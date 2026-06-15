import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, CheckCircle, Target, User, MapPin, ChevronRight, Zap, Compass, Share2, Calendar, Clock, Globe, ShieldCheck, Trophy, X, Download, AlertTriangle, RotateCw, Filter } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { AvatarPlaceholder } from '../common/AvatarPlaceholder';
import TaskMap from '../common/TaskMap';
import { useTranslateDynamic } from '../../hooks/useTranslateDynamic';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { GOVT_SCHEMES } from '../../constants/data';

const getCoordsForCity = (city, index = 0) => {
  const coords = {
    ahmedabad: [23.0225, 72.5714],
    mumbai: [19.0760, 72.8777],
    delhi: [28.6139, 77.2090],
    kheda: [22.7523, 72.6841],
    surat: [21.1702, 72.8311],
    bangalore: [12.9716, 77.5946],
    pune: [18.5204, 73.8567],
    jaipur: [26.9124, 75.7873],
    vadodara: [22.3072, 73.1812]
  };
  const key = (city || 'ahmedabad').toLowerCase().trim();
  const base = coords[key] || [23.0225, 72.5714];
  const offsetLat = ((index * 17) % 100) / 2000 - 0.025;
  const offsetLng = ((index * 31) % 100) / 2000 - 0.025;
  return [base[0] + offsetLat, base[1] + offsetLng];
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export function VolunteerDashboard({ user, addToast, onLogout, onOpenProfile, emergencyMissions = [], onViewHost, theme, setTheme, isCheckingIn, activeSessionSecs, onCheckIn, onCheckOut, activeTab, setActiveTab, onMissionAccept, acceptedTasks }) {
  const { t } = useTranslateDynamic();
  const [notifications, setNotifications] = useState([
    {id:1,text:'New CRITICAL task: Flood Relief in Kheda',time:'2m ago',read:false,type:'urgent'},
    {id:2,text:'You earned the "City Hero" badge! 🏙️',time:'1h ago',read:false,type:'success'},
    {id:3,text:'Anjali Desai liked your impact post',time:'3h ago',read:true,type:'social'},
    {id:4,text:'Your digital certificate is ready',time:'1d ago',read:true,type:'info'},
  ]);
  const [showSchemeResult, setShowSchemeResult] = useState(false);
  const [certifiedRecords, setCertifiedRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cc_certified_records') || '{}');
    } catch (e) {
      return {};
    }
  });
  const [certifyingTaskId, setCertifyingTaskId] = useState(null);
  const [registryDetails, setRegistryDetails] = useState(null);
  const [showInterestFilter, setShowInterestFilter] = useState(false);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);
  const [showSkinSection, setShowSkinSection] = useState(false);
  const [skinRefreshKey, setSkinRefreshKey] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [schemeSearchQuery, setSchemeSearchQuery] = useState('');
  const [dbMissions, setDbMissions] = useState([]);

  useEffect(() => {
    try {
      const q = query(collection(db, 'missions'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map(doc => {
          const data = doc.data();
          const index = doc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const cityCoords = getCoordsForCity(data.location || 'Ahmedabad', index);
          const distKm = calculateDistance(23.0225, 72.5714, cityCoords[0], cityCoords[1]);
          return {
            id: doc.id,
            title: data.title,
            description: data.description,
            skills: data.skills || [],
            type: data.type || (data.status === 'Active' ? 'URGENT' : 'ROUTINE'),
            color: data.type === 'CRITICAL' ? '#ef4444' : data.type === 'URGENT' ? '#f97316' : '#10b981',
            deadline: data.date ? `By ${data.date}` : 'Ongoing',
            volunteers: data.volunteers || 0,
            needed: data.target || 10,
            lat: cityCoords[0],
            lng: cityCoords[1],
            dist: `${distKm.toFixed(1)} km`,
            score: Math.min(100, 75 + (index % 25)),
            isDbMission: true,
            orgName: data.orgName,
            orgId: data.orgId
          };
        });
        setDbMissions(list);
      });
      return () => unsub();
    } catch (err) {
      console.warn("Failed to subscribe to missions in VolunteerDashboard:", err);
    }
  }, []);

  const handleCertifyRecord = (task) => {
    setCertifyingTaskId(task.title);
    addToast(t('Securing record in Official Digital Registry...'), 'info');
    
    setTimeout(() => {
      const verificationId = 'VR-' + Array.from({length:16}, () => Math.floor(Math.random()*16).toString(16).toUpperCase()).join('');
      const registryNum = Math.floor(100000 + Math.random()*900000);
      const securityCode = Math.floor(10000000 + Math.random()*90000000);
      const signatureStatus = 'Verified & Secured';
      
      const updated = {
        ...certifiedRecords,
        [task.title]: {
          verificationId,
          registryNum,
          securityCode,
          signatureStatus,
          timestamp: new Date().toISOString()
        }
      };
      
      setCertifiedRecords(updated);
      localStorage.setItem('cc_certified_records', JSON.stringify(updated));
      setCertifyingTaskId(null);
      addToast(t('🎉 Record Certified & Secured Successfully!'), 'success');
    }, 1500);
  };

  const mockTasks = [
    { id:1, title: 'Emergency Medical Supply Drop', dist: '1.2 km', score: 98, type: 'CRITICAL', color: '#ef4444', skills: ['First Aid', 'Driving'], deadline:'Today 6:00 PM', volunteers:3, needed:5, lat: 23.0338, lng: 72.5856 },
    { id:2, title: 'Elderly Food Assistance', dist: '3.4 km', score: 85, type: 'URGENT', color: '#f97316', skills: ['Cooking', 'Transport'], deadline:'Today 8:00 PM', volunteers:8, needed:10, lat: 23.0120, lng: 72.5532 },
    { id:3, title: 'Local School Renovation Aid', dist: '5.0 km', score: 76, type: 'ROUTINE', color: '#10b981', skills: ['Painting', 'Carpentry'], deadline:'Tomorrow 9:00 AM', volunteers:15, needed:20, lat: 23.0450, lng: 72.5612 },
    { id:4, title: 'Flood Relief — Kheda District', dist: '24 km', score: 99, type: 'CRITICAL', color: '#ef4444', skills: ['Swimming', 'First Aid', 'Driving'], deadline:'Immediate', volunteers:42, needed:100, lat: 22.7523, lng: 72.6841 },
    { id:5, title: 'Clean Water Distribution', dist: '7.2 km', score: 80, type: 'URGENT', color: '#f97316', skills: ['Logistics'], deadline:'Tomorrow 12:00 PM', volunteers:6, needed:15, lat: 23.0805, lng: 72.5312 },
  ];

  const tasks = useMemo(() => {
    return [...dbMissions, ...mockTasks];
  }, [dbMissions]);

  const myTaskHistory = useMemo(() => {
    const realHistory = (user.history || []).map(h => ({
      title: h.title,
      date: h.date,
      hrs: h.hrs || 0,
      status: 'Completed',
      pts: (h.hrs || 0) * 50
    }));
    return realHistory;
  }, [user.history]);

  const filteredTasks = useMemo(() => {
    if (!showInterestFilter) return tasks;
    const interests = (user.interests || []).map(i => i.toLowerCase());
    if (interests.length === 0) return tasks;
    return tasks.filter(task =>
      task.skills.some(skill => interests.includes(skill.toLowerCase())) ||
      interests.some(interest => task.title.toLowerCase().includes(interest))
    );
  }, [tasks, showInterestFilter, user.interests]);

  const handleDownloadCertificate = (mission) => {
    addToast('📜 Generating your official certificate...', 'info');
    
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        addToast('❌ Pop-up blocked! Please allow pop-ups to download.', 'error');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>CommunityConnect Certificate - ${mission.title}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
            <style>
              body { margin: 0; padding: 40px; font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; display: grid; place-items: center; min-height: 100vh; }
              .cert { width: 800px; padding: 60px; border: 15px double #f97316; background: white; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.1); border-radius: 4px; box-sizing: border-box; }
              .cert::before { content: ''; position: absolute; inset: 10px; border: 2px solid rgba(249,115,22,0.2); pointer-events: none; }
              .logo { text-align: center; margin-bottom: 40px; font-weight: 800; font-size: 1.5rem; color: #f97316; letter-spacing: -1px; }
              h1 { font-family: 'Playfair Display', serif; font-size: 3rem; text-align: center; margin: 20px 0; color: #0f172a; }
              .subtitle { text-align: center; text-transform: uppercase; letter-spacing: 4px; font-weight: 700; color: #64748b; margin-bottom: 40px; font-size: 0.8rem; }
              .content { text-align: center; line-height: 1.8; font-size: 1.1rem; color: #475569; }
              .name { font-size: 2rem; font-weight: 800; text-decoration: underline; margin: 15px 0; color: #f97316; display: block; }
              .footer { margin-top: 60px; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 30px; font-size: 0.85rem; color: #64748b; }
              .signature { border-top: 1px solid #334155; padding-top: 10px; font-weight: 700; color: #1e293b; }
              @media print { body { background: white; padding: 0; } .cert { box-shadow: none; width: 100%; border-width: 10px; } }
            </style>
          </head>
          <body>
            <div class="cert">
              <div class="logo">COMMUNITYCONNECT</div>
              <div class="subtitle">Certificate of Impact</div>
              <h1>Volunteer Recognition</h1>
              <div class="content">
                This is to certify that <span class="name">${user.name}</span>
                has successfully completed the mission <strong>${mission.title}</strong>
                on <strong>${mission.date}</strong>, contributing <strong>${mission.hrs} hours</strong> of dedicated community service.
                <br><br>
                Their commitment to social impact and volunteerism sets an inspiring example
                for the global CommunityConnect network.
              </div>
              <div class="footer">
                <div>
                  <strong>Issue Date:</strong> ${new Date().toLocaleDateString()}<br>
                  <strong>Certificate ID:</strong> CC-${Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
                <div style="text-align: right;">
                  <div class="signature">Executive Director</div>
                  CommunityConnect AI Platform
                </div>
              </div>
            </div>
            <script>setTimeout(() => { window.print(); }, 500);</script>
          </body>
        </html>
      `);
      printWindow.document.close();
      addToast('✅ Certificate generated! Opening print dialog...', 'success');
    }, 1500);
  };

  const govtSchemes = useMemo(() => [
    { name: 'PM-KISAN', benefit: '₹6,000/year', eligible: true, desc: 'Direct income support for farming families' },
    { name: 'Ayushman Bharat', benefit: '₹5 Lakh/year', eligible: true, desc: 'Health insurance for below-poverty families' },
    { name: 'MGNREGA', benefit: '100 days work', eligible: true, desc: 'Guaranteed rural employment scheme' },
    { name: 'PM Awas Yojana', benefit: 'Housing subsidy', eligible: false, desc: 'Affordable housing for urban poor' },
    { name: 'PM Scholarship', benefit: 'Up to ₹25,000/yr', eligible: true, desc: 'Merit-based scholarship for students' },
  ], []);

  const unread = notifications.filter(n=>!n.read).length;

  const markRead = (id) => setNotifications(prev=>prev.map(n=>n.id===id?{...n,read:true}:n));

  const handleAccept = (task) => {
    onMissionAccept(task.title, task.id);
  };

  const impactBar = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const currentMonth = new Date().getMonth();
    const displayMonths = [];
    for(let i=5; i>=0; i--) {
      let m = currentMonth - i;
      if (m < 0) m += 12;
      displayMonths.push(months[m]);
    }

    const data = displayMonths.map(mName => {
      const mIdx = months.indexOf(mName);
      return (user.history || []).reduce((acc, h) => {
        const hDate = new Date(h.date);
        return hDate.getMonth() === mIdx ? acc + (h.hrs || 0) : acc;
      }, 0);
    });

    return {
      labels: displayMonths,
      datasets: [{
        label: 'Hours',
        data,
        backgroundColor: 'rgba(249,115,22,0.55)',
        borderColor: '#f97316',
        borderWidth: 2,
        borderRadius: 6,
      }]
    };
  }, [user.history]);

  const donut = useMemo(() => {
    const history = user.history || [];
    const categories = ['Medical','Education','Disaster','Food','Environment'];
    const counts = categories.map(cat => 
      history.filter(h => h.title.toLowerCase().includes(cat.toLowerCase())).length
    );
    
    // If no history, show some placeholder distribution for visual appeal but with 0 values
    const data = counts.every(c => c === 0) ? [0,0,0,0,0] : counts;

    return {
      labels: categories,
      datasets: [{ 
        data, 
        backgroundColor:['#ef4444','#3b82f6','#f97316','#10b981','#8b5cf6'], 
        borderWidth:0 
      }]
    };
  }, [user.history]);

  const badges = useMemo(() => {
    const missionsCount = user.history?.length || 0;
    const hoursCount = user.volunteerHours || 0;
    const skillsCount = user.skills?.length || 0;
    return [
      { icon: '🚀', title: 'First Mission', desc: 'Complete your first mission', earned: missionsCount >= 1 },
      { icon: '🏙️', title: 'City Hero', desc: 'Complete 5 missions', earned: missionsCount >= 5 },
      { icon: '🏆', title: 'Community Champion', desc: 'Complete 10 missions', earned: missionsCount >= 10 },
      { icon: '🌅', title: 'Early Bird', desc: 'Check in before 8 AM', earned: false },
      { icon: '🦉', title: 'Night Guardian', desc: 'Work after 10 PM', earned: false },
      { icon: '💪', title: 'Skill Master', desc: 'Use 3 different skills', earned: skillsCount >= 3 },
      { icon: '❤️', title: 'Lifesaver', desc: 'Respond to a critical mission', earned: false },
      { icon: '⏰', title: 'Century Milestone', desc: 'Complete 100 volunteer hours', earned: hoursCount >= 100 },
    ];
  }, [user.history, user.volunteerHours, user.skills]);

  const shareOnLinkedIn = (title) => {
    const url = encodeURIComponent('https://communityconnect.app/certificate/' + encodeURIComponent(title));
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=600');
  };

  const shareOnWhatsApp = (title, details) => {
    const text = encodeURIComponent(`I earned "${title}" on CommunityConnect! ${details} 🏅 #CommunityConnect #Volunteer`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'width=600,height=600');
  };

  const copyText = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const shareOnInstagram = (title, details) => {
    const text = `I earned "${title}" on CommunityConnect! ${details} 🏅 #CommunityConnect #Volunteer`;
    copyText(text);
    addToast('📋 Text copied! Paste it on Instagram to share.', 'info');
  };

  const skinDataSets = useMemo(() => [
    [
      { category: 'Air Quality', value: 'AQI 142 (Moderate)', source: 'CPCB Portal', status: 'moderate', icon: '🌤️' },
      { category: 'Air Quality', value: 'PM2.5: 72 µg/m³', source: 'CPCB Portal', status: 'moderate', icon: '🌤️' },
      { category: 'Water Quality', value: 'TDS: 185 ppm (Good)', source: 'GWSSB Portal', status: 'good', icon: '💧' },
      { category: 'Water Quality', value: 'pH: 7.1 (Normal)', source: 'GWSSB Portal', status: 'good', icon: '💧' },
      { category: 'Disaster Alerts', value: 'No active cyclone warnings', source: 'IMD Portal', status: 'safe', icon: '🌊' },
      { category: 'Disaster Alerts', value: 'Seismic: No recent activity', source: 'ISR Portal', status: 'safe', icon: '🌋' },
    ],
    [
      { category: 'Air Quality', value: 'AQI 168 (Unhealthy)', source: 'CPCB Portal', status: 'warning', icon: '🌤️' },
      { category: 'Air Quality', value: 'PM10: 94 µg/m³', source: 'CPCB Portal', status: 'warning', icon: '🌤️' },
      { category: 'Water Quality', value: 'TDS: 245 ppm (Acceptable)', source: 'GWSSB Portal', status: 'moderate', icon: '💧' },
      { category: 'Water Quality', value: 'pH: 7.5 (Normal)', source: 'GWSSB Portal', status: 'good', icon: '💧' },
      { category: 'Disaster Alerts', value: 'Cyclone alert: Low pressure in Arabian Sea', source: 'IMD Portal', status: 'warning', icon: '🌊' },
      { category: 'Disaster Alerts', value: 'Seismic: Minor tremors reported', source: 'ISR Portal', status: 'info', icon: '🌋' },
    ],
    [
      { category: 'Air Quality', value: 'AQI 95 (Satisfactory)', source: 'CPCB Portal', status: 'good', icon: '🌤️' },
      { category: 'Air Quality', value: 'PM2.5: 38 µg/m³', source: 'CPCB Portal', status: 'good', icon: '🌤️' },
      { category: 'Water Quality', value: 'TDS: 142 ppm (Excellent)', source: 'GWSSB Portal', status: 'good', icon: '💧' },
      { category: 'Water Quality', value: 'pH: 6.9 (Normal)', source: 'GWSSB Portal', status: 'good', icon: '💧' },
      { category: 'Disaster Alerts', value: 'No active cyclone warnings', source: 'IMD Portal', status: 'safe', icon: '🌊' },
      { category: 'Disaster Alerts', value: 'Seismic: All clear', source: 'ISR Portal', status: 'safe', icon: '🌋' },
    ],
  ], []);

  const currentSkinData = useMemo(() => {
    return skinDataSets[skinRefreshKey % skinDataSets.length];
  }, [skinRefreshKey, skinDataSets]);

  const leaderboard = useMemo(() => {
    const base = [
      {name:'Anjali Desai',city:'Surat',pts:4820,badge:'🥇',hrs:340},
      {name:'Rahul Verma',city:'Delhi',pts:3950,badge:'🥈',hrs:280},
      {name:'Ananya Iyer',city:'Bangalore',pts:3100,badge:'🥉',hrs:220},
      {name: user.name||'Demo User',city: user.city||'Your City',pts:user.points||0,hrs:user.volunteerHours||0, isMe:true},
      {name:'Kamal Singh',city:'Jaipur',pts:1200,hrs:95},
    ];

    const sorted = [...base].sort((a, b) => b.pts - a.pts);

    return sorted.map((v, i) => ({
      ...v,
      badge: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`,
      rank: i + 1,
    }));
  }, [user.name, user.city, user.points, user.volunteerHours, leaderboardRefreshKey]);

  const tabStyle = useCallback((t) => ({
    padding:'0.6rem 1.1rem', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.88rem',
    background: activeTab===t ? '#f97316' : 'transparent',
    color: activeTab===t ? 'white' : 'var(--text-secondary)',
    transition:'all 0.15s', fontFamily:'var(--font-body)',
    whiteSpace: 'nowrap',
  }), [activeTab]);

  const cardS = useMemo(() => ({
    background:'var(--bg-elevated)',
    border:'1px solid var(--border-light)',
    borderRadius:'16px',
    padding:'1.25rem',
    color: 'var(--text-primary)'
  }), []);

  const statusColor = (status) => {
    switch(status) {
      case 'good': case 'safe': return '#10b981';
      case 'moderate': return '#f97316';
      case 'warning': return '#ef4444';
      case 'info': return '#3b82f6';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:'fixed',inset:0,background:'transparent',zIndex:9000,overflowY:'auto',paddingBottom:'2rem'}}>

      <div style={{height:'80px'}} /> {/* Spacer for Global Navbar */}

      <div style={{maxWidth:1300,margin:'0 auto',padding:'2rem'}}>
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div>
            {/* Welcome Banner */}
            <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} style={{background:'linear-gradient(135deg,var(--primary-500),var(--accent-pink))',borderRadius:'24px',padding:'2rem',marginBottom:'2rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
              <div style={{color:'white'}}>
                <p style={{opacity:0.85,marginBottom:'0.3rem'}}>{new Date().getHours()<12 ? t('Good Morning') : t('Good Afternoon')},</p>
                <h2 style={{fontSize:'2rem',fontWeight:800}}>{t('Welcome back')}, {user?.name ? user.name.split(' ')[0] : t('Volunteer')}! 👋</h2>
                <div style={{display:'flex',gap:'1rem',marginTop:'0.4rem',flexWrap:'wrap'}}>
                  {user.age && <span style={{background:'rgba(255,255,255,0.15)',padding:'0.2rem 0.8rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>🎂 {user.age} {t('Years Old')}</span>}
                  {(user.interests || []).slice(0,3).map((it,idx) => (
                    <span key={idx} style={{background:'rgba(255,255,255,0.15)',padding:'0.2rem 0.8rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>✨ {t(it)}</span>
                  ))}
                </div>
                <p style={{opacity:0.85,marginTop:'0.8rem'}}>{t('You have')} <strong>3 {t('active missions')}</strong> {t('near you. Ready to make an impact?')}</p>
              </div>
              <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                <button onClick={isCheckingIn ? () => {} : onCheckIn} style={{padding:'0.9rem 1.8rem',borderRadius:'14px',background:isCheckingIn?'rgba(16,185,129,0.1)':'white',color:isCheckingIn?'#10b981':'var(--primary-500)',border:isCheckingIn?'1px solid #10b981':'none',cursor:isCheckingIn?'default':'pointer',fontWeight:700,display:'flex',alignItems:'center',gap:'0.6rem',fontSize:'1rem',fontFamily:'var(--font-body)'}}>
                  {isCheckingIn ? (
                    <>
                      <div style={{width:10,height:10,borderRadius:'50%',background:'#10b981'}} className="animate-pulse" />
                      {t('Session Live')}
                    </>
                  ) : (
                    <><Target size={18}/> {t('Check In')}</>
                  )}
                </button>
                <button onClick={onOpenProfile} style={{padding:'0.9rem 1.5rem',borderRadius:'14px',background:'rgba(255,255,255,0.15)',color:'white',border:'1px solid rgba(255,255,255,0.3)',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.95rem',fontFamily:'var(--font-body)'}}>
                  <User size={16}/> {t('My Profile')}
                </button>
              </div>
            </motion.div>
 
            {/* Stats Row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1.5rem',marginBottom:'2rem'}}>
              {[
                {icon:'⏱️',label:t('Volunteer Hours'),val:`${user.volunteerHours||0}h`,sub:t('+0h this week'),color:'#f97316'},
                {icon:'⭐',label:t('Impact Points'),val:(user.points||0).toLocaleString(),sub:t('Start your journey today'),color:'#8b5cf6'},
                {icon:'✅',label:t('Tasks Done'),val:user.history?.length || 0,sub:t('0 this month'),color:'#10b981'},
                {icon:'❤️',label:t('Lives Impacted'),val: (user.history?.length || 0) * 5, sub:t('+0 this week'),color:'#ec4899'},
              ].map((s,i)=>(
                <motion.div key={i} whileHover={{y:-4}} style={{...cardS,textAlign:'center',cursor:'default'}}>
                  <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>{s.icon}</div>
                  <div style={{fontSize:'2rem',fontWeight:800,color:s.color}}>{s.val}</div>
                  <div style={{fontWeight:600,fontSize:'0.85rem',marginTop:'0.2rem'}}>{s.label}</div>
                  <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.2rem'}}>{s.sub}</div>
                </motion.div>
              ))}
            </div>
 
            {/* Charts + Near Tasks */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem',marginBottom:'2rem'}}>
              <div style={cardS}>
                <h3 style={{fontSize:'1.2rem',marginBottom:'1rem'}}>📊 {t('Activity Overview')}</h3>
                <div style={{position:'relative',height:180}}>
                  <Bar data={impactBar} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{color:'#aaa'},grid:{color:'rgba(255,255,255,0.06)'}},x:{ticks:{color:'#aaa'},grid:{display:false}}}}}/>
                </div>
              </div>
              <div style={cardS}>
                <h3 style={{fontSize:'1.2rem',marginBottom:'1rem'}}>🎯 {t('Impact by Category')}</h3>
                <div style={{display:'flex',alignItems:'center',gap:'1.5rem'}}>
                  <div style={{position:'relative',height:160,width:160,flexShrink:0}}>
                    <Doughnut data={donut} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:'65%'}}/>
                  </div>
                  <div style={{flex:1}}>
                    {donut.labels.map((l,i) => (
                      <div key={i} style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem',fontSize:'0.82rem'}}>
                        <div style={{width:10,height:10,borderRadius:'50%',background:donut.datasets[0].backgroundColor[i],flexShrink:0}}/>
                        <span>{t(l)}</span>
                        <span style={{marginLeft:'auto',fontWeight:600}}>{donut.datasets[0].data[i]}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
 
            {/* Nearby Tasks Quick View */}
            <div style={cardS}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.2rem'}}>
                <h3 style={{fontSize:'1.2rem'}}>📍 {t('Nearby Active Requests')}</h3>
                <button onClick={()=>setActiveTab('missions')} style={{background:'none',border:'none',color:'var(--primary-500)',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:'0.3rem',fontFamily:'var(--font-body)'}}>{t('View All')} <ChevronRight size={16}/></button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {tasks.slice(0,3).map((task)=>(
                  <div key={task.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem',background:'var(--bg-secondary)',borderRadius:'14px',border:'1px solid var(--border-light)',gap:'1rem'}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'0.3rem'}}>
                        <span style={{background:`${task.color}22`,color:task.color,padding:'0.15rem 0.6rem',borderRadius:'99px',fontSize:'0.72rem',fontWeight:700}}>{t(task.type)}</span>
                        <span style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}><MapPin size={11} style={{display:'inline'}}/> {t(task.dist)}</span>
                      </div>
                      <div style={{fontWeight:600,fontSize:'0.95rem'}}>{t(task.title)}</div>
                    </div>
                    <button onClick={()=>handleAccept(task)} disabled={acceptedTasks[task.id]}
                      style={{padding:'0.5rem 1.2rem',borderRadius:'10px',border:'none',background:acceptedTasks[task.id]?'#10b981':'var(--primary-500)',color:'white',fontWeight:600,cursor:acceptedTasks[task.id]?'default':'pointer',fontSize:'0.85rem',flexShrink:0,fontFamily:'var(--font-body)'}}>
                      {acceptedTasks[task.id]?t('✓ Accepted'):t('Accept')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MISSIONS TAB ── */}
        {activeTab === 'missions' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem',marginBottom:'0.4rem'}}>
              <h2 style={{fontSize:'1.8rem'}}>🎯 Active Missions Near You</h2>
              <button onClick={() => setShowInterestFilter(!showInterestFilter)}
                style={{padding:'0.5rem 1rem',borderRadius:'10px',border:'1px solid var(--border-light)',background:showInterestFilter?'rgba(249,115,22,0.1)':'transparent',color:showInterestFilter?'var(--primary-500)':'var(--text-secondary)',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.82rem',fontFamily:'var(--font-body)'}}>
                <Filter size={15}/> {showInterestFilter ? t('Showing Matched') : t('Show All')}
              </button>
            </div>
            <p style={{color:'#9ca3af',marginBottom:'1.5rem',fontSize:'0.9rem'}}>AI-matched to your skills ({(user.skills||['All Skills']).slice(0,3).join(', ')}) · {user.city||'Your City'}.
              {showInterestFilter && <span style={{color:'var(--primary-500)',marginLeft:'0.5rem'}}>· Interest filter active</span>}
            </p>

            <div style={{ marginBottom: '2.5rem' }}>
              <TaskMap 
                theme={theme}
                tasks={filteredTasks} 
                userLocation={[23.0225, 72.5714]} 
                onAcceptTask={(task) => handleAccept(task)}
                acceptedTasks={acceptedTasks}
              />
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'1.2rem'}}>
              {/* Emergency / SOS Missions */}
              {emergencyMissions.map((mission) => (
                <motion.div 
                  key={mission.id} 
                  initial={{ x: -20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }}
                  style={{ 
                    ...cardS, 
                    border: '2px solid #ef4444', 
                    background: 'rgba(239,68,68,0.05)',
                    boxShadow: '0 0 20px rgba(239,68,68,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ background: '#ef4444', color: 'white', padding: '0.2rem 0.7rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertTriangle size={12} /> CRITICAL SOS
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>LIVE BROADCAST</span>
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>{mission.topic}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700 }}>URGENT NEED</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(mission.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
                    <strong>Message:</strong> {mission.reason}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Host / NGO</div>
                      <div style={{ fontWeight: 700 }}>{mission.org || 'Independent'} ({mission.name})</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Timeframe</div>
                      <div style={{ fontWeight: 700 }}>{mission.time}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Location</div>
                      <div style={{ fontWeight: 700 }}>{mission.location}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button 
                      onClick={() => addToast(`✅ YOU ARE RESPONDING to SOS: "${mission.topic}"`)}
                      style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                    >
                      Respond Now
                    </button>
                    <button 
                      onClick={() => onViewHost({ name: mission.name, org: mission.org, city: mission.location, bio: mission.reason })}
                      style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}
                      title="View Host History"
                    >
                      📜
                    </button>
                    <button 
                      onClick={() => addToast('🧭 Routing in AR...')}
                      style={{ padding: '0.8rem 1.5rem', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Compass size={18} /> AR Nav
                    </button>
                  </div>
                </motion.div>
              ))}

              {filteredTasks.length === 0 && showInterestFilter ? (
                <div style={{...cardS, textAlign:'center', padding:'3rem'}}>
                  <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🔍</div>
                  <h3 style={{fontSize:'1.2rem',marginBottom:'0.5rem'}}>No matching missions</h3>
                  <p style={{color:'var(--text-secondary)'}}>No missions match your selected interests. Try showing all missions.</p>
                  <button onClick={() => setShowInterestFilter(false)} style={{marginTop:'1rem',padding:'0.7rem 1.5rem',borderRadius:'10px',border:'none',background:'var(--primary-500)',color:'white',fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)'}}>
                    Show All Missions
                  </button>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const accepted = !!acceptedTasks[task.id];
                  return (
                    <div key={task.id} style={{...cardS, border: accepted ? '1.5px solid #10b981' : '1px solid var(--border-light)', transition:'border 0.2s'}}>
                      <div style={{display:'flex',gap:'1.2rem',flexWrap:'wrap'}}>
                        <div style={{flex:'1 1 280px'}}>
                          <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'0.7rem',flexWrap:'wrap'}}>
                            <span style={{background:`${task.color}22`,color:task.color,padding:'0.2rem 0.7rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>{task.type}</span>
                            <span style={{background:'rgba(139,92,246,0.15)',color:'#a78bfa',padding:'0.2rem 0.7rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>{task.score}% AI Match</span>
                            {accepted && <span style={{background:'rgba(16,185,129,0.15)',color:'#10b981',padding:'0.2rem 0.7rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>✓ YOU'RE IN</span>}
                          </div>
                          <h3 style={{fontSize:'1.1rem',marginBottom:'0.5rem',fontWeight:700}}>{task.title}</h3>
                          <div style={{display:'flex',gap:'0.8rem',color:'var(--text-secondary)',fontSize:'0.82rem',flexWrap:'wrap',marginBottom:'0.7rem'}}>
                            <span>📍 {task.dist}</span>
                            <span>⏰ {task.deadline}</span>
                            <span>👥 {task.volunteers}/{task.needed} volunteers</span>
                          </div>
                          <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.8rem'}}>
                            {task.skills.map((s,i) => <span key={i} style={{background:'var(--bg-secondary)',border:'1px solid var(--border-light)',padding:'0.15rem 0.6rem',borderRadius:'99px',fontSize:'0.75rem',color:'var(--text-primary)'}}>{s}</span>)}
                          </div>
                          {/* Progress bar */}
                          <div>
                            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',color:'var(--text-secondary)',marginBottom:'0.25rem'}}>
                              <span>Volunteers joined</span><span>{Math.round((task.volunteers/task.needed)*100)}%</span>
                            </div>
                            <div style={{height:5,background:'var(--border-light)',borderRadius:'99px',overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${Math.min((task.volunteers/task.needed)*100,100)}%`,background:`linear-gradient(90deg,${task.color},${task.color}99)`,borderRadius:'99px',transition:'width 1s ease'}}/>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{display:'flex',flexDirection:'column',gap:'0.6rem',justifyContent:'center',minWidth:150}}>
                          <button
                            onClick={() => {
                              if (!accepted) {
                                handleAccept(task);
                                setSelectedTask(task);
                              }
                            }}
                            disabled={accepted}
                            style={{padding:'0.75rem 1.2rem',borderRadius:'10px',border:'none',
                              background: accepted ? '#10b981' : '#f97316',
                              color:'white',fontWeight:700,cursor:accepted?'default':'pointer',
                              display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',
                              fontFamily:'var(--font-body)',fontSize:'0.9rem',transition:'all 0.15s'}}>
                            {accepted ? <><CheckCircle size={15}/> Accepted</> : <><Zap size={15}/> Accept Mission</>}
                          </button>
                          <button
                            onClick={() => addToast(`🧭 AR Navigation launching for "${task.title}"`,'info')}
                            style={{padding:'0.7rem',borderRadius:'10px',border:'1px solid var(--border-light)',background:'transparent',color:'var(--text-primary)',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',fontFamily:'var(--font-body)',fontSize:'0.88rem'}}>
                            <Compass size={15} style={{color:'var(--primary-500)'}}/> AR Navigate
                          </button>
                          <button
                            onClick={() => addToast(`📤 Sharing mission link...`,'info')}
                            style={{padding:'0.7rem',borderRadius:'10px',border:'1px solid var(--border-light)',background:'transparent',color:'var(--text-primary)',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',fontFamily:'var(--font-body)',fontSize:'0.88rem'}}>
                            <Share2 size={15} style={{color:'var(--accent-highlight)'}}/> Share
                          </button>
                        </div>
                      </div>

                      {/* Accepted — show active info panel */}
                      {accepted && (
                        <div style={{marginTop:'1rem',padding:'0.9rem',background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.25)',borderRadius:'12px'}}>
                          <div style={{fontWeight:700,color:'#10b981',marginBottom:'0.5rem',fontSize:'0.9rem'}}>✅ Mission Active — You are registered!</div>
                          <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',fontSize:'0.82rem',color:'var(--text-secondary)'}}>
                            <span>📍 Meet point: <strong style={{color:'var(--text-primary)'}}>{task.dist} from you</strong></span>
                            <span>⏰ Report by: <strong style={{color:'var(--text-primary)'}}>{task.deadline}</strong></span>
                            <span>📞 Coordinator: <strong style={{color:'var(--text-primary)'}}>+91 98765 43210</strong></span>
                          </div>
                          <div style={{display:'flex',gap:'0.7rem',marginTop:'0.8rem',flexWrap:'wrap'}}>
                            <button onClick={() => addToast('📞 Calling coordinator...','info')} style={{padding:'0.45rem 1rem',borderRadius:'8px',background:'#10b981',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'0.8rem',fontFamily:'var(--font-body)'}}>
                              📞 Call Coordinator
                            </button>
                            <button onClick={() => addToast('🗺️ Opening maps...','info')} style={{padding:'0.45rem 1rem',borderRadius:'8px',background:'var(--bg-secondary)',color:'var(--text-primary)',border:'1px solid var(--border-light)',cursor:'pointer',fontWeight:600,fontSize:'0.8rem',fontFamily:'var(--font-body)'}}>
                              🗺️ Get Directions
                            </button>
                            <button onClick={() => { addToast('Mission cancelled','warning'); }} style={{padding:'0.45rem 1rem',borderRadius:'8px',background:'rgba(239,68,68,0.1)',color:'#f87171',border:'1px solid rgba(239,68,68,0.25)',cursor:'pointer',fontWeight:600,fontSize:'0.8rem',fontFamily:'var(--font-body)'}}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div>
            <h2 style={{fontSize:'2rem',marginBottom:'0.5rem'}}>📋 {t('My Volunteering History')}</h2>
            <p style={{color:'var(--text-secondary)',marginBottom:'2rem'}}>{t('Your complete record of completed missions and earned impact points.')}</p>
            {myTaskHistory.length === 0 ? (
              <div style={{...cardS, textAlign:'center', padding:'3rem 2rem'}}>
                <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📭</div>
                <h3 style={{fontSize:'1.3rem',marginBottom:'0.5rem'}}>No missions logged yet</h3>
                <p style={{color:'var(--text-secondary)',marginBottom:'1.5rem',maxWidth:400,margin:'0 auto 1.5rem'}}>Check in to start recording your impact!</p>
                <button onClick={onCheckIn} style={{padding:'0.8rem 2rem',borderRadius:'99px',border:'none',background:'var(--primary-500)',color:'white',fontWeight:700,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'0.5rem',fontFamily:'var(--font-body)'}}>
                  <Target size={18}/> Check In Now
                </button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {myTaskHistory.map((tTask,i)=>(
                  <motion.div key={i} whileHover={{x:4}} style={{...cardS,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:'1rem'}}>{t(tTask.title)}</div>
                      <div style={{color:'var(--text-secondary)',fontSize:'0.85rem',marginTop:'0.3rem',display:'flex',gap:'1rem'}}>
                        <span><Calendar size={13} style={{display:'inline',verticalAlign:'middle',marginRight:4}}/> {tTask.date}</span>
                        <span><Clock size={13} style={{display:'inline',verticalAlign:'middle',marginRight:4}}/> {tTask.hrs}h</span>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}>
                      <span style={{color:'#10b981',fontWeight:700,fontSize:'1.1rem'}}>+{tTask.pts} pts</span>
                      <span style={{background:'rgba(16,185,129,0.1)',color:'#10b981',padding:'0.3rem 0.8rem',borderRadius:'99px',fontSize:'0.8rem',fontWeight:700}}>{t(tTask.status)}</span>
                      <button onClick={()=>handleDownloadCertificate(tTask)} style={{padding:'0.4rem 0.9rem',borderRadius:'8px',border:'1px solid var(--border-light)',background:'transparent',color:'var(--text-primary)',cursor:'pointer',fontSize:'0.8rem',display:'flex',alignItems:'center',gap:'0.4rem',fontFamily:'var(--font-body)'}}>
                        <Download size={14}/> {t('Certificate')}
                      </button>
                      {certifiedRecords[tTask.title] ? (
                        <button onClick={()=>setRegistryDetails({ ...tTask, ...certifiedRecords[tTask.title] })} style={{padding:'0.4rem 0.9rem',borderRadius:'8px',border:'1px solid var(--accent-highlight)',background:'rgba(139,92,246,0.1)',color:'var(--accent-highlight)',cursor:'pointer',fontSize:'0.8rem',fontWeight:700,display:'flex',alignItems:'center',gap:'0.4rem',fontFamily:'var(--font-body)'}}>
                          🔗 {t('Verify Record')}
                        </button>
                      ) : (
                        <button onClick={()=>handleCertifyRecord(tTask)} disabled={certifyingTaskId === tTask.title} style={{padding:'0.4rem 0.9rem',borderRadius:'8px',border:'none',background:'var(--accent-highlight)',color:'white',cursor:certifyingTaskId === tTask.title?'wait':'pointer',fontSize:'0.8rem',fontWeight:700,display:'flex',alignItems:'center',gap:'0.4rem',fontFamily:'var(--font-body)'}}>
                          {certifyingTaskId === tTask.title ? '⚡ ' + t('Verifying...') : '⚡ ' + t('Certify Record')}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            <div style={{...cardS,marginTop:'2rem',textAlign:'center'}}>
              <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🔗</div>
              <h3>{t('Digital Registry Search')}</h3>
              <p style={{color:'var(--text-secondary)',margin:'0.5rem 0 1rem'}}>{t('All your hours are cryptographically certified on our official digital registry. Search your records anywhere.')}</p>
              <button onClick={()=>addToast(t('🔗 Registry lookup opening...'),'info')} style={{padding:'0.8rem 2rem',borderRadius:'99px',background:'var(--accent-highlight)',color:'white',border:'none',cursor:'pointer',fontWeight:700,fontFamily:'var(--font-body)'}}><Globe size={16} style={{display:'inline',verticalAlign:'middle',marginRight:6}}/>{t('Registry Lookup')}</button>
            </div>
          </div>
        )}
        {/* ── SCHEMES TAB ── */}
        {activeTab === 'schemes' && (
          <div>
            <h2 style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🏛️ National Government Schemes & Portals</h2>
            <p style={{color:'var(--text-secondary)',marginBottom:'2rem'}}>
              Direct access to live official government portals for citizens and beneficiary registrations. Use the search bar below to filter schemes.
            </p>
            
            {/* Search and Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search schemes (e.g. Health, Pension, Agriculture)..."
                value={schemeSearchQuery}
                onChange={(e) => {
                  setSchemeSearchQuery(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '0.85rem 1.2rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div className="table-responsive" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '1.2rem 1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Scheme Name</th>
                    <th style={{ padding: '1.2rem 1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Key Benefit</th>
                    <th style={{ padding: '1.2rem 1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Category / Sector</th>
                    <th style={{ padding: '1.2rem 1rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'right' }}>Official Link</th>
                  </tr>
                </thead>
                <tbody>
                  {GOVT_SCHEMES
                  .filter(s => {
                    const q = schemeSearchQuery.toLowerCase();
                    return s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
                  })
                  .map((s, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }} className="table-row-hover">
                      <td style={{ padding: '1.2rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{s.desc}</div>
                      </td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                        <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                          {s.benefit}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem 1rem' }}>
                        <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                          {s.category}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem 1rem', textAlign: 'right' }}>
                        <a
                          href={s.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-pink))',
                            color: 'white',
                            fontWeight: 700,
                            textDecoration: 'none',
                            fontSize: '0.82rem',
                            boxShadow: '0 4px 12px rgba(249,115,22,0.2)'
                          }}
                        >
                          Visit Portal ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* ── WALLET TAB ── */}
        {activeTab === 'wallet' && (
          <div>
            <h2 style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🏅 Badges & Certifications</h2>
            <p style={{color:'var(--text-secondary)',marginBottom:'2rem'}}>Your earned achievements and certified mission records.</p>

            {/* Badges Section */}
            <div style={cardS}>
              <h3 style={{fontSize:'1.2rem',marginBottom:'1.2rem'}}>🎖️ Achievement Badges</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'1rem'}}>
                {badges.map((badge, i) => (
                  <motion.div key={i} whileHover={{y:-2}} style={{
                    padding:'1.2rem 1rem',
                    borderRadius:'14px',
                    background: badge.earned ? 'rgba(16,185,129,0.08)' : 'var(--bg-secondary)',
                    border: badge.earned ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-light)',
                    textAlign:'center',
                    opacity: badge.earned ? 1 : 0.6,
                    position:'relative',
                  }}>
                    <div style={{fontSize:'2.2rem',marginBottom:'0.5rem',filter: badge.earned ? 'none' : 'grayscale(0.8)'}}>{badge.icon}</div>
                    <div style={{fontWeight:700,fontSize:'0.95rem',marginBottom:'0.2rem'}}>{badge.title}</div>
                    <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginBottom:'0.6rem'}}>{badge.desc}</div>
                    {badge.earned ? (
                      <span style={{background:'rgba(16,185,129,0.15)',color:'#10b981',padding:'0.15rem 0.6rem',borderRadius:'99px',fontSize:'0.7rem',fontWeight:700}}>✓ Unlocked</span>
                    ) : (
                      <span style={{background:'rgba(100,116,139,0.15)',color:'var(--text-secondary)',padding:'0.15rem 0.6rem',borderRadius:'99px',fontSize:'0.7rem',fontWeight:700}}>🔒 Locked</span>
                    )}
                    <div style={{display:'flex',justifyContent:'center',gap:'0.4rem',marginTop:'0.6rem'}}>
                      <button onClick={() => shareOnLinkedIn(badge.title, badge.desc)} style={{padding:'0.3rem 0.5rem',borderRadius:'6px',border:'1px solid var(--border-light)',background:'transparent',cursor:'pointer',fontSize:'0.7rem',color:'var(--text-secondary)',fontFamily:'var(--font-body)'}} title="Share on LinkedIn">in</button>
                      <button onClick={() => shareOnWhatsApp(badge.title, badge.desc)} style={{padding:'0.3rem 0.5rem',borderRadius:'6px',border:'1px solid var(--border-light)',background:'transparent',cursor:'pointer',fontSize:'0.7rem',color:'var(--text-secondary)',fontFamily:'var(--font-body)'}} title="Share on WhatsApp">wa</button>
                      <button onClick={() => shareOnInstagram(badge.title, badge.desc)} style={{padding:'0.3rem 0.5rem',borderRadius:'6px',border:'1px solid var(--border-light)',background:'transparent',cursor:'pointer',fontSize:'0.7rem',color:'var(--text-secondary)',fontFamily:'var(--font-body)'}} title="Share on Instagram">ig</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Certificates Section */}
            <div style={{...cardS,marginTop:'2rem'}}>
              <h3 style={{fontSize:'1.2rem',marginBottom:'1.2rem'}}>📜 Certified Mission Records</h3>
              {Object.keys(certifiedRecords).length === 0 ? (
                <div style={{textAlign:'center',padding:'2rem'}}>
                  <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>📄</div>
                  <p style={{color:'var(--text-secondary)'}}>No certified records yet. Complete a mission and certify it from the History tab.</p>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'0.8rem'}}>
                  {Object.entries(certifiedRecords).map(([title, record]) => (
                    <div key={title} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem',background:'var(--bg-secondary)',borderRadius:'12px',border:'1px solid var(--border-light)',flexWrap:'wrap',gap:'0.8rem'}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:'0.95rem'}}>{title}</div>
                        <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.2rem'}}>
                          Certified · {new Date(record.timestamp).toLocaleDateString()} · ID: {record.verificationId?.slice(0,12)}...
                        </div>
                      </div>
                      <div style={{display:'flex',gap:'0.4rem'}}>
                        <button onClick={() => setRegistryDetails({ title, ...record })} style={{padding:'0.4rem 0.8rem',borderRadius:'8px',border:'1px solid var(--accent-highlight)',background:'rgba(139,92,246,0.1)',color:'var(--accent-highlight)',cursor:'pointer',fontSize:'0.75rem',fontWeight:600,fontFamily:'var(--font-body)'}}>
                          🔗 Verify
                        </button>
                        <button onClick={() => shareOnLinkedIn(title, 'Certified mission record on CommunityConnect')} style={{padding:'0.4rem 0.6rem',borderRadius:'8px',border:'1px solid var(--border-light)',background:'transparent',cursor:'pointer',fontSize:'0.7rem',color:'var(--text-secondary)',fontFamily:'var(--font-body)'}} title="Share on LinkedIn">in</button>
                        <button onClick={() => shareOnWhatsApp(title, 'Certified mission record on CommunityConnect')} style={{padding:'0.4rem 0.6rem',borderRadius:'8px',border:'1px solid var(--border-light)',background:'transparent',cursor:'pointer',fontSize:'0.7rem',color:'var(--text-secondary)',fontFamily:'var(--font-body)'}} title="Share on WhatsApp">wa</button>
                        <button onClick={() => shareOnInstagram(title, 'Certified mission record on CommunityConnect')} style={{padding:'0.4rem 0.6rem',borderRadius:'8px',border:'1px solid var(--border-light)',background:'transparent',cursor:'pointer',fontSize:'0.7rem',color:'var(--text-secondary)',fontFamily:'var(--font-body)'}} title="Share on Instagram">ig</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COMMUNITY TAB ── */}
        {activeTab === 'community' && (
          <div>
            <h2 style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🤝 Community & Leaderboard</h2>
            <p style={{color:'var(--text-secondary)',marginBottom:'2rem'}}>Connect with fellow volunteers, track rankings, and celebrate impact.</p>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'2rem',flexWrap:'wrap'}}>
              <div style={cardS}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.2rem'}}>
                  <h3 style={{fontSize:'1.2rem'}}><Trophy size={18} style={{display:'inline',verticalAlign:'middle',marginRight:6}} color="var(--primary-500)"/>Volunteer Leaderboard</h3>
                  <button onClick={() => { setLeaderboardRefreshKey(k => k + 1); addToast('🔄 Leaderboard refreshed!', 'success'); }}
                    style={{padding:'0.4rem 1rem',borderRadius:'8px',border:'1px solid var(--border-light)',background:'transparent',color:'var(--text-secondary)',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.8rem',fontFamily:'var(--font-body)'}}>
                    <RotateCw size={14}/> Refresh
                  </button>
                </div>
                {leaderboard.map((v,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.9rem',borderRadius:'12px',background:v.isMe?'rgba(249,115,22,0.08)':'transparent',border:v.isMe?'1px solid rgba(249,115,22,0.2)':'1px solid transparent',marginBottom:'0.5rem'}}>
                    <span style={{fontSize:i<3?'1.8rem':'1.1rem',width:36,textAlign:'center',fontWeight:800,color:i>=3?'var(--text-secondary)':'inherit'}}>{v.badge}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700}}>{v.name} {v.isMe&&<span style={{background:'var(--primary-500)',color:'white',padding:'0.1rem 0.5rem',borderRadius:'6px',fontSize:'0.7rem',marginLeft:'0.5rem'}}>YOU</span>}</div>
                      <div style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>#{v.rank} · {v.city} · {v.hrs}h volunteered</div>
                    </div>
                    <div style={{fontWeight:800,color:'var(--primary-500)'}}>{v.pts.toLocaleString()} pts</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
                <div style={{...cardS,textAlign:'center',background:'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(236,72,153,0.1))'}}>
                  <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>🏅</div>
                  <h3 style={{fontSize:'1.1rem'}}>Your Rank</h3>
                  <div style={{fontSize:'3rem',fontWeight:800,color:'var(--primary-500)'}}>#{leaderboard.find(v => v.isMe)?.rank || '99+'}</div>
                  <div style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}>in {user.city || 'your city'}</div>
                </div>
                <div style={cardS}>
                  <h3 style={{fontSize:'1rem',marginBottom:'1rem'}}>📢 Recent Community Posts</h3>
                  {['Flood relief op in Kheda — URGENT NEED!','Blanket drive this Sunday at 9 AM','New blood donation camp: 3 May','Volunteer meetup: Saturday evening'].map((post,i)=>(
                    <div key={i} style={{padding:'0.6rem 0',borderBottom:i<3?'1px solid var(--border-light)':'none',fontSize:'0.83rem',cursor:'pointer',color:'var(--text-secondary)'}} onClick={()=>addToast('💬 Opening post...','info')}>
                      {post}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skin / Crisis Data Section */}
            <div style={{...cardS, marginTop:'2rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem',cursor:'pointer'}} onClick={() => setShowSkinSection(!showSkinSection)}>
                <h3 style={{fontSize:'1.2rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  🌍 Government Crisis & Environment Data
                </h3>
                <span style={{fontSize:'1.2rem',color:'var(--text-secondary)',transition:'transform 0.2s',transform:showSkinSection?'rotate(180deg)':'rotate(0deg)'}}>▼</span>
              </div>
              <p style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom: showSkinSection ? '1rem' : 0}}>Data sourced from CPCB, GWSSB, IMD & ISR government portals · Refreshes periodically</p>
              {showSkinSection && (
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
                  <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'1rem'}}>
                    <button onClick={() => setSkinRefreshKey(k => k + 1)} style={{padding:'0.35rem 0.9rem',borderRadius:'8px',border:'1px solid var(--border-light)',background:'transparent',color:'var(--text-secondary)',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.78rem',fontFamily:'var(--font-body)'}}>
                      <RotateCw size={13}/> Refresh Data
                    </button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1rem'}}>
                    {currentSkinData.map((item, i) => (
                      <div key={i} style={{
                        padding:'1rem',
                        borderRadius:'12px',
                        background:'var(--bg-secondary)',
                        border:'1px solid var(--border-light)',
                        borderLeft:`4px solid ${statusColor(item.status)}`,
                      }}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.4rem'}}>
                          <span style={{fontSize:'1.2rem'}}>{item.icon}</span>
                          <span style={{
                            fontSize:'0.65rem',
                            fontWeight:700,
                            padding:'0.15rem 0.5rem',
                            borderRadius:'99px',
                            background: `${statusColor(item.status)}22`,
                            color: statusColor(item.status),
                            textTransform:'uppercase',
                          }}>{item.status}</span>
                        </div>
                        <div style={{fontWeight:700,fontSize:'0.9rem',marginBottom:'0.2rem'}}>{item.category}</div>
                        <div style={{fontSize:'0.82rem',color:'var(--text-primary)'}}>{item.value}</div>
                        <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginTop:'0.4rem'}}>📡 {item.source}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
        <AnimatePresence>
          {registryDetails && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setRegistryDetails(null)}
              style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:100000,display:'grid',placeItems:'center',padding:'1rem',backdropFilter:'blur(4px)'}}>
              <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9,y:20}} onClick={e=>e.stopPropagation()}
                style={{background:'var(--bg-secondary)',border:'1px solid var(--border-light)',borderRadius:'24px',padding:'2.5rem',maxWidth:'560px',width:'100%',position:'relative',boxShadow:'var(--glass-shadow)',color:'var(--text-primary)'}}>
                
                <button onClick={()=>setRegistryDetails(null)} style={{position:'absolute',top:'1.2rem',right:'1.2rem',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:'50%',width:32,height:32,display:'grid',placeItems:'center',cursor:'pointer',color:'var(--text-primary)'}}>✕</button>

                <div style={{display:'flex',alignItems:'center',gap:'0.8rem',marginBottom:'1.5rem',borderBottom:'1px solid var(--border-light)',paddingBottom:'1rem'}}>
                  <span style={{fontSize:'1.8rem'}}>🛡️</span>
                  <div>
                    <h3 style={{fontSize:'1.3rem',fontWeight:800}}>{t('Official Verification Registry')}</h3>
                    <p style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{t('Secure Digital Certification Details')}</p>
                  </div>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:'1rem',fontSize:'0.9rem'}}>
                  <div>
                    <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:800}}>{t('Event / Mission')}</div>
                    <div style={{fontWeight:700,color:'var(--text-primary)',marginTop:'0.2rem'}}>{t(registryDetails.title)}</div>
                  </div>
                  <div>
                    <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:800}}>{t('Recipient Volunteer')}</div>
                    <div style={{fontWeight:700,color:'var(--text-primary)',marginTop:'0.2rem'}}>{user.name}</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                    <div>
                      <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:800}}>{t('Registry Number')}</div>
                      <div style={{fontWeight:700,color:'var(--text-primary)',marginTop:'0.2rem'}}>#{registryDetails.registryNum}</div>
                    </div>
                    <div>
                      <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:800}}>{t('Security Seal Code')}</div>
                      <div style={{fontWeight:700,color:'var(--text-primary)',marginTop:'0.2rem'}}>{registryDetails.securityCode}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:800}}>{t('Verification ID')}</div>
                    <div style={{fontFamily:'monospace',fontSize:'0.8rem',wordBreak:'break-all',color:'var(--primary-400)',marginTop:'0.2rem',background:'rgba(0,0,0,0.15)',padding:'0.6rem',borderRadius:'8px',border:'1px solid var(--border-light)'}}>{registryDetails.verificationId}</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                    <div>
                      <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:800}}>{t('Signature Status')}</div>
                      <div style={{fontWeight:700,color:'#10b981',marginTop:'0.2rem'}}>{t(registryDetails.signatureStatus)}</div>
                    </div>
                    <div>
                      <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',textTransform:'uppercase',fontWeight:800}}>{t('Certification Date')}</div>
                      <div style={{fontWeight:700,color:'var(--text-primary)',marginTop:'0.2rem'}}>{new Date(registryDetails.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>

                <div style={{marginTop:'2rem',display:'flex',gap:'1rem'}}>
                  <button onClick={()=>{addToast(t('Downloading official certificate verification document...'),'success')}}
                    style={{flex:1,padding:'0.8rem',borderRadius:'10px',border:'none',background:'var(--accent-highlight)',color:'white',fontWeight:700,cursor:'pointer',fontFamily:'var(--font-body)'}}>
                    {t('Download Registry Record')}
                  </button>
                  <button onClick={()=>setRegistryDetails(null)}
                    style={{padding:'0.8rem 1.5rem',borderRadius:'10px',border:'1px solid var(--border-light)',background:'transparent',color:'var(--text-primary)',fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)'}}>
                    {t('Close')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
