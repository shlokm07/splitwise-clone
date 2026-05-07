import { useState, useEffect } from 'react';
import { useAppContext } from './store';
import { Moon, Sun } from 'lucide-react';
import Dashboard from './components/Dashboard';
import GroupsList from './components/GroupsList';
import GroupDetail from './components/GroupDetail';

export type ViewState = 
  | { name: 'DASHBOARD' }
  | { name: 'GROUPS' }
  | { name: 'GROUP_DETAIL'; groupId: string };

function App() {
  const { state, dispatch } = useAppContext();
  const [currentView, setCurrentView] = useState<ViewState>({ name: 'DASHBOARD' });

  useEffect(() => {
    if (state.theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [state.theme]);

  return (
    <div className="app-container">
      <header className="navbar fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setCurrentView({ name: 'DASHBOARD' })}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#splitGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="splitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="50%" stopColor="#e83a59" />
                <stop offset="100%" stopColor="#ff9f1c" />
              </linearGradient>
            </defs>
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span className="logo-text">Split</span>
        </div>
        <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className={`btn ${currentView.name === 'DASHBOARD' ? 'btn-primary' : 'btn-secondary'}`}
            style={currentView.name === 'DASHBOARD' ? { boxShadow: 'var(--glow-accent)' } : { border: 'none' }}
            onClick={() => setCurrentView({ name: 'DASHBOARD' })}
          >
            Dashboard
          </button>
          <button 
            className={`btn ${currentView.name === 'GROUPS' ? 'btn-primary' : 'btn-secondary'}`}
            style={currentView.name === 'GROUPS' ? { boxShadow: 'var(--glow-accent)' } : { border: 'none' }}
            onClick={() => setCurrentView({ name: 'GROUPS' })}
          >
            Groups
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem', border: 'none', borderRadius: '50%' }}
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            title="Toggle Theme"
          >
            {state.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </nav>
      </header>

      <main className="fade-in">
        {currentView.name === 'DASHBOARD' && <Dashboard />}
        {currentView.name === 'GROUPS' && <GroupsList onViewGroup={(id) => setCurrentView({ name: 'GROUP_DETAIL', groupId: id })} />}
        {currentView.name === 'GROUP_DETAIL' && <GroupDetail groupId={currentView.groupId} onBack={() => setCurrentView({ name: 'GROUPS' })} />}
      </main>
    </div>
  );
}

export default App;
