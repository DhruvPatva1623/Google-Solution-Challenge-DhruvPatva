import { useState, useEffect, useRef } from 'react'
import { AlertCircle, Mic, Heart, Compass, Award, User, MapPin, CheckCircle, ShieldCheck, Activity, Star, Clock, AlertTriangle, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';

// Firebase
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';

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
import { SessionController } from './components/common/SessionController';
import { HostProfileModal } from './components/common/HostProfileModal';

// Data
import { IMPACT_DATA, LANDING_TASKS, LEADERBOARD_DATA, TESTIMONIALS, GOVT_SCHEMES } from './constants/data';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

function ImpactSection() {
  const [livesCount, livesRef] = useCounter(50389, 2500);
  const [volCount, volRef] = useCounter(10245, 2000);
  const [taskCount, taskRef] = useCounter(8742, 2200);
  const [ngoCount, ngoRef] = useCounter(127, 1500);

  return (
    <section id="impact-stats" style={{padding:'6rem 2rem 2rem',maxWidth:'1400px',margin:'0 auto'}}>
      <div className="reveal" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1.5rem',textAlign:'center'}}>
        {[{ref:livesRef,val:livesCount,label:'Lives Impacted',icon:'❤️',color:'var(--accent-pink)'},
          {ref:volRef,val:volCount,label:'Active Volunteers',icon:'🙋‍♂️',color:'var(--primary-500)'},
          {ref:taskRef,val:taskCount,label:'Tasks Completed',icon:'✅',color:'var(--accent-highlight)'},
          {ref:ngoRef,val:ngoCount,label:'NGO Partners',icon:'🤝',color:'#fbbf24'}].map((m,i)=>(
          <div key={i} className="card-3d" style={{padding:'3rem 2rem',background:'var(--glass-bg)',backdropFilter:'blur(16px)',border:'1px solid var(--glass-border)'}}>
            <div style={{fontSize:'3rem',marginBottom:'1.5rem'}}>{m.icon}</div>
            <div style={{fontSize:'3.5rem',fontWeight:900,color:m.color,marginBottom:'0.5rem'}} ref={m.ref}>{m.val.toLocaleString()}+</div>
            <div style={{color:'var(--text-secondary)',fontWeight:700,fontSize:'0.9rem',textTransform:'uppercase',letterSpacing:'1px'}}>{m.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EcosystemSection() {
  return (
    <section id="ecosystem" className="dotted-bg" style={{position:'relative',padding:'8rem 2rem',maxWidth:'1400px',margin:'0 auto',overflow:'hidden'}}>
      {/* Decorative Aurora Blurs */}
      <div className="aurora-blur" style={{top:'-10%',right:'-5%',width:'500px',height:'500px',background:'rgba(249,115,22,0.12)',filter:'blur(120px)'}}/>
      <div className="aurora-blur" style={{bottom:'-10%',left:'-5%',width:'600px',height:'600px',background:'rgba(139,92,246,0.1)',filter:'blur(150px)'}}/>

      <div style={{textAlign:'center',marginBottom:'6rem',position:'relative',zIndex:1}} className="reveal">
        <h2 style={{fontSize:'4.5rem',fontWeight:900,marginBottom:'1rem',color:'white',letterSpacing:'-1px'}}>Intelligent Ecosystem</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'1.2rem',fontWeight:500}}>Powered by cutting-edge heuristics and empathy-driven UX.</p>
      </div>
      
      <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:'1.5rem',maxWidth:'1300px',margin:'0 auto',position:'relative',zIndex:1}}>
        <div className="bento-card reveal" style={{gridColumn:'span 6',gridRow:'span 2',display:'flex',flexDirection:'column'}}>
          <div style={{fontSize:'3rem',marginBottom:'2rem'}}>🔮</div>
          <h3 style={{fontSize:'2.5rem',fontWeight:800,marginBottom:'1.5rem',color:'white'}}>Predictive Needs Graph</h3>
          <p style={{color:'var(--text-secondary)',fontSize:'1.1rem',lineHeight:1.8,marginBottom:'2rem'}}>Leveraging historical climatic anomalies and socioeconomic shifts, the Vertex AI engine scales anticipated supply shortages before they impact marginalized communities.</p>
          <div style={{height:'220px',marginTop:'auto'}}>
             <Line 
               data={{
                 labels: ['','','','','','','','',''],
                 datasets: [{ 
                   data: [12, 18, 15, 22, 20, 28, 25, 32, 38], 
                   borderColor: '#f97316', 
                   tension: 0.4, 
                   borderWidth: 4, 
                   pointRadius: 0, 
                   fill: true,
                   backgroundColor: (context) => {
                     const ctx = context.chart.ctx;
                     const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                     gradient.addColorStop(0, 'rgba(249,115,22,0.1)');
                     gradient.addColorStop(1, 'rgba(249,115,22,0)');
                     return gradient;
                   }
                 }]
               }}
               options={{ maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{color:'rgba(255,255,255,0.03)'},ticks:{display:false}},y:{grid:{color:'rgba(255,255,255,0.03)'},ticks:{display:false}}} }}
             />
          </div>
        </div>

        <div className="bento-card reveal" style={{gridColumn:'span 3'}}>
          <div style={{fontSize:'2.5rem',marginBottom:'1.5rem'}}>🏆</div>
          <h3 style={{fontSize:'1.8rem',fontWeight:800,marginBottom:'1rem',color:'white'}}>Gamified Growth</h3>
          <p style={{color:'var(--text-secondary)',fontSize:'1rem',lineHeight:1.6,marginBottom:'2rem'}}>Rank up by aiding your community. Unlock exclusive blockchain badges.</p>
          <div style={{background:'rgba(2,6,23,0.4)',padding:'1.2rem',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1rem',fontSize:'0.9rem',fontWeight:800}}><span>Level 4: Hero</span><span style={{color:'var(--primary-500)'}}>1450 pts</span></div>
            <div style={{height:'10px',background:'rgba(255,255,255,0.08)',borderRadius:'99px',overflow:'hidden'}}><div style={{width:'72%',height:'100%',background:'linear-gradient(90deg,#f97316,#ec4899)'}}/></div>
          </div>
        </div>

        <div className="bento-card reveal" style={{gridColumn:'span 3'}}>
          <div style={{fontSize:'2.5rem',marginBottom:'1.5rem'}}>🌍</div>
          <h3 style={{fontSize:'1.8rem',fontWeight:800,marginBottom:'1rem',color:'white'}}>Multilingual Voice</h3>
          <p style={{color:'var(--text-secondary)',fontSize:'1rem',lineHeight:1.7}}>Real-time Dialogflow parsing across 15+ complex regional dialects bridging technological divide.</p>
        </div>

        <div className="bento-card reveal" style={{gridColumn:'span 6',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'2rem',marginTop:'-1.5rem'}}>
          <div style={{flex:1}}>
            <h3 style={{fontSize:'2rem',fontWeight:800,marginBottom:'0.5rem',color:'white'}}>Polygon Blockchain Identity</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'0.9rem',lineHeight:1.7}}>Your verified volunteer hours are securely minted as non-fungible certificates on the Polygon L2 network, preventing fraud and providing lifelong, transportable accreditation.</p>
          </div>
          <div style={{background:'rgba(2,6,23,0.5)',padding:'1.2rem 1.8rem',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:'1.2rem',minWidth:'280px'}}>
             <div style={{fontSize:'2.5rem'}}>🏅</div>
             <div>
               <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',fontWeight:800,textTransform:'uppercase',letterSpacing:'1px',marginBottom:'0.2rem'}}>Verified NFT Minted</div>
               <div style={{fontSize:'1.1rem',fontWeight:900,color:'white'}}>120h Community Service</div>
               <div style={{fontSize:'0.65rem',fontFamily:'monospace',color:'var(--primary-400)',marginTop:'0.2rem'}}>0x7f3a...b92e</div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveNeedsSection({ setShowAuthModal, currentUser, setShowDashboard }) {
  return (
    <section id="impact" className="dotted-bg" style={{padding:'8rem 2rem',maxWidth:'1400px',margin:'0 auto',position:'relative',overflow:'hidden'}}>
      {/* Decorative Aurora Blurs */}
      <div className="aurora-blur" style={{top:'10%',left:'-10%',width:'400px',height:'400px',background:'rgba(59,130,246,0.12)',filter:'blur(100px)'}}/>
      <div className="aurora-blur" style={{bottom:'5%',right:'-8%',width:'500px',height:'500px',background:'rgba(236,72,153,0.08)',filter:'blur(130px)'}}/>

      <div style={{textAlign:'center',marginBottom:'6rem',position:'relative',zIndex:1}} className="reveal">
        <h2 style={{fontSize:'4.5rem',fontWeight:900,marginBottom:'1rem',color:'white',letterSpacing:'-1px'}}>Live Needs & Social Impact</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'1.2rem',fontWeight:500}}>Real-time matching powered by TensorFlow.js and geospatial ML models.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:'2rem',maxWidth:'1300px',margin:'0 auto'}}>
        <div className="card-3d reveal" style={{padding:'3rem',background:'var(--glass-bg)',backdropFilter:'blur(16px)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'3rem'}}>
            <Activity color="#f97316" size={32} />
            <h3 style={{fontSize:'2rem',fontWeight:900,color:'white'}}>Active Action Requests</h3>
          </div>
          {LANDING_TASKS.map((t,i)=>(
            <div key={i} className="mission-item">
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1.2rem',alignItems:'center'}}>
                <span className={t.type === 'CRITICAL' ? 'tag-critical' : t.type === 'URGENT' ? 'tag-urgent' : 'tag-routine'} style={{fontSize:'0.75rem',fontWeight:900,padding:'0.3rem 0.8rem',borderRadius:'6px',textTransform:'uppercase',letterSpacing:'1px'}}>{t.type}</span>
                <span style={{color:'var(--accent-highlight)',fontWeight:900,fontSize:'0.95rem'}}>{t.score}% ML Match</span>
              </div>
              <h4 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'0.8rem',color:'white'}}>{t.title}</h4>
              <div style={{display:'flex',alignItems:'center',gap:'1.2rem',color:'var(--text-secondary)',fontSize:'0.9rem',marginBottom:'2rem'}}>
                <span>📍 {t.dist} away</span>
                <span>• Skills: {t.skills.join(', ')}</span>
              </div>
              <div style={{display:'flex',gap:'1rem'}}>
                <button style={{background:'#f97316',color:'white',padding:'1rem 2rem',borderRadius:'12px',fontWeight:800,border:'none',flex:1,cursor:'pointer'}} onClick={()=>currentUser ? setShowDashboard(true) : setShowAuthModal(true)}>Accept Mission</button>
                <button style={{width:'56px',height:'56px',background:'transparent',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center'}}><Compass size={24} color="white" /></button>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'2rem'}}>
          <div className="card-3d reveal" style={{background:'var(--glass-bg)',backdropFilter:'blur(16px)',padding:'2rem'}}>
            <h3 style={{fontSize:'1.8rem',fontWeight:800,marginBottom:'2.5rem',color:'white'}}>Community Impact Trajectory</h3>
            <div style={{height:'300px'}}>
              <Line 
                data={IMPACT_DATA} 
                options={{
                  maintainAspectRatio:false,
                  plugins:{legend:{display:false}},
                  scales:{
                    y:{grid:{color:'rgba(255,255,255,0.03)'},ticks:{color:'rgba(255,255,255,0.4)',font:{weight:700}}},
                    x:{grid:{display:false},ticks:{color:'rgba(255,255,255,0.4)',font:{weight:700}}}
                  }
                }}
              />
            </div>
          </div>

          <div className="card-3d reveal" style={{background:'rgba(15, 23, 42, 0.6)',backdropFilter:'blur(16px)',padding:'2rem'}}>
            <div style={{fontSize:'3rem',marginBottom:'1.5rem'}}>🏛️</div>
            <h3 style={{fontSize:'2rem',fontWeight:900,marginBottom:'1.2rem',color:'white'}}>Govt Scheme Eligibility AI</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'1rem',lineHeight:1.8,marginBottom:'2.5rem'}}>Our system automatically cross-references beneficiary needs with Direct Benefit Transfer (DBT) and Digital India portals.</p>
            <button style={{width:'100%',padding:'1.2rem',borderRadius:'14px',background:'transparent',border:'1px solid rgba(59,130,246,0.3)',color:'#60a5fa',fontWeight:800,fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.8rem'}}>
              <ShieldCheck size={22} /> Scan Beneficiary Profile
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function LeaderboardSection() {
  return (
    <section id="leaderboard" style={{padding:'8rem 2rem',maxWidth:'1400px',margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:'6rem'}} className="reveal">
        <h2 style={{fontSize:'4rem',fontWeight:900,marginBottom:'1rem',color:'white'}}>Volunteer Leaderboard</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'1.2rem'}}>Top contributors making the most impact this month.</p>
      </div>
      <div className="card-3d reveal" style={{padding:0,overflow:'hidden',maxWidth:'1000px',margin:'0 auto',background:'var(--glass-bg)',backdropFilter:'blur(16px)'}}>
        {LEADERBOARD_DATA.map((v,i)=>(
          <div key={i} className="leaderboard-row" style={{background:i===3?'rgba(249,115,22,0.08)':'transparent'}}>
            <div style={{display:'flex',alignItems:'center',gap:'2rem'}}>
              <div style={{width:'40px',height:'40px',background:i<3?'rgba(59,130,246,0.1)':'transparent',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:i<3?'1.5rem':'1rem',fontWeight:900,color:'#3b82f6'}}>
                {i<3 ? <Award size={24} /> : i+1}
              </div>
              <div>
                <div style={{fontWeight:800,fontSize:'1.2rem',color:'white'}}>{v.name} {i===3&&<span style={{background:'var(--primary-500)',color:'white',padding:'0.2rem 0.6rem',borderRadius:'6px',fontSize:'0.75rem',marginLeft:'0.8rem',fontWeight:900}}>YOU</span>}</div>
                <div style={{fontSize:'0.9rem',color:'var(--text-secondary)',fontWeight:600}}>{v.city}</div>
              </div>
            </div>
            <div style={{fontWeight:900,fontSize:'1.3rem',color:'var(--primary-500)'}}>{v.pts.toLocaleString()} pts</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StoriesSection() {
  return (
    <section id="stories" style={{padding:'8rem 2rem',maxWidth:'1400px',margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:'6rem'}} className="reveal">
        <h2 style={{fontSize:'4rem',fontWeight:900,marginBottom:'1rem',color:'white'}}>Success Stories</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'1.2rem'}}>Real voices from the communities we serve.</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:'2rem',maxWidth:'1300px',margin:'0 auto'}}>
        {TESTIMONIALS.map((t,i)=>(
          <motion.div key={i} whileHover={{y:-10}} className="card-3d reveal" style={{display:'flex',flexDirection:'column',padding:'3rem',background:'var(--glass-bg)',backdropFilter:'blur(16px)'}}>
            <div style={{display:'flex',gap:'0.4rem',marginBottom:'2rem'}}>
              {Array.from({length:t.rating}).map((_,j)=><Star key={j} size={20} fill="#f97316" color="#f97316"/>)}
            </div>
            <p style={{color:'var(--text-secondary)',fontStyle:'italic',flex:1,lineHeight:1.9,marginBottom:'2.5rem',fontSize:'1.1rem'}}>"{t.text}"</p>
            <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:'2rem'}}>
              <div style={{fontWeight:900,fontSize:'1.2rem',color:'white'}}>{t.name}</div>
              <div style={{fontSize:'0.95rem',color:'var(--text-secondary)',fontWeight:700}}>{t.role}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CtaSection({ setShowAuthModal }) {
  return (
    <section id="cta" style={{padding:'8rem 2rem',textAlign:'center'}}>
      <div className="card-3d reveal" style={{padding:'5rem 2rem',borderRadius:'40px',background:'linear-gradient(135deg,#f97316,#ec4899)',color:'white',maxWidth:'1000px',margin:'0 auto',position:'relative',overflow:'hidden',border:'none'}}>
        <div style={{position:'absolute',inset:0,opacity:0.1,backgroundImage:'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',backgroundSize:'32px 32px'}}/>
        <div style={{position:'relative',zIndex:2}}>
          <h2 style={{fontSize:'clamp(2.5rem, 6vw, 4.5rem)',fontWeight:900,marginBottom:'1.5rem'}}>Ready to Create Real Impact?</h2>
          <p style={{fontSize:'1.3rem',opacity:0.9,maxWidth:'600px',margin:'0 auto 3rem',lineHeight:1.6}}>Join 10,000+ volunteers already changing lives every day. Setup takes less than 2 minutes.</p>
          <button className="btn-magic" style={{background:'white',color:'var(--primary-500)',padding:'1.2rem 3rem',fontSize:'1.2rem',fontWeight:800,boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}} onClick={() => setShowAuthModal(true)}>🚀 Get Started — It's Free</button>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showDashboard, setShowDashboard] = useState(() => localStorage.getItem('showDashboard') === 'true');
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'overview');

  const cursorRef = useRef(null)
  const blobRef = useRef(null)
  const [sosActive, setSosActive] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [toasts, setToasts] = useState([])
  const [acceptedTasks, setAcceptedTasks] = useState({})
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [showSosModal, setShowSosModal] = useState(false)
  const [showHostProfile, setShowHostProfile] = useState(null)
  const [emergencyMissions, setEmergencyMissions] = useState([])
  const [checkInTime, setCheckInTime] = useState(null)
  const [activeSessionSecs, setActiveSessionSecs] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [accumulatedSecs, setAccumulatedSecs] = useState(0)
  const [timestamps, setTimestamps] = useState([])

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('showDashboard', showDashboard); }, [showDashboard]);
  useEffect(() => { localStorage.setItem('activeTab', activeTab); }, [activeTab]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data());
        } else {
          setCurrentUser(null);
          setShowDashboard(false);
        }
      } else {
        setCurrentUser(null);
        setShowDashboard(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'emergency_missions'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const missions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmergencyMissions(missions);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let interval;
    if (checkInTime && !isPaused) {
      interval = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - checkInTime) / 1000);
        setActiveSessionSecs(accumulatedSecs + currentElapsed);
      }, 1000);
    } else {
      setActiveSessionSecs(accumulatedSecs);
    }
    return () => clearInterval(interval);
  }, [checkInTime, isPaused, accumulatedSecs]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = authLoading || showSplash;

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleSos = () => {
    if (navigator.vibrate) navigator.vibrate([100,50,100,50,200]);
    setShowSosModal(true);
  }

  const [isSosSubmitting, setIsSosSubmitting] = useState(false);
  const handleSosSubmit = async (missionData) => {
    if (isSosSubmitting) return;
    setIsSosSubmitting(true);
    try {
      await addDoc(collection(db, 'emergency_missions'), {
        ...missionData,
        timestamp: serverTimestamp(),
        senderId: currentUser?.uid || 'anon'
      });
      setShowSosModal(false);
      setSosActive(true);
      addToast('🚨 SOS Broadcasted! Every user is being notified.', 'error');
      setTimeout(() => setSosActive(false), 8000);
    } catch (error) {
      addToast('Failed to broadcast SOS', 'error');
    } finally {
      setIsSosSubmitting(false);
    }
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setShowAuthModal(false);
    setShowDashboard(true);
    localStorage.setItem('showDashboard', 'true');
  };

  const handleMissionAccept = (title, taskId) => {
    setAcceptedTasks(prev => ({ ...prev, [taskId]: true }));
    addToast(`✅ Accepted: ${title}`, 'success');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setTimeout(() => {
        setCurrentUser(null);
        setShowDashboard(false);
        localStorage.removeItem('showDashboard');
        addToast('👋 Logged out successfully', 'info');
      }, 300);
    } catch (error) { addToast('Error logging out', 'error'); }
  };

  const handleProfileUpdate = async (updated) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, updated, { merge: true });
      setCurrentUser(updated);
      addToast('✅ Profile updated successfully', 'success');
    } catch (error) { addToast('Failed to update profile', 'error'); }
  };

  useEffect(() => {
    if (isLoading) return;
    const updateObserver = () => {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active') });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
      document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
      return obs;
    };
    const obs = updateObserver();
    const timer = setTimeout(updateObserver, 100);
    return () => { obs.disconnect(); clearTimeout(timer); };
  }, [isLoading, showDashboard]);

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
  }, []);

  if (isLoading) return <SplashScreen />

  return (
    <>
      <div className="cosmic-layer" />
      <div className="particles" />
      <div className="aurora-blur" style={{top:'10%',left:'20%',width:'500px',height:'500px',background:'var(--accent-highlight)'}}/>
      <div className="aurora-blur" style={{bottom:'0%',right:'10%',width:'600px',height:'600px',background:'var(--primary-500)',animationDelay:'-4s'}}/>
      
      <div ref={blobRef} className="cursor-blob" />
      <div ref={cursorRef} className="cursor-trail" />

      <div className="app-container">
        <svg className="bg-svg" preserveAspectRatio="none">
          <path d="M-100,500 Q400,100 900,600 T2000,300" className="path-line"/>
          <path d="M-100,200 Q300,700 1000,100 T2000,500" className="path-line" style={{animationDuration:'12s',stroke:'var(--accent-pink)'}}/>
        </svg>

        <Navbar 
          theme={theme} setTheme={setTheme} handleSos={handleSos} 
          currentUser={currentUser} showDashboard={showDashboard}
          setShowDashboard={setShowDashboard} setShowProfile={setShowProfile} 
          setShowAuthModal={setShowAuthModal} activeSessionSecs={activeSessionSecs}
          isCheckingIn={!!checkInTime || accumulatedSecs > 0}
          onCheckOut={() => {}} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}
          onNavigateBack={() => {
            if (showProfile) setShowProfile(false);
            else if (showDashboard) { if (activeTab !== 'overview') setActiveTab('overview'); else setShowDashboard(false); }
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        <AnimatePresence>
          {showAuthModal && <AuthModal onClose={()=>setShowAuthModal(false)} onLogin={handleLogin} addToast={addToast} theme={theme}/>}
          {showSosModal && <SosModal user={currentUser} onClose={() => setShowSosModal(false)} onSubmit={handleSosSubmit} isLoading={isSosSubmitting} />}
          {showHostProfile && <HostProfileModal host={showHostProfile} onClose={() => setShowHostProfile(null)} />}
          {showProfile && currentUser && <ProfilePanel user={currentUser} onClose={() => setShowProfile(false)} onUpdate={handleProfileUpdate} addToast={addToast} onLogout={handleLogout} />}
        </AnimatePresence>

        <AnimatePresence>
          {!showDashboard || !currentUser ? (
            <motion.main key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'relative', paddingTop: '100px' }}>
              <Hero setShowAuthModal={setShowAuthModal} />
              <ImpactSection />
              <EcosystemSection />
              <LiveNeedsSection setShowAuthModal={setShowAuthModal} currentUser={currentUser} setShowDashboard={setShowDashboard} />
              <LeaderboardSection />
              <StoriesSection />
              <CtaSection setShowAuthModal={setShowAuthModal} />

              <footer style={{marginTop:'100px',borderTop:'1px solid rgba(255,255,255,0.05)',padding:'4rem 2rem'}}>
                <div style={{maxWidth:'1200px',margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'3rem'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'1rem'}}>
                      <style>{`[data-theme="dark"] .app-logo { filter: invert(1) brightness(2) contrast(1.2) drop-shadow(0 0 15px rgba(255,255,255,0.4)) !important; }`}</style>
                      <img src="/CC_LOGO.png" alt="Logo" className="app-logo" style={{ height: '42px', width: 'auto', cursor: 'pointer' }} /><span style={{fontWeight:800}}>CommunityConnect</span>
                    </div>
                    <p style={{color:'var(--text-secondary)',fontSize:'0.9rem',lineHeight:1.6}}>AI-powered volunteer coordination built for Google Solution Challenge 2026.</p>
                  </div>
                  <div><h4 style={{marginBottom:'1rem'}}>Platform</h4><div style={{display:'flex',flexDirection:'column',gap:'0.5rem',fontSize:'0.9rem',color:'var(--text-secondary)'}}><a href="#platform" style={{color:'inherit',textDecoration:'none'}}>Missions</a><a href="#impact" style={{color:'inherit',textDecoration:'none'}}>Impact Hub</a><a href="#stories" style={{color:'inherit',textDecoration:'none'}}>Stories</a></div></div>
                  <div><h4 style={{marginBottom:'1rem'}}>Connect</h4><div style={{display:'flex',flexDirection:'column',gap:'0.5rem',fontSize:'0.9rem',color:'var(--text-secondary)'}}><a href="#" style={{color:'inherit',textDecoration:'none'}}>Twitter</a><a href="#" style={{color:'inherit',textDecoration:'none'}}>GitHub</a><a href="#" style={{color:'inherit',textDecoration:'none'}}>LinkedIn</a></div></div>
                </div>
              </footer>
            </motion.main>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              {currentUser.role === 'NGO' ? (
                <NgoDashboard user={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} addToast={addToast} onTriggerSos={handleSosSubmit} theme={theme} setTheme={setTheme} onLogout={handleLogout} onOpenProfile={() => setShowProfile(true)} />
              ) : (
                <VolunteerDashboard user={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} addToast={addToast} acceptedTasks={acceptedTasks} onMissionAccept={handleMissionAccept} theme={theme} setTheme={setTheme} onLogout={handleLogout} onOpenProfile={() => setShowProfile(true)} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
        </AnimatePresence>

        {sosActive && <div className="sos-overlay" />}
        {voiceActive && <div className="voice-wave-container"><div className="voice-wave" /><div className="voice-text">{voiceText}</div></div>}
      </div>
    </>
  )
}

export default App;
