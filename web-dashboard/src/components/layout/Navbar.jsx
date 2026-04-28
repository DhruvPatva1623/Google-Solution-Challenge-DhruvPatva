import { AlertCircle, Clock, CheckCircle, ArrowLeft, ArrowRight, LogOut, Bell } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarPlaceholder } from '../common/AvatarPlaceholder';

export function Navbar({ 
  theme, setTheme, handleSos, currentUser, showDashboard, setShowDashboard, setShowProfile, setShowAuthModal, 
  activeSessionSecs, isCheckingIn, onCheckOut, onNavigateBack, activeTab, setActiveTab, onLogout 
}) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New mission near you: Food Distribution', time: '2m ago', read: false },
    { id: 2, text: 'Your profile is 80% complete', time: '1h ago', read: true }
  ]);
  const unread = notifications.filter(n => !n.read).length;

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs = currentUser?.role === 'ngo' 
    ? ['overview', 'missions', 'volunteers', 'analytics']
    : ['overview', 'missions', 'history', 'schemes', 'community'];

  return (
    <header className="navbar glass-panel" style={{ zIndex: 10000 }}>
      <div className="navbar-content" style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        
        {/* Left: Logo & Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }} onClick={() => setShowDashboard(false)}>
            <img src="/CC_LOGO.png" alt="Logo" className="app-logo" style={{ height: '42px', width: 'auto', cursor: 'pointer' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', cursor: 'pointer', display: 'none', md: 'block' }}>CommunityConnect</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', borderLeft: '1px solid var(--border-light)', paddingLeft: '0.8rem' }}>
            <button onClick={onNavigateBack} className="nav-page-btn" title="Back"><ArrowLeft size={16} /></button>
            <button onClick={() => window.history.forward()} className="nav-page-btn" title="Forward"><ArrowRight size={16} /></button>
          </div>
        </div>

        {/* Middle: Dynamic Tabs or Landing Links */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 1rem', minWidth: 0 }}>
          {currentUser && showDashboard ? (
            <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-light)', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {tabs.map(t => (
                <button key={t} onClick={() => { setActiveTab(t); setShowDashboard(true); }} 
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize',
                    background: activeTab === t ? 'var(--primary-500)' : 'transparent',
                    color: activeTab === t ? 'white' : 'var(--text-secondary)',
                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}>
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <nav className="desktop-nav" style={{ display: 'flex', gap: '2rem' }}>
              {['Platform', 'Impact', 'Ecosystem', 'Leaderboard', 'Stories'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>{l}</a>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
          {isCheckingIn && (
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '0.3rem 0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} className="animate-pulse" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'monospace' }}>{formatTime(activeSessionSecs)}</span>
            </div>
          )}

          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
            {theme === 'dark' ? '🌑' : '☀️'}
          </button>

          {currentUser ? (
            <>
              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowNotifs(!showNotifs)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', position: 'relative', display: 'grid', placeItems: 'center' }}>
                  <Bell size={20} />
                  {unread > 0 && <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white', width: 14, height: 14, borderRadius: '50%', fontSize: '0.6rem', fontWeight: 800, display: 'grid', placeItems: 'center' }}>{unread}</span>}
                </button>
                <AnimatePresence>
                  {showNotifs && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      style={{ position: 'absolute', right: 0, top: '150%', width: 280, background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', padding: '0.5rem', zIndex: 10001 }}>
                      <div style={{ padding: '0.5rem', fontWeight: 700, fontSize: '0.85rem', borderBottom: '1px solid var(--border-light)', marginBottom: '0.5rem' }}>Notifications</div>
                      {notifications.map(n => (
                        <div key={n.id} style={{ padding: '0.6rem', fontSize: '0.8rem', borderRadius: '8px', cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(249,115,22,0.05)' }}>
                          {n.text} <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{n.time}</div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {currentUser?.role === 'ngo' && (
            <button onClick={handleSos} 
              style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <AlertCircle size={16} /> SOS
            </button>
          )}

          <div onClick={() => setShowProfile(true)} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <AvatarPlaceholder name={currentUser.name} size={34} />
              </div>

              <button onClick={onLogout} title="Logout"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', width: 34, height: 34, display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#ef4444', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button className="btn-magic" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }} onClick={() => setShowAuthModal(true)}>Sign In</button>
          )}
        </div>
      </div>
    </header>
  );
}
