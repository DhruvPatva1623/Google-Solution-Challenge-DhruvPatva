import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react'
import { AlertCircle, Mic, Heart, Compass, Award, User, Share2, MapPin, CheckCircle, ShieldCheck, Activity, Star, X, Bell, LogOut, Edit3, Lock, Phone, Mail, Camera, TrendingUp, Users, Clock, Trophy, ChevronRight, ChevronDown, Download, Calendar, Target, Zap, Globe, BookOpen, Badge } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

/* ─── Animated Counter Hook ─── */
function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let startTime = null;
        const step = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          setCount(Math.floor(progress * end));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return [count, ref];
}

/* ─── Toast ─── */
function Toast({ message, type = 'success', onClose }) {
  const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f97316' };
  const icons = { success: <CheckCircle size={20}/>, error: <AlertCircle size={20}/>, info: <ShieldCheck size={20}/>, warning: <AlertCircle size={20}/> };
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{opacity:0,y:50,scale:0.8}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:50,scale:0.8}}
      style={{position:'fixed',bottom:'30px',left:'50%',transform:'translateX(-50%)',zIndex:99999,background:colors[type],color:'white',padding:'0.8rem 1.5rem',borderRadius:'14px',display:'flex',alignItems:'center',gap:'0.8rem',boxShadow:`0 8px 30px ${colors[type]}66`,fontWeight:600,maxWidth:'90vw'}}>
      {icons[type]}<span>{message}</span>
      <button onClick={onClose} style={{background:'transparent',border:'none',color:'white',cursor:'pointer',marginLeft:'0.5rem'}}><X size={16}/></button>
    </motion.div>
  );
}

/* ─── Avatar Placeholder ─── */
function AvatarPlaceholder({ name, size = 80 }) {
  const initials = name ? name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : '?';
  const colors = ['linear-gradient(135deg,#f97316,#ec4899)','linear-gradient(135deg,#8b5cf6,#3b82f6)','linear-gradient(135deg,#10b981,#06b6d4)','linear-gradient(135deg,#f59e0b,#ef4444)'];
  const color = colors[(name?.charCodeAt(0)||0) % colors.length];
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:color,display:'grid',placeItems:'center',fontSize:size*0.35,fontWeight:800,color:'white',flexShrink:0}}>
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   AUTH MODAL  — Login / Register / Profile Collect
───────────────────────────────────────────────────*/
function AuthModal({ onClose, onLogin, addToast }) {
  const [step, setStep] = useState('choose'); // choose | email-login | phone-login | email-register | profile | otp
  const [method, setMethod] = useState('');
  const [form, setForm] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // default = Sign In

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // ── DUMMY DEMO ACCOUNTS — remove later when real Firebase auth is wired ──
  const DUMMY_ACCOUNTS = [
    {
      id: 'demo1',
      label: '🧑‍💻 Demo 1 — Priya Sharma (Volunteer · Champion)',
      tag: '4820 pts',
      tagColor: '#8b5cf6',
      user: {
        name:'Priya Sharma', email:'priya@demo.com', phone:'9876543210', method:'demo',
        avatar:null, city:'Mumbai', state:'Maharashtra', dob:'1998-06-15', gender:'Female',
        skills:['First Aid','Teaching','Social Media'],
        languages:['Hindi','English','Marathi'],
        availability:'Weekends only', org:'Tata Institute of Social Sciences',
        bio:'Passionate social worker with 3 years of NGO experience. Love making communities stronger through education and healthcare.',
        volunteerHours:340, points:4820, level:'Champion',
        joinDate:'2024-03-10', verifiedId:true, aadhar:'xxxx-5678',
        address:'Bandra West, Mumbai - 400050',
        emergencyContact:'Rajesh Sharma — +91 9812345678',
        interests:['Education','Healthcare','Women Empowerment'],
        notifications:{email:true, sms:true, push:true}
      }
    },
    {
      id: 'demo2',
      label: '👨‍🎓 Demo 2 — Rahul Verma (NGO Coordinator · Legend)',
      tag: '3950 pts',
      tagColor: '#ec4899',
      user: {
        name:'Rahul Verma', email:'rahul@demo.com', phone:'9123456789', method:'demo',
        avatar:null, city:'Delhi', state:'Delhi', dob:'1995-11-22', gender:'Male',
        skills:['Logistics','Leadership','Driving','Carpentry'],
        languages:['Hindi','English','Punjabi'],
        availability:'Flexible / Any time', org:'Delhi University — Social Work Dept.',
        bio:'NGO coordinator with 6+ years experience in disaster relief and rural development. Coordinated 500+ volunteers across 12 states.',
        volunteerHours:620, points:3950, level:'Legend',
        joinDate:'2023-08-05', verifiedId:true, aadhar:'xxxx-9012',
        address:'Vasant Kunj, New Delhi - 110070',
        emergencyContact:'Anita Verma — +91 9887654321',
        interests:['Disaster Relief','Rural Development','Education'],
        notifications:{email:true, sms:false, push:true}
      }
    }
  ];

  const handleDemoLogin = (account) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast(`✅ Logged in as ${account.user.name} (Demo Account)`, 'success');
      onLogin(account.user);
    }, 600);
  };

  const handleGoogle = () => {
    setLoading(true);
    const user = {
      name:'Dhruv Patva', email:'dhruv@gmail.com', phone:'', method:'google',
      avatar:null,city:'Ahmedabad',state:'Gujarat',dob:'2004-01-01',gender:'Male',
      skills:['Teaching','First Aid'],languages:['Hindi','English','Gujarati'],
      availability:'Weekends',org:'BITS Pilani',bio:'Passionate about social impact.',
      volunteerHours:120,points:1450,level:'Hero',joinDate:'2025-01-15',
      verifiedId:true,aadhar:'xxxx-1234',address:'Near BITS Campus, Pilani',
      emergencyContact:'Narendra Patva — +91 9876543210',
      interests:['Education','Medical','Disaster Relief'],
      notifications:{email:true,sms:true,push:true}
    };
    setTimeout(() => {
      setLoading(false);
      addToast('✅ Signed in with Google successfully!','success');
      onLogin(user);
    }, 900);
  };

  const handleSendOtp = () => {
    if (!form.phone || form.phone.length < 10) { addToast('Please enter a valid 10-digit phone number','error'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setOtpSent(true); addToast(`📱 OTP sent to +91 ${form.phone}`,'info'); }, 1200);
  };

  const handleVerifyOtp = () => {
    if (otp !== '123456') { addToast('❌ Incorrect OTP. Hint: use 123456','error'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = {
        name:'Phone User', email:'', phone:form.phone, method:'phone',
        avatar:null, city:'', state:'', dob:'', gender:'',
        skills:[], languages:[], availability:'', org:'', bio:'',
        volunteerHours:0, points:0, level:'Newcomer',
        joinDate: new Date().toISOString().split('T')[0], verifiedId:false, aadhar:'',
        address:'', emergencyContact:'', interests:[],
        notifications:{email:false, sms:true, push:true}
      };
      addToast('✅ Phone verified! Welcome to CommunityConnect','success');
      onLogin(user);
    }, 700);
  };

  const handleEmailAuth = () => {
    if (!form.email || !form.password) { addToast('Please fill all fields','error'); return; }
    if (!isLogin && form.password !== form.confirmPassword) { addToast('Passwords do not match','error'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (isLogin) {
        const name = (form.email||'').split('@')[0].replace(/[^a-zA-Z ]/g,' ').trim() || 'Volunteer';
        const user = {
          name, email:form.email, phone:'', method:'email',
          avatar:null, city:'', state:'', dob:'', gender:'', skills:[], languages:[],
          availability:'', org:'', bio:'', volunteerHours:0, points:0, level:'Newcomer',
          joinDate: new Date().toISOString().split('T')[0], verifiedId:false, aadhar:'',
          address:'', emergencyContact:'', interests:[], notifications:{email:true,sms:false,push:true}
        };
        addToast('✅ Login successful! Welcome back 👋','success');
        onLogin(user);
      } else { setStep('profile'); }
    }, 900);
  };

  const handleProfileSubmit = () => {
    if (!form.name||!form.city||!form.dob) { addToast('Please fill Name, City, and Date of Birth','error'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const user = {
        name:form.name, email:form.email||'', phone:form.phone||'', method,
        avatar:null, city:form.city, state:form.state||'', dob:form.dob, gender:form.gender||'',
        skills:(form.skills||'').split(',').map(s=>s.trim()).filter(Boolean),
        languages:(form.languages||'').split(',').map(s=>s.trim()).filter(Boolean),
        availability:form.availability||'', org:form.org||'', bio:form.bio||'',
        volunteerHours:0, points:0, level:'Newcomer',
        joinDate: new Date().toISOString().split('T')[0], verifiedId:false, aadhar:form.aadhar||'',
        address:form.address||'', emergencyContact:form.emergencyContact||'',
        interests:(form.interests||'').split(',').map(s=>s.trim()).filter(Boolean),
        notifications:{email:true,sms:true,push:true}
      };
      addToast('🎉 Account created! Welcome to CommunityConnect','success'); onLogin(user);
    }, 1500);
  };

  const inputStyle = {
    width:'100%', padding:'0.75rem 1rem', borderRadius:'10px',
    border:'1px solid var(--border-light)', background:'var(--bg-secondary)',
    color:'var(--text-primary)', fontSize:'0.95rem', outline:'none',
    transition:'border 0.2s', fontFamily:'var(--font-body)'
  };
  const labelStyle = { display:'block', fontWeight:600, marginBottom:'0.3rem', fontSize:'0.85rem', color:'var(--text-secondary)' };
  const rowStyle = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'none',zIndex:10000,display:'grid',placeItems:'center',padding:'1rem'}}>
      <motion.div initial={{scale:0.85,y:40}} animate={{scale:1,y:0}} exit={{scale:0.85,y:40}}
        onClick={e=>e.stopPropagation()} className="glass-panel"
        style={{padding:'2.5rem',borderRadius:'28px',maxWidth:'520px',width:'100%',maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
        
        <button onClick={onClose} style={{position:'absolute',top:'1.2rem',right:'1.2rem',background:'var(--bg-secondary)',border:'1px solid var(--border-light)',borderRadius:'50%',width:32,height:32,display:'grid',placeItems:'center',cursor:'pointer',color:'var(--text-primary)'}}><X size={16}/></button>

        {/* STEP: CHOOSE METHOD */}
        {step === 'choose' && (
          <>
            <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
              <div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>🔐</div>
              <h2 style={{fontSize:'1.8rem'}}>Join CommunityConnect</h2>
              <p style={{color:'var(--text-secondary)',marginTop:'0.4rem',fontSize:'0.92rem'}}>Access missions, track impact, and earn rewards.</p>
            </div>

            {/* ── DUMMY DEMO ACCOUNTS ── remove later ── */}
            <div style={{marginBottom:'1.5rem',background:'linear-gradient(135deg,rgba(249,115,22,0.07),rgba(139,92,246,0.07))',border:'1px solid rgba(249,115,22,0.3)',borderRadius:'16px',padding:'1rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.8rem'}}>
                <span style={{fontSize:'0.78rem',fontWeight:700,color:'white',background:'var(--primary-500)',padding:'0.2rem 0.6rem',borderRadius:'6px',letterSpacing:'0.03em'}}>🧪 DEMO</span>
                <span style={{fontSize:'0.78rem',color:'var(--text-secondary)'}}>Click any account to instantly explore all features</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
                {DUMMY_ACCOUNTS.map(acc => (
                  <button key={acc.id} onClick={() => handleDemoLogin(acc)} disabled={loading}
                    style={{padding:'0.75rem 1rem',borderRadius:'12px',border:'1px solid var(--border-light)',background:'var(--bg-secondary)',color:'var(--text-primary)',cursor:loading?'wait':'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.6rem',textAlign:'left',fontFamily:'var(--font-body)',transition:'all 0.2s',width:'100%'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=acc.tagColor;e.currentTarget.style.boxShadow=`0 0 0 3px ${acc.tagColor}22`}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.boxShadow='none'}}>
                    <span style={{fontWeight:600,fontSize:'0.88rem'}}>{acc.label}</span>
                    <span style={{background:`${acc.tagColor}22`,color:acc.tagColor,padding:'0.2rem 0.6rem',borderRadius:'6px',fontSize:'0.72rem',fontWeight:700,flexShrink:0,whiteSpace:'nowrap'}}>{acc.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1rem'}}>
              <div style={{flex:1,height:1,background:'var(--border-light)'}}/>
              <span style={{fontSize:'0.78rem',color:'var(--text-secondary)',fontWeight:500,whiteSpace:'nowrap'}}>OR CONTINUE WITH</span>
              <div style={{flex:1,height:1,background:'var(--border-light)'}}/>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'0.8rem'}}>
              <button onClick={handleGoogle} disabled={loading}
                style={{padding:'0.9rem',borderRadius:'12px',border:'1px solid var(--border-light)',background:'var(--bg-secondary)',color:'var(--text-primary)',fontWeight:600,cursor:loading?'wait':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.8rem',fontSize:'0.93rem',transition:'all 0.2s',fontFamily:'var(--font-body)'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#4285f4';e.currentTarget.style.background='rgba(66,133,244,0.06)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.background='var(--bg-secondary)'}}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {loading ? 'Connecting...' : 'Continue with Google'}
              </button>
              <button onClick={()=>{setStep('phone');setMethod('phone')}}
                style={{padding:'0.9rem',borderRadius:'12px',border:'1px solid var(--border-light)',background:'var(--bg-secondary)',color:'var(--text-primary)',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.8rem',fontSize:'0.93rem',fontFamily:'var(--font-body)',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--primary-500)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)'}}>
                <Phone size={18}/> Continue with Phone Number
              </button>
              <button onClick={()=>{setStep('emailauth');setMethod('email')}}
                style={{padding:'0.9rem',borderRadius:'12px',border:'1px solid var(--border-light)',background:'var(--bg-secondary)',color:'var(--text-primary)',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.8rem',fontSize:'0.93rem',fontFamily:'var(--font-body)',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent-highlight)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)'}}>
                <Mail size={18}/> Continue with Email
              </button>
            </div>
          </>
        )}

        {/* STEP: PHONE OTP */}
        {step === 'phone' && (
          <>
            <button onClick={()=>setStep('choose')} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.9rem'}}>← Back</button>
            <div style={{textAlign:'center',marginBottom:'2rem'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>📱</div>
              <h2 style={{fontSize:'1.6rem'}}>Phone Verification</h2>
              <p style={{color:'var(--text-secondary)',marginTop:'0.4rem'}}>We'll send a 6-digit OTP to your mobile number.</p>
            </div>
            {!otpSent ? (
              <>
                <label style={labelStyle}>Mobile Number</label>
                <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
                  <div style={{...inputStyle,width:'70px',textAlign:'center',flexShrink:0}}>+91</div>
                  <input style={inputStyle} placeholder="10-digit number" maxLength={10} value={form.phone||''} onChange={e=>set('phone',e.target.value)} onFocus={e=>e.target.style.borderColor='var(--primary-500)'} onBlur={e=>e.target.style.borderColor='var(--border-light)'}/>
                </div>
                <button onClick={handleSendOtp} disabled={loading} className="btn-magic" style={{width:'100%',padding:'1rem'}}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </>
            ) : (
              <>
                <p style={{color:'var(--text-secondary)',marginBottom:'1rem',fontSize:'0.9rem'}}>Enter the 6-digit OTP sent to +91 {form.phone} <span style={{color:'var(--primary-500)',cursor:'pointer'}} onClick={()=>setOtpSent(false)}>Change</span></p>
                <label style={labelStyle}>OTP Code</label>
                <input style={{...inputStyle,letterSpacing:'0.5rem',fontSize:'1.3rem',textAlign:'center',marginBottom:'1rem'}} placeholder="• • • • • •" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value)}/>
                <p style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>Demo OTP: <strong>123456</strong></p>
                <button onClick={handleVerifyOtp} disabled={loading} className="btn-magic" style={{width:'100%',padding:'1rem'}}>
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </>
            )}
          </>
        )}

        {/* STEP: EMAIL AUTH */}
        {step === 'emailauth' && (
          <>
            <button onClick={()=>setStep('choose')} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontWeight:600,marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.9rem',fontFamily:'var(--font-body)'}}>← Back</button>
            <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>{isLogin?'🔑':'📧'}</div>
              <h2 style={{fontSize:'1.6rem'}}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            </div>
            {/* Sign In / Sign Up Toggle */}
            <div style={{display:'flex',background:'var(--bg-secondary)',borderRadius:'12px',padding:'4px',marginBottom:'1.5rem',border:'1px solid var(--border-light)'}}>
              {['Sign In','Sign Up'].map((t,i) => (
                <button key={t} onClick={()=>setIsLogin(i===0)}
                  style={{flex:1,padding:'0.6rem',borderRadius:'9px',border:'none',cursor:'pointer',fontWeight:600,fontSize:'0.9rem',background:(isLogin&&i===0)||(!isLogin&&i===1)?'var(--primary-500)':'transparent',color:(isLogin&&i===0)||(!isLogin&&i===1)?'white':'var(--text-secondary)',transition:'all 0.2s',fontFamily:'var(--font-body)'}}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              {!isLogin && (
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input style={inputStyle} placeholder="Your full name" value={form.name||''} onChange={e=>set('name',e.target.value)}/>
                </div>
              )}
              <div>
                <label style={labelStyle}>Email Address</label>
                <input style={inputStyle} type="email" placeholder="you@example.com" value={form.email||''} onChange={e=>set('email',e.target.value)}/>
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input style={inputStyle} type="password" placeholder="••••••••" value={form.password||''} onChange={e=>set('password',e.target.value)}/>
              </div>
              {!isLogin && (
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <input style={inputStyle} type="password" placeholder="••••••••" value={form.confirmPassword||''} onChange={e=>set('confirmPassword',e.target.value)}/>
                </div>
              )}
            </div>
            <button onClick={handleEmailAuth} disabled={loading} className="btn-magic" style={{width:'100%',padding:'1rem',marginTop:'1.5rem'}}>
              {loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? '🚀 Sign In' : '🚀 Create Account')}
            </button>
            {isLogin && <p style={{textAlign:'center',marginTop:'0.7rem',fontSize:'0.8rem',color:'var(--text-secondary)'}}>💡 Any email + any password works in demo mode</p>}
          </>
        )}

        {/* STEP: PROFILE (Collect volunteer details) */}
        {step === 'profile' && (
          <>
            <div style={{textAlign:'center',marginBottom:'2rem'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>👤</div>
              <h2 style={{fontSize:'1.6rem'}}>Complete Your Profile</h2>
              <p style={{color:'var(--text-secondary)',marginTop:'0.4rem'}}>Help us match you with the perfect volunteering opportunities.</p>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div style={rowStyle}>
                <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} placeholder="Full name" value={form.name||''} onChange={e=>set('name',e.target.value)}/></div>
                <div><label style={labelStyle}>Gender</label>
                  <select style={inputStyle} value={form.gender||''} onChange={e=>set('gender',e.target.value)}>
                    <option value="">Select</option><option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div style={rowStyle}>
                <div><label style={labelStyle}>Date of Birth *</label><input style={inputStyle} type="date" value={form.dob||''} onChange={e=>set('dob',e.target.value)}/></div>
                <div><label style={labelStyle}>Mobile Number</label><input style={inputStyle} placeholder="+91 XXXXXXXXXX" value={form.phone||''} onChange={e=>set('phone',e.target.value)}/></div>
              </div>
              <div><label style={labelStyle}>Full Address</label><input style={inputStyle} placeholder="House/Street/Locality" value={form.address||''} onChange={e=>set('address',e.target.value)}/></div>
              <div style={rowStyle}>
                <div><label style={labelStyle}>City *</label><input style={inputStyle} placeholder="City" value={form.city||''} onChange={e=>set('city',e.target.value)}/></div>
                <div><label style={labelStyle}>State</label><input style={inputStyle} placeholder="State" value={form.state||''} onChange={e=>set('state',e.target.value)}/></div>
              </div>
              <div><label style={labelStyle}>Organization / School / College</label><input style={inputStyle} placeholder="Where do you study/work?" value={form.org||''} onChange={e=>set('org',e.target.value)}/></div>
              <div><label style={labelStyle}>Skills (comma-separated)</label><input style={inputStyle} placeholder="e.g. Teaching, First Aid, Coding" value={form.skills||''} onChange={e=>set('skills',e.target.value)}/></div>
              <div><label style={labelStyle}>Languages Known</label><input style={inputStyle} placeholder="e.g. Hindi, English, Gujarati" value={form.languages||''} onChange={e=>set('languages',e.target.value)}/></div>
              <div><label style={labelStyle}>Areas of Interest</label><input style={inputStyle} placeholder="e.g. Education, Healthcare, Environment" value={form.interests||''} onChange={e=>set('interests',e.target.value)}/></div>
              <div><label style={labelStyle}>Availability</label>
                <select style={inputStyle} value={form.availability||''} onChange={e=>set('availability',e.target.value)}>
                  <option value="">Select availability</option>
                  <option>Weekdays only</option><option>Weekends only</option><option>Weekdays & Weekends</option><option>Flexible / Any time</option>
                </select>
              </div>
              <div><label style={labelStyle}>Aadhaar (last 4 digits for verification)</label><input style={inputStyle} placeholder="XXXX" maxLength={4} value={form.aadhar||''} onChange={e=>set('aadhar',e.target.value)}/></div>
              <div><label style={labelStyle}>Emergency Contact</label><input style={inputStyle} placeholder="Name — Phone number" value={form.emergencyContact||''} onChange={e=>set('emergencyContact',e.target.value)}/></div>
              <div><label style={labelStyle}>Short Bio</label><textarea style={{...inputStyle,minHeight:80,resize:'vertical'}} placeholder="Tell us about yourself and why you volunteer..." value={form.bio||''} onChange={e=>set('bio',e.target.value)}/></div>
            </div>
            <button onClick={handleProfileSubmit} disabled={loading} className="btn-magic" style={{width:'100%',padding:'1rem',marginTop:'1.5rem'}}>
              {loading ? 'Saving Profile...' : '🚀 Launch My Dashboard'}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   MY PROFILE PANEL
─────────────────────────────────────────────*/
function ProfilePanel({ user, onClose, onUpdate, addToast }) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('personal');
  const [form, setForm] = useState({ ...user });

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = () => {
    onUpdate(form);
    setEditing(false);
    addToast('✅ Profile updated successfully!','success');
  };

  const inputStyle = (locked=false) => ({
    width:'100%', padding:'0.65rem 1rem', borderRadius:'10px',
    border:`1px solid ${locked ? 'transparent' : 'var(--border-light)'}`,
    background: locked ? 'transparent' : 'var(--bg-secondary)',
    color:'var(--text-primary)', fontSize:'0.9rem', outline:'none',
    cursor: locked ? 'default' : 'text',
    fontFamily:'var(--font-body)', fontWeight: locked ? 600 : 400
  });
  const labelStyle = { display:'block', fontWeight:600, marginBottom:'0.25rem', fontSize:'0.8rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' };
  const fieldBlock = (label, key, locked=false, type='text', options=null) => (
    <div style={{marginBottom:'1rem'}}>
      <label style={labelStyle}>
        {label} {locked && <Lock size={11} style={{display:'inline',marginLeft:'0.3rem',verticalAlign:'middle'}}/>}
      </label>
      {options ? (
        editing && !locked
          ? <select style={inputStyle(false)} value={form[key]||''} onChange={e=>set(key,e.target.value)}>
              {options.map(o=><option key={o}>{o}</option>)}
            </select>
          : <div style={inputStyle(true)}>{form[key]||'—'}</div>
      ) : editing && !locked
        ? <input style={inputStyle(false)} type={type} value={form[key]||''} onChange={e=>set(key,e.target.value)}/>
        : <div style={inputStyle(true)}>{form[key]||'—'}</div>
      }
    </div>
  );

  const levelMap = { 'Newcomer':{pts:0,color:'#a3a3a3'}, 'Helper':{pts:500,color:'#10b981'}, 'Hero':{pts:1000,color:'#f97316'}, 'Champion':{pts:2500,color:'#8b5cf6'}, 'Legend':{pts:5000,color:'#ec4899'} };
  const levels = Object.keys(levelMap);
  const currentLevelIdx = levels.indexOf(user.level||'Newcomer');
  const nextLevel = levels[currentLevelIdx+1];
  const nextLevelPts = nextLevel ? levelMap[nextLevel].pts : levelMap[user.level||'Newcomer'].pts;
  const progress = nextLevel ? Math.min(100, ((user.points||0)/nextLevelPts)*100) : 100;

  const tabs = [
    {id:'personal',label:'Personal',icon:'👤'},
    {id:'volunteering',label:'Volunteer',icon:'🤝'},
    {id:'achievements',label:'Awards',icon:'🏆'},
    {id:'settings',label:'Settings',icon:'⚙️'},
  ];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'none',zIndex:10000,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',padding:'80px 1rem 1rem'}}>
      <motion.div initial={{x:100,opacity:0}} animate={{x:0,opacity:1}} exit={{x:100,opacity:0}} onClick={e=>e.stopPropagation()}
        className="glass-panel" style={{width:'min(560px,100%)',maxHeight:'calc(100vh - 100px)',borderRadius:'28px',overflow:'hidden',display:'flex',flexDirection:'column'}}>

        {/* Header */}
        <div style={{padding:'2rem',background:'linear-gradient(135deg,var(--primary-500),var(--accent-pink))',position:'relative',flexShrink:0}}>
          <button onClick={onClose} style={{position:'absolute',top:'1rem',right:'1rem',background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'50%',width:32,height:32,display:'grid',placeItems:'center',cursor:'pointer',color:'white'}}><X size={16}/></button>
          <div style={{display:'flex',alignItems:'center',gap:'1.5rem'}}>
            <div style={{position:'relative'}}>
              <AvatarPlaceholder name={user.name} size={80}/>
              {editing && <div style={{position:'absolute',bottom:0,right:0,background:'white',borderRadius:'50%',width:24,height:24,display:'grid',placeItems:'center',cursor:'pointer'}}><Camera size={14} color="#000"/></div>}
            </div>
            <div style={{color:'white'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:800}}>{user.name}</h2>
              <p style={{opacity:0.85,fontSize:'0.9rem'}}>{user.org||'Community Volunteer'} · {user.city}</p>
              <div style={{display:'flex',gap:'0.5rem',marginTop:'0.5rem',flexWrap:'wrap'}}>
                <span style={{background:'rgba(255,255,255,0.2)',padding:'0.2rem 0.7rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>
                  ⭐ {user.level||'Newcomer'}
                </span>
                {user.verifiedId && <span style={{background:'rgba(16,185,129,0.3)',padding:'0.2rem 0.7rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>✅ Verified</span>}
                <span style={{background:'rgba(255,255,255,0.2)',padding:'0.2rem 0.7rem',borderRadius:'99px',fontSize:'0.75rem',fontWeight:700}}>
                  {user.points||0} pts
                </span>
              </div>
            </div>
          </div>
          {/* Level Progress */}
          <div style={{marginTop:'1.2rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',color:'rgba(255,255,255,0.8)',marginBottom:'0.4rem'}}>
              <span>{user.level||'Newcomer'}</span>
              {nextLevel && <span>{nextLevel} in {nextLevelPts-(user.points||0)} pts</span>}
            </div>
            <div style={{height:6,background:'rgba(255,255,255,0.2)',borderRadius:'99px',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${progress}%`,background:'white',borderRadius:'99px',transition:'width 1s ease'}}/>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid var(--border-light)',flexShrink:0,background:'var(--bg-secondary)'}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'0.8rem 0.5rem',background:'none',border:'none',cursor:'pointer',color:tab===t.id?'var(--primary-500)':'var(--text-secondary)',fontWeight:tab===t.id?700:500,fontSize:'0.8rem',borderBottom:tab===t.id?'2px solid var(--primary-500)':'2px solid transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.2rem',fontFamily:'var(--font-body)',transition:'all 0.2s'}}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:'auto',padding:'1.5rem'}}>

          {tab === 'personal' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 1rem'}}>
                {fieldBlock('Full Name','name',false)}
                {fieldBlock('Gender','gender',false,'text',['Male','Female','Non-binary','Prefer not to say'])}
                {fieldBlock('Date of Birth','dob',true,'date')}
                {fieldBlock('Join Date','joinDate',true)}
                {fieldBlock('Email','email',true)}
                {fieldBlock('Phone','phone',false)}
              </div>
              {fieldBlock('Address','address',false)}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 1rem'}}>
                {fieldBlock('City','city',false)}
                {fieldBlock('State','state',false)}
              </div>
              {fieldBlock('Organization / College','org',false)}
              {fieldBlock('Emergency Contact','emergencyContact',false)}
              {fieldBlock('Aadhaar (last 4)','aadhar',true)}
              <div style={{marginBottom:'1rem'}}>
                <label style={labelStyle}>Bio</label>
                {editing ? <textarea style={{...inputStyle(false),width:'100%',minHeight:80,resize:'vertical'}} value={form.bio||''} onChange={e=>set('bio',e.target.value)}/> : <div style={{...inputStyle(true),minHeight:60,whiteSpace:'pre-wrap'}}>{form.bio||'—'}</div>}
              </div>
            </div>
          )}

          {tab === 'volunteering' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
                {[{icon:'⏱️',label:'Total Hours',val:`${user.volunteerHours||0}h`},{icon:'✅',label:'Tasks Done',val:'24'},{icon:'🏙️',label:'Cities Covered',val:'3'},{icon:'❤️',label:'Lives Impacted',val:'480'}].map((s,i)=>(
                  <div key={i} style={{background:'var(--bg-secondary)',border:'1px solid var(--border-light)',borderRadius:'16px',padding:'1.2rem',textAlign:'center'}}>
                    <div style={{fontSize:'1.8rem'}}>{s.icon}</div>
                    <div style={{fontWeight:800,fontSize:'1.3rem'}}>{s.val}</div>
                    <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:'1rem'}}>
                <label style={labelStyle}>Skills</label>
                {editing
                  ? <input style={inputStyle(false)} value={(form.skills||[]).join(', ')} onChange={e=>set('skills',e.target.value.split(',').map(s=>s.trim()))}/>
                  : <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginTop:'0.3rem'}}>
                      {(user.skills||[]).map((s,i)=><span key={i} style={{background:'rgba(249,115,22,0.1)',color:'var(--primary-500)',padding:'0.3rem 0.8rem',borderRadius:'99px',fontSize:'0.82rem',fontWeight:600}}>{s}</span>)}
                    </div>
                }
              </div>
              <div style={{marginBottom:'1rem'}}>
                <label style={labelStyle}>Languages</label>
                {editing
                  ? <input style={inputStyle(false)} value={(form.languages||[]).join(', ')} onChange={e=>set('languages',e.target.value.split(',').map(s=>s.trim()))}/>
                  : <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginTop:'0.3rem'}}>
                      {(user.languages||[]).map((l,i)=><span key={i} style={{background:'rgba(59,130,246,0.1)',color:'#3b82f6',padding:'0.3rem 0.8rem',borderRadius:'99px',fontSize:'0.82rem',fontWeight:600}}>{l}</span>)}
                    </div>
                }
              </div>
              <div style={{marginBottom:'1rem'}}>
                <label style={labelStyle}>Interests</label>
                {editing
                  ? <input style={inputStyle(false)} value={(form.interests||[]).join(', ')} onChange={e=>set('interests',e.target.value.split(',').map(s=>s.trim()))}/>
                  : <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginTop:'0.3rem'}}>
                      {(user.interests||[]).map((s,i)=><span key={i} style={{background:'rgba(139,92,246,0.1)',color:'var(--accent-highlight)',padding:'0.3rem 0.8rem',borderRadius:'99px',fontSize:'0.82rem',fontWeight:600}}>{s}</span>)}
                    </div>
                }
              </div>
              {fieldBlock('Availability','availability',false,'text',['Weekdays only','Weekends only','Weekdays & Weekends','Flexible / Any time'])}
              {/* Activity chart */}
              <div style={{marginTop:'1rem',background:'var(--bg-secondary)',borderRadius:'16px',padding:'1.2rem',border:'1px solid var(--border-light)'}}>
                <div style={{fontWeight:700,marginBottom:'0.8rem',fontSize:'0.9rem'}}>📈 Monthly Activity</div>
                <Bar data={{labels:['Jan','Feb','Mar','Apr','May','Jun'],datasets:[{data:[12,18,8,24,16,20],backgroundColor:'rgba(249,115,22,0.4)',borderColor:'var(--primary-500)',borderWidth:2,borderRadius:6}]}} options={{maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'var(--border-light)'}}}}} style={{height:120}}/>
              </div>
            </div>
          )}

          {tab === 'achievements' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                {[
                  {icon:'🏅',title:'First Responder',desc:'Completed 1st emergency task',earned:true},
                  {icon:'🌟',title:'Super Volunteer',desc:'120+ volunteer hours logged',earned:true},
                  {icon:'🔗',title:'Chain Maker',desc:'Referred 5+ volunteers',earned:false},
                  {icon:'🏆',title:'Top 10 Achiever',desc:'Rank in top 10 leaderboard',earned:false},
                  {icon:'🌍',title:'City Hero',desc:'Active in 3+ districts',earned:true},
                  {icon:'📜',title:'NFT Certified',desc:'Blockchain certificate minted',earned:true},
                ].map((a,i)=>(
                  <div key={i} style={{background:'var(--bg-secondary)',border:`1px solid ${a.earned?'var(--primary-500)':'var(--border-light)'}`,borderRadius:'16px',padding:'1rem',textAlign:'center',opacity:a.earned?1:0.5,transition:'all 0.2s',position:'relative',overflow:'hidden'}}>
                    {a.earned && <div style={{position:'absolute',top:6,right:8,fontSize:'0.65rem',color:'var(--primary-500)',fontWeight:700}}>✓ EARNED</div>}
                    <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>{a.icon}</div>
                    <div style={{fontWeight:700,fontSize:'0.85rem'}}>{a.title}</div>
                    <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:'0.2rem'}}>{a.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:'1.5rem',background:'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(236,72,153,0.1))',border:'1px solid var(--border-light)',borderRadius:'16px',padding:'1.2rem',textAlign:'center'}}>
                <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>📜</div>
                <div style={{fontWeight:700,marginBottom:'0.3rem'}}>Blockchain Certificate</div>
                <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>Your 120h community service is minted on Polygon L2</div>
                <div style={{fontSize:'0.7rem',color:'var(--accent-highlight)',fontFamily:'monospace',marginBottom:'1rem'}}>0x7f3a...b92e · {user.joinDate}</div>
                <button style={{padding:'0.6rem 1.5rem',borderRadius:'99px',background:'var(--accent-highlight)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'0.85rem',display:'inline-flex',alignItems:'center',gap:'0.5rem'}}>
                  <Download size={14}/> Download Certificate
                </button>
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div>
              <div style={{fontWeight:700,marginBottom:'1rem'}}>Notification Preferences</div>
              {[['Email Notifications','email'],['SMS Alerts','sms'],['Push Notifications','push']].map(([label,key])=>(
                <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.8rem 0',borderBottom:'1px solid var(--border-light)'}}>
                  <span style={{fontWeight:500}}>{label}</span>
                  <div onClick={()=>set('notifications',{...form.notifications,[key]:!form.notifications?.[key]})}
                    style={{width:46,height:26,borderRadius:'99px',background:form.notifications?.[key]?'var(--primary-500)':'var(--border-light)',cursor:'pointer',position:'relative',transition:'background 0.3s'}}>
                    <div style={{position:'absolute',top:3,left:form.notifications?.[key]?22:3,width:20,height:20,borderRadius:'50%',background:'white',transition:'left 0.3s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
                  </div>
                </div>
              ))}
              <div style={{marginTop:'2rem',fontWeight:700,marginBottom:'1rem'}}>Privacy & Security</div>
              <div style={{display:'flex',flexDirection:'column',gap:'0.8rem'}}>
                {['Change Password','Two-Factor Authentication','Delete Account'].map((item,i)=>(
                  <button key={i} onClick={()=>addToast(`${item} — coming soon in full release`,'info')}
                    style={{padding:'0.8rem 1rem',borderRadius:'12px',border:'1px solid var(--border-light)',background:'var(--bg-secondary)',color:i===2?'#ef4444':'var(--text-primary)',textAlign:'left',cursor:'pointer',fontWeight:500,display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:'var(--font-body)'}}>
                    {item} <ChevronRight size={16}/>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Edit Button Footer */}
        <div style={{padding:'1.2rem 1.5rem',borderTop:'1px solid var(--border-light)',flexShrink:0,background:'var(--bg-secondary)',display:'flex',gap:'0.8rem'}}>
          {editing ? (
            <>
              <button onClick={()=>setEditing(false)} style={{flex:1,padding:'0.9rem',borderRadius:'12px',border:'1px solid var(--border-light)',background:'transparent',color:'var(--text-primary)',cursor:'pointer',fontWeight:600,fontFamily:'var(--font-body)'}}>Cancel</button>
              <button onClick={handleSave} className="btn-magic" style={{flex:2,padding:'0.9rem'}}>💾 Save Changes</button>
            </>
          ) : (
            <button onClick={()=>setEditing(true)} style={{width:'100%',padding:'0.9rem',borderRadius:'14px',background:'linear-gradient(135deg,var(--primary-400),var(--accent-highlight))',color:'white',border:'none',cursor:'pointer',fontWeight:700,fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.6rem',fontFamily:'var(--font-body)',boxShadow:'0 6px 20px rgba(249,115,22,0.4)',transition:'transform 0.2s'}} onMouseEnter={e=>e.target.style.transform='scale(1.02)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}>
              <Edit3 size={18}/> Edit My Details
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   VOLUNTEER DASHBOARD (after login)
─────────────────────────────────────────────*/
function VolunteerDashboard({ user, addToast, onLogout, onOpenProfile }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [acceptedTasks, setAcceptedTasks] = useState({});
  const [notifications, setNotifications] = useState([
    {id:1,text:'New CRITICAL task: Flood Relief in Kheda',time:'2m ago',read:false,type:'urgent'},
    {id:2,text:'You earned the "City Hero" badge! 🏙️',time:'1h ago',read:false,type:'success'},
    {id:3,text:'Priya Sharma liked your impact post',time:'3h ago',read:true,type:'social'},
    {id:4,text:'Your blockchain certificate is ready',time:'1d ago',read:true,type:'info'},
  ]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [checkinActive, setCheckinActive] = useState(false);
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

  const handleCheckin = () => {
    setCheckinActive(v=>!v);
    addToast(checkinActive ? '📍 Checked out — great work today!' : '📍 Checked in! Your hours are being tracked','success');
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

  // Lightweight card style — no heavy backdropFilter for perf
  const cardS = useMemo(() => ({
    background:'#111827',
    border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:'16px',
    padding:'1.25rem',
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
                <button onClick={handleCheckin} style={{padding:'0.9rem 1.8rem',borderRadius:'14px',background:checkinActive?'rgba(255,255,255,0.3)':'white',color:checkinActive?'white':'var(--primary-500)',border:'none',cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',gap:'0.6rem',fontSize:'1rem',fontFamily:'var(--font-body)'}}>
                  {checkinActive?<><CheckCircle size={18}/> Checked In</>:<><Target size={18}/> Check In</>}
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

/* ─────────────────────────────────────────
   MAIN APP
─────────────────────────────────────────*/
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
  const [currentUser, setCurrentUser] = useState({
      name:'Priya Sharma', email:'priya@demo.com', phone:'9876543210', method:'demo',
      avatar:null, city:'Mumbai', state:'Maharashtra', dob:'1998-06-15', gender:'Female',
      skills:['First Aid','Teaching','Social Media'],
      languages:['Hindi','English','Marathi'],
      availability:'Weekends only', org:'Tata Institute of Social Sciences',
      bio:'Passionate social worker with 3 years of NGO experience. Love making communities stronger through education and healthcare.',
      volunteerHours:340, points:4820, level:'Champion',
      joinDate:'2024-03-10', verifiedId:true, aadhar:'xxxx-5678',
      address:'Bandra West, Mumbai - 400050',
      emergencyContact:'Rajesh Sharma — +91 9812345678',
      interests:['Education','Healthcare','Women Empowerment'],
      notifications:{email:true, sms:true, push:true}
  })
  const [showDashboard, setShowDashboard] = useState(true)
  const [showProfile, setShowProfile] = useState(false)

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
    setSosActive(true);
    addToast('🚨 SOS signal broadcast to 32 nearby volunteers!', 'error');
    setTimeout(() => setSosActive(false), 5000);
  }

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

  const impactData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{ label:'Direct Beneficiaries Helped', data:[1200,3100,2800,5020], borderColor:'#ec4899', backgroundColor:'transparent', tension:0.4, borderWidth:3, pointBackgroundColor:'#ec4899', pointBorderColor:'#ffffff', pointBorderWidth:2, pointRadius:5 }]
  };

  const tasks = [
    { title:'Emergency Medical Supply Drop', dist:'1.2 km', score:98, type:'CRITICAL', color:'#ef4444', skills:['First Aid','Driving'] },
    { title:'Elderly Food Assistance', dist:'3.4 km', score:85, type:'URGENT', color:'#f97316', skills:['Cooking','Transport'] },
    { title:'Local School Renovation Aid', dist:'5.0 km', score:76, type:'ROUTINE', color:'#10b981', skills:['Painting','Carpentry'] }
  ];

  const leaderboard = [
    {name:'Priya Sharma',city:'Mumbai',pts:4820,badge:'🥇'},
    {name:'Rahul Verma',city:'Delhi',pts:3950,badge:'🥈'},
    {name:'Ananya Iyer',city:'Bangalore',pts:3100,badge:'🥉'},
    {name:'Dhruv Patva',city:'Ahmedabad',pts:1450,badge:'4'},
    {name:'Kamal Singh',city:'Jaipur',pts:1200,badge:'5'},
  ];

  const testimonials = [
    {name:'Meera Deshpande',role:'Beneficiary',text:'CommunityConnect helped me receive medical supplies within 15 minutes during an emergency. The volunteer was guided right to my doorstep.',rating:5},
    {name:'Akshaya Patra NGO',role:'Partner NGO',text:'We mobilized 500 volunteers in 24 hours during the Gujarat floods. 3x faster volunteer coordination than any other platform.',rating:5},
    {name:'Ravi Kumar',role:'Volunteer',text:'The gamification keeps me motivated. I have completed 120 hours and earned my blockchain certificate. It feels amazing to give back.',rating:5},
  ];

  const govtSchemes = [
    {name:'PM-KISAN',benefit:'₹6,000/year',eligible:true,desc:'Direct income support for farming families'},
    {name:'Ayushman Bharat',benefit:'₹5 Lakh/year',eligible:true,desc:'Health insurance for below-poverty families'},
    {name:'MGNREGA',benefit:'100 days work',eligible:true,desc:'Guaranteed rural employment scheme'},
    {name:'PM Awas Yojana',benefit:'Housing subsidy',eligible:false,desc:'Affordable housing for urban poor'},
  ];

  return (
    <>
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

      {/* Navbar */}
      <header className="navbar glass-panel">
        <div className="navbar-content">
          <div style={{display:'flex',alignItems:'center',gap:'0.8rem'}}>
            <span style={{fontSize:'1.8rem'}}>🌍</span>
            <span style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:'1.3rem',letterSpacing:'-0.5px'}}>CommunityConnect</span>
          </div>
          <nav style={{display:'flex',gap:'2rem'}}>
            <a href="#features" style={{textDecoration:'none',color:'var(--text-secondary)',fontWeight:600}}>Platform</a>
            <a href="#impact" style={{textDecoration:'none',color:'var(--text-secondary)',fontWeight:600}}>Impact</a>
            <a href="#stories" style={{textDecoration:'none',color:'var(--text-secondary)',fontWeight:600}}>Stories</a>
          </nav>
          <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <button onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{background:'none',border:'none',fontSize:'1.4rem',cursor:'pointer'}} aria-label="Toggle theme">
              {theme==='dark'?'🌑':'☀️'}
            </button>
            <button onClick={handleSos} className="sos-btn" aria-label="Emergency SOS"><AlertCircle size={20}/> SOS</button>
            {currentUser ? (
              <div style={{display:'flex',alignItems:'center',gap:'0.8rem'}}>
                <button onClick={()=>setShowDashboard(true)} className="btn-magic">My Dashboard</button>
                <div onClick={()=>setShowProfile(true)} style={{cursor:'pointer'}}><AvatarPlaceholder name={currentUser.name} size={36}/></div>
              </div>
            ) : (
              <button className="btn-magic" onClick={()=>setShowAuthModal(true)}>Join / Sign In</button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && <AuthModal onClose={()=>setShowAuthModal(false)} onLogin={handleLogin} addToast={addToast}/>}
      </AnimatePresence>

      {/* Volunteer Dashboard */}
      <AnimatePresence>
        {showDashboard && currentUser && (
          <VolunteerDashboard
            user={currentUser}
            addToast={addToast}
            onLogout={handleLogout}
            onOpenProfile={()=>{setShowProfile(true);setShowDashboard(false)}}
          />
        )}
      </AnimatePresence>

      {/* Profile Panel */}
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

      {/* Main Landing */}
      <main style={{position:'relative',paddingTop:'160px',paddingBottom:'100px'}}>

        {/* Hero */}
        <section style={{minHeight:'80vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 2rem'}}>
          <div className="animate-float-fast" style={{display:'inline-flex',alignItems:'center',gap:'0.5rem',background:'var(--glass-bg)',padding:'0.5rem 1.2rem',borderRadius:'100px',border:'1px solid var(--border-light)',marginBottom:'2rem',fontWeight:600,color:'var(--text-secondary)'}}>
            <span style={{color:'var(--accent-pink)'}}>●</span> AI Matching Engine V2 Now Live
          </div>
          <h1 className="hero-title reveal active">
            Turn Compassion Into <br/>
            <span className="text-gradient">Intelligent Action</span>
          </h1>
          <p className="hero-subtitle reveal active" style={{transitionDelay:'0.1s'}}>
            AI-powered platform matching 10,000+ volunteers with urgent social causes. Your next hour could change a life.
          </p>
          <div className="reveal active" style={{transitionDelay:'0.2s',display:'flex',gap:'1.5rem',marginTop:'2rem',flexWrap:'wrap',justifyContent:'center'}}>
            <button className="btn-magic" style={{padding:'1rem 2.5rem',fontSize:'1.1rem'}} onClick={()=>setShowAuthModal(true)}>Join & Find Missions</button>
            <button onClick={()=>document.getElementById('impact')?.scrollIntoView({behavior:'smooth'})} style={{padding:'1rem 2rem',fontSize:'1.1rem',borderRadius:'99px',border:'1px solid var(--border-light)',background:'var(--glass-bg)',backdropFilter:'blur(10px)',color:'var(--text-primary)',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <Activity size={18}/> See Live Impact
            </button>
          </div>
          <div className="glass-panel animate-float-slow" style={{position:'absolute',top:'20%',left:'10%',padding:'1rem',borderRadius:'16px',display:'flex',alignItems:'center',gap:'1rem'}}>
            <div style={{width:40,height:40,background:'var(--accent-highlight)',borderRadius:10,display:'grid',placeItems:'center',color:'white',fontWeight:'bold'}}>94%</div>
            <div style={{textAlign:'left'}}><div style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>Matching Accuracy</div><div style={{fontWeight:700}}>Algorithm V2</div></div>
          </div>
          <div className="glass-panel animate-float-fast" style={{position:'absolute',bottom:'20%',right:'10%',padding:'1rem',borderRadius:'16px',display:'flex',alignItems:'center',gap:'1rem',animationDelay:'1s'}}>
            <div style={{width:40,height:40,background:'var(--primary-500)',borderRadius:10,display:'grid',placeItems:'center',color:'white',fontSize:'1.5rem'}}>⚡</div>
            <div style={{textAlign:'left'}}><div style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>Response Network</div><div style={{fontWeight:700}}>30s Average Action</div></div>
          </div>
        </section>

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
              {tasks.map((task,i)=>(
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
                <div style={{height:'250px'}}><Line data={impactData} options={{maintainAspectRatio:false,scales:{y:{beginAtZero:true}},plugins:{legend:{display:false}}}}/></div>
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
                          {govtSchemes.map((s,i)=>(
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
            {leaderboard.map((v,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 2rem',borderBottom:i<leaderboard.length-1?'1px solid var(--border-light)':'none',background:i===3?'rgba(249,115,22,0.06)':'transparent'}}>
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
            {testimonials.map((t,i)=>(
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
