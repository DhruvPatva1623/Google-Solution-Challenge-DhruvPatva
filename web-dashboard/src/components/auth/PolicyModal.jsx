import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, BookOpen, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

export function PolicyModal({ user, onAccept, theme }) {
  const [agreed, setAgreed] = useState(false);

  const containerStyle = {
    position: 'fixed',
    inset: 0,
    background: theme === 'dark' ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(12px)',
    zIndex: 20000,
    display: 'grid',
    placeItems: 'center',
    padding: '1.5rem',
  };

  const modalStyle = {
    background: theme === 'dark' ? 'rgba(30, 41, 59, 0.75)' : 'rgba(255, 255, 255, 0.8)',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--glass-shadow)',
    borderRadius: '28px',
    maxWidth: '640px',
    width: '100%',
    padding: '2.5rem',
    maxHeight: '90vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.8rem',
  };

  const headerStyle = {
    textAlign: 'center',
    borderBottom: '1px solid var(--border-light)',
    paddingBottom: '1.2rem',
  };

  const sectionStyle = {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-light)',
    borderRadius: '16px',
    padding: '1.2rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  };

  const iconContainer = (color) => ({
    background: `${color}15`,
    color: color,
    padding: '0.6rem',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  return (
    <div style={containerStyle}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="glass-panel"
        style={modalStyle}
      >
        <div style={headerStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📜</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Welcome to CommunityConnect
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.3rem' }}>
            Please review our platform policies and guidelines before accessing your dashboard.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Section 1: User Guidance */}
          <div style={sectionStyle}>
            <div style={iconContainer('#3b82f6')}>
              <BookOpen size={22} />
            </div>
            <div>
              <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                1. Navigating key features
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Use the Live Map on the landing page to search and filter active relief missions. 
                Volunteers can check in to track service hours and accumulate points. 
                NGOs can create missions and view real-time volunteer logs.
              </p>
            </div>
          </div>

          {/* Section 2: Platform Restrictions */}
          <div style={sectionStyle}>
            <div style={iconContainer('#ef4444')}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                2. Platform rules & restrictions
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Do not upload fraudulent documents or fake mission details. Falsifying GPS locations during 
                check-ins is strictly prohibited and results in immediate account suspension. 
                Maintain professional conduct during all community relief events.
              </p>
            </div>
          </div>

          {/* Section 3: Privacy & Security */}
          <div style={sectionStyle}>
            <div style={iconContainer('#10b981')}>
              <Shield size={22} />
            </div>
            <div>
              <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                3. Privacy & security guidelines
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your data is protected. Location data is processed locally for matching nearby missions and is 
                never shared. Aadhaar and contact numbers are encrypted. You can request full data export or 
                account deletion at any time in your Settings panel.
              </p>
            </div>
          </div>
        </div>

        {/* Highlight User ID */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px dashed var(--primary-500)',
          borderRadius: '16px',
          padding: '1rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-primary)'
        }}>
          <span>Your Assigned Unique User ID: </span>
          <strong style={{
            fontFamily: 'monospace',
            background: 'rgba(249, 115, 22, 0.1)',
            padding: '0.2rem 0.6rem',
            borderRadius: '6px',
            color: 'var(--primary-500)',
            fontSize: '0.95rem',
            marginLeft: '0.3rem'
          }}>
            {user?.uid}
          </strong>
        </div>

        {/* Agreement controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <input 
              type="checkbox" 
              checked={agreed} 
              onChange={(e) => setAgreed(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--primary-500)',
                cursor: 'pointer'
              }}
            />
            <span>I acknowledge the guidelines, rules, and privacy terms.</span>
          </label>

          <button
            onClick={onAccept}
            disabled={!agreed}
            className="btn-magic"
            style={{
              width: '100%',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              opacity: agreed ? 1 : 0.5,
              cursor: agreed ? 'pointer' : 'not-allowed',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            <CheckCircle size={18} /> Agree & Go to Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
