import { useLocation, useNavigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: '/', icon: '⌂' },
  { label: 'Projects', path: '/projects', icon: '📁' },
  { label: 'New Project', path: '/new', icon: '✚' },
  { label: 'Training', path: '/train', icon: '🧠' },
  { label: 'Metrics', path: '/train/metrics', icon: '📊' },
];

interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export default function Layout({ children, hideNav = false }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show nav on annotate pages
  const isAnnotatePage = location.pathname.includes('/annotate');

  if (hideNav || isAnnotatePage) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <nav className="app-nav">
        <div className="nav-header">
          <div className="nav-logo">
            <img src="/images/MDL Rebranded (3).png" alt="MDL Logo" className="logo-image" />
            <span className="logo-text">CORTEX</span>
          </div>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <button
            className="nav-back-btn"
            onClick={() => window.location.href = 'http://localhost:3000'}
            title="Return to Meridian Dashboard"
          >
            ↗
          </button>
        </div>
        <div className="nav-items">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path ||
                           (item.path === '/projects' && location.pathname.startsWith('/projects')) ||
                           (item.path === '/train/metrics' && location.pathname.startsWith('/train/metrics'));
            return (
              <button
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      <div className="app-content">
        {children}
      </div>
    </div>
  );
}
