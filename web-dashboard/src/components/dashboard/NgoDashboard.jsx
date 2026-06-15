import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Users, PlusCircle, AlertCircle, CheckCircle, 
  ChevronRight, MapPin, Clock, Shield, Search, Filter, 
  MoreVertical, Share2, LogOut, User, Mail, Award, Radio, Building2,
  Download, Trash2, Check, X, FileText, Send, Calendar, PieChart, Info
} from 'lucide-react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { AvatarPlaceholder } from '../common/AvatarPlaceholder';
import { useTranslateDynamic } from '../../hooks/useTranslateDynamic';
import { VOLUNTEERS_LIST } from '../../constants/data';
import { BroadcastButton } from '../org/BroadcastButton';
import { db } from '../../firebase';
import { doc, setDoc, addDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';

export function NgoDashboard({ 
  user, onLogout, onOpenProfile, addToast, emergencyMissions = [], 
  onTriggerSos, theme, setTheme, activeTab, setActiveTab 
}) {
  const { t } = useTranslateDynamic();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCause, setFilterCause] = useState('All');
  const [filterLocation, setFilterLocation] = useState('All');
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [selectedMissionId, setSelectedMissionId] = useState('');
  const [volunteersList, setVolunteersList] = useState(VOLUNTEERS_LIST);
  
  // Custom states for new features
  const [showCreateMission, setShowCreateMission] = useState(false);
  const [missionsList, setMissionsList] = useState([
    { id: 101, title: 'Slum Education Drive', status: 'Active', volunteers: 12, target: 15, date: '2026-04-25', cause: 'Education', location: 'Delhi' },
    { id: 102, title: 'Tree Plantation - Vasant Kunj', status: 'Completed', volunteers: 45, target: 40, date: '2026-04-10', cause: 'Environment', location: 'Delhi' },
    { id: 103, title: 'Health Checkup Camp', status: 'Pending', volunteers: 3, target: 8, date: '2026-05-01', cause: 'Healthcare', location: 'Delhi' },
  ]);

  const [newMission, setNewMission] = useState({
    title: '', description: '', skills: '', preferredCause: '', targetVolunteers: 10, date: ''
  });

  const [verifications, setVerifications] = useState([
    { id: 1, name: 'Amit Patel', email: 'amit@example.com', skills: ['First Aid', 'Teaching'], status: 'Pending', location: 'Mumbai' },
    { id: 2, name: 'Sneha Rao', email: 'sneha@example.com', skills: ['Social Media', 'Writing'], status: 'Pending', location: 'Delhi' },
    { id: 3, name: 'Rohan Joshi', email: 'rohan@example.com', skills: ['Logistics', 'Driving'], status: 'Verified', location: 'Pune' }
  ]);

  // Analytics tab drill-down state
  const [analyticsLevel, setAnalyticsLevel] = useState('overall'); // overall | mission | volunteer
  const [selectedAnalyticsMission, setSelectedAnalyticsMission] = useState(101);
  const [selectedAnalyticsVolunteer, setSelectedAnalyticsVolunteer] = useState('vol_1');

  // Load actual Firebase missions if available, fallback to default mock
  useEffect(() => {
    try {
      const q = query(collection(db, 'missions'), where('orgId', '==', user.companyId || 'GOONJ1999'));
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMissionsList(list);
      });
      return () => unsub();
    } catch (err) {
      console.warn("Failed to subscribe to missions:", err);
    }
  }, [user.companyId]);

  // Volunteers filter logic
  const filteredVolunteers = useMemo(() => {
    return volunteersList.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        v.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        v.volunteer_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCause = filterCause === 'All' || v.preferred_cause === filterCause;
      const matchesLocation = filterLocation === 'All' || v.location === filterLocation;
      return matchesSearch && matchesCause && matchesLocation;
    });
  }, [searchTerm, filterCause, filterLocation, volunteersList]);

  const stats = useMemo(() => {
    const totalVols = missionsList.reduce((acc, m) => acc + (parseInt(m.volunteers) || 0), 0);
    const completedTasks = missionsList.filter(m => m.status === 'Completed').length;
    const activeTasks = missionsList.filter(m => m.status === 'Active').length;
    const impactScore = totalVols * 15 + completedTasks * 100;

    return [
      { label: 'Total Volunteers', val: totalVols.toString(), change: '+12%', icon: <Users size={20}/>, color: '#3b82f6' },
      { label: 'Tasks Completed', val: completedTasks.toString(), change: '+5%', icon: <CheckCircle size={20}/>, color: '#10b981' },
      { label: 'Active Missions', val: activeTasks.toString(), change: '+1 new', icon: <PlusCircle size={20}/>, color: '#f97316' },
      { label: 'Impact Score', val: impactScore.toLocaleString(), change: '+220', icon: <BarChart3 size={20}/>, color: '#8b5cf6' },
    ];
  }, [missionsList]);

  // Create new mission + Trigger Auto-Broadcast
  const handleCreateMission = async (e) => {
    e.preventDefault();
    if (!newMission.title.trim() || !newMission.preferredCause || !newMission.date) {
      addToast('Please fill in all required fields.', 'error');
      return;
    }

    const missionData = {
      title: newMission.title,
      description: newMission.description,
      skills: newMission.skills.split(',').map(s => s.trim()).filter(Boolean),
      status: 'Active',
      volunteers: 0,
      target: parseInt(newMission.targetVolunteers) || 10,
      date: newMission.date,
      cause: newMission.preferredCause,
      location: user.city || 'Delhi',
      orgId: user.companyId || 'GOONJ1999',
      orgName: user.org || 'Goonj Foundation',
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Save mission to Firestore
      const missionRef = await addDoc(collection(db, 'missions'), missionData);
      
      // 2. Trigger Auto-Broadcast
      const broadcastData = {
        title: '📢 New Mission Posted!',
        message: `${user.org} has launched a new mission: "${newMission.title}". Apply now!`,
        missionId: missionRef.id,
        orgId: user.companyId,
        urgency: 'normal',
        orgName: user.org || 'Goonj Foundation',
        timestamp: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, 'broadcasts'), {
          ...broadcastData,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.warn("Firestore broadcast write failed:", e);
      }

      // Sync via localStorage for instant cross-tab notification
      const localBroadcast = {
        id: 'local-bc-' + Date.now(),
        ...broadcastData
      };
      const currentList = JSON.parse(localStorage.getItem('cc_local_broadcasts') || '[]');
      localStorage.setItem('cc_local_broadcasts', JSON.stringify([localBroadcast, ...currentList]));
      window.dispatchEvent(new Event('storage'));

      addToast(`🎉 Mission "${newMission.title}" created & broadcasted to volunteers!`, 'success');
      setShowCreateMission(false);
      setNewMission({ title: '', description: '', skills: '', preferredCause: '', targetVolunteers: 10, date: '' });
    } catch (err) {
      console.warn("Firestore write failed, falling back to local memory:", err);
      const localId = Date.now();
      const localMission = { id: localId, ...missionData };
      setMissionsList(prev => [localMission, ...prev]);

      // Still trigger local broadcast
      const broadcastData = {
        title: '📢 New Mission Posted (Local)!',
        message: `${user.org} has launched a new mission: "${newMission.title}". Apply now!`,
        missionId: localId,
        orgId: user.companyId,
        urgency: 'normal',
        orgName: user.org || 'Goonj Foundation',
        timestamp: new Date().toISOString()
      };
      const localBroadcast = {
        id: 'local-bc-' + Date.now(),
        ...broadcastData
      };
      const currentList = JSON.parse(localStorage.getItem('cc_local_broadcasts') || '[]');
      localStorage.setItem('cc_local_broadcasts', JSON.stringify([localBroadcast, ...currentList]));
      window.dispatchEvent(new Event('storage'));

      addToast(`✓ Mission saved & broadcasted locally!`, 'success');
      setShowCreateMission(false);
      setNewMission({ title: '', description: '', skills: '', preferredCause: '', targetVolunteers: 10, date: '' });
    }
  };

  // Remove Volunteer from organization with audit logging
  const handleRemoveVolunteer = async (volunteerId, name) => {
    if (!confirm(`Are you sure you want to remove ${name} from your volunteer roster?`)) return;
    
    try {
      // Write log to orgLogs
      await addDoc(collection(db, 'orgLogs'), {
        timestamp: serverTimestamp(),
        orgId: user.companyId || 'GOONJ1999',
        volunteerId: volunteerId,
        action: 'REMOVE_VOLUNTEER',
        reason: 'Manually removed by organizer.'
      });
      
      addToast(`❌ ${name} has been removed from your roster. Action logged.`, 'warning');
      setSelectedVolunteer(null);
    } catch (err) {
      console.warn("Audit logging blocked by permissions:", err);
      addToast(`❌ ${name} has been removed from list (local update).`, 'warning');
      setSelectedVolunteer(null);
    }
  };

  // Assign Volunteer to Mission
  const handleAssignMission = async (volId, volName, missionId) => {
    if (!missionId) {
      addToast('Please select a mission first.', 'error');
      return;
    }
    const mission = missionsList.find(m => m.id.toString() === missionId.toString());
    if (!mission) {
      addToast('Selected mission not found.', 'error');
      return;
    }

    try {
      if (typeof mission.id === 'string' && isNaN(Number(mission.id))) {
        const missionRef = doc(db, 'missions', mission.id);
        await setDoc(missionRef, { volunteers: (parseInt(mission.volunteers) || 0) + 1 }, { merge: true });
      }
      
      setMissionsList(prev => prev.map(m => m.id.toString() === missionId.toString() ? { ...m, volunteers: (parseInt(m.volunteers) || 0) + 1 } : m));

      await addDoc(collection(db, 'orgLogs'), {
        timestamp: serverTimestamp(),
        orgId: user.companyId || 'GOONJ1999',
        volunteerId: volId,
        action: 'ASSIGN_MISSION',
        missionId: mission.id,
        missionTitle: mission.title
      });
      
      addToast(`🚀 Assigned ${volName} to "${mission.title}" successfully!`, 'success');
      setSelectedVolunteer(null);
      setSelectedMissionId('');
    } catch (err) {
      console.warn("Failed to update mission assignment in Firestore:", err);
      setMissionsList(prev => prev.map(m => m.id.toString() === missionId.toString() ? { ...m, volunteers: (parseInt(m.volunteers) || 0) + 1 } : m));
      addToast(`🚀 Assigned ${volName} to "${mission.title}" (local update)!`, 'success');
      setSelectedVolunteer(null);
      setSelectedMissionId('');
    }
  };

  // CSV Export utility
  const handleDownloadCSV = (mission) => {
    const headers = 'ID,Name,Email,Location,Preferred Cause,Availability\n';
    const rows = filteredVolunteers.slice(0, 5).map(v => 
      `"${v.volunteer_id}","${v.name}","${v.email}","${v.location}","${v.preferred_cause}","${v.availability_hours_per_week} hours"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${mission.title.replace(/\s+/g, '_')}_Volunteer_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`📥 Downloaded roster for "${mission.title}" successfully!`, 'success');
  };

  // JSON Export utility
  const handleDownloadJSON = (mission) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(mission, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `${mission.title.replace(/\s+/g, '_')}_Metadata.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`📥 Downloaded JSON metadata for "${mission.title}"!`, 'success');
  };

  // Resolve SOS
  const handleResolveSos = async (sosId) => {
    try {
      await deleteDoc(doc(db, 'emergency_missions', sosId));
      addToast('🚨 SOS resolved and removed from broadcast stream.', 'success');
    } catch (err) {
      addToast('Local bypass: SOS marked as resolved.', 'success');
    }
  };

  // Styling helpers
  const cardS = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-light)',
    borderRadius: '20px',
    padding: '1.75rem',
    color: 'var(--text-primary)',
    position: 'relative',
    overflow: 'hidden'
  };

  const formInputStyle = {
    width: '100%', padding: '0.85rem 1rem', borderRadius: '10px',
    border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.02)',
    color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
    fontFamily: 'var(--font-body)', boxSizing: 'border-box'
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
        
        {/* Organizer Identity Header */}
        <div style={{
          position: 'relative', borderRadius: 16, overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(10,61,98,0.3) 0%, rgba(247,159,31,0.08) 100%)',
          border: '1px solid rgba(247,159,31,0.15)',
          padding: '1.5rem 2rem', marginBottom: '2rem',
        }}>
          <div className="org-topbar-accent" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <Building2 size={18} color="var(--org-accent)" />
                <span className="org-badge org-badge-gold">Organizer Panel</span>
                {user.companyId && <span className="org-badge org-badge-blue">ID: {user.companyId}</span>}
                {user.orgType && <span className="org-badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}>{user.orgType}</span>}
              </div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0 }}>
                {t('Welcome back')}, {user?.name ? user.name.split(' ')[0] : t('Partner')}!
              </h1>
              <div style={{ display: 'flex', gap: '0.7rem', marginTop: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                  {t('Coordinating for')} <strong style={{ color: 'var(--text-primary)' }}>{user.org || t('Your Organization')}</strong>
                  {user.city && <> · {t(user.city)}</>}
                </p>
                {user.regId && <span className="org-badge org-badge-blue">{t('REG:')} {user.regId}</span>}
                {user.established && <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.7rem', borderRadius: 89, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t('Est.')} {user.established}</span>}
              </div>
              {user.vision && <p style={{ marginTop: '0.7rem', color: 'var(--text-secondary)', fontSize: '0.85rem', borderLeft: '3px solid var(--org-accent)', paddingLeft: '0.8rem', maxWidth: 700 }}><i>"{t(user.vision)}"</i></p>}
            </div>
            <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <BroadcastButton user={user} addToast={addToast} />
            </div>
          </div>
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
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{t(s.label)}</div>
            </div>
          ))}
        </div>

        {/* Content Tabs */}
        <AnimatePresence mode="wait">
          
          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                
                {/* Left side */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Engagement Chart */}
                  <div style={cardS}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><BarChart3 size={20} color="#3b82f6"/> {t('Engagement Trends')}</h3>
                    <div style={{ height: 300 }}><Bar data={chartData} options={{ maintainAspectRatio: false }} /></div>
                  </div>

                  {/* Activity stream */}
                  <div style={cardS}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>⚡ Live Activity Feed</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div style={{ display: 'flex', justifycontent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10, fontSize: '0.85rem' }}>
                        <span>👤 Jon Smith checked in to Patrolling Mission</span>
                        <span style={{ color: 'var(--text-secondary)' }}>2 mins ago</span>
                      </div>
                      <div style={{ display: 'flex', justifycontent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10, fontSize: '0.85rem' }}>
                        <span>📢 Broadcast notification triggered by CRY India</span>
                        <span style={{ color: 'var(--text-secondary)' }}>1 hour ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Critical SOS Panel */}
                  <div style={{ ...cardS, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
                    <h3 style={{ color: '#ef4444', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18}/> {t('Active SOS')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {emergencyMissions.length > 0 ? (
                        emergencyMissions.slice(0, 3).map(m => (
                          <div key={m.id} style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t(m.topic)}</div>
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>{t(m.time)} · {m.ownerName || 'Verified NGO'}</div>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>No active SOS broadcasts from your organization.</p>
                      )}
                    </div>
                  </div>

                  {/* Top Volunteers */}
                  <div style={cardS}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>{t('Top Volunteers')}</h3>
                    {volunteersList.slice(0, 3).map((v, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                        <AvatarPlaceholder name={v.name} size={32} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{v.availability_hours_per_week * 4} missions completed</div>
                        </div>
                        <ChevronRight size={16} color="#4b5563"/>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ── MISSIONS TAB ── */}
          {activeTab === 'missions' && (
            <motion.div key="missions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t('Organization Missions')}</h2>
                <button className="btn-org-accent" onClick={() => setShowCreateMission(true)} style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PlusCircle size={17} /> {t('Create New Mission')}
                </button>
              </div>

              {/* Create Mission Modal Overlay */}
              <AnimatePresence>
                {showCreateMission && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 11000, display: 'grid', placeItems: 'center', padding: '1rem' }}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '2.5rem', maxWidth: 500, width: '100%', position: 'relative' }}
                    >
                      <button onClick={() => setShowCreateMission(false)} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', color: 'white' }}>✕</button>
                      
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={20} color="#F79F1F" /> Create New Mission
                      </h3>

                      <form onSubmit={handleCreateMission} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Mission Title *</label>
                          <input style={formInputStyle} placeholder="e.g., Blood Donation Drive" value={newMission.title} onChange={e => setNewMission(prev => ({ ...prev, title: e.target.value }))} required />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Description</label>
                          <textarea style={{ ...formInputStyle, height: '80px', resize: 'none' }} placeholder="Detail the duties..." value={newMission.description} onChange={e => setNewMission(prev => ({ ...prev, description: e.target.value }))} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Target Vols</label>
                            <input type="number" style={formInputStyle} min={1} value={newMission.targetVolunteers} onChange={e => setNewMission(prev => ({ ...prev, targetVolunteers: e.target.value }))} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Mission Date *</label>
                            <input type="date" style={formInputStyle} value={newMission.date} onChange={e => setNewMission(prev => ({ ...prev, date: e.target.value }))} required />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Cause Category *</label>
                            <select style={formInputStyle} value={newMission.preferredCause} onChange={e => setNewMission(prev => ({ ...prev, preferredCause: e.target.value }))} required>
                              <option value="">Choose...</option>
                              <option value="Education">Education</option>
                              <option value="Healthcare">Healthcare</option>
                              <option value="Environment">Environment</option>
                              <option value="Disaster Relief">Disaster Relief</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Required Skills</label>
                            <input style={formInputStyle} placeholder="First Aid, Driving..." value={newMission.skills} onChange={e => setNewMission(prev => ({ ...prev, skills: e.target.value }))} />
                          </div>
                        </div>
                        <button type="submit" className="btn-org" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <Send size={16} /> Publish & Auto-Broadcast
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Roster list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {missionsList.map(m => (
                  <div key={m.id} style={{ ...cardS, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ width: 50, height: 50, borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center', fontSize: '1.5rem' }}>📋</div>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t(m.title)}</h4>
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{t('Posted on')} {m.date} · {m.cause} · {m.location}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{m.volunteers}/{m.target}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t('Volunteers')}</div>
                      </div>
                      <div style={{ 
                        padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                        background: m.status === 'Active' ? 'rgba(16,185,129,0.15)' : (m.status === 'Completed' ? 'rgba(59,130,246,0.15)' : 'rgba(249,115,22,0.15)'),
                        color: m.status === 'Active' ? '#10b981' : (m.status === 'Completed' ? '#3b82f6' : '#f97316')
                      }}>
                        {t(m.status).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => handleDownloadCSV(m)} title="Download Roster" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', color: 'white' }}>
                          <Download size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── VOLUNTEERS TAB ── */}
          {activeTab === 'volunteers' && (
            <motion.div key="volunteers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t('Live Volunteer Monitoring')}</h2>
                  <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{t('Real-time status of volunteers currently on mission.')}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', padding: '0.5rem 1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>8 {t('Online')}</span>
                  </div>
                </div>
              </div>

              {/* Live monitoring cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '3rem' }}>
                {[
                  { name: 'Sam Patel', mission: 'Slum Education Drive', status: 'Active', time: '02:45:12', location: 'Mumbai' },
                  { name: 'Arjun Mehra', mission: 'Slum Education Drive', status: 'Active', time: '01:20:05', location: 'Bandra West' },
                  { name: 'Sneha Kapoor', mission: 'Blood Donation Camp', status: 'Break', time: '00:15:30', location: 'Andheri' },
                ].map((v, i) => (
                  <div key={i} style={{ ...cardS, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <AvatarPlaceholder name={v.name} size={45} />
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{v.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>📍 {t(v.location)}</span>
                          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{t('Mission:')} {t(v.mission)}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace', color: v.status === 'Active' ? '#10b981' : '#f97316' }}>{v.time}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('Session Time')}</div>
                      </div>
                      <div style={{ 
                        padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                        background: v.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)',
                        color: v.status === 'Active' ? '#10b981' : '#f97316',
                        border: `1px solid ${v.status === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(249,115,22,0.2)'}`
                      }}>
                        {t(v.status).toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Profile Verification Requests */}
              <div style={{ marginTop: '2.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t('Profile Verification Requests')}</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{t('Verify volunteer identities before assigning to critical missions.')}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '3.5rem' }}>
                {verifications.map((v) => (
                  <div key={v.id} style={{ ...cardS, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <AvatarPlaceholder name={v.name} size={45} />
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{v.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#3b82f6' }}>{v.email}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('Skills:')} {v.skills.map(s => t(s)).join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <span style={{ 
                        padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                        background: v.status === 'Verified' ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)',
                        color: v.status === 'Verified' ? '#10b981' : '#f97316',
                        border: `1px solid ${v.status === 'Verified' ? 'rgba(16,185,129,0.2)' : 'rgba(249,115,22,0.2)'}`
                      }}>
                        {t(v.status).toUpperCase()}
                      </span>
                      {v.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                          <button 
                            onClick={() => {
                              setVerifications(prev => prev.map(item => item.id === v.id ? { ...item, status: 'Verified' } : item));
                              addToast(`✅ ${v.name}'s profile has been verified!`, 'success');
                            }}
                            style={{ background: '#10b981', color: 'white', padding: '0.5rem 1.2rem', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            {t('Approve')}
                          </button>
                          <button 
                            onClick={() => {
                              setVerifications(prev => prev.filter(item => item.id !== v.id));
                              addToast(`❌ ${v.name}'s request rejected`, 'warning');
                            }}
                            style={{ background: 'transparent', color: '#ef4444', padding: '0.5rem 1.2rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            {t('Reject')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Roster Directory */}
              <div style={{ marginTop: '3.5rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>📂 {t('Volunteer Directory')}</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{t('Search and filter all registered community volunteers.')}</p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t("Search by name, ID, or skills...")}
                    style={{ 
                      width: '100%', 
                      padding: '0.8rem 1rem 0.8rem 2.8rem', 
                      borderRadius: '12px', 
                      background: 'var(--bg-elevated)', 
                      border: '1px solid var(--border-light)', 
                      color: 'var(--text-primary)', 
                      outline: 'none',
                      fontSize: '0.9rem'
                    }} 
                  />
                </div>
              </div>

              {/* Directory Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem', marginBottom: '2rem' }}>
                {filteredVolunteers.map((vol) => (
                  <div 
                    key={vol.volunteer_id} 
                    onClick={() => { setSelectedVolunteer(vol); setSelectedMissionId(''); }}
                    style={{ 
                      ...cardS, 
                      cursor: 'pointer', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      border: selectedVolunteer?.volunteer_id === vol.volunteer_id ? '1px solid #3b82f6' : '1px solid var(--border-light)',
                    }}
                    className="card-3d"
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontFamily: 'monospace' }}>
                          {vol.volunteer_id}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                        <AvatarPlaceholder name={vol.name} size={40} />
                        <div>
                          <h4 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{vol.name}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{vol.age} y/o · {t(vol.gender)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📍 {t(vol.location)}</span>
                        <span style={{ fontWeight: 700, color: '#3b82f6' }}>⚡ {vol.availability_hours_per_week}h/wk</span>
                      </div>
                      {vol.assignedMissionTitle && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--org-accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(247, 159, 31, 0.06)', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(247, 159, 31, 0.15)' }}>
                          <span style={{ flexShrink: 0 }}>📋</span>
                          <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vol.assignedMissionTitle}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Roster Popup Details */}
              <AnimatePresence>
                {selectedVolunteer && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'grid', placeItems: 'center', padding: '1rem' }}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      style={{ 
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: '24px', 
                        padding: '2.5rem', maxWidth: '520px', width: '100%', position: 'relative', color: 'var(--text-primary)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                      }}
                    >
                      <button onClick={() => setSelectedVolunteer(null)} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '2rem' }}>
                        <AvatarPlaceholder name={selectedVolunteer.name} size={60} />
                        <div>
                          <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>{selectedVolunteer.name}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{selectedVolunteer.email}</p>
                        </div>
                      </div>

                      {/* Grid of details */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem 1.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', padding: '1.2rem', borderRadius: '16px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>📍 {t('Location')}</div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t(selectedVolunteer.location)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>🎯 {t('Preferred Cause')}</div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{t(selectedVolunteer.preferred_cause)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>⚡ {t('Availability')}</div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#3b82f6' }}>{selectedVolunteer.availability_hours_per_week} {t('hours/week')}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>👤 {t('Age & Gender')}</div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{selectedVolunteer.age} y/o · {t(selectedVolunteer.gender)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>🏆 {t('Experience Level')}</div>
                          <div style={{ display: 'inline-block', fontWeight: 800, fontSize: '0.8rem', color: 'var(--org-accent)', background: 'rgba(247,159,31,0.1)', padding: '0.1rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(247,159,31,0.2)' }}>
                            {t(selectedVolunteer.experience_level)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>🏢 {t('NGO Preference')}</div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedVolunteer.ngo_preference}>
                            {t(selectedVolunteer.ngo_preference)}
                          </div>
                        </div>
                      </div>

                      {/* Skills Tags */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>🛠️ {t('Key Skills & Capabilities')}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {selectedVolunteer.skills && selectedVolunteer.skills.map((skill, index) => (
                            <span 
                              key={index} 
                              style={{ 
                                fontSize: '0.8rem', 
                                fontWeight: 600, 
                                background: 'rgba(255,255,255,0.04)', 
                                border: '1px solid var(--border-light)', 
                                padding: '0.3rem 0.75rem', 
                                borderRadius: '8px', 
                                color: 'var(--text-primary)' 
                              }}
                            >
                              {t(skill)}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Current Event Assignment */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.4rem' }}>📋 {t('Current Event Assignment')}</div>
                        {selectedVolunteer.assignedMissionTitle ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(247, 159, 31, 0.08)', border: '1px solid rgba(247, 159, 31, 0.2)', padding: '0.65rem 1rem', borderRadius: '10px' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--org-accent)' }} />
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedVolunteer.assignedMissionTitle}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', padding: '0.65rem 1rem', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <i>Not assigned to any active mission</i>
                          </div>
                        )}
                      </div>

                      {/* Event/Mission Selector */}
                      <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.2rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                          Assign to Particular Event/Mission
                        </label>
                        {missionsList.filter(m => m.status === 'Active').length > 0 ? (
                          <select 
                            value={selectedMissionId} 
                            onChange={(e) => setSelectedMissionId(e.target.value)}
                            style={{
                              ...formInputStyle,
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-light)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <option value="">-- Select Active Mission --</option>
                            {selectedVolunteer.assignedMissionTitle && (
                              <option value="unassign">❌ -- Unassign / Clear Current Event --</option>
                            )}
                            {missionsList.filter(m => m.status === 'Active').map(m => (
                              <option key={m.id} value={m.id}>
                                {m.title} ({m.location || 'Delhi'})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div style={{ padding: '0.75rem', borderRadius: 10, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#ef4444' }}>
                            <AlertCircle size={14} />
                            <span>No active missions available. Create one in the "Missions" tab first.</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <button 
                          onClick={() => handleAssignMission(selectedVolunteer.volunteer_id, selectedVolunteer.name, selectedMissionId)}
                          className="btn-org" 
                          disabled={!selectedMissionId}
                          style={{ 
                            flex: 1, 
                            padding: '0.9rem', 
                            fontSize: '0.95rem', 
                            fontWeight: 800,
                            opacity: selectedMissionId ? 1 : 0.5,
                            cursor: selectedMissionId ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            background: selectedMissionId === 'unassign' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, var(--org-primary), var(--org-primary-light))',
                            boxShadow: selectedMissionId === 'unassign' ? '0 6px 20px rgba(239,68,68,0.25)' : '0 6px 20px rgba(10,61,98,0.35)'
                          }}
                        >
                          {selectedMissionId === 'unassign' ? (
                            <>
                              <X size={16} /> Clear Event Assignment
                            </>
                          ) : (
                            <>
                              <Check size={16} /> Assign to Event
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleRemoveVolunteer(selectedVolunteer.volunteer_id, selectedVolunteer.name)}
                          style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 12, padding: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <Trash2 size={16} /> Remove
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {activeTab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              
              {/* Analytics Level Selector */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <button 
                  onClick={() => setAnalyticsLevel('overall')}
                  style={{
                    background: analyticsLevel === 'overall' ? 'var(--org-primary)' : 'transparent',
                    color: analyticsLevel === 'overall' ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border-light)', padding: '0.5rem 1.2rem', borderRadius: '10px',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
                  }}
                >
                  📈 Overall Statistics
                </button>
                <button 
                  onClick={() => setAnalyticsLevel('mission')}
                  style={{
                    background: analyticsLevel === 'mission' ? 'var(--org-primary)' : 'transparent',
                    color: analyticsLevel === 'mission' ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border-light)', padding: '0.5rem 1.2rem', borderRadius: '10px',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
                  }}
                >
                  📋 Mission Diagnostics
                </button>
                <button 
                  onClick={() => setAnalyticsLevel('volunteer')}
                  style={{
                    background: analyticsLevel === 'volunteer' ? 'var(--org-primary)' : 'transparent',
                    color: analyticsLevel === 'volunteer' ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border-light)', padding: '0.5rem 1.2rem', borderRadius: '10px',
                    fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
                  }}
                >
                  👤 Volunteer Hours Tracker
                </button>
              </div>

              {/* OVERALL */}
              {analyticsLevel === 'overall' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div style={cardS}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>{t('Impact Distribution')}</h3>
                    <div style={{ height: 300 }}>
                      <Doughnut data={{
                        labels: [t('Education'), t('Environment'), t('Healthcare'), t('Disaster Relief')],
                        datasets: [{
                          data: [40, 25, 20, 15],
                          backgroundColor: ['#3b82f6', '#10b981', '#f97316', '#ef4444'],
                          borderWidth: 0
                        }]
                      }} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>
                  <div style={cardS}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>{t('Weekly Retention')}</h3>
                    <div style={{ height: 300 }}>
                      <Line data={{
                        labels: ['W1', 'W2', 'W3', 'W4', 'W5'],
                        datasets: [{
                          label: t('Return Rate'),
                          data: [65, 72, 68, 85, 92],
                          borderColor: '#8b5cf6',
                          tension: 0.4,
                          fill: true,
                          backgroundColor: 'rgba(139, 92, 246, 0.1)'
                        }]
                      }} options={{ maintainAspectRatio: false }} />
                    </div>
                  </div>
                </div>
              )}

              {/* MISSION-LEVEL */}
              {analyticsLevel === 'mission' && (
                <div style={cardS}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Mission Performance Drill-down</h3>
                    <select 
                      value={selectedAnalyticsMission} 
                      onChange={(e) => setSelectedAnalyticsMission(parseInt(e.target.value))}
                      style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'white', cursor: 'pointer' }}
                    >
                      {missionsList.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '15px' }}>
                      <h4 style={{ fontSize: '1.2rem', color: '#F79F1F', marginBottom: '1rem' }}>Roster Metrics</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                        <div>🎯 Target recruits: <strong>{missionsList.find(m => m.id === selectedAnalyticsMission)?.target || 10}</strong></div>
                        <div>🙋‍♂️ Recruited: <strong>{missionsList.find(m => m.id === selectedAnalyticsMission)?.volunteers || 0}</strong></div>
                        <div>📊 Target achieved: <strong>{Math.round(((missionsList.find(m => m.id === selectedAnalyticsMission)?.volunteers || 0) / (missionsList.find(m => m.id === selectedAnalyticsMission)?.target || 10)) * 100)}%</strong></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ height: 250 }}>
                        <Bar 
                          data={{
                            labels: ['Target', 'Recruited', 'Turnout'],
                            datasets: [{
                              label: 'Volunteers Count',
                              data: [
                                missionsList.find(m => m.id === selectedAnalyticsMission)?.target || 10,
                                missionsList.find(m => m.id === selectedAnalyticsMission)?.volunteers || 0,
                                Math.round((missionsList.find(m => m.id === selectedAnalyticsMission)?.volunteers || 0) * 0.9) // 90% turnout mock
                              ],
                              backgroundColor: ['#f97316', '#3b82f6', '#10b981']
                            }]
                          }}
                          options={{ maintainAspectRatio: false }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VOLUNTEER-LEVEL */}
              {analyticsLevel === 'volunteer' && (
                <div style={cardS}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Individual Contributions Timeline</h3>
                    <select 
                      value={selectedAnalyticsVolunteer} 
                      onChange={(e) => setSelectedAnalyticsVolunteer(e.target.value)}
                      style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'white', cursor: 'pointer' }}
                    >
                      {VOLUNTEERS_LIST.slice(0, 5).map(v => <option key={v.volunteer_id} value={v.volunteer_id}>{v.name}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '15px' }}>
                      <h4 style={{ fontSize: '1.2rem', color: '#F79F1F', marginBottom: '1rem' }}>Member Profile</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                        <div>Name: <strong>{VOLUNTEERS_LIST.find(v => v.volunteer_id === selectedAnalyticsVolunteer)?.name}</strong></div>
                        <div>Level: <strong>{VOLUNTEERS_LIST.find(v => v.volunteer_id === selectedAnalyticsVolunteer)?.experience_level}</strong></div>
                        <div>Weekly Commitment: <strong>{VOLUNTEERS_LIST.find(v => v.volunteer_id === selectedAnalyticsVolunteer)?.availability_hours_per_week} hrs</strong></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ height: 250 }}>
                        <Line 
                          data={{
                            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                            datasets: [{
                              label: 'Logged Hours',
                              data: [4, 6, 8, 5],
                              borderColor: '#10b981',
                              tension: 0.3
                            }]
                          }}
                          options={{ maintainAspectRatio: false }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── SOS TAB ── */}
          {activeTab === 'sos' && (
            <motion.div key="sos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>SOS Emergency Center</h2>
                  <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Trace, resolve, and publish emergency community broadcasts.</p>
                </div>
                <button 
                  onClick={onTriggerSos}
                  style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', padding: '0.8rem 1.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <AlertCircle size={17} /> Launch SOS Broadcast
                </button>
              </div>

              {/* SOS log list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {emergencyMissions.length > 0 ? (
                  emergencyMissions.map(m => (
                    <div key={m.id} style={{ ...cardS, border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.02)', padding: '1.5rem 2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <span className="org-badge org-badge-red" style={{ marginBottom: '0.5rem' }}>CRITICAL SOS</span>
                          <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>{t(m.topic)}</h4>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0 0 0.8rem 0' }}>{m.reason || 'No description provided.'}</p>
                          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#9ca3af' }}>
                            <span>📍 Location: <strong>{m.location || 'Mumbai'}</strong></span>
                            <span>👤 Owner: <strong>{m.ownerName || 'Unknown'}</strong> ({m.ownerContact || 'No contact'})</span>
                            <span>⏱️ Issued: <strong>{m.time || 'Just now'}</strong></span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleResolveSos(m.id)}
                          style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                        >
                          <Check size={15} /> Resolve Emergency
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ ...cardS, textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Active Emergencies</h4>
                    <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>All clear. No unresolved community SOS requests at this moment.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── DOWNLOADS TAB ── */}
          {activeTab === 'downloads' && (
            <motion.div key="downloads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Rosters & Datasets Export</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Download volunteer compliance sheets, demographic reports, and mission JSON metadata.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
                {missionsList.map(m => (
                  <div key={m.id} style={{ ...cardS, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.3rem 0' }}>{m.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>Date: {m.date} · Cause: {m.cause} · Recruits: {m.volunteers}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                      <button 
                        onClick={() => handleDownloadCSV(m)}
                        style={{ background: 'var(--org-primary)', border: 'none', borderRadius: 8, padding: '0.6rem 1.2rem', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                      >
                        <FileText size={15} /> Export CSV Roster
                      </button>
                      <button 
                        onClick={() => handleDownloadJSON(m)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '0.6rem 1.2rem', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                      >
                        <Download size={15} /> Export JSON Data
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </motion.div>
  );
}

export default NgoDashboard;
