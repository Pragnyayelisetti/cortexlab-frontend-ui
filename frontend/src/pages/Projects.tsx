import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as jobsApi from '../api/jobs';
import type { Job } from '../types';

export default function Projects() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await jobsApi.listJobs();
      setJobs(res.jobs || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = (job: Job) => {
    navigate(`/projects/${job.ls_project_id}/annotate`);
  };

  const handleDeleteProject = async (projectName: string) => {
    try {
      await jobsApi.deleteProject(projectName);
      setDeleteConfirm(null);
      await loadJobs();
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="page two-pane">
      <div className="jobs-sidebar">
        <div className="sidebar-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ←
          </button>
          <span className="sidebar-title">Projects</span>
          <button className="load-btn" style={{ width: 'auto', margin: 0, marginLeft: 'auto', padding: '5px 10px' }} onClick={loadJobs}>
            Refresh
          </button>
        </div>
        <div className="jobs-list">
          {loading ? (
            <div className="empty-state">
              <span className="spinner"></span>
              <div style={{ marginTop: '12px' }}>
                Loading projects...
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '32px' }}>📁</div>
              <div>No Projects Found</div>
              <div style={{ marginTop: '8px', opacity: 0.7 }}>
                Create your first project to get started.
              </div>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="job-item"
                onClick={() => handleSelectJob(job)}
              >
                <div className="job-info">
                  <div className="job-name">{job.name}</div>
                  <div className="job-meta">
                    <span>{new Date(job.created_at).toLocaleString()}</span>
                    <span className="job-badge">LS #{job.ls_project_id}</span>
                  </div>
                </div>
                <button
                  className="delete-job-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(job.name);
                  }}
                  title="Delete project"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="main-area" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 0, gap: '1rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 10 }}>
          <button
            className="btn-primary"
            onClick={() => navigate('/train')}
          >
            Go to Training
          </button>
        </div>

        <div className="projects-logo-overlay">
          <img src="/images/mdl-logo.png" alt="Meridian Logo" />
          <h1>CORTEX LAB</h1>
          <p>Annotation Platform</p>

          <div style={{ marginTop: '2rem' }}>
            {error ? (
              <div className="msg error">
                Unable to connect to the server.
                Please try again later.
              </div>
            ) : jobs.length === 0 ? (
              <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: '12px' }}>
                Select a project to annotate
              </span>
            ) : (
              <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: '12px' }}>
                Click a project to open annotation
              </span>
            )}
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Delete project?</div>
            <div className="modal-body">
              This will permanently delete <strong>{deleteConfirm}</strong> and all its annotations from Label Studio. This cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" style={{ padding: '8px 16px', fontSize: '11px' }} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDeleteProject(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
