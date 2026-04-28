import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, CheckCircle, Target, User, MapPin, ChevronRight, Zap, Compass, Share2, Calendar, Clock, Globe, ShieldCheck, Trophy, X, Download, AlertTriangle } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { AvatarPlaceholder } from '../common/AvatarPlaceholder';

export function VolunteerDashboard({ user, addToast, onLogout, onOpenProfile, emergencyMissions = [], onViewHost, theme, setTheme, isCheckingIn, activeSessionSecs, onCheckIn, onCheckOut }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [acceptedTasks, setAcceptedTasks] = useState({});
  const [notifications, setNotifications] = useState([
    {id:1,text:'New CRITICAL task: Flood Relief in Kheda',time:'2m ago',read:false,type:'urgent'},
    {id:2,text:'You earned the "City Hero" badge! 🏙️',time:'1h ago',read:false,type:'success'},
    {id:3,text:'Priya Sharma liked your impact post',time:'3h ago',read:true,type:'social'},
    {id:4,text:'Your blockchain certificate is ready',time:'1d ago',read:true,type:'info'},
  ]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSchemeResult, setShowSchemeResult] = useState(false);

  const tasks = [
    { id:1, title: 'Emergency Medical Supply Drop', dist: '1.2 km', score: 98, type: 'CRITICAL', color: '#ef4444', skills: ['First Aid', 'Driving'], deadline:'Today 6:00 PM', volunteers:3, needed:5 },
    { id:2, title: 'Elderly Food Assistance', dist: '3.4 km', score: 85, type: 'URGENT', color: '#f97316', skills: ['Cooking', 'Transport'], deadline:'Today 8:00 PM', volunteers:8, needed:10 },
    { id:3, title: 'Local School Renovation Aid', dist: '5.0 km', score: 76, type: 'ROUTINE', color: '#10b981', skills: ['Painting', 'Carpentry'], deadline:'Tomorrow 9:00 AM', volunteers:15, needed:20 },
    { id:4, title: 'Flood Relief — Kheda District', dist: '24 km', score: 99, type: 'CRITICAL', color: '#ef4444', skills: ['Swimming', 'First Aid', 'Driving'], deadline:'Immediate', volunteers:42, needed:100 },
    { id:5, title: 'Clean Water Distribution', dist: '7.2 km', score: 80, type: 'URGENT', color: '#f97316', skills: ['Logistics'], deadline:'Tomorrow 12:00 PM', volunteers:6, needed:15 },
  ];

  const myTaskHistory = useMemo(() => [
    {title:'Blood Donation Camp',date:'2026-04-10',hrs:4,status:'Completed',pts:200},
    {title:'Tree Plantation Drive',date:'2026-03-22',hrs:6,status:'Completed',pts:300},
    {title:'Scholarship Form Fill-Up',date:'2026-03-05',hrs:3,status:'Completed',pts:150},
    {title:'Winter Blanket Distribution',date:'2026-02-14',hrs:8,status:'Completed',pts:400},
    {title:'Road Accident First Aid',date:'2026-01-30',hrs:2,status:'Completed',pts:100},
  ], []);

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
    setAcceptedTasks(p=>({...p,[task.id]:true}));
    addToast(`✅ Mission accepted: "${task.title}" — GPS routing started`,'success');
  };


  const impactBar = useMemo(() => ({
    labels: ['Jan','Feb','Mar','Apr','May','Jun'],
    datasets: [{
      label: 'Hours',
      data: [18, 26, 12, 32, 28, 40],
      backgroundColor: 'rgba(249,115,22,0.55)',
      borderColor: '#f97316',
      borderWidth: 2,
      borderRadius: 6,
    }]
  }), []);

  const donut = useMemo(() => ({
    labels: ['Medical','Education','Disaster','Food','Environment'],
    datasets: [{ data:[30,25,20,15,10], backgroundColor:['#ef4444','#3b82f6','#f97316','#10b981','#8b5cf6'], borderWidth:0 }]
  }), []);

  const tabStyle = useCallback((t) => ({
    padding:'0.6rem 1.1rem', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.88rem',
    background: activeTab===t ? '#f97316' : 'transparent',
    color: activeTab===t ? 'white' : '#9ca3af',
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

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      style={{position:'fixed',inset:0,background:'var(--bg-primary)',zIndex:9000,overflowY:'auto',paddingBottom:'2rem'}}>

      {/* Dashboard Navbar */}
      <div style={{position:'sticky',top:0,zIndex:100,background:'var(--glass-bg)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border-light)',padding:'1rem 2rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.8rem'}}>
          <span style={{fontSize:'1.5rem'}}>🌍</span>
          <span style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:'1.2rem'}}>CommunityConnect</span>
          <span style={{background:'rgba(16,185,129,0.15)',color:'#10b981',padding:'0.2rem 0.7rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>● LIVE</span>
        </div>
        <div style={{display:'flex',gap:'0.5rem',overflowX:'auto',padding:'0 0.5rem'}}>
          {['overview','missions','history','schemes','community'].map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} style={tabStyle(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'1rem',flexShrink:0}}>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', padding: '0.4rem 0.8rem', borderRadius: '10px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }} aria-label="Toggle theme">
            {theme === 'dark' ? '🌑' : '☀️'}
          </button>
          {/* Notifications Bell */}
          <div style={{position:'relative'}}>
            <button onClick={()=>setShowNotifs(v=>!v)} style={{background:'var(--bg-secondary)',border:'1px solid var(--border-light)',borderRadius:'50%',width:38,height:38,display:'grid',placeItems:'center',cursor:'pointer',color:'var(--text-primary)',position:'relative'}}>
              <Bell size={18}/>
              {unread>0 && <span style={{position:'absolute',top:-4,right:-4,background:'#ef4444',color:'white',width:18,height:18,borderRadius:'50%',fontSize:'0.65rem',display:'grid',placeItems:'center',fontWeight:700}}>{unread}</span>}
            </button>
            <AnimatePresence>
              {showNotifs && (
                <motion.div initial={{opacity:0,y:-10,scale:0.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-10,scale:0.95}}
                  style={{position:'absolute',right:0,top:'110%',width:320,background:'var(--bg-primary)',border:'1px solid var(--border-light)',borderRadius:'16px',boxShadow:'0 20px 40px rgba(0,0,0,0.15)',zIndex:200,overflow:'hidden'}}>
                  <div style={{padding:'1rem',borderBottom:'1px solid var(--border-light)',fontWeight:700,fontSize:'0.9rem',display:'flex',justifyContent:'space-between'}}>
                    Notifications <span style={{color:'var(--text-secondary)',fontWeight:400,fontSize:'0.8rem',cursor:'pointer'}} onClick={()=>setNotifications(p=>p.map(n=>({...n,read:true})))}>Mark all read</span>
                  </div>
                  {notifications.map(n=>(
                    <div key={n.id} onClick={()=>markRead(n.id)} style={{padding:'0.9rem 1rem',borderBottom:'1px solid var(--border-light)',cursor:'pointer',background:n.read?'transparent':'rgba(249,115,22,0.05)',display:'flex',gap:'0.7rem',alignItems:'flex-start'}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:n.read?'transparent':'var(--primary-500)',marginTop:4,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'0.85rem',fontWeight:n.read?400:600}}>{n.text}</div>
                        <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.2rem'}}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Profile avatar */}
          <div onClick={onOpenProfile} style={{cursor:'pointer',display:'flex',alignItems:'center',gap:'0.7rem'}}>
            <AvatarPlaceholder name={user.name} size={36}/>
            <span style={{fontWeight:600,fontSize:'0.9rem'}}>{user.name.split(' ')[0]}</span>
          </div>
          <button onClick={onLogout} style={{background:'none',border:'1px solid var(--border-light)',borderRadius:'99px',padding:'0.4rem 0.9rem',cursor:'pointer',color:'var(--text-secondary)',fontSize:'0.85rem',fontWeight:600,display:'flex',alignItems:'center',gap:'0.4rem',fontFamily:'var(--font-body)'}}>
            <LogOut size={14}/> Logout
          </button>
        </div>
      </div>

      <div style={{maxWidth:1300,margin:'0 auto',padding:'2rem'}}>
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div>
            {/* Welcome Banner */}
            <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} style={{background:'linear-gradient(135deg,var(--primary-500),var(--accent-pink))',borderRadius:'24px',padding:'2rem',marginBottom:'2rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'1rem'}}>
              <div style={{color:'white'}}>
                <p style={{opacity:0.85,marginBottom:'0.3rem'}}>Good {new Date().getHours()<12?'Morning':'Afternoon'},</p>
                <h2 style={{fontSize:'2rem',fontWeight:800}}>Welcome back, {user.name.split(' ')[0]}! 👋</h2>
                <p style={{opacity:0.85,marginTop:'0.3rem'}}>You have <strong>3 active missions</strong> near you. Ready to make an impact?</p>
              </div>
              <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                <button onClick={isCheckingIn ? onCheckOut : onCheckIn} style={{padding:'0.9rem 1.8rem',borderRadius:'14px',background:isCheckingIn?'rgba(255,255,255,0.3)':'white',color:isCheckingIn?'white':'var(--primary-500)',border:'none',cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',gap:'0.6rem',fontSize:'1rem',fontFamily:'var(--font-body)',position:'relative'}}>
                  {isCheckingIn ? (
                    <>
                      <Clock size={18} className="animate-spin-slow" /> 
                      {Math.floor(activeSessionSecs / 3600).toString().padStart(2, '0')}:
                      {Math.floor((activeSessionSecs % 3600) / 60).toString().padStart(2, '0')}:
                      {(activeSessionSecs % 60).toString().padStart(2, '0')}
                    </>
                  ) : (
                    <><Target size={18}/> Check In</>
                  )}
                </button>
                <button onClick={onOpenProfile} style={{padding:'0.9rem 1.5rem',borderRadius:'14px',background:'rgba(255,255,255,0.15)',color:'white',border:'1px solid rgba(255,255,255,0.3)',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.95rem',fontFamily:'var(--font-body)'}}>
                  <User size={16}/> My Profile
                </button>
              </div>
            </motion.div>

            {/* Stats Row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'1.5rem',marginBottom:'2rem'}}>
              {[
                {icon:'⏱️',label:'Volunteer Hours',val:`${user.volunteerHours||120}h`,sub:'+4h this week',color:'#f97316'},
                {icon:'⭐',label:'Impact Points',val:(user.points||1450).toLocaleString(),sub:'Rank #4 in Ahmedabad',color:'#8b5cf6'},
                {icon:'✅',label:'Tasks Done',val:'24',sub:'3 this month',color:'#10b981'},
                {icon:'❤️',label:'Lives Impacted',val:'480',sub:'+120 this week',color:'#ec4899'},
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
                <h3 style={{fontSize:'1.2rem',marginBottom:'1rem'}}>📊 Activity Overview</h3>
                <div style={{position:'relative',height:180}}>
                  <Bar data={impactBar} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{color:'#aaa'},grid:{color:'rgba(255,255,255,0.06)'}},x:{ticks:{color:'#aaa'},grid:{display:false}}}}}/>
                </div>
              </div>
              <div style={cardS}>
                <h3 style={{fontSize:'1.2rem',marginBottom:'1rem'}}>🎯 Impact by Category</h3>
                <div style={{display:'flex',alignItems:'center',gap:'1.5rem'}}>
                  <div style={{position:'relative',height:160,width:160,flexShrink:0}}>
                    <Doughnut data={donut} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:'65%'}}/>
                  </div>
                  <div style={{flex:1}}>
                    {donut.labels.map((l,i) => (
                      <div key={i} style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem',fontSize:'0.82rem'}}>
                        <div style={{width:10,height:10,borderRadius:'50%',background:donut.datasets[0].backgroundColor[i],flexShrink:0}}/>
                        <span>{l}</span>
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
                <h3 style={{fontSize:'1.2rem'}}>📍 Nearby Active Requests</h3>
                <button onClick={()=>setActiveTab('missions')} style={{background:'none',border:'none',color:'var(--primary-500)',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:'0.3rem',fontFamily:'var(--font-body)'}}>View All <ChevronRight size={16}/></button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                {tasks.slice(0,3).map((task)=>(
                  <div key={task.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem',background:'var(--bg-secondary)',borderRadius:'14px',border:'1px solid var(--border-light)',gap:'1rem'}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'0.3rem'}}>
                        <span style={{background:`${task.color}22`,color:task.color,padding:'0.15rem 0.6rem',borderRadius:'99px',fontSize:'0.72rem',fontWeight:700}}>{task.type}</span>
                        <span style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}><MapPin size={11} style={{display:'inline'}}/> {task.dist}</span>
                      </div>
                      <div style={{fontWeight:600,fontSize:'0.95rem'}}>{task.title}</div>
                    </div>
                    <button onClick={()=>handleAccept(task)} disabled={acceptedTasks[task.id]}
                      style={{padding:'0.5rem 1.2rem',borderRadius:'10px',border:'none',background:acceptedTasks[task.id]?'#10b981':'var(--primary-500)',color:'white',fontWeight:600,cursor:acceptedTasks[task.id]?'default':'pointer',fontSize:'0.85rem',flexShrink:0,fontFamily:'var(--font-body)'}}>
                      {acceptedTasks[task.id]?'✓ Accepted':'Accept'}
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
            <h2 style={{fontSize:'1.8rem',marginBottom:'0.4rem'}}>🎯 Active Missions Near You</h2>
            <p style={{color:'#9ca3af',marginBottom:'1.5rem',fontSize:'0.9rem'}}>AI-matched to your skills ({(user.skills||['All Skills']).slice(0,3).join(', ')}) · {user.city||'Your City'}.</p>

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

              {tasks.map(task => {
                const accepted = !!acceptedTasks[task.id];
                return (
                  <div key={task.id} style={{...cardS, border: accepted ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.08)', transition:'border 0.2s'}}>
                    <div style={{display:'flex',gap:'1.2rem',flexWrap:'wrap'}}>
                      <div style={{flex:'1 1 280px'}}>
                        <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'0.7rem',flexWrap:'wrap'}}>
                          <span style={{background:`${task.color}22`,color:task.color,padding:'0.2rem 0.7rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>{task.type}</span>
                          <span style={{background:'rgba(139,92,246,0.15)',color:'#a78bfa',padding:'0.2rem 0.7rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>{task.score}% AI Match</span>
                          {accepted && <span style={{background:'rgba(16,185,129,0.15)',color:'#10b981',padding:'0.2rem 0.7rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>✓ YOU'RE IN</span>}
                        </div>
                        <h3 style={{fontSize:'1.1rem',marginBottom:'0.5rem',fontWeight:700}}>{task.title}</h3>
                        <div style={{display:'flex',gap:'0.8rem',color:'#9ca3af',fontSize:'0.82rem',flexWrap:'wrap',marginBottom:'0.7rem'}}>
                          <span>📍 {task.dist}</span>
                          <span>⏰ {task.deadline}</span>
                          <span>👥 {task.volunteers}/{task.needed} volunteers</span>
                        </div>
                        <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.8rem'}}>
                          {task.skills.map((s,i) => <span key={i} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',padding:'0.15rem 0.6rem',borderRadius:'99px',fontSize:'0.75rem'}}>{s}</span>)}
                        </div>
                        {/* Progress bar */}
                        <div>
                          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',color:'#9ca3af',marginBottom:'0.25rem'}}>
                            <span>Volunteers joined</span><span>{Math.round((task.volunteers/task.needed)*100)}%</span>
                          </div>
                          <div style={{height:5,background:'rgba(255,255,255,0.08)',borderRadius:'99px',overflow:'hidden'}}>
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
                          style={{padding:'0.7rem',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'white',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',fontFamily:'var(--font-body)',fontSize:'0.88rem'}}>
                          <Compass size={15}/> AR Navigate
                        </button>
                        <button
                          onClick={() => addToast(`📤 Sharing mission link...`,'info')}
                          style={{padding:'0.7rem',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'white',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',fontFamily:'var(--font-body)',fontSize:'0.88rem'}}>
                          <Share2 size={15}/> Share
                        </button>
                      </div>
                    </div>

                    {/* Accepted — show active info panel */}
                    {accepted && (
                      <div style={{marginTop:'1rem',padding:'0.9rem',background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.25)',borderRadius:'12px'}}>
                        <div style={{fontWeight:700,color:'#10b981',marginBottom:'0.5rem',fontSize:'0.9rem'}}>✅ Mission Active — You are registered!</div>
                        <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',fontSize:'0.82rem',color:'#9ca3af'}}>
                          <span>📍 Meet point: <strong style={{color:'white'}}>{task.dist} from you</strong></span>
                          <span>⏰ Report by: <strong style={{color:'white'}}>{task.deadline}</strong></span>
                          <span>📞 Coordinator: <strong style={{color:'white'}}>+91 98765 43210</strong></span>
                        </div>
                        <div style={{display:'flex',gap:'0.7rem',marginTop:'0.8rem',flexWrap:'wrap'}}>
                          <button onClick={() => addToast('📞 Calling coordinator...','info')} style={{padding:'0.45rem 1rem',borderRadius:'8px',background:'#10b981',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'0.8rem',fontFamily:'var(--font-body)'}}>
                            📞 Call Coordinator
                          </button>
                          <button onClick={() => addToast('🗺️ Opening maps...','info')} style={{padding:'0.45rem 1rem',borderRadius:'8px',background:'rgba(255,255,255,0.08)',color:'white',border:'1px solid rgba(255,255,255,0.15)',cursor:'pointer',fontWeight:600,fontSize:'0.8rem',fontFamily:'var(--font-body)'}}>
                            🗺️ Get Directions
                          </button>
                          <button onClick={() => { setAcceptedTasks(p => ({...p,[task.id]:false})); addToast('Mission cancelled','warning'); }} style={{padding:'0.45rem 1rem',borderRadius:'8px',background:'rgba(239,68,68,0.1)',color:'#f87171',border:'1px solid rgba(239,68,68,0.25)',cursor:'pointer',fontWeight:600,fontSize:'0.8rem',fontFamily:'var(--font-body)'}}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div>
            <h2 style={{fontSize:'2rem',marginBottom:'0.5rem'}}>📋 My Volunteering History</h2>
            <p style={{color:'var(--text-secondary)',marginBottom:'2rem'}}>Your complete record of completed missions and earned impact points.</p>
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              {myTaskHistory.map((t,i)=>(
                <motion.div key={i} whileHover={{x:4}} style={{...cardS,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:'1rem'}}>{t.title}</div>
                    <div style={{color:'var(--text-secondary)',fontSize:'0.85rem',marginTop:'0.3rem',display:'flex',gap:'1rem'}}>
                      <span><Calendar size={13} style={{display:'inline',verticalAlign:'middle'}}/> {t.date}</span>
                      <span><Clock size={13} style={{display:'inline',verticalAlign:'middle'}}/> {t.hrs}h</span>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                    <span style={{color:'#10b981',fontWeight:700,fontSize:'1.1rem'}}>+{t.pts} pts</span>
                    <span style={{background:'rgba(16,185,129,0.1)',color:'#10b981',padding:'0.3rem 0.8rem',borderRadius:'99px',fontSize:'0.8rem',fontWeight:700}}>{t.status}</span>
                    <button onClick={()=>addToast('📜 Certificate download will be available in full release','info')} style={{padding:'0.4rem 0.9rem',borderRadius:'8px',border:'1px solid var(--border-light)',background:'transparent',color:'var(--text-primary)',cursor:'pointer',fontSize:'0.8rem',display:'flex',alignItems:'center',gap:'0.4rem',fontFamily:'var(--font-body)'}}>
                      <Download size={14}/> Certificate
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            <div style={{...cardS,marginTop:'2rem',textAlign:'center'}}>
              <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🔗</div>
              <h3>Verify on Blockchain</h3>
              <p style={{color:'var(--text-secondary)',margin:'0.5rem 0 1rem'}}>All your hours are cryptographically verified on Polygon L2. Share your proof anywhere.</p>
              <button onClick={()=>addToast('🔗 Blockchain explorer opening...','info')} style={{padding:'0.8rem 2rem',borderRadius:'99px',background:'var(--accent-highlight)',color:'white',border:'none',cursor:'pointer',fontWeight:700,fontFamily:'var(--font-body)'}}><Globe size={16} style={{display:'inline',verticalAlign:'middle',marginRight:6}}/>Verify on Chain</button>
            </div>
          </div>
        )}

        {/* ── SCHEMES TAB ── */}
        {activeTab === 'schemes' && (
          <div>
            <h2 style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🏛️ Government Scheme Eligibility</h2>
            <p style={{color:'var(--text-secondary)',marginBottom:'2rem'}}>AI-powered cross-referencing with DBT and Digital India portals based on beneficiary profiles.</p>
            <div style={{...cardS,marginBottom:'2rem',background:'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(16,185,129,0.1))'}}>
              <div style={{display:'flex',gap:'1.5rem',alignItems:'center',flexWrap:'wrap'}}>
                <div style={{fontSize:'3rem'}}>🤖</div>
                <div style={{flex:1}}>
                  <h3 style={{fontSize:'1.3rem',marginBottom:'0.3rem'}}>Scan Beneficiary Profile</h3>
                  <p style={{color:'var(--text-secondary)'}}>Enter beneficiary details and our AI will instantly match them to eligible government schemes across PM-DBT portal, eKYC and UIDAI data.</p>
                </div>
                <button onClick={()=>{setShowSchemeResult(true);addToast('🔍 Scanning against 47 government schemes...','info');setTimeout(()=>addToast('✅ 3 eligible schemes found!','success'),2000)}}
                  style={{padding:'0.9rem 1.8rem',borderRadius:'14px',background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',gap:'0.5rem',fontFamily:'var(--font-body)'}}>
                  <ShieldCheck size={18}/> Scan Now
                </button>
              </div>
            </div>
            <AnimatePresence>
              {showSchemeResult && (
                <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'1.5rem'}}>
                    {govtSchemes.map((s,i)=>(
                      <div key={i} style={{...cardS,borderColor:s.eligible?'rgba(16,185,129,0.4)':'var(--border-light)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.8rem'}}>
                          <div>
                            <h3 style={{fontSize:'1.1rem'}}>{s.name}</h3>
                            <p style={{color:'var(--text-secondary)',fontSize:'0.85rem',marginTop:'0.2rem'}}>{s.desc}</p>
                          </div>
                          {s.eligible ? <CheckCircle size={22} color="#10b981"/> : <X size={22} color="#ef4444"/>}
                        </div>
                        <div style={{fontWeight:800,fontSize:'1.2rem',color:s.eligible?'#10b981':'var(--text-secondary)'}}>{s.benefit}</div>
                        <div style={{fontSize:'0.8rem',color:s.eligible?'#10b981':'#ef4444',marginTop:'0.2rem',fontWeight:600}}>{s.eligible?'✅ Eligible':'❌ Not Eligible'}</div>
                        {s.eligible && <button onClick={()=>addToast(`📝 Applying for ${s.name}...`,'info')} style={{marginTop:'1rem',width:'100%',padding:'0.6rem',borderRadius:'10px',background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.3)',color:'#10b981',cursor:'pointer',fontWeight:600,fontFamily:'var(--font-body)'}}>Apply Now →</button>}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── COMMUNITY TAB ── */}
        {activeTab === 'community' && (
          <div>
            <h2 style={{fontSize:'2rem',marginBottom:'0.5rem'}}>🤝 Community & Leaderboard</h2>
            <p style={{color:'var(--text-secondary)',marginBottom:'2rem'}}>Connect with fellow volunteers, track rankings, and celebrate impact.</p>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'2rem',flexWrap:'wrap'}}>
              <div style={cardS}>
                <h3 style={{fontSize:'1.2rem',marginBottom:'1.2rem'}}><Trophy size={18} style={{display:'inline',verticalAlign:'middle',marginRight:6}} color="var(--primary-500)"/>Volunteer Leaderboard</h3>
                {[
                  {name:'Priya Sharma',city:'Mumbai',pts:4820,badge:'🥇',hrs:340},
                  {name:'Rahul Verma',city:'Delhi',pts:3950,badge:'🥈',hrs:280},
                  {name:'Ananya Iyer',city:'Bangalore',pts:3100,badge:'🥉',hrs:220},
                  {name: user.name||'Dhruv Patva',city: user.city||'Ahmedabad',pts:user.points||1450,badge:'4',hrs:user.volunteerHours||120, isMe:true},
                  {name:'Kamal Singh',city:'Jaipur',pts:1200,badge:'5',hrs:95},
                ].map((v,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.9rem',borderRadius:'12px',background:v.isMe?'rgba(249,115,22,0.08)':'transparent',border:v.isMe?'1px solid rgba(249,115,22,0.2)':'1px solid transparent',marginBottom:'0.5rem'}}>
                    <span style={{fontSize:i<3?'1.8rem':'1.1rem',width:36,textAlign:'center',fontWeight:800,color:i>=3?'var(--text-secondary)':'inherit'}}>{v.badge}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700}}>{v.name} {v.isMe&&<span style={{background:'var(--primary-500)',color:'white',padding:'0.1rem 0.5rem',borderRadius:'6px',fontSize:'0.7rem',marginLeft:'0.5rem'}}>YOU</span>}</div>
                      <div style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{v.city} · {v.hrs}h volunteered</div>
                    </div>
                    <div style={{fontWeight:800,color:'var(--primary-500)'}}>{v.pts.toLocaleString()} pts</div>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
                <div style={{...cardS,textAlign:'center',background:'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(236,72,153,0.1))'}}>
                  <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>🏅</div>
                  <h3 style={{fontSize:'1.1rem'}}>Your Rank</h3>
                  <div style={{fontSize:'3rem',fontWeight:800,color:'var(--primary-500)'}}>#4</div>
                  <div style={{color:'var(--text-secondary)',fontSize:'0.85rem'}}>in Ahmedabad</div>
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
          </div>
        )}
      </div>
    </motion.div>
  );
}
