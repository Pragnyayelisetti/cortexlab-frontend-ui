import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { TRAINING_API } from '../env';

interface LogEntry {
  timestamp: string;
  type: string;
  content: string;
}

interface Artifact {
  name: string;
}

export default function TrainingLogs() {
  const navigate = useNavigate();
  const { projectName } = useParams<{ projectName: string }>();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const imagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectName) {
      setError('Project name is required');
      return;
    }

    const eventSourceUrl = `${TRAINING_API}/train/get_training_logs/${projectName}/stream`;
    console.log('Connecting to:', eventSourceUrl);

    const eventSource = new EventSource(eventSourceUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('EventSource connected');
      setIsConnecting(false);
    };

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'artifacts' && data.files) {
          setArtifacts(data.files);
          setIsConnecting(false);
        } else if (data.type !== 'artifacts') {
          const logEntry: LogEntry = {
            timestamp: new Date().toLocaleTimeString(),
            type: data.type || 'info',
            content: data.message ? data.message : (data.epoch !== undefined ? `Epoch ${data.epoch}/${data.total_epochs} - Progress: ${data.progress}%` : JSON.stringify(data)),
          };

          setLogs((prev) => [...prev, logEntry]);
          setIsConnecting(false);
        }

        if (data.type === 'done') {
          setIsComplete(true);
          setError('');
          eventSource.close();
        } else if (data.type === 'error') {
          setError(data.message || 'Training error occurred');
          setIsComplete(true);
          eventSource.close();
        }
      } catch (e) {
        console.error('Error parsing log data:', e, event.data);
      }
    });

    eventSource.onerror = (err) => {
      console.error('EventSource error:', err);
      setIsConnecting(false);
      if (!isComplete) {
        setError('Connection lost - training may still be in progress');
      }
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [projectName, isComplete]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    if (imagesEndRef.current) {
      imagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [artifacts]);

  const getLogClass = (type: string) => {
    switch (type) {
      case 'metrics':
        return 'log-metrics';
      case 'error':
        return 'log-error';
      case 'done':
        return 'log-success';
      default:
        return 'log-info';
    }
  };

  return (
    <div className="page" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
      <PageHeader title={`Training Logs - ${projectName}`} />

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '2rem',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          padding: '1rem',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          lineHeight: '1.5',
          minHeight: '400px',
          maxHeight: '600px',
          overflow: 'auto',
          border: '1px solid #404040',
          marginBottom: '1rem',
        }}>
          {isConnecting && logs.length === 0 && (
            <div style={{ color: '#858585' }}>⏳ Connecting to training stream...</div>
          )}

          {logs.length === 0 && !isConnecting && (
            <div style={{ color: '#858585' }}>📭 No logs available yet...</div>
          )}

          {logs.map((log, idx) => (
            <div key={idx} className={getLogClass(log.type)}>
              <span style={{ color: '#858585', marginRight: '0.5rem' }}>[{log.timestamp}]</span>
              <span>{log.content}</span>
            </div>
          ))}

          <div ref={logsEndRef} />
        </div>

        {artifacts.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#d4d4d4' }}>Training Artifacts</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '1rem',
            }}>
              {artifacts.map((artifact, idx) => (
                <div key={idx} style={{
                  border: '1px solid #404040',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#1e1e1e',
                }}>
                  <img
                    src={`${TRAINING_API}/train/artifacts/${projectName}/${artifact.name}`}
                    alt={artifact.name}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  />
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#252526',
                    fontSize: '0.85rem',
                    color: '#d4d4d4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {artifact.name}
                  </div>
                </div>
              ))}
            </div>
            <div ref={imagesEndRef} />
          </div>
        )}

        {error && (
          <div className="msg error" style={{ marginBottom: '1rem' }}>
            ❌ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isComplete && (
            <div style={{ fontSize: '0.9rem', color: '#858585' }}>
              🔴 Training in progress...
            </div>
          )}

          {isComplete && !error && (
            <div className="msg success" style={{ flex: 1 }}>
              ✓ Training completed successfully
            </div>
          )}

          <button
            className="btn-ghost"
            onClick={() => navigate('/train')}
            style={{ marginLeft: 'auto' }}
          >
            Back to Training
          </button>
        </div>
      </div>

      <style>{`
        .log-metrics {
          color: #4ec9b0;
          margin-bottom: 0.25rem;
        }
        .log-error {
          color: #f48771;
          margin-bottom: 0.25rem;
        }
        .log-success {
          color: #6a9955;
          margin-bottom: 0.25rem;
        }
        .log-info {
          color: #d4d4d4;
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
}
