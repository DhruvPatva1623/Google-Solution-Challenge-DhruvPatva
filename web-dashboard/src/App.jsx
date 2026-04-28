import { useState, useEffect, useRef } from 'react'
import { AlertCircle, Mic, Heart, Compass, Award, User, MapPin, CheckCircle, ShieldCheck, Activity, Star, Clock, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';

// Hooks
import { useCounter } from './hooks/useCounter';

// Components
import { Toast } from './components/common/Toast';
import { AvatarPlaceholder } from './components/common/AvatarPlaceholder';
import { SplashScreen } from './components/common/SplashScreen';
import { Navbar } from './components/layout/Navbar';
import { AuthModal } from './components/auth/AuthModal';
import { VolunteerDashboard } from './components/dashboard/VolunteerDashboard';
import { NgoDashboard } from './components/dashboard/NgoDashboard';
import { ProfilePanel } from './components/dashboard/ProfilePanel';
import { Hero } from './components/landing/Hero';
import { SosModal } from './components/common/SosModal';
import { HostProfileModal } from './components/common/HostProfileModal';

// Data
import { IMPACT_DATA, LANDING_TASKS, LEADERBOARD_DATA, TESTIMONIALS, GOVT_SCHEMES } from './constants/data';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

function App() {
  const [theme, setTheme] = useState('dark')
  const cursorRef = useRef(null)
  const blobRef = useRef(null)
  const [sosActive, setSosActive] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [toasts, setToasts] = useState([])
  const [acceptedTasks, setAcceptedTasks] = useState({})
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showSchemeResult, setShowSchemeResult] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showDashboard, setShowDashboard] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [showSosModal, setShowSosModal] = useState(false)
  const [showHostProfile, setShowHostProfile] = useState(null)
  const [emergencyMissions, setEmergencyMissions] = useState([])
  const [checkInTime, setCheckInTime] = useState(null)
  const [activeSessionSecs, setActiveSessionSecs] = useState(0)

  // Global Timer Logic
  useEffect(() => {
    let interval;
    if (checkInTime) {
      interval = setInterval(() => {
        setActiveSessionSecs(Math.floor((Date.now() - checkInTime) / 1000));
      }, 1000);
    } else {
      setActiveSessionSecs(0);
    }
    return () => clearInterval(interval);
  }, [checkInTime]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleCheckIn = () => {
    const now = Date.now();
    setCheckInTime(now);
    addToast('📍 Mission session started! Your time is being recorded.', 'success');
  };

  const handleCheckOut = () => {
    if (!checkInTime) return;
    const durationMins = Math.floor(activeSessionSecs / 60);
    const durationHrs = (activeSessionSecs / 3600).toFixed(1);
    
    // Add to user history
    const newSession = {
      id: Date.now(),
      title: 'Active Volunteering Session',
      date: new Date().toISOString().split('T')[0],
      hrs: parseFloat(durationHrs),
      status: 'Completed',
      pts: Math.floor(durationMins * 10) // 10 pts per minute
    };

    if (currentUser) {
      setCurrentUser(prev => ({
        ...prev,
        volunteerHours: (prev.volunteerHours || 0) + parseFloat(durationHrs),
        points: (prev.points || 0) + newSession.pts,
        history: [newSession, ...(prev.history || [])]
      }));
    }

    setCheckInTime(null);
    addToast(`🏁 Session ended! You contributed ${durationHrs} hours.`, 'success');
  };

  // Simulate real-time mission discovery - DISABLED to prevent spamming as per user request
  /*
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const newMission = {
          id: Date.now(),
          topic: "🚨 EMERGENCY: Food Distribution",
          name: "Rahul Verma",
          org: "Goonj NGO",
          reason: "Critical shortage of supplies in sector 12. Urgent help needed.",
          time: "Immediate",
          location: "Sector 12, Delhi",
          timestamp: new Date().toISOString()
        };
        setEmergencyMissions(prev => [newMission, ...prev]);
        addToast(`🚨 NEW CRITICAL MISSION: ${newMission.topic}`, 'error');
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);
  */

  const [livesCount, livesRef] = useCounter(50389, 2500);
  const [volCount, volRef] = useCounter(10245, 2000);
  const [taskCount, taskRef] = useCounter(8742, 2200);
  const [ngoCount, ngoRef] = useCounter(127, 1500);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleSos = () => {
    if (navigator.vibrate) navigator.vibrate([100,50,100,50,200]);
    setShowSosModal(true);
  }

  const handleSosSubmit = (missionData) => {
    setEmergencyMissions(prev => [missionData, ...prev]);
    setShowSosModal(false);
    setSosActive(true);
    addToast('🚨 SOS Broadcasted! Every user is being notified.', 'error');
    
    // Simulate global notification
    setTimeout(() => {
      setSosActive(false);
    }, 8000);
  };

  const handleVoiceMsg = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    if (!voiceActive) {
      setVoiceActive(true); setVoiceText('Listening...');
      addToast('🎤 Voice interface activated — speak in Hindi or English', 'info');
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const r = new SR(); r.lang='en-IN'; r.continuous=false; r.interimResults=true;
        r.onresult = (e) => setVoiceText(e.results[0][0].transcript);
        r.onend = () => { setVoiceActive(false); };
        r.onerror = () => { setVoiceActive(false); setVoiceText(''); addToast('Voice recognition ended.','info'); };
        r.start();
      } else {
        setTimeout(() => {
          setVoiceText('मुझे आज का काम दिखाओ');
          addToast('Simulated: "Show today\'s tasks" — navigating','success');
          setTimeout(() => { setVoiceActive(false); setVoiceText(''); }, 2000);
        }, 2000);
      }
    } else { setVoiceActive(false); setVoiceText(''); }
  }

  const handleAcceptMission = (taskTitle, index) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setAcceptedTasks(prev => ({...prev, [index]: true}));
    addToast(`✅ Mission accepted: "${taskTitle}" — GPS routing started`, 'success');
  }

  const handleLogin = (user) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    setShowDashboard(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowDashboard(false);
    setShowProfile(false);
    addToast('👋 Logged out successfully. See you soon!','info');
  };

  const handleProfileUpdate = (updated) => setCurrentUser(updated);

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])

  useEffect(() => {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const t = document.querySelector(a.getAttribute('href'));
        if (t) t.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }, [])

  useEffect(() => {
    let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
    let cursorX = mouseX, cursorY = mouseY, blobX = mouseX, blobY = mouseY, running = true;
    const handleMouse = (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      document.querySelectorAll('.card-3d').forEach(card => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    };
    window.addEventListener('mousemove', handleMouse);
    const loop = () => {
      cursorX += (mouseX - cursorX) * 0.3; cursorY += (mouseY - cursorY) * 0.3;
      blobX += (mouseX - blobX) * 0.04; blobY += (mouseY - blobY) * 0.04;
      if (cursorRef.current) cursorRef.current.style.transform = `translate(${cursorX-7}px,${cursorY-7}px)`;
      if (blobRef.current) blobRef.current.style.transform = `translate(${blobX}px,${blobY}px)`;
      if (running) requestAnimationFrame(loop);
    };
    loop();
    return () => { running=false; window.removeEventListener('mousemove', handleMouse); };
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active') });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [])

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>
      <div className="cursor-trail" ref={cursorRef}/>
      <div className="cursor-blob" ref={blobRef}/>
      <div className="cosmic-layer"/>
      <div className="particles"/>
      <div className="aurora-blur" style={{top:'10%',left:'20%',width:'500px',height:'500px',background:'var(--accent-highlight)'}}/>
      <div className="aurora-blur" style={{bottom:'0%',right:'10%',width:'600px',height:'600px',background:'var(--primary-500)',animationDelay:'-4s'}}/>
      <div className="aurora-blur" style={{top:'40%',left:'60%',width:'400px',height:'400px',background:'var(--accent-pink)',animationDelay:'-8s'}}/>
      <svg className="bg-svg" preserveAspectRatio="none">
        <path d="M-100,500 Q400,100 900,600 T2000,300" className="path-line"/>
        <path d="M-100,200 Q300,700 1000,100 T2000,500" className="path-line" style={{animationDuration:'12s',stroke:'var(--accent-pink)'}}/>
      </svg>

      <div style={{ position: 'relative', zIndex: 10000 }}>
        <Navbar 
          theme={theme} 
          setTheme={setTheme} 
          handleSos={handleSos} 
          currentUser={currentUser} 
          setShowDashboard={setShowDashboard} 
          setShowProfile={setShowProfile} 
          setShowAuthModal={setShowAuthModal}
          activeSessionSecs={activeSessionSecs}
          isCheckingIn={!!checkInTime}
          onCheckOut={handleCheckOut}
        />
      </div>

      <AnimatePresence>
        {showAuthModal && <AuthModal onClose={()=>setShowAuthModal(false)} onLogin={handleLogin} addToast={addToast}/>}
      </AnimatePresence>

      <AnimatePresence>
        {showDashboard && currentUser && (
          currentUser.role === 'ngo' ? (
            <NgoDashboard
              user={currentUser}
              onLogout={handleLogout}
              onOpenProfile={()=>{setShowProfile(true);setShowDashboard(false)}}
              addToast={addToast}
              emergencyMissions={emergencyMissions}
              onTriggerSos={handleSos}
            />
          ) : (
            <VolunteerDashboard
              user={currentUser}
              addToast={addToast}
              onLogout={handleLogout}
              onOpenProfile={()=>{setShowProfile(true);setShowDashboard(false)}}
              emergencyMissions={emergencyMissions}
              onViewHost={setShowHostProfile}
              theme={theme}
              setTheme={setTheme}
              activeSessionSecs={activeSessionSecs}
              isCheckingIn={!!checkInTime}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
            />
          )
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSosModal && (
          <SosModal 
            user={currentUser} 
            onClose={() => setShowSosModal(false)} 
            onSubmit={handleSosSubmit}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHostProfile && (
          <HostProfileModal 
            host={showHostProfile} 
            onClose={() => setShowHostProfile(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfile && currentUser && (
          <ProfilePanel
            user={currentUser}
            onClose={()=>{setShowProfile(false); if(currentUser) setShowDashboard(true)}}
            onUpdate={handleProfileUpdate}
            addToast={addToast}
          />
        )}
      </AnimatePresence>

      <main style={{position:'relative',paddingTop:'160px',paddingBottom:'100px'}}>
        <Hero setShowAuthModal={setShowAuthModal} />

        {/* Live Emergency Feed - Visible to all */}
        <AnimatePresence>
          {emergencyMissions.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}
            >
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '24px', padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="animate-pulse" style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>LIVE CRITICAL NEEDS</h2>
                  <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700, marginLeft: 'auto' }}>{emergencyMissions.length} ACTIVE ALERTS</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {emergencyMissions.slice(0, 3).map(m => (
                    <div key={m.id} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.7rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{m.topic}</div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{m.reason.substring(0, 80)}...</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={14} /> {m.location} · <Clock size={14} /> {m.time}
                      </div>
                      <button onClick={() => setShowAuthModal(true)} style={{ width: '100%', marginTop: '1.2rem', padding: '0.7rem', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                        Help Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Counters */}
        <section className="reveal" style={{maxWidth:'1200px',margin:'0 auto',padding:'0 2rem'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1.5rem',textAlign:'center'}}>
            {[{ref:livesRef,val:livesCount,label:'Lives Impacted',suffix:'+',icon:'❤️'},{ref:volRef,val:volCount,label:'Active Volunteers',suffix:'+',icon:'🙋'},{ref:taskRef,val:taskCount,label:'Tasks Completed',suffix:'+',icon:'✅'},{ref:ngoRef,val:ngoCount,label:'NGO Partners',suffix:'+',icon:'🤝'}].map((m,i)=>(
              <div key={i} ref={m.ref} className="glass-panel" style={{padding:'2rem 1rem',borderRadius:'20px'}}>
                <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>{m.icon}</div>
                <div style={{fontSize:'2.5rem',fontWeight:800,fontFamily:'var(--font-display)'}}>{m.val.toLocaleString()}{m.suffix}</div>
                <div style={{color:'var(--text-secondary)',fontWeight:600,marginTop:'0.3rem'}}>{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Global FABs */}
        <AnimatePresence>
          {sosActive && (
            <motion.div initial={{opacity:0,y:-50,scale:0.8}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,scale:0.8}}
              style={{position:'fixed',top:'100px',left:'50%',transform:'translateX(-50%)',zIndex:9999,background:'rgba(239,68,68,0.95)',color:'white',padding:'1rem 2rem',borderRadius:'16px',display:'flex',alignItems:'center',gap:'1rem',boxShadow:'0 10px 30px rgba(239,68,68,0.5)',border:'1px solid #ef4444'}}>
              <AlertCircle size={24}/>
              <div><strong style={{display:'block'}}>🚨 SOS Dispatched!</strong><span style={{fontSize:'0.9rem'}}>32 volunteers alerted within 5km · Est. response: 4 min</span></div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{position:'fixed',bottom:'100px',right:'30px',zIndex:1000,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'0.5rem'}}>
          <AnimatePresence>
            {voiceActive && voiceText && (
              <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20}} className="glass-panel" style={{padding:'0.6rem 1rem',borderRadius:'12px',fontSize:'0.85rem',fontWeight:600,maxWidth:'250px'}}>
                🎤 {voiceText}
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={handleVoiceMsg} aria-label="Voice interface toggle" style={{width:65,height:65,borderRadius:'50%',background:voiceActive?'var(--accent-pink)':'var(--glass-bg)',backdropFilter:'blur(10px)',border:'1px solid var(--glass-border)',display:'grid',placeItems:'center',color:voiceActive?'white':'var(--text-primary)',boxShadow:voiceActive?'0 0 30px var(--accent-pink)':'var(--glass-shadow)',transition:'all 0.3s',cursor:'pointer'}}>
            <Mic size={30}/>
          </button>
        </div>

        {/* Features Bento */}
        <section id="features" style={{marginTop:'100px'}}>
          <div style={{textAlign:'center',margin:'0 auto 60px'}}>
            <h2 className="reveal" style={{fontSize:'3rem',marginBottom:'1rem'}}>Intelligent Ecosystem</h2>
            <p className="reveal" style={{color:'var(--text-secondary)'}}>Powered by cutting-edge heuristics and empathy-driven UX.</p>
          </div>
          <div className="bento-grid">
            <div className="card-3d glass-panel reveal" style={{gridColumn:'span 2',gridRow:'span 2',display:'flex',flexDirection:'column'}}>
              <div className="card-content" style={{flex:1}}>
                <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🔮</div>
                <h3 style={{fontSize:'2rem',marginBottom:'1rem'}}>Predictive Needs Graph</h3>
                <p style={{color:'var(--text-secondary)',fontSize:'1.1rem',maxWidth:'80%'}}>Leveraging historical climatic anomalies and socioeconomic shifts, the Vertex AI engine scales anticipated supply shortages before they impact marginalized communities.</p>
                <div style={{marginTop:'auto',paddingTop:'2rem'}}>
                  <div style={{height:150,width:'100%',background:'linear-gradient(0deg,var(--border-light) 1px,transparent 1px) 0 0 / 100% 30px',position:'relative'}}>
                    <svg width="100%" height="100%" preserveAspectRatio="none"><path d="M0,150 L100,100 L200,120 L300,50 L400,60 L500,20" fill="none" stroke="var(--primary-500)" strokeWidth="4"/></svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-3d glass-panel reveal">
              <div className="card-content">
                <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🏆</div>
                <h3 style={{fontSize:'1.5rem',marginBottom:'0.5rem'}}>Gamified Growth</h3>
                <p style={{color:'var(--text-secondary)',marginBottom:'1rem'}}>Rank up by aiding your community. Unlock exclusive blockchain badges.</p>
                <div style={{background:'rgba(255,255,255,0.05)',borderRadius:'12px',padding:'1rem',border:'1px solid var(--border-light)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}><span style={{fontWeight:700}}>Level 4: Hero</span><span style={{color:'var(--primary-500)',fontWeight:700}}>1450 pts</span></div>
                  <div style={{width:'100%',height:'8px',background:'var(--border-light)',borderRadius:'99px',overflow:'hidden'}}><div style={{width:'72%',height:'100%',background:'linear-gradient(90deg,var(--accent-highlight),var(--accent-pink))'}}/></div>
                </div>
              </div>
            </div>
            <div className="card-3d glass-panel reveal" style={{background:'linear-gradient(135deg,var(--bg-elevated) 0%,rgba(236,72,153,0.1) 100%)'}}>
              <div className="card-content">
                <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🌍</div>
                <h3 style={{fontSize:'1.5rem',marginBottom:'0.5rem'}}>Multilingual Voice</h3>
                <p style={{color:'var(--text-secondary)'}}>Real-time Dialogflow parsing across 15+ complex regional dialects bridging technological divide.</p>
              </div>
            </div>
            <div className="card-3d glass-panel reveal" style={{gridColumn:'span 3'}}>
              <div className="card-content" style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:'2rem'}}>
                <div style={{flex:'1 1 500px'}}>
                  <h3 style={{fontSize:'1.8rem',marginBottom:'0.5rem'}}>Polygon Blockchain Identity</h3>
                  <p style={{color:'var(--text-secondary)'}}>Your verified volunteer hours are securely minted as non-fungible certificates on the Polygon L2 network, preventing fraud and providing lifelong, transportable accreditation.</p>
                </div>
                <div style={{background:'var(--bg-primary)',padding:'1rem 1.5rem',borderRadius:'16px',border:'1px solid var(--border-light)',display:'flex',alignItems:'center',gap:'1rem'}}>
                  <Award size={40} color="var(--primary-500)"/>
                  <div>
                    <div style={{fontSize:'0.9rem',color:'var(--text-secondary)'}}>Verified NFT Minted</div>
                    <div style={{fontWeight:800,fontSize:'1.2rem'}}>120h Community Service</div>
                    <div style={{fontSize:'0.7rem',color:'var(--accent-highlight)',fontFamily:'monospace'}}>0x7f3a...b92e</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section id="impact" style={{marginTop:'100px'}}>
          <div style={{textAlign:'center',margin:'0 auto 60px'}}>
            <h2 className="reveal" style={{fontSize:'3rem',marginBottom:'1rem'}}>Live Needs & Social Impact</h2>
            <p className="reveal" style={{color:'var(--text-secondary)'}}>Real-time matching powered by TensorFlow.js and geospatial ML models.</p>
          </div>
          <div className="bento-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
            <div className="card-3d glass-panel reveal" style={{display:'flex',flexDirection:'column',gap:'1rem',padding:'2rem'}}>
              <h3 style={{fontSize:'1.8rem',display:'flex',alignItems:'center',gap:'0.8rem'}}><Activity color="var(--primary-500)"/> Active Action Requests</h3>
              {LANDING_TASKS.map((task,i)=>(
                <div key={i} style={{background:'var(--bg-secondary)',padding:'1rem 1.5rem',borderRadius:'16px',border:'1px solid var(--border-light)',display:'flex',flexDirection:'column',gap:'0.5rem',opacity:acceptedTasks[i]?0.6:1,transition:'opacity 0.3s'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{background:`${task.color}22`,color:task.color,padding:'0.2rem 0.6rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>{task.type}</span>
                    <span style={{color:'var(--accent-highlight)',fontWeight:800,fontSize:'0.9rem'}}>{task.score}% ML Match</span>
                  </div>
                  <h4 style={{fontSize:'1.2rem'}}>{task.title}</h4>
                  <p style={{fontSize:'0.8rem',color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:'0.3rem'}}><MapPin size={14}/> {task.dist} away · Skills: {task.skills.join(', ')}</p>
                  <div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem'}}>
                    <button onClick={()=>currentUser ? handleAcceptMission(task.title,i) : setShowAuthModal(true)} disabled={acceptedTasks[i]}
                      style={{flex:1,padding:'0.5rem',border:'none',background:acceptedTasks[i]?'#10b981':'var(--primary-500)',color:'white',borderRadius:'8px',fontWeight:600,cursor:acceptedTasks[i]?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem'}}>
                      {acceptedTasks[i]?<><CheckCircle size={16}/> Accepted</>:'Accept Mission'}
                    </button>
                    <button onClick={()=>addToast(`🧭 AR Navigation launching for "${task.title}"`,'info')} style={{padding:'0.5rem 1rem',border:'1px solid var(--border-light)',background:'transparent',color:'var(--text-primary)',borderRadius:'8px',cursor:'pointer'}} title="Launch AR Navigation"><Compass size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'2rem'}}>
              <div className="card-3d glass-panel reveal" style={{padding:'2rem'}}>
                <h3 style={{fontSize:'1.5rem',marginBottom:'1.5rem'}}>Community Impact Trajectory</h3>
                <div style={{height:'250px'}}><Line data={IMPACT_DATA} options={{maintainAspectRatio:false,scales:{y:{beginAtZero:true}},plugins:{legend:{display:false}}}}/></div>
              </div>
              <div className="card-3d glass-panel reveal" style={{background:'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(16,185,129,0.1))'}}>
                <div className="card-content">
                  <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🏛️</div>
                  <h3 style={{fontSize:'1.5rem',marginBottom:'0.5rem'}}>Govt Scheme Eligibility AI</h3>
                  <p style={{color:'var(--text-secondary)',marginBottom:'1rem'}}>Our system automatically cross-references beneficiary needs with Direct Benefit Transfer (DBT) and Digital India portals.</p>
                  <button onClick={()=>{setShowSchemeResult(true);addToast('🔍 Scanning beneficiary profile against 47 government schemes...','info');setTimeout(()=>addToast('✅ 3 eligible schemes found! PM-KISAN, Ayushman Bharat, MGNREGA','success'),2500)}} style={{width:'100%',padding:'0.8rem',borderRadius:'12px',border:'1px solid #3b82f6',background:'rgba(59,130,246,0.1)',color:'#3b82f6',fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',cursor:'pointer',marginBottom:showSchemeResult?'1rem':0}}>
                    <ShieldCheck size={18}/> Scan Beneficiary Profile
                  </button>
                  <AnimatePresence>
                    {showSchemeResult && (
                      <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} style={{overflow:'hidden'}}>
                        <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                          {GOVT_SCHEMES.map((s,i)=>(
                            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.6rem 1rem',borderRadius:'10px',border:'1px solid var(--border-light)',background:'var(--bg-secondary)'}}>
                              <div><div style={{fontWeight:700,fontSize:'0.95rem'}}>{s.name}</div><div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{s.desc}</div></div>
                              <div style={{textAlign:'right'}}><div style={{fontWeight:700,color:s.eligible?'#10b981':'var(--text-secondary)',fontSize:'0.85rem'}}>{s.benefit}</div><div style={{fontSize:'0.7rem',color:s.eligible?'#10b981':'#ef4444'}}>{s.eligible?'✅ Eligible':'❌ Not eligible'}</div></div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section style={{marginTop:'100px',maxWidth:'1200px',margin:'100px auto 0',padding:'0 2rem'}}>
          <div style={{textAlign:'center',marginBottom:'60px'}}>
            <h2 className="reveal" style={{fontSize:'3rem',marginBottom:'1rem'}}>Volunteer Leaderboard</h2>
            <p className="reveal" style={{color:'var(--text-secondary)'}}>Top contributors making the most impact this month.</p>
          </div>
          <div className="card-3d glass-panel reveal" style={{borderRadius:'24px',overflow:'hidden'}}>
            {LEADERBOARD_DATA.map((v,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 2rem',borderBottom:i<LEADERBOARD_DATA.length-1?'1px solid var(--border-light)':'none',background:i===3?'rgba(249,115,22,0.06)':'transparent'}}>
                <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                  <span style={{fontSize:i<3?'1.8rem':'1.2rem',width:'40px',textAlign:'center',fontWeight:800,color:i>=3?'var(--text-secondary)':'inherit'}}>{v.badge}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:'1.05rem'}}>{v.name} {i===3&&<span style={{background:'var(--primary-500)',color:'white',padding:'0.1rem 0.5rem',borderRadius:'6px',fontSize:'0.7rem',marginLeft:'0.5rem'}}>YOU</span>}</div>
                    <div style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{v.city}</div>
                  </div>
                </div>
                <div style={{fontWeight:800,fontSize:'1.1rem',color:'var(--primary-500)'}}>{v.pts.toLocaleString()} pts</div>
              </div>
            ))}
          </div>
        </section>

        {/* Stories */}
        <section id="stories" style={{marginTop:'100px',maxWidth:'1200px',margin:'100px auto 0',padding:'0 2rem'}}>
          <div style={{textAlign:'center',marginBottom:'60px'}}>
            <h2 className="reveal" style={{fontSize:'3rem',marginBottom:'1rem'}}>Success Stories</h2>
            <p className="reveal" style={{color:'var(--text-secondary)'}}>Real voices from the communities we serve.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:'2rem'}}>
            {TESTIMONIALS.map((t,i)=>(
              <motion.div key={i} whileHover={{y:-5}} className="card-3d glass-panel reveal" style={{padding:'2rem',borderRadius:'24px',display:'flex',flexDirection:'column'}}>
                <div style={{display:'flex',gap:'0.3rem',marginBottom:'1rem'}}>
                  {Array.from({length:t.rating}).map((_,j)=><Star key={j} size={18} fill="#f97316" color="#f97316"/>)}
                </div>
                <p style={{color:'var(--text-secondary)',fontStyle:'italic',flex:1,lineHeight:1.7,marginBottom:'1.5rem'}}>"{t.text}"</p>
                <div style={{borderTop:'1px solid var(--border-light)',paddingTop:'1rem'}}>
                  <div style={{fontWeight:700}}>{t.name}</div>
                  <div style={{fontSize:'0.85rem',color:'var(--text-secondary)'}}>{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Join Banner */}
        <section style={{maxWidth:'1200px',margin:'100px auto 0',padding:'0 2rem'}}>
          <div style={{background:'linear-gradient(135deg,var(--primary-500),var(--accent-pink),var(--accent-highlight))',borderRadius:'32px',padding:'4rem',textAlign:'center',color:'white',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,background:'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}/>
            <div style={{position:'relative',zIndex:1}}>
              <h2 style={{fontSize:'3rem',marginBottom:'1rem'}}>Ready to Create Real Impact?</h2>
              <p style={{opacity:0.9,fontSize:'1.2rem',marginBottom:'2rem',maxWidth:600,margin:'0 auto 2rem'}}>Join 10,000+ volunteers already changing lives every day. Setup takes less than 2 minutes.</p>
              <button onClick={()=>setShowAuthModal(true)} style={{padding:'1.2rem 3rem',borderRadius:'99px',background:'white',color:'var(--primary-500)',border:'none',cursor:'pointer',fontWeight:800,fontSize:'1.1rem',display:'inline-flex',alignItems:'center',gap:'0.8rem',fontFamily:'var(--font-display)',boxShadow:'0 10px 30px rgba(0,0,0,0.2)',transition:'transform 0.2s'}} onMouseEnter={e=>e.target.style.transform='scale(1.04)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}>
                🚀 Get Started — It's Free
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{position:'relative',marginTop:'100px',borderTop:'1px solid var(--border-light)',padding:'4rem 2rem 2rem'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto',display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:'3rem'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1rem'}}><span style={{fontSize:'1.5rem'}}>🌍</span><span style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:'1.2rem'}}>CommunityConnect</span></div>
            <p style={{color:'var(--text-secondary)',maxWidth:'300px',lineHeight:1.7}}>AI-powered volunteer coordination platform built for Google Solution Challenge 2026. Making social impact measurable, transparent, and accessible to all.</p>
          </div>
          <div>
            <h4 style={{marginBottom:'1rem',fontWeight:700}}>Platform</h4>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              <a href="#features" style={{color:'var(--text-secondary)',textDecoration:'none'}}>Features</a>
              <a href="#impact" style={{color:'var(--text-secondary)',textDecoration:'none'}}>Impact Hub</a>
              <a href="#stories" style={{color:'var(--text-secondary)',textDecoration:'none'}}>Success Stories</a>
            </div>
          </div>
          <div>
            <h4 style={{marginBottom:'1rem',fontWeight:700}}>Technology</h4>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',color:'var(--text-secondary)'}}>
              <span>TensorFlow.js</span><span>Polygon L2</span><span>Firebase</span><span>Web Speech API</span>
            </div>
          </div>
          <div>
            <h4 style={{marginBottom:'1rem',fontWeight:700}}>UN SDGs</h4>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',color:'var(--text-secondary)'}}>
              <span>🎯 No Poverty</span><span>🍽️ Zero Hunger</span><span>❤️ Good Health</span><span>📚 Quality Education</span>
            </div>
          </div>
        </div>
        <div style={{maxWidth:'1200px',margin:'3rem auto 0',borderTop:'1px solid var(--border-light)',paddingTop:'2rem',display:'flex',justifyContent:'space-between',alignItems:'center',color:'var(--text-secondary)',fontSize:'0.85rem',flexWrap:'wrap',gap:'1rem'}}>
          <span>© 2026 CommunityConnect · Google Solution Challenge</span>
          <div style={{display:'flex',gap:'1.5rem'}}><span>Privacy Policy</span><span>Terms of Service</span><span>Contact</span></div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="glass-panel mobile-nav">
        <div onClick={()=>document.getElementById('impact')?.scrollIntoView({behavior:'smooth'})} style={{display:'flex',flexDirection:'column',alignItems:'center',color:'var(--primary-500)',cursor:'pointer'}}>
          <Heart size={24}/><span style={{fontSize:'0.7rem',marginTop:'0.2rem',fontWeight:600}}>Tasks</span>
        </div>
        <div onClick={()=>addToast('🧭 AR Navigation requires camera access','info')} style={{display:'flex',flexDirection:'column',alignItems:'center',color:'var(--text-secondary)',cursor:'pointer'}}>
          <Compass size={24}/><span style={{fontSize:'0.7rem',marginTop:'0.2rem',fontWeight:600}}>AR Nav</span>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',color:'var(--text-secondary)',position:'relative',top:'-15px'}}>
          <button onClick={handleSos} style={{width:50,height:50,borderRadius:'50%',background:'#ef4444',color:'white',border:'none',display:'grid',placeItems:'center',boxShadow:'0 4px 15px rgba(239,68,68,0.4)',cursor:'pointer'}}>
            <AlertCircle size={24}/>
          </button>
          <span style={{fontSize:'0.7rem',marginTop:'0.2rem',fontWeight:600}}>SOS</span>
        </div>
        <div onClick={()=>currentUser?setShowDashboard(true):setShowAuthModal(true)} style={{display:'flex',flexDirection:'column',alignItems:'center',color:'var(--text-secondary)',cursor:'pointer'}}>
          <Award size={24}/><span style={{fontSize:'0.7rem',marginTop:'0.2rem',fontWeight:600}}>Dashboard</span>
        </div>
        <div onClick={()=>currentUser?setShowProfile(true):setShowAuthModal(true)} style={{display:'flex',flexDirection:'column',alignItems:'center',color:'var(--text-secondary)',cursor:'pointer'}}>
          <User size={24}/><span style={{fontSize:'0.7rem',marginTop:'0.2rem',fontWeight:600}}>Profile</span>
        </div>
      </nav>

      {/* Toasts */}
      <AnimatePresence>
        {toasts.map(t=><Toast key={t.id} message={t.message} type={t.type} onClose={()=>removeToast(t.id)}/>)}
      </AnimatePresence>
    </>
  )
}

export default App
