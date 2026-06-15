import { useState } from 'react';
import { Activity, MapPin, Clock, Heart, Shield, Users, X } from 'lucide-react';

const floatingFeatures = [
  {
    id: 'sos',
    icon: '🚨',
    iconBg: '#ef4444',
    label: 'Emergency SOS',
    value: 'Instant Broadcast',
    description: 'One-tap emergency alert that instantly notifies every nearby volunteer and NGO. Help arrives in minutes, not hours.',
    top: '10%', left: '4%', right: undefined,
    animation: 'animate-float-slow',
    opacity: 0.85,
    scale: 0.9,
    delay: '0s',
  },
  {
    id: 'livemap',
    icon: '🗺️',
    iconBg: '#3b82f6',
    label: 'Live Mission Map',
    value: 'Track Nearby',
    description: 'Interactive geo-map showing real-time volunteer missions, SOS alerts, and community needs happening around you right now.',
    top: '8%', left: undefined, right: '4%',
    animation: 'animate-float-fast',
    opacity: 0.85,
    scale: 0.9,
    delay: '0.6s',
  },
  {
    id: 'cities',
    icon: null,
    iconComponent: 'mappin',
    iconBg: 'var(--accent-pink)',
    iconRadius: '50%',
    label: 'Active Zones',
    value: '12 Cities',
    description: 'CommunityConnect operates across 12 cities in Gujarat with real-time geo-tagged missions and volunteer tracking.',
    top: '40%', left: '2%', right: undefined,
    animation: 'animate-float-fast',
    opacity: 0.7,
    scale: 0.85,
    delay: '1.2s',
  },
  {
    id: 'registry',
    icon: '📋',
    iconComponent: null,
    iconBg: '#22c55e',
    label: 'Digital Registry',
    value: 'Certified Hours',
    description: 'Every volunteer hour is logged in a tamper-proof digital registry. Download official certificates for your community service anytime.',
    top: '42%', left: undefined, right: '2%',
    animation: 'animate-float-slow',
    opacity: 0.7,
    scale: 0.85,
    delay: '1.8s',
  },
  {
    id: 'multilingual',
    icon: '🌐',
    iconBg: 'var(--accent-highlight)',
    label: 'Multilingual',
    value: '3+ Languages',
    description: 'Full support for English, Hindi, and Gujarati — including voice commands. No one is left behind due to language barriers.',
    top: '72%', left: '6%', right: undefined,
    animation: 'animate-float-slow',
    opacity: 0.65,
    scale: 0.82,
    delay: '0.4s',
  },
  {
    id: 'rewards',
    icon: '🏆',
    iconBg: '#f59e0b',
    label: 'Volunteer Rewards',
    value: 'Earn Badges',
    description: 'Complete missions to earn points, climb the leaderboard, and unlock digital certification badges for your service.',
    top: '72%', left: undefined, right: '6%',
    animation: 'animate-float-fast',
    opacity: 0.65,
    scale: 0.82,
    delay: '1s',
  },
];

export function Hero({ setShowAuthModal }) {
  const [activePopup, setActivePopup] = useState(null);

  const handleFeatureClick = (feature) => {
    setActivePopup(activePopup?.id === feature.id ? null : feature);
  };

  return (
    <section style={{ position: 'relative', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 2rem', overflow: 'hidden' }}>
      <div className="animate-float-fast" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.5rem 1.2rem', borderRadius: '100px', border: '1px solid var(--border-light)', marginBottom: '2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        <span style={{ color: '#22c55e' }}>●</span> Real-Time Volunteer Network Active
      </div>
      <h1 className="hero-title reveal active">
        Turn Compassion Into <br />
        <span className="text-gradient">Meaningful Action</span>
      </h1>
      <p className="hero-subtitle reveal active" style={{ transitionDelay: '0.1s' }}>
        An open platform connecting 10,000+ volunteers with urgent community needs. Your next hour could change a life.
      </p>
      <div className="reveal active" style={{ transitionDelay: '0.2s', display: 'flex', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
        <button className="btn-magic" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }} onClick={() => setShowAuthModal(true)}>Join & Find Missions</button>
        <button onClick={() => document.getElementById('impact')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '99px', border: '1px solid var(--border-light)', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} /> See Live Impact
        </button>
      </div>

      {/* Floating Feature Badges — evenly spaced, clickable */}
      {floatingFeatures.map((f) => (
        <div
          key={f.id}
          className={`glass-panel ${f.animation}`}
          onClick={() => handleFeatureClick(f)}
          style={{
            position: 'absolute',
            top: f.top,
            left: f.left,
            right: f.right,
            padding: '0.8rem 1.2rem',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            animationDelay: f.delay,
            pointerEvents: 'auto',
            opacity: f.opacity,
            transform: `scale(${f.scale})`,
            cursor: 'pointer',
            transition: 'transform 0.25s ease, opacity 0.25s ease, box-shadow 0.25s ease',
            zIndex: activePopup?.id === f.id ? 20 : 5,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = `scale(${f.scale * 1.08})`;
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = String(f.opacity);
            e.currentTarget.style.transform = `scale(${f.scale})`;
            e.currentTarget.style.boxShadow = '';
          }}
        >
          <div style={{
            width: 40, height: 40,
            background: f.iconBg,
            borderRadius: f.iconRadius || 10,
            display: 'grid', placeItems: 'center',
            color: 'white', fontSize: '1.2rem',
          }}>
            {f.icon ? f.icon : f.iconComponent === 'mappin' ? <MapPin size={20} /> : <Shield size={18} />}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{f.label}</div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{f.value}</div>
          </div>
        </div>
      ))}

      {/* Feature Description Popup */}
      {activePopup && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '20px',
            padding: '1.2rem 1.6rem',
            maxWidth: '420px',
            width: '90%',
            zIndex: 100,
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            animation: 'popupSlideUp 0.3s ease',
          }}
        >
          <div style={{
            width: 44, height: 44, flexShrink: 0,
            background: activePopup.iconBg,
            borderRadius: activePopup.iconRadius || 12,
            display: 'grid', placeItems: 'center',
            color: 'white', fontSize: '1.3rem',
          }}>
            {activePopup.icon ? activePopup.icon : activePopup.iconComponent === 'mappin' ? <MapPin size={20} /> : <Shield size={18} />}
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
              {activePopup.label}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {activePopup.description}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setActivePopup(null); }}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: '0.2rem', flexShrink: 0,
              marginTop: '0.1rem',
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Popup animation keyframes */}
      <style>{`
        @keyframes popupSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </section>
  );
}
