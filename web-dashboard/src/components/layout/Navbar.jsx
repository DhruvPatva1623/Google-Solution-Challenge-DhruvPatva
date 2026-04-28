import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { AvatarPlaceholder } from '../common/AvatarPlaceholder';

export function Navbar({ theme, setTheme, handleSos, currentUser, setShowDashboard, setShowProfile, setShowAuthModal, activeSessionSecs, isCheckingIn, onCheckOut }) {
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="navbar glass-panel">
      <div className="navbar-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontSize: '1.8rem' }}>🌍</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.5px' }}>CommunityConnect</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {isCheckingIn && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '0.4rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.8rem', animation: 'pulse 2s infinite' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Active Session</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace' }}>{formatTime(activeSessionSecs)}</span>
              </div>
              <button onClick={onCheckOut} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>STOP</button>
            </div>
          )}
          <nav style={{ display: 'flex', gap: '2rem' }}>
            <a href="#features" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600 }}>Platform</a>
            <a href="#impact" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600 }}>Impact</a>
            <a href="#stories" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600 }}>Stories</a>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }} aria-label="Toggle theme">
            {theme === 'dark' ? '🌑' : '☀️'}
          </button>
          <button onClick={handleSos} className="sos-btn" aria-label="Emergency SOS"><AlertCircle size={20} /> SOS</button>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <button onClick={() => setShowDashboard(true)} className="btn-magic">My Dashboard</button>
              <div onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }}><AvatarPlaceholder name={currentUser.name} size={36} /></div>
            </div>
          ) : (
            <button className="btn-magic" onClick={() => setShowAuthModal(true)}>Join / Sign In</button>
          )}
        </div>
      </div>
    </header>
  );
}
