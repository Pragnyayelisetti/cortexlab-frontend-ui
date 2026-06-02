import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="grid-bg"></div>
      <img src="/images/MDL Rebranded (3).png" alt="" className="landing-watermark" />
      <div className="landing-inner">
        <div className="logo">CORTEXLAB · Annotation Platform</div>
        <h1 className="landing-title">
          Label.<br />
          Train.<br />
          <span>Ship.</span>
        </h1>
        <p className="landing-sub">End-to-end dataset creation for computer vision.</p>
        <div className="landing-actions">
          <button className="btn-primary" onClick={() => navigate('/new')}>
            New project
          </button>
          <button className="btn-ghost" onClick={() => navigate('/projects')}>
            Continue project
          </button>
          <button className="btn-ghost" onClick={() => navigate('/train')}>
            Train model
          </button>
          <button
            className="btn-ghost"
            onClick={() => window.location.href = 'http://localhost:3000'}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
