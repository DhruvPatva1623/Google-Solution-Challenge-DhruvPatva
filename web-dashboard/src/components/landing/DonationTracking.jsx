import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ArrowRight, CheckCircle, Clock, MapPin, User, ChevronDown, ChevronUp } from 'lucide-react';

const DONATION_LEDGER = [
  {
    id: 'DN-2026-0847',
    item: '200 Food Packets',
    donor: 'Akshaya Patra Foundation',
    donorType: 'NGO',
    recipient: 'Flood Relief Camp, Kheda',
    status: 'delivered',
    date: '2026-06-12',
    timeline: [
      { step: 'Donated', time: 'Jun 12, 9:00 AM', done: true },
      { step: 'Picked up by volunteer', time: 'Jun 12, 9:45 AM', done: true },
      { step: 'Quality verified', time: 'Jun 12, 10:10 AM', done: true },
      { step: 'Delivered to camp', time: 'Jun 12, 11:30 AM', done: true },
      { step: 'Receipt confirmed', time: 'Jun 12, 11:45 AM', done: true },
    ],
    emoji: '🍱',
  },
  {
    id: 'DN-2026-0852',
    item: '50 Medicine Kits',
    donor: 'Surat Medical Trust',
    donorType: 'Organization',
    recipient: 'Community Health Center, Navsari',
    status: 'in-transit',
    date: '2026-06-13',
    timeline: [
      { step: 'Donated', time: 'Jun 13, 8:00 AM', done: true },
      { step: 'Picked up by volunteer', time: 'Jun 13, 8:30 AM', done: true },
      { step: 'Quality verified', time: 'Jun 13, 9:00 AM', done: true },
      { step: 'In transit', time: 'Jun 13, 9:20 AM', done: true },
      { step: 'Awaiting delivery', time: 'Estimated 12:00 PM', done: false },
    ],
    emoji: '💊',
  },
  {
    id: 'DN-2026-0839',
    item: '120 Blankets',
    donor: 'Rahul Verma',
    donorType: 'Individual',
    recipient: 'Night Shelter, Ahmedabad',
    status: 'delivered',
    date: '2026-06-10',
    timeline: [
      { step: 'Donated', time: 'Jun 10, 2:00 PM', done: true },
      { step: 'Picked up by volunteer', time: 'Jun 10, 3:15 PM', done: true },
      { step: 'Quality verified', time: 'Jun 10, 3:40 PM', done: true },
      { step: 'Delivered to shelter', time: 'Jun 10, 5:00 PM', done: true },
      { step: 'Receipt confirmed', time: 'Jun 10, 5:20 PM', done: true },
    ],
    emoji: '🧣',
  },
  {
    id: 'DN-2026-0861',
    item: '30 School Supply Kits',
    donor: 'Anjali Desai',
    donorType: 'Individual',
    recipient: 'Municipal School, Vadodara',
    status: 'verified',
    date: '2026-06-13',
    timeline: [
      { step: 'Donated', time: 'Jun 13, 10:00 AM', done: true },
      { step: 'Picked up by volunteer', time: 'Jun 13, 11:00 AM', done: true },
      { step: 'Quality verified', time: 'Jun 13, 11:30 AM', done: true },
      { step: 'Awaiting delivery', time: 'Scheduled for tomorrow', done: false },
    ],
    emoji: '📚',
  },
];

const statusConfig = {
  'delivered': { label: 'Delivered', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
  'in-transit': { label: 'In Transit', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
  'verified': { label: 'Verified', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  'pending': { label: 'Pending', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' },
};

export function DonationTrackingSection() {
  const [expandedId, setExpandedId] = useState(null);

  const stats = {
    totalDonations: DONATION_LEDGER.length,
    delivered: DONATION_LEDGER.filter(d => d.status === 'delivered').length,
    inTransit: DONATION_LEDGER.filter(d => d.status === 'in-transit').length,
    itemsDistributed: '400+',
  };

  return (
    <section id="donations" style={{ padding: '8rem 2rem', maxWidth: '1400px', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="reveal">
        <h2 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text-primary)', letterSpacing: '-1px' }}>
          Transparent Donation Tracking
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', fontWeight: 500, maxWidth: '650px', margin: '0 auto' }}>
          Every donation is tracked from donor to recipient. Full transparency, full accountability.
        </p>
      </div>

      {/* Quick Stats Strip */}
      <div className="reveal" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2rem',
        maxWidth: '900px', margin: '0 auto 3.5rem',
      }}>
        {[
          { value: stats.totalDonations, label: 'Total Donations', icon: <Package size={18} />, color: 'var(--primary-500)' },
          { value: stats.delivered, label: 'Delivered', icon: <CheckCircle size={18} />, color: '#22c55e' },
          { value: stats.inTransit, label: 'In Transit', icon: <Clock size={18} />, color: '#f97316' },
          { value: stats.itemsDistributed, label: 'Items Distributed', icon: <MapPin size={18} />, color: 'var(--accent-pink)' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--glass-bg)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--glass-border)', borderRadius: '18px',
            padding: '1.5rem 1rem', textAlign: 'center',
          }}>
            <div style={{ color: stat.color, marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Donation Ledger */}
      <div className="reveal" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <Package size={14} /> Public Donation Ledger
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {DONATION_LEDGER.map((donation) => {
            const status = statusConfig[donation.status];
            const isExpanded = expandedId === donation.id;

            return (
              <div
                key={donation.id}
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.3s ease',
                }}
              >
                {/* Donation Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : donation.id)}
                  style={{
                    padding: '1.2rem 1.5rem',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
                    display: 'grid', placeItems: 'center', fontSize: '1.5rem', flexShrink: 0,
                  }}>
                    {donation.emoji}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                      {donation.item}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <User size={12} /> {donation.donor}
                      <span style={{ opacity: 0.4 }}>→</span>
                      <MapPin size={12} /> {donation.recipient}
                    </div>
                  </div>

                  <div style={{
                    padding: '0.35rem 0.8rem', borderRadius: '10px',
                    background: status.bg, color: status.color,
                    fontSize: '0.75rem', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    flexShrink: 0,
                  }}>
                    {status.label}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace', flexShrink: 0 }}>
                    {donation.id}
                  </div>

                  <div style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Expanded Timeline */}
                {isExpanded && (
                  <div style={{
                    padding: '0 1.5rem 1.5rem',
                    borderTop: '1px solid var(--border-light)',
                  }}>
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '1px', color: 'var(--text-secondary)',
                      margin: '1rem 0 0.8rem',
                    }}>
                      Tracking Timeline
                    </div>

                    <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                      {/* Vertical line */}
                      <div style={{
                        position: 'absolute', left: '7px', top: '4px', bottom: '4px',
                        width: '2px', background: 'var(--border-light)',
                      }} />

                      {donation.timeline.map((step, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'flex-start', gap: '1rem',
                          marginBottom: i < donation.timeline.length - 1 ? '0.8rem' : 0,
                          position: 'relative',
                        }}>
                          {/* Dot */}
                          <div style={{
                            position: 'absolute', left: '-1.5rem', top: '3px',
                            width: '14px', height: '14px', borderRadius: '50%',
                            background: step.done ? '#22c55e' : 'var(--bg-secondary)',
                            border: step.done ? '2px solid #22c55e' : '2px solid var(--border-light)',
                            display: 'grid', placeItems: 'center',
                            zIndex: 1,
                          }}>
                            {step.done && <CheckCircle size={8} color="white" />}
                          </div>

                          <div>
                            <div style={{
                              fontWeight: step.done ? 700 : 500,
                              fontSize: '0.88rem',
                              color: step.done ? 'var(--text-primary)' : 'var(--text-secondary)',
                            }}>
                              {step.step}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                              {step.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
