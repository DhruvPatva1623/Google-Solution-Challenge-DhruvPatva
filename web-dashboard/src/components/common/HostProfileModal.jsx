import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, ShieldCheck, MapPin, Calendar, Clock, Star, Heart, Share2, ThumbsUp } from 'lucide-react';
import { AvatarPlaceholder } from './AvatarPlaceholder';

export function HostProfileModal({ host, onClose }) {
  if (!host) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} />
      
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        style={{ position: 'relative', width: '100%', maxWidth: '600px', background: 'var(--bg-elevated)', borderRadius: '24px', border: '1px solid var(--border-light)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header / Banner */}
        <div style={{ height: '140px', background: 'linear-gradient(135deg, var(--primary-500), var(--accent-pink))', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <X size={18}/>
          </button>
        </div>

        {/* Profile Info */}
        <div style={{ padding: '0 2rem 2rem', marginTop: '-50px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ border: '4px solid var(--bg-elevated)', borderRadius: '24px', overflow: 'hidden', background: 'var(--bg-elevated)' }}>
              <AvatarPlaceholder name={host.name} size={100} />
            </div>
            <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.2rem' }}>{host.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
                <ShieldCheck size={16}/> Verified Coordinator
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[{ label: 'Missions', val: host.missions || 42, icon: <Heart size={16}/> }, { label: 'Rating', val: host.rating || '4.9/5', icon: <Star size={16}/> }, { label: 'Impact', val: host.impact || 'High', icon: <Award size={16}/> }].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                <div style={{ color: 'var(--primary-500)', marginBottom: '0.3rem', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{s.val}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', fontWeight: 700 }}>About the Host</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {host.bio || `${host.name} is a dedicated lead coordinator at ${host.org || 'CommunityConnect'}. With over 5 years of experience in on-ground mobilization, they have successfully managed crisis response missions across ${host.city || 'multiple regions'}.`}
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 700 }}>Past Missions & Reputation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {[{ title: 'Flood Relief Coordination', date: 'March 2026', badge: 'Critical Success' }, { title: 'Vaccination Drive', date: 'Jan 2026', badge: 'High Engagement' }].map((m, i) => (
                <div key={i} style={{ padding: '1rem', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.date}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-500)', background: 'rgba(249,115,22,0.1)', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>{m.badge}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ flex: 1, padding: '1rem', borderRadius: '14px', background: 'var(--primary-500)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              Connect with Host
            </button>
            <button style={{ padding: '1rem', borderRadius: '14px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)', cursor: 'pointer' }}>
              <Share2 size={20}/>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
