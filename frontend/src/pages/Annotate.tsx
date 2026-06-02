import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as jobsApi from '../api/jobs';
import * as annotationApi from '../api/annotation';
import { useLabelStudio } from '../hooks/useLabelStudio';
import type { Task } from '../types';

export default function Annotate() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | ''>('');
  const [projectName, setProjectName] = useState('');
  const [labelConfig, setLabelConfig] = useState<string>('');
  const [labels, setLabels] = useState<string[]>([]);
  const jobIdRef = useRef<string>('');

  useEffect(() => {
    if (!projectId) return;
    loadJob(projectId);
  }, [projectId]);

  useLabelStudio('ls-container', tasks[currentIndex] || {id: 0, data: {image: ''}}, labelConfig);

  const loadJob = async (projId: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await jobsApi.listJobs();
      const job = res.jobs?.find((j) => String(j.ls_project_id) === projId);

      if (!job) throw new Error('Project not found');

      jobIdRef.current = job.id;
      setProjectName(job.name);

      const jobRes = await jobsApi.getJob(job.id);
      setTasks(jobRes.tasks || []);
      setCurrentIndex(0);

      // Fetch label config from backend
      try {
        const configRes = await fetch(`http://localhost:8002/api/v1/annotate/projects/${projId}/label_config`);
        if (configRes.ok) {
          const configData = await configRes.json();
          if (configData.label_config) {
            setLabelConfig(configData.label_config);
            // Extract labels from XML
            const labelMatches = configData.label_config.match(/<Label value="([^"]+)"/g);
            const extractedLabels = labelMatches
              ? labelMatches.map((m: string) => m.match(/"([^"]+)"/)?.[1]).filter(Boolean)
              : [];
            setLabels(extractedLabels);
          }
        }
      } catch (e) {
        console.warn('Could not fetch label config:', e);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const currentTask = tasks[currentIndex];

  const handleSubmitAnnotation = async () => {
    if (!currentTask) return;

    setSaveStatus('saving');
    try {
      // Get the LS app instance that was stored globally by the hook
      console.log('Submit clicked, checking for _labelStudioApp:', (window as any)._labelStudioApp);
      const lsApp = (window as any)._labelStudioApp;

      if (!lsApp) {
        console.error('_labelStudioApp not found in window. Available keys:', Object.keys(window).filter(k => k.includes('label') || k.includes('Label') || k.includes('LS')));
        throw new Error('Label Studio not initialized');
      }

      console.log('Found lsApp:', lsApp);

      // Try different ways to access the annotation store
      const store = lsApp.store?.annotationStore ||
                    lsApp.annotationStore ||
                    lsApp;

      const annotation = store?.selected || store?.selectedAnnotation;
      if (!annotation) throw new Error('No active annotation');

      const result = annotation.serializeAnnotation?.();

      await annotationApi.saveAnnotation({
        task_id: currentTask.id,
        project_id: parseInt(projectId || '0'),
        project_name: projectName,
        result,
        labels,
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);

      if (currentIndex < tasks.length - 1) {
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
        }, 400);
      }
    } catch (e) {
      console.error('Annotation save error:', e);
      setSaveStatus('error');
    }
  };

  const handleAddImages = () => {
    navigate(`/new?projectId=${projectId}`);
  };

  const handleExportYaml = async () => {
    try {
      await annotationApi.exportYaml(jobIdRef.current);
      alert('Data exported to YAML');
    } catch (e) {
      alert('Export failed: ' + String(e));
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner"></span>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="msg error">{error || 'No tasks found'}</div>
      </div>
    );
  }

  return (
    <div className="page" style={{ flexDirection: 'column' }}>
      <div className="annotate-header">
        <div className="annotate-logo">MDIS · Annotator</div>
        <span className="task-counter">{currentIndex + 1} / {tasks.length}</span>
        <span className={`save-status ${saveStatus}`}>
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'error' ? 'Error' : ''}
        </span>
        <div className="task-nav">
          <button
            className="nav-btn"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          >
            ←
          </button>
          <button
            className="nav-btn"
            disabled={currentIndex === tasks.length - 1}
            onClick={() => setCurrentIndex(Math.min(tasks.length - 1, currentIndex + 1))}
          >
            →
          </button>
        </div>
        <button className="submit-btn" onClick={handleSubmitAnnotation}>
          {tasks[currentIndex]?.annotations && tasks[currentIndex]!.annotations!.length > 0 ? 'Update' : 'Submit'}
        </button>
        <button
          className="btn-ghost"
          style={{ padding: '6px 14px', fontSize: '11px' }}
          onClick={handleExportYaml}
        >
          Export YAML
        </button>
        <button
          className="btn-ghost"
          style={{ padding: '6px 14px', fontSize: '11px' }}
          onClick={handleAddImages}
        >
          + Add Images
        </button>
        <button
          className="btn-ghost"
          style={{ padding: '6px 14px', fontSize: '11px' }}
          onClick={() => navigate('/projects')}
        >
          ← Projects
        </button>
        <button
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '11px', marginLeft: 'auto' }}
          onClick={() => {
            const modelType = labels.length > 0 ? 'segmentation' : 'detection';
            navigate(`/train?projectName=${encodeURIComponent(projectName)}&modelType=${modelType}`);
          }}
        >
          Done & Train →
        </button>
      </div>
      <div className="annotate-body">
        <div id="ls-container"></div>
      </div>
    </div>
  );
}
