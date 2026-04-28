import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Clock, Info, Shield, User, Building, Heart } from 'lucide-react';

export function SosModal({ user, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    org: user?.org || '',
    time: '',
    topic: '',
    reason: '',
    location: user?.city || ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.topic || !form.reason || !form.time) return;
    
    onSubmit({
      ...form,
      id: Date.now(),
      type: 'SOS_MISSION',
      timestamp: new Date().toISOString(),
      isCritical: true
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    border: '1px solid var(--border-light)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'var(--font-body)'
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', 
        backdropFilter: 'blur(8px)', zIndex: 20000, 
        display: 'grid', placeItems: 'center', padding: '1rem'
      }}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} 
        animate={{ scale: 1, y: 0 }} 
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="glass-panel"
        style={{
          width: 'min(560px, 100%)', maxHeight: '90vh', overflowY: 'auto',
          borderRadius: '28px', padding: '2rem', border: '1px solid rgba(239,68,68,0.3)',
          position: 'relative', boxShadow: '0 20px 50px rgba(239,68,68,0.2)'
        }}
      >
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute', top: '1.2rem', right: '1.2rem', 
            background: 'rgba(255,255,255,0.05)', border: 'none', 
            borderRadius: '50%', width: 32, height: 32, 
            display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'white'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: 70, height: 70, background: 'rgba(239,68,68,0.1)', 
            borderRadius: '20px', display: 'grid', placeItems: 'center', 
            margin: '0 auto 1rem', border: '2px solid #ef4444' 
          }}>
            <AlertTriangle size={32} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Broadcast SOS Mission</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Flag an urgent community need. This will notify all nearby volunteers immediately.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}><User size={14} /> Your Name</label>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}><Building size={14} /> NGO / Company</label>
              <input style={inputStyle} value={form.org} onChange={e => set('org', e.target.value)} placeholder="Independent" />
            </div>
          </div>

          <div>
            <label style={labelStyle}><Clock size={14} /> Estimated Time / Duration</label>
            <input style={inputStyle} value={form.time} onChange={e => set('time', e.target.value)} placeholder="e.g. Today 4:00 PM (2 hours)" required />
          </div>

          <div>
            <label style={labelStyle}><Heart size={14} /> What is this about?</label>
            <input style={inputStyle} value={form.topic} onChange={e => set('topic', e.target.value)} placeholder="e.g. Medical Supply Transport" required />
          </div>

          <div>
            <label style={labelStyle}><Info size={14} /> Why is this needed? (Rationale)</label>
            <textarea 
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} 
              value={form.reason} 
              onChange={e => set('reason', e.target.value)} 
              placeholder="Explain the urgency and impact..." 
              required 
            />
          </div>

          <div style={{ background: 'rgba(239,68,68,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={14} /> Verification Protocol
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              By broadcasting this SOS, you confirm this is a verified emergency. Abuse of the SOS system may lead to account suspension.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn-magic" 
            style={{ 
              padding: '1.1rem', fontSize: '1.1rem', fontWeight: 800, 
              background: 'linear-gradient(135deg, #ef4444, #f97316)', 
              boxShadow: '0 10px 25px rgba(239,68,68,0.4)',
              border: 'none'
            }}
          >
            🚨 Broadcast Emergency Mission
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
