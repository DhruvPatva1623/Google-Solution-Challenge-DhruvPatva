import { useState, useEffect, useRef, useMemo } from 'react'
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
import { OrgAuthModal } from './components/auth/OrgAuthModal';
import { PolicyModal } from './components/auth/PolicyModal';
import { VolunteerDashboard } from './components/dashboard/VolunteerDashboard';
import { NgoDashboard } from './components/dashboard/NgoDashboard';
import { ProfilePanel } from './components/dashboard/ProfilePanel';
import { Hero } from './components/landing/Hero';
import { SosModal } from './components/common/SosModal';
import { SessionController } from './components/common/SessionController';
import { HostProfileModal } from './components/common/HostProfileModal';
import TaskMap from './components/common/TaskMap';
import { useBroadcastListener } from './components/org/BroadcastButton';

// Data
import { IMPACT_DATA, LANDING_TASKS, LEADERBOARD_DATA, TESTIMONIALS, GOVT_SCHEMES } from './constants/data';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

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
        <h2 style={{fontSize:'4.5rem',fontWeight:900,marginBottom:'1rem',color:'var(--text-primary)',letterSpacing:'-1px'}}>Intelligent Ecosystem</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'1.2rem',fontWeight:500}}>Powered by cutting-edge heuristics and empathy-driven UX.</p>
      </div>
      
      <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:'1.5rem',maxWidth:'1300px',margin:'0 auto',position:'relative',zIndex:1}}>
        <div className="card-3d reveal" style={{gridColumn:'span 6',gridRow:'span 2',display:'flex',flexDirection:'column',background:'var(--glass-bg)',backdropFilter:'blur(16px)'}}>
          <div style={{fontSize:'3rem',marginBottom:'2rem'}}>🔮</div>
          <h3 style={{fontSize:'2.5rem',fontWeight:800,marginBottom:'1.5rem',color:'var(--text-primary)'}}>Predictive Needs Graph</h3>
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
               options={{ maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{color:'var(--border-light)'},ticks:{display:false}},y:{grid:{color:'var(--border-light)'},ticks:{display:false}}} }}
             />
          </div>
        </div>

        <div className="card-3d reveal" style={{gridColumn:'span 3',background:'var(--glass-bg)',backdropFilter:'blur(16px)'}}>
          <div style={{fontSize:'2.5rem',marginBottom:'1.5rem'}}>🏆</div>
          <h3 style={{fontSize:'1.8rem',fontWeight:800,marginBottom:'1rem',color:'var(--text-primary)'}}>Gamified Growth</h3>
          <p style={{color:'var(--text-secondary)',fontSize:'1rem',lineHeight:1.6,marginBottom:'2rem'}}>Rank up by aiding your community. Unlock exclusive blockchain badges.</p>
          <div style={{background:'var(--bg-secondary)',padding:'1.2rem',borderRadius:'20px',border:'1px solid var(--border-light)'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1rem',fontSize:'0.9rem',fontWeight:800,color:'var(--text-primary)'}}><span>Level 4: Hero</span><span style={{color:'var(--primary-500)'}}>1450 pts</span></div>
            <div style={{height:'10px',background:'rgba(15,23,42,0.08)',borderRadius:'99px',overflow:'hidden'}}><div style={{width:'72%',height:'100%',background:'linear-gradient(90deg,#f97316,#ec4899)'}}/></div>
          </div>
        </div>

        <div className="card-3d reveal" style={{gridColumn:'span 3',background:'var(--glass-bg)',backdropFilter:'blur(16px)'}}>
          <div style={{fontSize:'2.5rem',marginBottom:'1.5rem'}}>🌍</div>
          <h3 style={{fontSize:'1.8rem',fontWeight:800,marginBottom:'1rem',color:'var(--text-primary)'}}>Multilingual Voice</h3>
          <p style={{color:'var(--text-secondary)',fontSize:'1rem',lineHeight:1.7}}>Real-time Dialogflow parsing across 15+ complex regional dialects bridging technological divide.</p>
        </div>

        <div className="card-3d reveal" style={{gridColumn:'span 6',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'2rem',marginTop:'-1.5rem',background:'var(--glass-bg)',backdropFilter:'blur(16px)'}}>
          <div style={{flex:1}}>
            <h3 style={{fontSize:'2rem',fontWeight:800,marginBottom:'0.5rem',color:'var(--text-primary)'}}>Polygon Blockchain Identity</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'0.9rem',lineHeight:1.7}}>Your verified volunteer hours are securely minted as non-fungible certificates on the Polygon L2 network, preventing fraud and providing lifelong, transportable accreditation.</p>
          </div>
          <div style={{background:'var(--bg-secondary)',padding:'1.2rem 1.8rem',borderRadius:'20px',border:'1px solid var(--border-light)',display:'flex',alignItems:'center',gap:'1.2rem',minWidth:'280px'}}>
             <div style={{fontSize:'2.5rem'}}>🏅</div>
             <div>
               <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',fontWeight:800,textTransform:'uppercase',letterSpacing:'1px',marginBottom:'0.2rem'}}>Verified NFT Minted</div>
               <div style={{fontSize:'1.1rem',fontWeight:900,color:'var(--text-primary)'}}>120h Community Service</div>
               <div style={{fontSize:'0.65rem',fontFamily:'monospace',color:'var(--primary-400)',marginTop:'0.2rem'}}>0x7f3a...b92e</div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MapSection({ theme, currentUser, setShowDashboard, setShowAuthModal, tasks }) {
  return (
    <section id="map-explore" className="dotted-bg" style={{padding:'6rem 2rem 2rem',maxWidth:'1400px',margin:'0 auto',position:'relative',overflow:'hidden'}}>
      <div className="reveal" style={{textAlign:'center',marginBottom:'4rem'}}>
        <h2 style={{fontSize:'4.5rem',fontWeight:900,marginBottom:'1rem',color:'var(--text-primary)',letterSpacing:'-1px'}}>Interactive Geo-Impact Map</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'1.2rem',fontWeight:500,maxWidth:'650px',margin:'0 auto'}}>Explore ongoing volunteer projects and real-time community needs in your city. Select map details to filter transit networks or active crisis overlays.</p>
      </div>
      <div className="reveal" style={{ maxWidth: '1300px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <TaskMap 
          theme={theme}
          tasks={tasks} 
          userLocation={[23.0225, 72.5714]} 
          onAcceptTask={() => currentUser ? setShowDashboard(true) : setShowAuthModal(true)}
          height="520px"
        />
      </div>
    </section>
  );
}

function LiveNeedsSection({ setShowAuthModal, currentUser, setShowDashboard, tasks, setActiveTab }) {
  const displayTasks = useMemo(() => {
    return (tasks || LANDING_TASKS).slice(0, 3);
  }, [tasks]);

  return (
    <section id="impact" className="dotted-bg" style={{padding:'8rem 2rem',maxWidth:'1400px',margin:'0 auto',position:'relative',overflow:'hidden'}}>
      {/* Decorative Aurora Blurs */}
      <div className="aurora-blur" style={{top:'10%',left:'-10%',width:'400px',height:'400px',background:'rgba(59,130,246,0.12)',filter:'blur(100px)'}}/>
      <div className="aurora-blur" style={{bottom:'5%',right:'-8%',width:'500px',height:'500px',background:'rgba(236,72,153,0.08)',filter:'blur(130px)'}}/>

      <div style={{textAlign:'center',marginBottom:'6rem',position:'relative',zIndex:1}} className="reveal">
        <h2 style={{fontSize:'4.5rem',fontWeight:900,marginBottom:'1rem',color:'var(--text-primary)',letterSpacing:'-1px'}}>Live Needs & Social Impact</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'1.2rem',fontWeight:500}}>Real-time matching powered by TensorFlow.js and geospatial ML models.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:'2rem',maxWidth:'1300px',margin:'0 auto'}}>
        <div className="card-3d reveal" style={{padding:'3rem',background:'var(--glass-bg)',backdropFilter:'blur(16px)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'3rem'}}>
            <Activity color="#f97316" size={32} />
            <h3 style={{fontSize:'2rem',fontWeight:900,color:'var(--text-primary)'}}>Active Action Requests</h3>
          </div>
          {displayTasks.map((t,i)=>(
            <div key={i} className="mission-item" style={{background:'var(--bg-secondary)',border:'1px solid var(--border-light)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1.2rem',alignItems:'center'}}>
                <span className={t.type === 'CRITICAL' ? 'tag-critical' : t.type === 'URGENT' ? 'tag-urgent' : 'tag-routine'} style={{fontSize:'0.75rem',fontWeight:900,padding:'0.3rem 0.8rem',borderRadius:'6px',textTransform:'uppercase',letterSpacing:'1px'}}>{t.type}</span>
                <span style={{color:'var(--accent-highlight)',fontWeight:900,fontSize:'0.95rem'}}>{t.score}% ML Match</span>
              </div>
              <h4 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'0.8rem',color:'var(--text-primary)'}}>{t.title}</h4>
              <div style={{display:'flex',alignItems:'center',gap:'1.2rem',color:'var(--text-secondary)',fontSize:'0.9rem',marginBottom:'2rem'}}>
                <span>📍 {t.dist} away</span>
                <span>• Skills: {t.skills.join(', ')}</span>
              </div>
              <div style={{display:'flex',gap:'1rem'}}>
                <button style={{background:'#f97316',color:'white',padding:'1rem 2rem',borderRadius:'12px',fontWeight:800,border:'none',flex:1,cursor:'pointer'}} onClick={()=>currentUser ? setShowDashboard(true) : setShowAuthModal(true)}>Accept Mission</button>
                <button style={{width:'56px',height:'56px',background:'transparent',border:'1px solid var(--border-light)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center'}}><Compass size={24} color="var(--text-primary)" /></button>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'2rem'}}>
          <div className="card-3d reveal" style={{background:'var(--glass-bg)',backdropFilter:'blur(16px)',padding:'2rem'}}>
            <h3 style={{fontSize:'1.8rem',fontWeight:800,marginBottom:'2.5rem',color:'var(--text-primary)'}}>Community Impact Trajectory</h3>
            <div style={{height:'300px'}}>
              <Line 
                data={IMPACT_DATA} 
                options={{
                  maintainAspectRatio:false,
                  plugins:{legend:{display:false}},
                  scales:{
                    y:{grid:{color:'var(--border-light)'},ticks:{color:'var(--text-secondary)',font:{weight:700}}},
                    x:{grid:{display:false},ticks:{color:'var(--text-secondary)',font:{weight:700}}}
                  }
                }}
              />
            </div>
          </div>

          <div className="card-3d reveal" style={{background:'var(--glass-bg)',backdropFilter:'blur(16px)',padding:'2rem',border:'1px solid var(--border-light)'}}>
            <div style={{fontSize:'3rem',marginBottom:'1.5rem'}}>🏛️</div>
            <h3 style={{fontSize:'2rem',fontWeight:900,marginBottom:'1.2rem',color:'var(--text-primary)'}}>Government Schemes & Portals</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'1rem',lineHeight:1.8,marginBottom:'2.5rem'}}>Quick lookup for official Indian Government welfare schemes (PM-KISAN, Ayushman Bharat, MGNREGA, etc.) with real, working external portal links.</p>
            <button 
              onClick={() => {
                if (currentUser) {
                  setActiveTab('schemes');
                  setShowDashboard(true);
                } else {
                  setShowAuthModal(true);
                }
              }}
              style={{width:'100%',padding:'1.2rem',borderRadius:'14px',background:'transparent',border:'1px solid rgba(59,130,246,0.3)',color:'#60a5fa',fontWeight:800,fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.8rem',cursor:'pointer'}}
            >
              <ShieldCheck size={22} /> View Schemes Directory
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function LeaderboardSection({ currentUser }) {
  const leaderboard = useMemo(() => {
    if (!currentUser || currentUser.role === 'ngo') {
      return LEADERBOARD_DATA.map(v => ({ ...v, isMe: false }));
    }
    const base = [
      { name: 'Anjali Desai', city: 'Surat', pts: 4820 },
      { name: 'Rahul Verma', city: 'Delhi', pts: 3950 },
      { name: 'Ananya Iyer', city: 'Bangalore', pts: 3100 },
      { name: currentUser.name || 'You', city: currentUser.city || 'Your City', pts: currentUser.points || 0, isMe: true },
      { name: 'Kamal Singh', city: 'Jaipur', pts: 1200 },
    ];
    const sorted = [...base].sort((a, b) => b.pts - a.pts);
    return sorted.map((v, i) => ({
      ...v,
      badge: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`,
      rank: i + 1
    }));
  }, [currentUser]);

  return (
    <section id="leaderboard" style={{padding:'8rem 2rem',maxWidth:'1400px',margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:'6rem'}} className="reveal">
        <h2 style={{fontSize:'4rem',fontWeight:900,marginBottom:'1rem',color:'var(--text-primary)'}}>Volunteer Leaderboard</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'1.2rem'}}>Top contributors making the most impact this month.</p>
      </div>
      <div className="card-3d reveal" style={{padding:0,overflow:'hidden',maxWidth:'1000px',margin:'0 auto',background:'var(--glass-bg)',backdropFilter:'blur(16px)'}}>
        {leaderboard.map((v,i)=>(
          <div key={i} className="leaderboard-row" style={{background:v.isMe?'rgba(249,115,22,0.08)':'transparent'}}>
            <div style={{display:'flex',alignItems:'center',gap:'2rem'}}>
              <div style={{width:'40px',height:'40px',background:i<3?'rgba(59,130,246,0.1)':'transparent',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:i<3?'1.5rem':'1rem',fontWeight:900,color:'#3b82f6'}}>
                {i<3 ? <Award size={24} /> : i+1}
              </div>
              <div>
                <div style={{fontWeight:800,fontSize:'1.2rem',color:'var(--text-primary)'}}>
                  {v.name} 
                  {v.isMe && <span style={{background:'var(--primary-500)',color:'white',padding:'0.2rem 0.6rem',borderRadius:'6px',fontSize:'0.75rem',marginLeft:'0.8rem',fontWeight:900}}>YOU</span>}
                </div>
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
        <h2 style={{fontSize:'4rem',fontWeight:900,marginBottom:'1rem',color:'var(--text-primary)'}}>Success Stories</h2>
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
              <div style={{fontWeight:900,fontSize:'1.2rem',color:'var(--text-primary)'}}>{t.name}</div>
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

  const [sosActive, setSosActive] = useState(false)
  const [voiceActive, setVoiceActive] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [toasts, setToasts] = useState([])
  const [acceptedTasks, setAcceptedTasks] = useState({})
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showOrgAuthModal, setShowOrgAuthModal] = useState(false)
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
  const [opacity, setOpacity] = useState(100);
  const [dbMissions, setDbMissions] = useState([]);

  useEffect(() => {
    try {
      const q = query(collection(db, 'missions'));
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
            orgName: data.orgName || 'NGO Partner',
            orgId: data.orgId || ''
          };
        });
        setDbMissions(list);
      }, (err) => {
        console.warn("Missions snapshot subscription failed:", err);
      });
      return unsub;
    } catch (e) {
      console.warn("Missions snapshot query initialization failed:", e);
    }
  }, []);

  const combinedLandingTasks = useMemo(() => {
    return [...dbMissions, ...LANDING_TASKS];
  }, [dbMissions]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('showDashboard', showDashboard); }, [showDashboard]);
  useEffect(() => { localStorage.setItem('activeTab', activeTab); }, [activeTab]);

  useEffect(() => {
    let unsubUser = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      unsubUser();
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        unsubUser = onSnapshot(userRef, async (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser(userData);
            localStorage.setItem('currentUser', JSON.stringify(userData));
          } else {
            // Check organizers
            const orgDoc = await getDoc(doc(db, 'organizers', user.uid));
            if (orgDoc.exists()) {
              const orgData = orgDoc.data();
              const orgUser = {
                uid: orgData.companyId, userId: orgData.companyId,
                name: orgData.contactName || orgData.orgName,
                email: orgData.contactEmail,
                role: 'ngo', org: orgData.orgName, orgType: orgData.orgType,
                city: orgData.area, companyId: orgData.companyId, companyName: orgData.orgName,
                policiesAccepted: true, regId: orgData.companyId
              };
              setCurrentUser(orgUser);
              localStorage.setItem('currentUser', JSON.stringify(orgUser));
            } else {
              const localUser = localStorage.getItem('currentUser');
              if (localUser) {
                setCurrentUser(JSON.parse(localUser));
              } else {
                setCurrentUser(null);
                setShowDashboard(false);
              }
            }
          }
        }, (err) => {
          console.warn("User document snapshot listener failed:", err);
        });
      } else {
        const localUser = localStorage.getItem('currentUser');
        if (localUser) {
          try {
            setCurrentUser(JSON.parse(localUser));
          } catch (_) {
            setCurrentUser(null);
            setShowDashboard(false);
          }
        } else {
          setCurrentUser(null);
          setShowDashboard(false);
        }
      }
      setAuthLoading(false);
    });
    return () => {
      unsubscribeAuth();
      unsubUser();
    };
  }, []);

  // Sync broadcasts to notifications toast
  useBroadcastListener(currentUser, addToast, (data) => {
    setShowDashboard(true);
    setActiveTab('missions');
  });

  useEffect(() => {
    let dbMissionsList = [];

    const updateCombinedSOS = (firebaseSOS) => {
      dbMissionsList = firebaseSOS;
      let localSOS = [];
      try {
        localSOS = JSON.parse(localStorage.getItem('cc_local_emergencies') || '[]');
      } catch (_) {}
      
      const combined = [...dbMissionsList];
      localSOS.forEach(localItem => {
        if (!combined.some(item => item.topic === localItem.topic && Math.abs(new Date(item.timestamp) - new Date(localItem.timestamp)) < 10000)) {
          combined.push(localItem);
        }
      });
      combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setEmergencyMissions(combined.slice(0, 10));
    };

    let unsubscribeFirestore = () => {};
    try {
      const q = query(collection(db, 'emergency_missions'), orderBy('timestamp', 'desc'), limit(10));
      unsubscribeFirestore = onSnapshot(q, (snapshot) => {
        const missions = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp
          };
        });
        updateCombinedSOS(missions);
      }, (err) => {
        console.warn("Firestore SOS listener blocked, loading local emergencies:", err);
        updateCombinedSOS([]);
      });
    } catch (err) {
      console.warn("Firestore query failed:", err);
      updateCombinedSOS([]);
    }

    const handleStorageChange = () => {
      updateCombinedSOS(dbMissionsList);
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribeFirestore();
      window.removeEventListener('storage', handleStorageChange);
    };
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

  const addToast = (message, type = 'success', onClick = null) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, onClick }]);
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
    const localData = {
      ...missionData,
      id: 'local-sos-' + Date.now(),
      timestamp: new Date().toISOString(),
      senderId: currentUser?.uid || 'anon',
      org: currentUser?.org || currentUser?.name || 'NGO'
    };

    try {
      await addDoc(collection(db, 'emergency_missions'), {
        ...missionData,
        timestamp: serverTimestamp(),
        senderId: currentUser?.uid || 'anon',
        org: currentUser?.org || currentUser?.name || 'NGO'
      });
      setShowSosModal(false);
      setSosActive(true);
      addToast('🚨 SOS Broadcasted! Every user is being notified.', 'error');
      setTimeout(() => setSosActive(false), 8000);
    } catch (error) {
      console.warn("Firestore SOS write failed, falling back to localStorage:", error);
      try {
        const localSOS = JSON.parse(localStorage.getItem('cc_local_emergencies') || '[]');
        localSOS.unshift(localData);
        localStorage.setItem('cc_local_emergencies', JSON.stringify(localSOS.slice(0, 20)));
        window.dispatchEvent(new Event('storage'));
        
        setShowSosModal(false);
        setSosActive(true);
        addToast('🚨 SOS Broadcasted (Local fallback)! Every user is being notified.', 'error');
        setTimeout(() => setSosActive(false), 8000);
      } catch (e) {
        addToast('Failed to broadcast SOS', 'error');
      }
    } finally {
      setIsSosSubmitting(false);
    }
  };

  const handleLogin = (userData, stayLoggedIn) => {
    setCurrentUser(userData);
    setShowDashboard(true);
    setShowAuthModal(false);
    setShowOrgAuthModal(false);
    if (stayLoggedIn) {
      localStorage.setItem('showDashboard', 'true');
      localStorage.setItem('currentUser', JSON.stringify(userData));
    } else {
      localStorage.removeItem('showDashboard');
      localStorage.removeItem('currentUser');
    }
    addToast(`👋 Welcome back, ${userData.name}!`, 'success');
  };

  const handleMissionAccept = async (title, taskId) => {
    setAcceptedTasks(prev => ({ ...prev, [taskId]: true }));
    addToast(`✅ Accepted Mission: ${title}`, 'success');

    if (typeof taskId === 'string') {
      try {
        const missionRef = doc(db, 'missions', taskId);
        const docSnap = await getDoc(missionRef);
        if (docSnap.exists()) {
          const currentVols = docSnap.data().volunteers || 0;
          await updateDoc(missionRef, {
            volunteers: currentVols + 1
          });
          addToast(`👥 Joined roster for "${title}"!`, 'info');
        }
      } catch (err) {
        console.warn("Failed to update volunteer count in Firestore:", err);
      }
    }
  };

  const handleCheckIn = () => {
    if (!currentUser) return;
    setCheckInTime(Date.now());
    setIsPaused(false);
    setAccumulatedSecs(0);
    setActiveSessionSecs(0);
    setTimestamps([]);
    addToast('🎯 Checked in! Your service hours are now being recorded live.', 'success');
  };

  const handlePause = () => {
    if (!checkInTime) return;
    const elapsed = Math.floor((Date.now() - checkInTime) / 1000);
    setAccumulatedSecs(prev => prev + elapsed);
    setCheckInTime(null);
    setIsPaused(true);
    addToast('⏸️ Session paused', 'info');
  };

  const handleResume = () => {
    setCheckInTime(Date.now());
    setIsPaused(false);
    addToast('▶️ Session resumed', 'success');
  };

  const handleAddTimestamp = () => {
    const current = activeSessionSecs;
    setTimestamps(prev => [current, ...prev]);
    addToast(`⏰ Marker added at ${Math.floor(current / 60)}m ${current % 60}s`, 'info');
  };

  const handleCheckOut = async () => {
    const finalSecs = activeSessionSecs;
    const finalHours = parseFloat((finalSecs / 3600).toFixed(2));
    const earnedPoints = Math.round(finalHours * 100);

    setCheckInTime(null);
    setIsPaused(false);
    setAccumulatedSecs(0);
    setActiveSessionSecs(0);
    setTimestamps([]);

    if (finalHours <= 0) {
      addToast('⏹️ Checked out. No hours recorded (session was too short).', 'info');
      return;
    }

    addToast(`⏹️ Checking out... Logging ${finalHours} hours to database.`, 'info');

    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        volunteerHours: parseFloat(((currentUser.volunteerHours || 0) + finalHours).toFixed(2)),
        points: (currentUser.points || 0) + earnedPoints,
        history: [
          {
            id: Date.now(),
            title: 'Community Support Session',
            date: new Date().toISOString().split('T')[0],
            hrs: finalHours,
            pts: earnedPoints,
            status: 'Completed'
          },
          ...(currentUser.history || [])
        ]
      };

      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      try {
        const users = JSON.parse(localStorage.getItem('cc_local_users') || '[]');
        const filtered = users.filter(u => u.uid !== updatedUser.uid && u.userId !== updatedUser.userId);
        filtered.push(updatedUser);
        localStorage.setItem('cc_local_users', JSON.stringify(filtered));
      } catch (_) {}

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
          volunteerHours: updatedUser.volunteerHours,
          points: updatedUser.points,
          history: updatedUser.history
        }, { merge: true });
        addToast(`🎉 Logged ${finalHours} hrs successfully! Earned +${earnedPoints} pts!`, 'success');
      } catch (err) {
        console.warn("Firestore hours log failed, session saved locally:", err);
        addToast(`✓ Logged ${finalHours} hrs locally (offline mode).`, 'success');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setTimeout(() => {
        setCurrentUser(null);
        setShowDashboard(false);
        localStorage.removeItem('showDashboard');
        localStorage.removeItem('currentUser');
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
      localStorage.setItem('currentUser', JSON.stringify(updated));
      try {
        const users = JSON.parse(localStorage.getItem('cc_local_users') || '[]');
        const filtered = users.filter(u => u.uid !== updated.uid && u.userId !== updated.userId);
        filtered.push(updated);
        localStorage.setItem('cc_local_users', JSON.stringify(filtered));
      } catch (_) {}
      addToast('✅ Profile updated successfully', 'success');
    } catch (error) {
      console.warn("Firestore profile update failed, saving locally:", error);
      setCurrentUser(updated);
      localStorage.setItem('currentUser', JSON.stringify(updated));
      try {
        const users = JSON.parse(localStorage.getItem('cc_local_users') || '[]');
        const filtered = users.filter(u => u.uid !== updated.uid && u.userId !== updated.userId);
        filtered.push(updated);
        localStorage.setItem('cc_local_users', JSON.stringify(filtered));
      } catch (_) {}
      addToast('✅ Profile updated locally', 'success');
    }
  };

  const handleAcceptPolicies = async () => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, policiesAccepted: true };
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    try {
      const users = JSON.parse(localStorage.getItem('cc_local_users') || '[]');
      const filtered = users.filter(u => u.uid !== updatedUser.uid && u.userId !== updatedUser.userId);
      filtered.push(updatedUser);
      localStorage.setItem('cc_local_users', JSON.stringify(filtered));
    } catch (_) {}

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { policiesAccepted: true }, { merge: true });
      addToast('📜 Policies accepted! Welcome to your dashboard.', 'success');
    } catch (err) {
      console.warn("Failed to save policy agreement to Firestore:", err);
      addToast('✓ Policies accepted locally.', 'success');
    }
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
    const handleMouse = (e) => {
      const card = e.target.closest('.card-3d');
      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
    };
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => { window.removeEventListener('mousemove', handleMouse); };
  }, []);

  if (isLoading) return <SplashScreen />

  return (
    <>
      <div className="cosmic-layer" />
      <div className="particles" />
      <div className="aurora-blur" style={{top:'10%',left:'20%',width:'500px',height:'500px',background:'var(--accent-highlight)'}}/>
      <div className="aurora-blur" style={{bottom:'0%',right:'10%',width:'600px',height:'600px',background:'var(--primary-500)',animationDelay:'-4s'}}/>
      
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
          onCheckOut={handleCheckOut} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}
          onNavigateBack={() => {
            if (showProfile) setShowProfile(false);
            else if (showDashboard) { 
              if (activeTab !== 'overview') setActiveTab('overview'); 
            }
            else window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          addToast={addToast}
        />

        {currentUser && (
          <SessionController
            activeSessionSecs={activeSessionSecs}
            isCheckingIn={!!checkInTime || accumulatedSecs > 0}
            isPaused={isPaused}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleCheckOut}
            onAddTimestamp={handleAddTimestamp}
            timestamps={timestamps}
            opacity={opacity}
            onOpacityChange={setOpacity}
          />
        )}

        <AnimatePresence>
          {showAuthModal && (
            <AuthModal 
              onClose={()=>setShowAuthModal(false)} 
              onLogin={handleLogin} 
              addToast={addToast} 
              theme={theme}
              onOpenOrgAuth={() => {
                setShowAuthModal(false);
                setShowOrgAuthModal(true);
              }}
            />
          )}
          {showOrgAuthModal && (
            <OrgAuthModal
              onClose={()=>setShowOrgAuthModal(false)}
              onLogin={handleLogin}
              addToast={addToast}
              theme={theme}
            />
          )}
          {showSosModal && <SosModal user={currentUser} onClose={() => setShowSosModal(false)} onSubmit={handleSosSubmit} isLoading={isSosSubmitting} />}
          {showHostProfile && <HostProfileModal host={showHostProfile} onClose={() => setShowHostProfile(null)} />}
          {showProfile && currentUser && <ProfilePanel user={currentUser} onClose={() => setShowProfile(false)} onUpdate={handleProfileUpdate} addToast={addToast} onLogout={handleLogout} />}
          {currentUser && !currentUser.policiesAccepted && (
            <PolicyModal 
              user={currentUser} 
              onAccept={handleAcceptPolicies} 
              theme={theme} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!showDashboard || !currentUser ? (
            <motion.main key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'relative', paddingTop: '100px' }}>
              <Hero setShowAuthModal={setShowAuthModal} />
              <ImpactSection />
              <EcosystemSection />
              <MapSection theme={theme} currentUser={currentUser} setShowDashboard={setShowDashboard} setShowAuthModal={setShowAuthModal} tasks={combinedLandingTasks} />
              <LiveNeedsSection setShowAuthModal={setShowAuthModal} currentUser={currentUser} setShowDashboard={setShowDashboard} tasks={combinedLandingTasks} setActiveTab={setActiveTab} />
              <LeaderboardSection currentUser={currentUser} />
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
              {currentUser.role === 'ngo' ? (
                <NgoDashboard 
                  user={currentUser} 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  addToast={addToast}
                  emergencyMissions={emergencyMissions}
                  onTriggerSos={handleSosSubmit}
                  theme={theme}
                  setTheme={setTheme}
                  onLogout={handleLogout}
                  onOpenProfile={() => setShowProfile(true)}
                />
              ) : (
                <VolunteerDashboard 
                  user={currentUser} 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  addToast={addToast}
                  acceptedTasks={acceptedTasks}
                  onMissionAccept={handleMissionAccept}
                  theme={theme}
                  setTheme={setTheme}
                  onLogout={handleLogout}
                  onOpenProfile={() => setShowProfile(true)}
                  emergencyMissions={emergencyMissions}
                  onViewHost={setShowHostProfile}
                  isCheckingIn={!!checkInTime || accumulatedSecs > 0}
                  activeSessionSecs={activeSessionSecs}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toasts.map(t => (
            <Toast 
              key={t.id} 
              message={t.message} 
              type={t.type} 
              onClose={() => removeToast(t.id)} 
              onClick={t.onClick ? () => { t.onClick(); removeToast(t.id); } : undefined} 
            />
          ))}
        </AnimatePresence>

        {sosActive && <div className="sos-overlay" />}
        {voiceActive && <div className="voice-wave-container"><div className="voice-wave" /><div className="voice-text">{voiceText}</div></div>}
      </div>
    </>
  )
}

export default App;
