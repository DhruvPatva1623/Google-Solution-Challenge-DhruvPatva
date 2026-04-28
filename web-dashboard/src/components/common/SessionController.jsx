import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Clock, List, GripHorizontal, X } from 'lucide-react';

export function SessionController({ activeSessionSecs, isCheckingIn, isPaused, onPause, onResume, onStop, onAddTimestamp, timestamps }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(false);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isCheckingIn) return null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="session-controller glass-panel"
      style={{
        position: 'fixed',
        top: '120px',
        right: '40px',
        zIndex: 10001,
        padding: '1rem',
        width: isMinimized ? '180px' : '320px',
        borderRadius: '24px',
        border: '1px solid var(--accent-highlight)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        cursor: 'grab',
        touchAction: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMinimized ? '0' : '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GripHorizontal size={16} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-highlight)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isPaused ? 'Session Paused' : 'Active Mission'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
          >
            {isMinimized ? <Play size={14} /> : <X size={14} />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
            <motion.div 
              animate={isPaused ? { scale: 1 } : { scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)' }}
            >
              {formatTime(activeSessionSecs)}
            </motion.div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem' }}>
            {isPaused ? (
              <button onClick={onResume} className="session-btn resume-btn">
                <Play size={18} />
                <span>Resume</span>
              </button>
            ) : (
              <button onClick={onPause} className="session-btn pause-btn">
                <Pause size={18} />
                <span>Pause</span>
              </button>
            )}
            
            <button onClick={onAddTimestamp} className="session-btn marker-btn">
              <Clock size={18} />
              <span>Marker</span>
            </button>

            <button onClick={onStop} className="session-btn stop-btn">
              <Square size={18} />
              <span>Stop</span>
            </button>
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTimestamps(!showTimestamps); }}
              style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
            >
              <List size={14} /> {showTimestamps ? 'Hide Timeline' : `Timeline (${timestamps.length})`}
            </button>
            
            <AnimatePresence>
              {showTimestamps && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden', marginTop: '0.5rem' }}
                >
                  <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.2rem' }}>
                    {timestamps.length === 0 ? (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No markers added yet</div>
                    ) : (
                      timestamps.map((t, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '8px', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Marker #{timestamps.length - i}</span>
                          <span style={{ fontWeight: 700, color: 'var(--accent-highlight)' }}>{formatTime(t)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {isMinimized && (
        <div style={{ textAlign: 'center', fontWeight: 800, fontFamily: 'monospace', fontSize: '1.2rem', color: isPaused ? 'var(--text-secondary)' : 'var(--accent-highlight)' }}>
          {formatTime(activeSessionSecs)}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .session-controller {
          backdrop-filter: blur(20px);
          background: var(--glass-bg);
        }
        .session-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.8rem 0.4rem;
          border-radius: 16px;
          border: 1px solid var(--border-light);
          color: white;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .session-btn span {
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .session-btn:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }
        .session-btn:active {
          transform: translateY(0) scale(0.95);
        }
        .resume-btn { 
          background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
          border-color: #10b981;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        .pause-btn { 
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
          border-color: #f59e0b;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        }
        .marker-btn { 
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); 
          border-color: #6366f1;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
        .stop-btn { 
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
          border-color: #ef4444;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
          animation: pulse-red 2s infinite;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </motion.div>
  );
}
