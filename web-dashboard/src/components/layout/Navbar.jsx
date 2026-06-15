import { AlertCircle, Clock, CheckCircle, ArrowLeft, ArrowRight, LogOut, Bell, Globe, Sun, Moon, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarPlaceholder } from '../common/AvatarPlaceholder';
import { useTranslation } from 'react-i18next';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export function Navbar({ 
  theme, setTheme, handleSos, currentUser, showDashboard, setShowDashboard, setShowProfile, setShowAuthModal, 
  activeSessionSecs, isCheckingIn, onCheckOut, onNavigateBack, activeTab, setActiveTab, onLogout, addToast 
}) {
  const { t, i18n } = useTranslation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [liveNotifs, setLiveNotifs] = useState([]);

  const formatRelativeTime = (date) => {
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  useEffect(() => {
    if (!currentUser) return;

    const seenSosIds = new Set();

    const handleLocalSos = () => {
      try {
        const localSOS = JSON.parse(localStorage.getItem('cc_local_emergencies') || '[]');
        localSOS.forEach(data => {
          if (seenSosIds.has(data.id)) return;
          seenSosIds.add(data.id);

          const notif = {
            id: data.id,
            text: `🚨 SOS (Local): ${data.topic} - ${data.reason?.slice(0, 60)}`,
            time: 'Just now',
            read: false,
            type: 'urgent',
            data: data
          };

          setNotifications(prev => [notif, ...prev].slice(0, 20));
          if (addToast) {
            addToast(notif.text, 'error', () => {
              if (setShowDashboard) setShowDashboard(true);
              if (setActiveTab) setActiveTab('missions');
            });
          }
        });
      } catch (_) {}
    };

    window.addEventListener('storage', handleLocalSos);
    handleLocalSos();

    let unsubscribe = () => {};
    try {
      const q = query(collection(db, 'emergency_missions'), orderBy('timestamp', 'desc'), limit(10));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const missions = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            text: data.topic ? `🚨 SOS: ${data.topic} - ${data.reason?.slice(0, 60)}` : '🚨 New emergency mission posted',
            time: data.timestamp?.toDate ? formatRelativeTime(data.timestamp.toDate()) : 'Just now',
            read: false,
            type: 'urgent',
            data: data
          };
        });

        if (missions.length > 0) {
          setLiveNotifs(missions);
          const prevCount = parseInt(localStorage.getItem('lastNotifCount') || '0');
          if (missions.length > prevCount) {
            const newOnes = missions.slice(0, missions.length - prevCount);
            setNotifications(prev => [...newOnes, ...prev].slice(0, 20));

            newOnes.forEach(one => {
              if (seenSosIds.has(one.id)) return;
              seenSosIds.add(one.id);
              if (addToast) {
                addToast(one.text, 'error', () => {
                  if (setShowDashboard) setShowDashboard(true);
                  if (setActiveTab) setActiveTab('missions');
                });
              }
            });
          }
          localStorage.setItem('lastNotifCount', missions.length.toString());
        }
      }, (err) => {
        console.warn("Firestore emergency list subscription blocked:", err);
      });
    } catch (e) {
      console.warn("Firestore emergency query failed:", e);
    }

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleLocalSos);
    };
  }, [currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      const timeBasedNotifs = [];
      const hour = new Date().getHours();
      if (hour === 8) timeBasedNotifs.push({ id: 'time-1', text: '☀️ Good morning! New missions available today.', time: 'Just now', read: false, type: 'info' });
      if (hour === 12) timeBasedNotifs.push({ id: 'time-2', text: '🌤️ Midday update: Check your active missions.', time: 'Just now', read: false, type: 'info' });
      if (hour === 18) timeBasedNotifs.push({ id: 'time-3', text: '🌆 Evening reminder: Log your hours before midnight.', time: 'Just now', read: false, type: 'warning' });
      if (timeBasedNotifs.length > 0) {
        setNotifications(prev => [...timeBasedNotifs, ...prev].slice(0, 20));
      }
    }, 3600000);
    return () => clearInterval(interval);
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs = currentUser?.role === 'ngo' 
    ? ['overview', 'missions', 'volunteers', 'analytics', 'sos', 'downloads']
    : ['overview', 'missions', 'history', 'schemes', 'wallet', 'community'];

  const handleNotifClick = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.type === 'urgent' && notif.data) {
      if (addToast) addToast(`📋 ${notif.data.topic || 'Emergency mission'} — Respond from Missions tab`, 'info', () => {
        if (setShowDashboard) setShowDashboard(true);
        if (setActiveTab) setActiveTab('missions');
      });
    } else {
      if (addToast) addToast(notif.text, 'info', () => {
        if (setShowDashboard) setShowDashboard(true);
      });
    }
    setShowNotifs(false);
  };

  return (
    <header className="navbar glass-panel" style={{ zIndex: 10000 }}>
      <div className="navbar-content">
        
        {/* Left: Logo & Navigation Controls */}
        <div className="navbar-left">
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => {
            if (currentUser) {
              setShowDashboard(prev => !prev);
            } else {
              setShowDashboard(false);
            }
          }}>
            <img 
              src="/CC_LOGO.png" 
              alt="Logo" 
              className="app-logo" 
              style={{ height: '42px', width: 'auto', transition: 'transform 0.2s' }} 
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          </div>
          
          <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 1rem' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={onNavigateBack} className="nav-page-btn" title="Back"><ArrowLeft size={16} /></button>
            <button onClick={() => window.history.forward()} className="nav-page-btn" title="Forward"><ArrowRight size={16} /></button>
          </div>
        </div>

        {/* Middle: Dynamic Tabs or Landing Links */}
        <div className="navbar-middle">
          {currentUser && showDashboard ? (
            <div className="nav-tabs-container">
              {tabs.map(tab => {
                const isActive = activeTab === tab;
                return (
                  <button 
                    key={tab} 
                    onClick={() => { setActiveTab(tab); setShowDashboard(true); }} 
                    className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                          borderRadius: '8px',
                          zIndex: -1
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {t(tab)}
                  </button>
                );
              })}
            </div>
          ) : (
            <nav className="desktop-nav" style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
              {currentUser && (
                <button 
                  onClick={() => setShowDashboard(true)} 
                  className="btn-magic" 
                  style={{ padding: '0.45rem 1.2rem', fontSize: '0.85rem', marginRight: '1rem', border: 'none', cursor: 'pointer' }}
                >
                  Go to Dashboard
                </button>
              )}
              {['Platform', 'Impact', 'Ecosystem', 'Leaderboard', 'Stories'].map(l => (
                <a 
                  key={l} 
                  href={`#${l.toLowerCase()}`} 
                  className="desktop-nav-link"
                >
                  {t(l.toLowerCase())}
                </a>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="navbar-right">
          {isCheckingIn && (
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '0.4rem 0.9rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} className="animate-pulse" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: 'monospace' }}>{formatTime(activeSessionSecs)}</span>
            </div>
          )}

          {/* Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
            <Globe size={16} />
            <select 
              value={i18n.language} 
              onChange={(e) => {
                i18n.changeLanguage(e.target.value);
                localStorage.setItem('language', e.target.value);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                paddingRight: '4px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <option value="en" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>EN</option>
              <option value="hi" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>हिन्दी</option>
              <option value="gu" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>ગુજરાતી</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} 
            className="theme-toggle-btn"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {currentUser ? (
            <>
              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowNotifs(!showNotifs)} className="nav-icon-btn" title="Notifications">
                  <Bell size={18} />
                  {unread > 0 && <span className="nav-notif-badge">{unread}</span>}
                </button>
                <AnimatePresence>
                  {showNotifs && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 10 }}
                      className="nav-notifs-panel"
                      style={{ 
                        position: 'absolute', 
                        right: 0, 
                        top: '48px', 
                        width: 320, 
                        background: 'var(--bg-elevated)', 
                        border: '1px solid var(--border-light)', 
                        borderRadius: '16px', 
                        boxShadow: 'var(--glass-shadow)', 
                        padding: '0.6rem', 
                        zIndex: 10001 
                      }}
                    >
                      <div style={{ padding: '0.4rem 0.5rem 0.6rem', fontWeight: 800, fontSize: '0.9rem', borderBottom: '1px solid var(--border-light)', marginBottom: '0.4rem', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Notifications</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {liveNotifs.length > 0 && <span style={{ color: '#ef4444', marginRight: '0.3rem' }}>● LIVE</span>}
                          {unread} unread
                        </span>
                      </div>
                      {notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <Bell size={24} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                          <div>No notifications yet</div>
                          <div style={{ fontSize: '0.75rem', marginTop: '0.3rem' }}>Live SOS alerts appear here</div>
                        </div>
                      ) : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {notifications.map(n => (
                            <div 
                              key={n.id} 
                              className="nav-notif-item"
                              onClick={() => handleNotifClick(n)}
                              style={{ 
                                padding: '0.6rem 0.8rem', 
                                fontSize: '0.8rem', 
                                borderRadius: '10px', 
                                cursor: 'pointer', 
                                background: n.read ? 'transparent' : n.type === 'urgent' ? 'rgba(239,68,68,0.06)' : 'rgba(249,115,22,0.06)',
                                marginBottom: '2px',
                                color: 'var(--text-primary)',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = n.read ? 'transparent' : n.type === 'urgent' ? 'rgba(239,68,68,0.06)' : 'rgba(249,115,22,0.06)';
                              }}
                            >
                              <div style={{ fontWeight: n.read ? 500 : 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {n.text}
                                <ExternalLink size={10} style={{ color: 'var(--text-secondary)', flexShrink: 0, opacity: 0.5 }} />
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{n.time}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SOS button */}
              {currentUser?.role === 'ngo' && (
                <button 
                  onClick={handleSos} 
                  style={{ 
                    background: '#ef4444', 
                    color: 'white', 
                    border: 'none', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '10px', 
                    fontWeight: 700, 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    fontSize: '0.8rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <AlertCircle size={15} /> SOS
                </button>
              )}

              {/* User ID Badge */}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  const idText = currentUser.userId || currentUser.uid;
                  navigator.clipboard.writeText(idText);
                  if (addToast) addToast('📋 User ID copied to clipboard!', 'success');
                }}
                title="Click to copy User ID"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  background: 'var(--bg-secondary)', 
                  padding: '0.35rem 0.75rem', 
                  borderRadius: '20px', 
                  border: '1px solid var(--border-light)', 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  userSelect: 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary-500)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--primary-500)' }}>●</span>
                <span style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                  {currentUser.userId || (currentUser.uid ? `ID: ${currentUser.uid.slice(0, 8)}...` : 'N/A')}
                </span>
              </div>

              {/* Profile Avatar */}
              <div onClick={() => setShowProfile(true)} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <AvatarPlaceholder name={currentUser.name} size={34} />
              </div>

              {/* Logout Button */}
              <button 
                onClick={onLogout} 
                title="Logout"
                className="nav-icon-btn"
                style={{ color: '#ef4444' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <button 
              className="btn-magic" 
              style={{ padding: '0.55rem 1.5rem', fontSize: '0.85rem' }} 
              onClick={() => setShowAuthModal(true)}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}