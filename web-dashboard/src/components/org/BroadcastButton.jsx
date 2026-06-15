import { useState, useEffect, useRef } from 'react';
import { Radio, X, Megaphone, CheckCircle2, Loader2 } from 'lucide-react';
import { db } from '../../firebase';
import {
  collection, addDoc, serverTimestamp, onSnapshot,
  query, orderBy, limit, where, Timestamp
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BroadcastButton — Organizer-only component
 * 
 * Features:
 * 1. Click → open broadcast composer (title + message)
 * 2. On submit → write to `broadcasts` Firestore collection
 * 3. All logged-in users' useBroadcastListener() picks it up via onSnapshot
 */
export function BroadcastButton({ user, addToast }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState('normal'); // normal | urgent | critical
  const titleRef = useRef(null);

  useEffect(() => {
    if (open && titleRef.current) titleRef.current.focus();
  }, [open]);

  const handleBroadcast = async () => {
    if (!title.trim()) { addToast('Broadcast title is required.', 'error'); return; }
    setLoading(true);
    const broadcastData = {
      title: title.trim(),
      message: message.trim(),
      urgency,
      orgId: user?.companyId || user?.uid || 'GOONJ1999',
      orgName: user?.companyName || user?.org || user?.name || 'Goonj Foundation',
      senderId: user?.uid || 'GOONJ1999',
      timestamp: new Date().toISOString(),
      type: 'broadcast',
    };
    try {
      // 1. Attempt Firestore write
      await addDoc(collection(db, 'broadcasts'), {
        ...broadcastData,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn('[Broadcast] Firestore blocked or failed, syncing via local storage:', e);
    }

    // 2. Synchronize via localStorage
    const localBroadcast = {
      id: 'local-bc-' + Date.now(),
      ...broadcastData
    };
    const currentList = JSON.parse(localStorage.getItem('cc_local_broadcasts') || '[]');
    localStorage.setItem('cc_local_broadcasts', JSON.stringify([localBroadcast, ...currentList]));
    window.dispatchEvent(new Event('storage'));

    setOpen(false);
    setTitle('');
    setMessage('');
    setUrgency('normal');
    addToast('📡 Broadcast sent! All active users have been notified.', 'success');
    setLoading(false);
  };

  const urgencyConfig = {
    normal:   { label: 'Normal',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    urgent:   { label: 'Urgent',   color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="broadcast-pulse btn-org-accent"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.7rem 1.2rem', fontSize: '0.88rem', borderRadius: '10px',
        }}
      >
        <Radio size={15} />
        Broadcast Mission
      </button>

      {/* Composer Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 15000,
              background: 'rgba(5,15,35,0.85)', backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            }}
            onClick={e => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              style={{
                width: '100%', maxWidth: 480,
                background: 'linear-gradient(145deg, #0d1b2e, #0a1628)',
                border: '1px solid rgba(247,159,31,0.2)',
                borderRadius: 20, padding: '1.8rem',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                position: 'relative',
              }}
            >
              {/* Gold top accent */}
              <div className="org-topbar-accent" />

              <button onClick={() => setOpen(false)} style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'rgba(255,255,255,0.06)', border: 'none',
                borderRadius: 8, width: 30, height: 30, cursor: 'pointer',
                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={14} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.4rem', marginTop: '0.5rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--org-accent), #e67e22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Megaphone size={18} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Broadcast to All Users
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Notifies all active + newly logged-in users
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {/* Title */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>
                    Mission Title *
                  </label>
                  <input
                    ref={titleRef}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g., Flood Relief Volunteers Needed — Assam"
                    style={{
                      width: '100%', padding: '0.8rem 1rem', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-body)',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    autoComplete="off"
                  />
                </div>

                {/* Message */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.35rem' }}>
                    Message (optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe the mission, urgency, or location…"
                    rows={3}
                    style={{
                      width: '100%', padding: '0.8rem 1rem', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'var(--font-body)',
                      outline: 'none', resize: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Urgency */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>
                    Urgency Level
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {Object.entries(urgencyConfig).map(([key, cfg]) => (
                      <button key={key} onClick={() => setUrgency(key)} style={{
                        flex: 1, padding: '0.5rem 0.3rem', borderRadius: 8, cursor: 'pointer',
                        border: urgency === key ? `1.5px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.1)',
                        background: urgency === key ? cfg.bg : 'transparent',
                        color: urgency === key ? cfg.color : 'var(--text-secondary)',
                        fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-body)',
                        transition: 'all 0.15s',
                      }}>
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleBroadcast} disabled={loading} style={{
                width: '100%', marginTop: '1.2rem', padding: '0.9rem', border: 'none', borderRadius: 12,
                background: 'linear-gradient(135deg, var(--org-accent), #e67e22)',
                color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 6px 20px rgba(247,159,31,0.35)', fontFamily: 'var(--font-body)',
              }}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <><Radio size={16} /> Send Broadcast Now</>}
              </button>

              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.7rem', opacity: 0.7 }}>
                This will instantly notify all online users and appear on login for offline users
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── useBroadcastListener Hook ────────────────────────────────────────────────
/**
 * Call this in App.jsx or any top-level component.
 * Returns pending broadcasts for logged-in users (incl. post-login catch-up).
 * 
 * Usage:
 *   const broadcasts = useBroadcastListener(currentUser, addToast, (b) => openMission(b));
 */


export function useBroadcastListener(currentUser, addToast, onAction) {
  const seenIds = useRef(new Set());
  const lastSeenAt = useRef(
    currentUser ? (parseInt(localStorage.getItem('cc_lastBroadcastAt') || '0')) : 0
  );

  useEffect(() => {
    if (!currentUser) return;

    // 1. Local storage synchronization listener
    const checkLocalBroadcasts = () => {
      try {
        const localList = JSON.parse(localStorage.getItem('cc_local_broadcasts') || '[]');
        localList.forEach(data => {
          const id = data.id;
          if (seenIds.current.has(id)) return;
          seenIds.current.add(id);

          addToast(
            `📡 ${data.urgency === 'critical' ? '🚨' : data.urgency === 'urgent' ? '⚡' : '📢'} ${data.orgName}: "${data.title}"`,
            data.urgency === 'critical' ? 'error' : data.urgency === 'urgent' ? 'warning' : 'info',
            () => onAction && onAction(data)
          );
        });
      } catch (e) {
        console.error("Local broadcast sync failed:", e);
      }
    };

    window.addEventListener('storage', checkLocalBroadcasts);
    checkLocalBroadcasts(); // initial load check

    // 2. Firestore database listener
    let unsubscribe = () => {};
    try {
      const q = query(
        collection(db, 'broadcasts'),
        orderBy('timestamp', 'desc'),
        limit(5)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          const ts = data.timestamp?.toMillis?.() || Date.now();
          if (ts <= (lastSeenAt.current || (Date.now() - 24 * 60 * 60 * 1000))) return;
          if (seenIds.current.has(docSnap.id)) return;
          seenIds.current.add(docSnap.id);

          addToast(
            `📡 ${data.urgency === 'critical' ? '🚨' : data.urgency === 'urgent' ? '⚡' : '📢'} ${data.orgName}: "${data.title}"`,
            data.urgency === 'critical' ? 'error' : data.urgency === 'urgent' ? 'warning' : 'info',
            () => onAction && onAction(data)
          );

          if (ts > lastSeenAt.current) {
            lastSeenAt.current = ts;
            localStorage.setItem('cc_lastBroadcastAt', String(ts));
          }
        });
      }, (err) => {
        console.warn("Firestore broadcasts subscription warning:", err);
      });
    } catch (e) {
      console.warn("Firestore broadcasts setup blocked:", e);
    }

    return () => {
      window.removeEventListener('storage', checkLocalBroadcasts);
      unsubscribe();
    };
  }, [currentUser?.uid]);
}

export default BroadcastButton;
