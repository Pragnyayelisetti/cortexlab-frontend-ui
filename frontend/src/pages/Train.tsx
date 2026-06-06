import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as jobsApi from '../api/jobs';
import * as trainingApi from '../api/training';
import PageHeader from '../components/PageHeader';
import type { Job, TrainingJob } from '../types';
import { STATUS_STYLE } from '../types';

export default function Train() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectNameParam = searchParams.get('projectName');
  const modelTypeParam = searchParams.get('modelType') as 'detection' | 'segmentation' | null;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [latestJobStatus, setLatestJobStatus] = useState<Map<string, TrainingJob>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trainingMode, setTrainingMode] = useState('scratch');

  const [config, setConfig] = useState({
    project_name: projectNameParam || '',
    epochs: 100,
    imgsz: 640,
    batch: 4,
    val_ratio: 0.2,
    save: true,
    save_period: 10,
    plots: true,
    version: 's' as 'n' | 's' | 'm' | 'l' | 'x',
    model_type: (modelTypeParam as 'detection' | 'segmentation') || 'detection',
  });

  useEffect(() => {
    loadJobs();
    // Warn if project name is not pre-filled
    if (!projectNameParam) {
      setError('ℹ️ Tip: Go to Projects, open annotation, and click "Done & Train" to auto-fill the project name');
    }
  }, [projectNameParam]);

  const loadJobs = async () => {
    try {
      const [jobsRes, metricsRes] = await Promise.all([
        jobsApi.listJobs(),
        trainingApi.getMetrics(),
      ]);
      setJobs(jobsRes.jobs || []);
      const map = new Map<string, TrainingJob>();
      for (const tj of metricsRes.training_jobs ?? []) {
        const existing = map.get(tj.name);
        if (!existing || tj.version > existing.version) {
          map.set(tj.name, tj);
        }
      }
      setLatestJobStatus(map);
    } catch (e) {
      setError('Unable to connect to training server. Please check backend connection.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate required fields
    if (!config.project_name || config.project_name.trim() === '') {
      setError('❌ Please select a project name');
      return;
    }

    if (config.epochs <= 0) {
      setError('❌ Epochs must be greater than 0');
      return;
    }

    if (config.imgsz <= 0) {
      setError('❌ Image size must be greater than 0');
      return;
    }

    if (config.batch <= 0) {
      setError('❌ Batch size must be greater than 0');
      return;
    }

    if (config.val_ratio < 0 || config.val_ratio > 1) {
      setError('❌ Validation ratio must be between 0 and 1');
      return;
    }

    if (config.save && config.save_period <= 0) {
      setError('❌ Save period must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const res = await trainingApi.startTraining(config);
      setSuccess(`✓ Training started! Task ID: ${res.task_id || 'pending'}`);
      setTimeout(() => {
        navigate(`/train/logs/${config.project_name}`);
      }, 1000);
    } catch (e) {
      setError(`❌ Failed to start training: ${String(e)}`);
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
      <PageHeader title="Training Configuration" />
      <div style={{ flex: 1, overflow: 'auto', padding: '2rem', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
        <div className="training-stats">

          <div className="training-card">
            <h2>{config.epochs}</h2>
            <p>Epochs</p>
          </div>

          <div className="training-card">
            <h2>{config.imgsz}</h2>
            <p>Image Size</p>
          </div>

          <div className="training-card">
            <h2>{config.batch}</h2>
            <p>Batch Size</p>
          </div>

      </div>
        <div className="section-header">
          Training Mode
        </div>

        <div className="training-mode-container">
        <div
          className={`mode-card ${trainingMode === 'scratch' ? 'active' : ''}`}
          onClick={() => setTrainingMode('scratch')}
        >
        <h4>Train From Scratch</h4>
        <p>Create and train a completely new model.</p>
      </div>

      <div
        className={`mode-card ${trainingMode === 'pretrained' ? 'active' : ''}`}
        onClick={() => setTrainingMode('pretrained')}
      >
      <h4>Use Pre-trained Model</h4>
      <p>Start from an existing model and fine-tune it.</p>
    </div>
  </div>
        <form onSubmit={handleSubmit}>
          {trainingMode === 'pretrained' && (
          <>
          <div className="section-header">
            Select Model
          </div>

          <div className="form-group">
            <label>Pre-trained Model</label>

            <select>
              <option>YOLOv8 Small</option>
              <option>YOLOv8 Medium</option>
              <option>YOLOv8 Large</option>
            </select>
          </div>
        </>
      )}
          <div className="section-header">
            📁 Dataset Settings
          </div>
          <div className="form-group">
            <label>Project name *</label>
            <select
              value={config.project_name}
              onChange={(e) => setConfig({ ...config, project_name: e.target.value })}
              required
            >
              <option value="">Select a project...</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.name}>
                  {job.name}
                </option>
              ))}
            </select>
            {config.project_name && (() => {
              const tj = latestJobStatus.get(config.project_name);
              if (!tj) return null;
              const style = STATUS_STYLE[tj.status] ?? { bg: '#2a2a2a', color: '#858585', label: tj.status };
              return (
                <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#858585', fontFamily: 'monospace' }}>
                  Latest training: v{tj.version}&nbsp;
                  <span style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: style.bg,
                    color: style.color,
                  }}>
                    {style.label}
                  </span>
                </div>
              );
            })()}
          </div>
          <div className="section-header">
            ⚙️ Training Settings
          </div>
          <div className="form-group">
            <label>Epochs</label>
            <input
              type="number"
              value={config.epochs}
              onChange={(e) => setConfig({ ...config, epochs: parseInt(e.target.value) })}
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Image size</label>
            <input
              type="number"
              value={config.imgsz}
              onChange={(e) => setConfig({ ...config, imgsz: parseInt(e.target.value) })}
              step="32"
            />
          </div>

          <div className="form-group">
            <label>Batch size</label>
            <input
              type="number"
              value={config.batch}
              onChange={(e) => setConfig({ ...config, batch: parseInt(e.target.value) })}
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Validation ratio</label>
            <input
              type="number"
              value={config.val_ratio}
              onChange={(e) => setConfig({ ...config, val_ratio: parseFloat(e.target.value) })}
              min="0"
              max="1"
              step="0.05"
            />
          </div>
          <div className="section-header">
            🧠 Model Settings
          </div>
          <div className="form-group">
            <label>Model variant</label>
            <select
              value={config.version}
              onChange={(e) => setConfig({ ...config, version: e.target.value as 'n' | 's' | 'm' | 'l' | 'x' })}
            >
              <option value="n">Nano (fastest)</option>
              <option value="s">Small</option>
              <option value="m">Medium</option>
              <option value="l">Large</option>
              <option value="x">Extra Large (slowest)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Model type</label>
            <select
              value={config.model_type}
              onChange={(e) => setConfig({ ...config, model_type: e.target.value as 'detection' | 'segmentation' })}
            >
              <option value="detection">Detection (Bounding Box)</option>
              <option value="segmentation">Segmentation</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={config.save}
                onChange={(e) => setConfig({ ...config, save: e.target.checked })}
              />
              {' '}Save model
            </label>
          </div>

          <div className="form-group">
            <label>Save period (epochs)</label>
            <input
              type="number"
              value={config.save_period}
              onChange={(e) => setConfig({ ...config, save_period: parseInt(e.target.value) })}
              min="1"
              disabled={!config.save}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={config.plots}
                onChange={(e) => setConfig({ ...config, plots: e.target.checked })}
              />
              {' '}Generate plots
            </label>
          </div>

          {error && <div className="msg error">{error}</div>}
          {success && <div className="msg success">{success}</div>}

          <button type="submit" className="btn-primary" disabled={!config.project_name || loading}>
            {loading ? 'Starting...' : 'Start Training'}
          </button>

          <button
            type="button"
            className="btn-ghost"
            style={{ marginLeft: '8px' }}
            onClick={() => navigate('/')}
          >
            Back
          </button>
        </form>
      </div>
    </div>
  );
}
