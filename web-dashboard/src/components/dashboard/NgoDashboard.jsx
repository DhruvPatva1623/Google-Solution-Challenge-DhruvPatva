import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Users, PlusCircle, AlertCircle, CheckCircle, 
  ChevronRight, MapPin, Clock, Shield, Search, Filter, 
  MoreVertical, Share2, LogOut, User
} from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { AvatarPlaceholder } from '../common/AvatarPlaceholder';

export function NgoDashboard({ user, onLogout, onOpenProfile, addToast, emergencyMissions = [], onTriggerSos, theme, setTheme, activeTab, setActiveTab }) {
  
  const myMissions = useMemo(() => [
    { id: 101, title: 'Slum Education Drive', status: 'Active', volunteers: 12, target: 15, date: '2026-04-25' },
    { id: 102, title: 'Tree Plantation - Vasant Kunj', status: 'Completed', volunteers: 45, target: 40, date: '2026-04-10' },
    { id: 103, title: 'Health Checkup Camp', status: 'Pending', volunteers: 0, target: 8, date: '2026-05-01' },
  ], []);

  const stats = [
    { label: 'Total Volunteers', val: '0', change: '0%', icon: <Users size={20}/>, color: '#3b82f6' },
    { label: 'Tasks Completed', val: '0', change: '0%', icon: <CheckCircle size={20}/>, color: '#10b981' },
    { label: 'Active Missions', val: '0', change: '0%', icon: <PlusCircle size={20}/>, color: '#f97316' },
    { label: 'Impact Score', val: '0', change: '0', icon: <BarChart3 size={20}/>, color: '#8b5cf6' },
  ];

  const cardS = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-light)',
    borderRadius: '20px',
    padding: '1.5rem',
    color: 'var(--text-primary)'
  };

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Volunteer Engagement',
      data: [65, 59, 80, 81, 56, 95, 40],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: '#3b82f6',
      borderWidth: 2,
      borderRadius: 8,
    }]
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'transparent', zIndex: 9000, overflowY: 'auto' }}>
      
      <div style={{height:'80px'}} /> {/* Spacer for Global Navbar */}

      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>
        
        {/* Welcome Section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Welcome back, {user?.name ? user.name.split(' ')[0] : 'Partner'}!</h1>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Coordinating for <strong>{user.org || 'Your Organization'}</strong> in {user.city}.</p>
            {user.established && <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.8rem', borderRadius: '89px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Est. {user.established}</span>}
            {user.regId && <span style={{ background: 'rgba(59,130,246,0.1)', padding: '0.2rem 0.8rem', borderRadius: '89px', fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700 }}>ID: {user.regId}</span>}
          </div>
          {user.vision && <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', borderLeft: '3px solid #3b82f6', paddingLeft: '1rem', maxWidth: '800px' }}><i>"{user.vision}"</i></p>}
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {stats.map((s, i) => (
            <div key={i} style={cardS}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${s.color}15`, color: s.color, display: 'grid', placeItems: 'center' }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>{s.change}</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{s.val}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>


        {/* Content Tabs */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                
                {/* Engagement Chart */}
                <div style={cardS}>
                  <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><BarChart3 size={20} color="#3b82f6"/> Engagement Trends</h3>
                  <div style={{ height: 300 }}><Bar data={chartData} options={{ maintainAspectRatio: false }} /></div>
                </div>

                {/* Critical Missions Side panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ ...cardS, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
                    <h3 style={{ color: '#ef4444', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18}/> Active SOS</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {emergencyMissions.filter(m => m.org === user.org).length > 0 ? (
                        emergencyMissions.filter(m => m.org === user.org).map(m => (
                          <div key={m.id} style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.topic}</div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>{m.time} · 12 Responded</div>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>No active SOS broadcasts from your organization.</p>
                      )}
                    </div>
                  </div>
                  <div style={cardS}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Top Volunteers</h3>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                        <AvatarPlaceholder name={`Volunteer ${i}`} size={32} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Volunteer {i}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{100 - i * 10} missions completed</div>
                        </div>
                        <ChevronRight size={16} color="#4b5563"/>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'missions' && (
            <motion.div key="missions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Organization Missions</h2>
                <button className="btn-magic" style={{ padding: '0.8rem 1.5rem' }}>Create New Mission</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myMissions.map(m => (
                  <div key={m.id} style={{ ...cardS, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ width: 50, height: 50, borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center', fontSize: '1.5rem' }}>📋</div>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{m.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Posted on {m.date} · {user.city}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{m.volunteers}/{m.target}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Volunteers</div>
                      </div>
                      <div style={{ 
                        padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                        background: m.status === 'Active' ? 'rgba(16,185,129,0.15)' : (m.status === 'Completed' ? 'rgba(59,130,246,0.15)' : 'rgba(249,115,22,0.15)'),
                        color: m.status === 'Active' ? '#10b981' : (m.status === 'Completed' ? '#3b82f6' : '#f97316')
                      }}>
                        {m.status.toUpperCase()}
                      </div>
                      <button style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}><MoreVertical size={20}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'volunteers' && (
            <motion.div key="volunteers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Live Volunteer Monitoring</h2>
                  <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Real-time status of volunteers currently on mission.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', padding: '0.5rem 1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>8 Online</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                {[
                  { name: 'Priya Sharma', mission: 'Slum Education Drive', status: 'Active', time: '02:45:12', location: 'Bandra West' },
                  { name: 'Arjun Mehra', mission: 'Slum Education Drive', status: 'Active', time: '01:20:05', location: 'Bandra West' },
                  { name: 'Sneha Kapoor', mission: 'Blood Donation Camp', status: 'Break', time: '00:15:30', location: 'Andheri' },
                  { name: 'Vikram Singh', mission: 'Tree Plantation', status: 'Just Checked In', time: '00:02:45', location: 'Vasant Kunj' },
                ].map((v, i) => (
                  <div key={i} style={{ ...cardS, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <AvatarPlaceholder name={v.name} size={45} />
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{v.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>📍 {v.location}</span>
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Mission: {v.mission}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace', color: v.status === 'Active' ? '#10b981' : '#f97316' }}>{v.time}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>Session Time</div>
                      </div>
                      <div style={{ 
                        padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                        background: v.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)',
                        color: v.status === 'Active' ? '#10b981' : '#f97316',
                        border: `1px solid ${v.status === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(249,115,22,0.2)'}`
                      }}>
                        {v.status.toUpperCase()}
                      </div>
                      <button style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer' }}><MoreVertical size={20}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={cardS}>
                  <h3 style={{ marginBottom: '1.5rem' }}>Impact Distribution</h3>
                  <div style={{ height: 300 }}><Doughnut data={{
                    labels: ['Education', 'Environment', 'Healthcare', 'Disaster Relief'],
                    datasets: [{
                      data: [40, 25, 20, 15],
                      backgroundColor: ['#3b82f6', '#10b981', '#f97316', '#ef4444'],
                      borderWidth: 0
                    }]
                  }} options={{ maintainAspectRatio: false }} /></div>
                </div>
                <div style={cardS}>
                  <h3 style={{ marginBottom: '1.5rem' }}>Weekly Retention</h3>
                  <div style={{ height: 300 }}><Line data={{
                    labels: ['W1', 'W2', 'W3', 'W4', 'W5'],
                    datasets: [{
                      label: 'Return Rate',
                      data: [65, 72, 68, 85, 92],
                      borderColor: '#8b5cf6',
                      tension: 0.4,
                      fill: true,
                      backgroundColor: 'rgba(139, 92, 246, 0.1)'
                    }]
                  }} options={{ maintainAspectRatio: false }} /></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
