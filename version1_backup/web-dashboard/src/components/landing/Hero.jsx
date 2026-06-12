import { Activity, MapPin, Clock } from 'lucide-react';

export function Hero({ setShowAuthModal }) {
  return (
    <section style={{ position: 'relative', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 2rem', overflow: 'hidden' }}>
      <div className="animate-float-fast" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.5rem 1.2rem', borderRadius: '100px', border: '1px solid var(--border-light)', marginBottom: '2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        <span style={{ color: 'var(--accent-pink)' }}>●</span> AI Matching Engine V2 Now Live
      </div>
      <h1 className="hero-title reveal active">
        Turn Compassion Into <br />
        <span className="text-gradient">Intelligent Action</span>
      </h1>
      <p className="hero-subtitle reveal active" style={{ transitionDelay: '0.1s' }}>
        AI-powered platform matching 10,000+ volunteers with urgent social causes. Your next hour could change a life.
      </p>
      <div className="reveal active" style={{ transitionDelay: '0.2s', display: 'flex', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
        <button className="btn-magic" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }} onClick={() => setShowAuthModal(true)}>Join & Find Missions</button>
        <button onClick={() => document.getElementById('impact')?.scrollIntoView({ behavior: 'smooth' })} style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '99px', border: '1px solid var(--border-light)', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} /> See Live Impact
        </button>
      </div>

      {/* Floating Decorative Elements - Stats from reference */}
      <div className="glass-panel animate-float-slow" style={{ position: 'absolute', top: '15%', left: '5%', padding: '0.8rem 1.2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', pointerEvents: 'none', opacity: 0.8, transform: 'scale(0.9)' }}>
        <div style={{ width: 40, height: 40, background: 'var(--accent-highlight)', borderRadius: 10, display: 'grid', placeItems: 'center', color: 'white', fontWeight: 'bold' }}>94%</div>
        <div style={{ textAlign: 'left' }}><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Matching Accuracy</div><div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Algorithm V2</div></div>
      </div>
      
      <div className="glass-panel animate-float-fast" style={{ position: 'absolute', bottom: '15%', right: '5%', padding: '0.8rem 1.2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', animationDelay: '1s', pointerEvents: 'none', opacity: 0.8, transform: 'scale(0.9)' }}>
        <div style={{ width: 40, height: 40, background: 'var(--primary-500)', borderRadius: 10, display: 'grid', placeItems: 'center', color: 'white', fontSize: '1.2rem' }}>⚡</div>
        <div style={{ textAlign: 'left' }}><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Response Network</div><div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>30s Action</div></div>
      </div>

      <div className="glass-panel animate-float-slow" style={{ position: 'absolute', top: '50%', right: '2%', padding: '0.8rem 1.2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', animationDelay: '0.5s', pointerEvents: 'none', opacity: 0.6, transform: 'scale(0.8)' }}>
        <div style={{ width: 40, height: 40, background: 'var(--accent-pink)', borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'white' }}><MapPin size={20} /></div>
        <div style={{ textAlign: 'left' }}><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Active Zones</div><div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>12 Cities</div></div>
      </div>
    </section>
  );
}
