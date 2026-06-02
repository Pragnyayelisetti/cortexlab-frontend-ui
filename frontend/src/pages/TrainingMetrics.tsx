import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import * as trainingApi from '../api/training';
import { TRAINING_API } from '../env';
import type { TrainingJob, ArtifactItem } from '../types';
import { STATUS_STYLE } from '../types';

function fmt(val: number | null) {
  return val != null ? (val * 100).toFixed(1) + '%' : '—';
}


function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: '#2a2a2a', color: '#858585', label: status };
  return (
    <span style={{
      padding: '0.2rem 0.55rem',
      borderRadius: '4px',
      fontSize: '0.78rem',
      backgroundColor: s.bg,
      color: s.color,
      fontFamily: 'monospace',
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

export default function TrainingMetrics() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Record<string, ArtifactItem[]>>({});
  const [artifactsLoading, setArtifactsLoading] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    trainingApi.getMetrics()
      .then((res) => setJobs(res.training_jobs ?? []))
      .catch(() => setError('Unable to load training metrics. The backend service is currently unavailable. Please start the backend server and refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  async function toggleJob(job: TrainingJob) {
    const key = `${job.name}/${job.version}`;
    if (expandedKey === key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(key);
    if (artifacts[key]) return;

    setArtifactsLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await trainingApi.getArtifacts(job.name, job.version);
      setArtifacts((prev) => ({ ...prev, [key]: res.artifacts ?? [] }));
    } catch (e) {
      setArtifacts((prev) => ({ ...prev, [key]: [] }));
    } finally {
      setArtifactsLoading((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function handleDelete(e: React.MouseEvent, job: TrainingJob) {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Delete "${job.name}" v${job.version}?\n\nThis will permanently remove the training job, all artifacts, and the saved model weights. This cannot be undone.`
    );
    if (!confirmed) return;

    const key = `${job.name}/${job.version}`;
    setDeleting((prev) => ({ ...prev, [key]: true }));
    try {
      await trainingApi.deleteTrainingJob(job.name, job.version);
      setJobs((prev) => prev.filter((j) => !(j.name === job.name && j.version === job.version)));
      if (expandedKey === key) setExpandedKey(null);
    } catch (e) {
      setError(`Failed to delete ${job.name} v${job.version}: ${String(e)}`);
    } finally {
      setDeleting((prev) => ({ ...prev, [key]: false }));
    }
  }

  return (
    <div className="page" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
      <PageHeader title="Training Metrics" />

      <div style={{ flex: 1, overflow: 'auto', padding: '2rem', width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
        {loading && <div style={{ color: '#858585' }}>Loading...</div>}
        {error && <div className="msg error">{error}</div>}

        {!loading && jobs.length === 0 && !error && (
          <div style={{ color: '#858585' }}>No training jobs found.</div>
        )}

        {jobs.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #404040', color: '#858585', textAlign: 'left' }}>
                <th style={th}>Project</th>
                <th style={th}>Version</th>
                <th style={th}>Status</th>
                <th style={th}>mAP50</th>
                <th style={th}>mAP50-95</th>
                <th style={th}>Precision</th>
                <th style={th}>Recall</th>
                <th style={th}>Created</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const key = `${job.name}/${job.version}`;
                const isExpanded = expandedKey === key;
                const jobArtifacts = artifacts[key] ?? [];
                const isLoadingArtifacts = artifactsLoading[key];
                const isDeleting = deleting[key];

                return (
                  <>
                    <tr
                      key={key}
                      onClick={() => toggleJob(job)}
                      style={{
                        borderBottom: isExpanded ? 'none' : '1px solid #2a2a2a',
                        cursor: 'pointer',
                        backgroundColor: isExpanded ? '#1e2a1e' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { if (!isExpanded) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#1e1e1e'; }}
                      onMouseLeave={(e) => { if (!isExpanded) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                    >
                      <td style={td}>
                        <span style={{ marginRight: '0.5rem', color: '#858585' }}>{isExpanded ? '▾' : '▸'}</span>
                        {job.name}
                      </td>
                      <td style={td}>v{job.version}</td>
                      <td style={td}><StatusBadge status={job.status} /></td>
                      <td style={{ ...td, color: job.mAP50 != null ? '#4ec9b0' : '#858585' }}>{fmt(job.mAP50)}</td>
                      <td style={{ ...td, color: job.mAP50_95 != null ? '#4ec9b0' : '#858585' }}>{fmt(job.mAP50_95)}</td>
                      <td style={td}>{fmt(job.precision)}</td>
                      <td style={td}>{fmt(job.recall)}</td>
                      <td style={{ ...td, color: '#858585' }}>{new Date(job.created_at).toLocaleDateString()}</td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <button
                          onClick={(e) => handleDelete(e, job)}
                          disabled={isDeleting}
                          title="Delete job, artifacts, and model weights"
                          style={{
                            background: 'none',
                            border: '1px solid #5a2a2a',
                            borderRadius: '4px',
                            color: isDeleting ? '#858585' : '#f48771',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.8rem',
                            fontFamily: 'monospace',
                          }}
                        >
                          {isDeleting ? '...' : 'Delete'}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${key}-artifacts`}>
                        <td colSpan={9} style={{ padding: '1rem 2rem 1.5rem', backgroundColor: '#1e2a1e', borderBottom: '1px solid #2a2a2a' }}>
                          {isLoadingArtifacts && <div style={{ color: '#858585' }}>Loading artifacts...</div>}

                          {!isLoadingArtifacts && jobArtifacts.length === 0 && (
                            <div style={{ color: '#858585', fontSize: '0.85rem' }}>No artifacts found for this job.</div>
                          )}

                          {!isLoadingArtifacts && jobArtifacts.length > 0 && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                              gap: '1rem',
                            }}>
                              {jobArtifacts.map((artifact) => (
                                <div key={artifact.name} style={{
                                  border: '1px solid #404040',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  backgroundColor: '#1a1a1a',
                                }}>
                                  <img
                                    src={`${TRAINING_API}/train/artifacts/${artifact.name}`}
                                    alt={artifact.name.split('/').pop()}
                                    style={{ width: '100%', height: 'auto', display: 'block' }}
                                  />
                                  <div style={{
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.8rem',
                                    color: '#858585',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}>
                                    {artifact.name.split('/').pop()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}

        <button className="btn-ghost" onClick={() => navigate('/train')} style={{ marginTop: '2rem' }}>
          Back to Training
        </button>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: '0.6rem 1rem',
  fontWeight: 500,
};

const td: React.CSSProperties = {
  padding: '0.75rem 1rem',
  color: '#d4d4d4',
};
