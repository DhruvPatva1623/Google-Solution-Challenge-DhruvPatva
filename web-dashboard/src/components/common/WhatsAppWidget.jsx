import { useState } from 'react';
import { X, MessageCircle, Bell, Check, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WHATSAPP_NUMBER = '919876543210'; // Platform support number

export function WhatsAppWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_wa_subscribed') || 'false'); } catch { return false; }
  });
  const [selectedAlerts, setSelectedAlerts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc_wa_alerts') || '["missions","sos","badges"]'); } catch { return ['missions', 'sos', 'badges']; }
  });

  const alertTypes = [
    { id: 'missions', label: 'New Mission Alerts', desc: 'Get notified when missions match your skills', emoji: '🎯' },
    { id: 'sos', label: 'Emergency SOS Broadcasts', desc: 'Immediate alerts for critical needs nearby', emoji: '🚨' },
    { id: 'badges', label: 'Badge & Reward Updates', desc: 'Know when you unlock achievements', emoji: '🏆' },
    { id: 'checkin', label: 'Check-in Reminders', desc: 'Gentle reminders for upcoming missions', emoji: '⏰' },
    { id: 'impact', label: 'Weekly Impact Summary', desc: 'Your contribution stats every Sunday', emoji: '📊' },
  ];

  const toggleAlert = (id) => {
    setSelectedAlerts(prev => {
      const next = prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id];
      localStorage.setItem('cc_wa_alerts', JSON.stringify(next));
      return next;
    });
  };

  const handleSubscribe = () => {
    setSubscribed(true);
    localStorage.setItem('cc_wa_subscribed', 'true');
    // Open WhatsApp with pre-filled opt-in message
    const name = user?.displayName || user?.name || 'Volunteer';
    const message = encodeURIComponent(
      `Hi! I'm ${name} from CommunityConnect. I'd like to subscribe to volunteer updates:\n\n` +
      `✅ ${selectedAlerts.map(id => alertTypes.find(a => a.id === id)?.label).filter(Boolean).join('\n✅ ')}\n\n` +
      `My volunteer ID: ${user?.uid || 'new-user'}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const handleQuickChat = () => {
    const message = encodeURIComponent('Hi! I need help with CommunityConnect.');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <div
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4)',
          zIndex: 90,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(37, 211, 102, 0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 211, 102, 0.4)'; }}
        title="WhatsApp Updates"
      >
        <svg viewBox="0 0 32 32" width="30" height="30" fill="white">
          <path d="M16.004 3.2C9.374 3.2 4 8.494 4 15.024c0 2.088.556 4.104 1.613 5.886L4 28.8l8.163-1.577A12.84 12.84 0 0016.004 28c6.63 0 11.996-5.293 11.996-11.824S22.634 3.2 16.004 3.2zm0 21.648a9.76 9.76 0 01-4.946-1.345l-.355-.21-3.676.963.98-3.58-.232-.368A9.6 9.6 0 016 15.024c0-5.496 4.508-9.824 10.004-9.824s9.996 4.328 9.996 9.824-4.5 9.824-9.996 9.824zm5.484-7.353c-.3-.15-1.776-.876-2.052-.976-.276-.1-.476-.15-.676.15-.2.3-.776.976-.952 1.176-.176.2-.352.225-.652.075-.3-.15-1.268-.467-2.416-1.49-.892-.795-1.496-1.777-1.672-2.077-.176-.3-.02-.462.132-.612.136-.136.3-.352.452-.528.15-.176.2-.3.3-.5.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.23-.244-.586-.492-.506-.676-.516l-.576-.01c-.2 0-.526.075-.8.375-.276.3-1.052 1.028-1.052 2.508s1.076 2.908 1.228 3.108c.15.2 2.12 3.233 5.136 4.536.718.31 1.278.495 1.714.633.72.23 1.376.197 1.894.12.578-.087 1.776-.726 2.028-1.428.25-.7.25-1.3.176-1.428-.076-.125-.276-.2-.576-.35z"/>
        </svg>
        {subscribed && (
          <div style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '20px', height: '20px', borderRadius: '50%',
            background: '#22c55e', border: '2px solid white',
            display: 'grid', placeItems: 'center',
          }}>
            <Check size={10} color="white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* WhatsApp Settings Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-primary)',
                borderRadius: '28px',
                border: '1px solid var(--border-light)',
                maxWidth: '440px',
                width: '100%',
                overflow: 'hidden',
                boxShadow: '0 32px 64px rgba(0,0,0,0.3)',
              }}
            >
              {/* Header */}
              <div style={{
                background: '#25D366',
                padding: '1.5rem 1.8rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center',
                  }}>
                    <MessageCircle size={22} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>WhatsApp Updates</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>Get mission alerts on WhatsApp</div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                  <X size={18} color="white" />
                </button>
              </div>

              {/* Alert Preferences */}
              <div style={{ padding: '1.5rem 1.8rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Choose your alerts
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {alertTypes.map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => toggleAlert(alert.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.8rem',
                        padding: '0.8rem 1rem',
                        borderRadius: '14px',
                        border: `1px solid ${selectedAlerts.includes(alert.id) ? '#25D366' : 'var(--border-light)'}`,
                        background: selectedAlerts.includes(alert.id) ? 'rgba(37, 211, 102, 0.06)' : 'var(--bg-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.3rem' }}>{alert.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{alert.label}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>{alert.desc}</div>
                      </div>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                        background: selectedAlerts.includes(alert.id) ? '#25D366' : 'transparent',
                        border: selectedAlerts.includes(alert.id) ? 'none' : '2px solid var(--border-light)',
                        display: 'grid', placeItems: 'center',
                        transition: 'all 0.2s ease',
                      }}>
                        {selectedAlerts.includes(alert.id) && <Check size={14} color="white" strokeWidth={3} />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={handleSubscribe}
                    style={{
                      flex: 1, padding: '0.9rem',
                      borderRadius: '14px', border: 'none',
                      background: '#25D366', color: 'white',
                      fontWeight: 800, fontSize: '0.95rem',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <Bell size={16} />
                    {subscribed ? 'Update Preferences' : 'Subscribe via WhatsApp'}
                  </button>
                  <button
                    onClick={handleQuickChat}
                    style={{
                      padding: '0.9rem 1.2rem',
                      borderRadius: '14px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontWeight: 700, fontSize: '0.88rem',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', gap: '0.4rem',
                    }}
                  >
                    <Phone size={15} /> Chat
                  </button>
                </div>

                {subscribed && (
                  <div style={{
                    marginTop: '1rem', padding: '0.7rem 1rem',
                    background: 'rgba(37, 211, 102, 0.08)',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    fontSize: '0.8rem', color: '#22c55e', fontWeight: 600,
                  }}>
                    <Check size={16} /> You're subscribed to WhatsApp updates
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
