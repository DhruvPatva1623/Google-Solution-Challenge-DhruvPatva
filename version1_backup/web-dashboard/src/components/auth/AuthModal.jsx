import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Phone, Mail, Loader2 } from 'lucide-react';
import { auth, db, googleProvider } from '../../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function AuthModal({ onClose, onLogin, addToast, theme }) {
  const [step, setStep] = useState('choose-role'); // choose-role | choose-method | email-login | ...
  const [role, setRole] = useState('volunteer'); // volunteer | ngo
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
      id: 'demo-vol',
      label: '🤝 Volunteer Demo — Priya Sharma',
      tag: 'Volunteer',
      tagColor: '#f97316',
      user: {
        name:'Priya Sharma', email:'priya@demo.com', role:'volunteer', age:24, city:'Mumbai',
        skills:['Teaching','First Aid'], interests:['Education','Healthcare'],
        volunteerHours:120, points:1450, level:'Hero', joinDate:'2024-01-15',
        history: [{id:1, title:'Slum Education', date:'2026-04-10', hrs:4, pts:200, status:'Completed'}]
      }
    },
    {
      id: 'demo-ngo',
      label: '🏢 NGO Demo — Goonj Foundation',
      tag: 'Organization',
      tagColor: '#3b82f6',
      user: {
        name:'Anshul Gupta', email:'ngo@demo.com', role:'ngo', org:'Goonj Foundation',
        established:'1999', city:'Delhi', regId:'NGO-8822-DL',
        vision:'Bridging the gap between urban discard and rural needs.',
        activeMissions:14, impactScore:9.8,
        history: []
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

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        addToast('✅ Signed in with Google successfully!', 'success');
        onLogin(userData);
      } else {
        // Redirect to profile setup
        setForm(prev => ({ ...prev, name: user.displayName, email: user.email }));
        setMethod('google');
        setStep('profile');
      }
    } catch (error) {
      console.error(error);
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = () => {
    if (!form.phone || form.phone.length < 10) { addToast('Please enter a valid 10-digit phone number','error'); return; }
    addToast('📱 Phone auth requires Firebase recaptcha setup. Using demo mode for now.', 'info');
    setLoading(true);
    setTimeout(() => { setLoading(false); setOtpSent(true); addToast(`📱 OTP sent to +91 ${form.phone}`,'info'); }, 1200);
  };

  const handleVerifyOtp = async () => {
    if (otp !== '123456') { addToast('❌ Incorrect OTP. Hint: use 123456','error'); return; }
    setLoading(true);
    try {
      // In real world, result = await confirmationResult.confirm(otp);
      // For demo, we simulate finding or creating a user
      const mockUid = 'phone-' + form.phone;
      const userDoc = await getDoc(doc(db, 'users', mockUid));
      
      if (userDoc.exists()) {
        addToast('✅ Phone verified! Welcome back', 'success');
        onLogin(userDoc.data());
      } else {
        addToast('📱 Phone verified! Please complete your profile.', 'info');
        setForm(prev => ({ ...prev, uid: mockUid }));
        setStep('profile');
      }
    } catch (error) {
      addToast('Error verifying OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!form.email || !form.password) { addToast('Please fill all fields','error'); return; }
    if (!isLogin && form.password !== form.confirmPassword) { addToast('Passwords do not match','error'); return; }
    
    setLoading(true);
    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, form.email, form.password);
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (userDoc.exists()) {
          addToast('✅ Login successful! Welcome back 👋', 'success');
          onLogin(userDoc.data());
        } else {
          // This shouldn't happen if they signed up correctly, but handle it
          addToast('Profile not found. Please complete setup.', 'warning');
          setStep('profile');
        }
      } else {
        // Sign Up - just move to profile step, will create user in handleProfileSubmit
        setStep('profile');
      }
    } catch (error) {
      console.error(error);
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    // Role-based validation
    if (role === 'volunteer') {
      if (!form.name || !form.city || !form.dob) {
        addToast('Please fill Name, City, and Date of Birth', 'error');
        return;
      }
    } else {
      if (!form.org || !form.city || !form.regId) {
        addToast('Please fill Org Name, City, and Registration ID', 'error');
        return;
      }
    }
    
    setLoading(true);
    try {
      let uid = auth.currentUser?.uid || form.uid;
      
      // If we don't have a UID yet (Email Sign Up flow)
      if (!uid) {
        if (method === 'google') {
          uid = auth.currentUser.uid;
        } else if (method === 'email') {
          const result = await createUserWithEmailAndPassword(auth, form.email, form.password);
          uid = result.user.uid;
        } else {
          // Phone fallback - for demo we generate a unique ID if real auth isn't setup
          uid = 'user-' + Date.now();
        }
      }

      const userData = {
        uid,
        name: form.name || form.org || 'New User',
        email: form.email || auth.currentUser?.email || '',
        phone: form.phone || '',
        method: method || 'email',
        avatar: null,
        city: form.city || '',
        state: form.state || '',
        dob: form.dob || '',
        gender: form.gender || '',
        age: form.age || null,
        skills: (form.skills || []),
        languages: (form.languages || []),
        availability: form.availability || '',
        org: form.org || '',
        bio: form.bio || form.vision || '',
        established: form.established || '',
        regId: form.regId || '',
        vision: form.vision || '',
        volunteerHours: 0,
        points: 0,
        level: 'Newcomer',
        joinDate: new Date().toISOString().split('T')[0],
        verifiedId: false,
        aadhar: form.aadhar || '',
        address: form.address || '',
        emergencyContact: form.emergencyContact || '',
        interests: (form.interests || []),
        notifications: { email: true, sms: true, push: true },
        role
      };

      await setDoc(doc(db, 'users', uid), userData);
      addToast('🎉 Account created! Welcome to CommunityConnect', 'success'); 
      onLogin(userData);
    } catch (error) {
      console.error(error);
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };


  const inputStyle = {
    width:'100%', padding:'0.75rem 1rem', borderRadius:'10px',
    border:'1px solid var(--border-light)', background:'var(--bg-secondary)',
    color:'var(--text-primary)', fontSize:'0.95rem', outline:'none',
    transition:'border 0.2s', fontFamily:'var(--font-body)'
  };
  const labelStyle = { display:'block', fontWeight:600, marginBottom:'0.3rem', fontSize:'0.85rem', color:'var(--text-secondary)' };
  const rowStyle = { display:'flex', gap:'1rem', flexWrap:'wrap' };
  const colStyle = { flex:1, minWidth:'140px' };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
      style={{position:'fixed',inset:0,background:theme==='dark'?'rgba(0,0,0,0.8)':'rgba(255,255,255,0.6)',backdropFilter:'blur(8px)',zIndex:10000,display:'grid',placeItems:'center',padding:'1rem'}}>
      <motion.div initial={{scale:0.85,y:40}} animate={{scale:1,y:0}} exit={{scale:0.85,y:40}}
        onClick={e=>e.stopPropagation()} className="glass-panel"
        style={{padding:'2.5rem',borderRadius:'28px',maxWidth:'520px',width:'100%',maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
        
        {/* STEP: CHOOSE ROLE */}
        {step === 'choose-role' && (
          <>
            <div style={{textAlign:'center',marginBottom:'2rem'}}>
              <div style={{fontSize:'3.5rem',marginBottom:'1rem'}}>🚀</div>
              <h2 style={{fontSize:'2rem',fontWeight:800,color:'var(--text-primary)'}}>How will you help?</h2>
              <p style={{color:'var(--text-secondary)',marginTop:'0.5rem'}}>Choose your path to start making an impact.</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',marginBottom:'1rem'}}>
              <button onClick={()=>{setRole('volunteer');setStep('choose')}} 
                style={{padding:'2rem 1rem',borderRadius:'20px',border:'2px solid var(--primary-500)',background:'rgba(249,115,22,0.05)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem',transition:'all 0.3s'}}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'}
                onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                <div style={{fontSize:'3rem'}}>🤝</div>
                <div style={{fontWeight:800,fontSize:'1.1rem',color:'var(--text-primary)'}}>Volunteer</div>
                <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',textAlign:'center'}}>I want to join missions and earn rewards.</div>
              </button>
              <button onClick={()=>{setRole('ngo');setStep('choose')}} 
                style={{padding:'2rem 1rem',borderRadius:'20px',border:'2px solid var(--accent-highlight)',background:'rgba(59,130,246,0.05)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem',transition:'all 0.3s'}}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-5px)'}
                onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                <div style={{fontSize:'3rem'}}>🏢</div>
                <div style={{fontWeight:800,fontSize:'1.1rem',color:'var(--text-primary)'}}>Organization</div>
                <div style={{fontSize:'0.75rem',color:'var(--text-secondary)',textAlign:'center'}}>I want to create opportunities and monitor impact.</div>
              </button>
            </div>
          </>
        )}

        <button onClick={onClose} style={{position:'absolute',top:'1.2rem',right:'1.2rem',background:'var(--bg-secondary)',border:'1px solid var(--border-light)',borderRadius:'50%',width:32,height:32,display:'grid',placeItems:'center',cursor:'pointer',color:'var(--text-primary)'}}><X size={16}/></button>

        {/* STEP: CHOOSE METHOD */}
        {step === 'choose' && (
          <>
            <button onClick={()=>setStep('choose-role')} style={{background:'none',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontWeight:600,marginBottom:'1rem',display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.9rem'}}>← Back to Role</button>

            {/* Global Sign In / Sign Up Toggle */}
            <div style={{display:'flex',background:'var(--bg-secondary)',borderRadius:'12px',padding:'4px',marginBottom:'1.5rem',border:'1px solid var(--border-light)'}}>
              {['Sign In','Sign Up'].map((t,i) => (
                <button key={t} onClick={()=>setIsLogin(i===0)}
                  style={{flex:1,padding:'0.6rem',borderRadius:'9px',border:'none',cursor:'pointer',fontWeight:600,fontSize:'0.9rem',background:(isLogin&&i===0)||(!isLogin&&i===1)?'var(--primary-500)':'transparent',color:(isLogin&&i===0)||(!isLogin&&i===1)?'white':'var(--text-secondary)',transition:'all 0.2s',fontFamily:'var(--font-body)'}}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
              <div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>{isLogin ? '🔐' : '✨'}</div>
              <h2 style={{fontSize:'1.8rem'}}>{isLogin ? 'Welcome Back' : 'Join CommunityConnect'}</h2>
              <p style={{color:'var(--text-secondary)',marginTop:'0.4rem',fontSize:'0.92rem'}}>
                {isLogin ? 'Access missions, track impact, and earn rewards.' : 'Create an account to start your journey.'}
              </p>
            </div>

            {/* ── DUMMY DEMO ACCOUNTS ── remove later ── */}
            {isLogin && (
              <div style={{marginBottom:'1.5rem',background:'var(--bg-secondary)',border:'1px solid var(--primary-500)',borderRadius:'16px',padding:'1rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.8rem'}}>
                  <span style={{fontSize:'0.78rem',fontWeight:800,color:'white',background:'var(--primary-500)',padding:'0.2rem 0.6rem',borderRadius:'6px',letterSpacing:'0.03em'}}>🧪 DEMO</span>
                  <span style={{fontSize:'0.78rem',color:'var(--text-secondary)',fontWeight:600}}>Instant access to all features</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
                  {DUMMY_ACCOUNTS.map(acc => (
                    <button key={acc.id} onClick={() => handleDemoLogin(acc)} disabled={loading}
                      style={{padding:'0.8rem 1rem',borderRadius:'12px',border:'1px solid var(--border-light)',background:'var(--bg-elevated)',color:'var(--text-primary)',cursor:loading?'wait':'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.6rem',textAlign:'left',fontFamily:'var(--font-body)',transition:'all 0.2s',width:'100%',boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=acc.tagColor;e.currentTarget.style.boxShadow=`0 4px 12px ${acc.tagColor}22`}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-light)';e.currentTarget.style.boxShadow='0 2px 4px rgba(0,0,0,0.02)'}}>
                      <span style={{fontWeight:700,fontSize:'0.88rem'}}>{acc.label}</span>
                      <span style={{background:`${acc.tagColor}`,color:'white',padding:'0.2rem 0.6rem',borderRadius:'6px',fontSize:'0.72rem',fontWeight:800,flexShrink:0,whiteSpace:'nowrap'}}>{acc.tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
            <div style={{marginTop:'1.5rem',paddingTop:'1.2rem',borderTop:'1px solid var(--border-light)',textAlign:'center'}}>
              <p style={{fontSize:'0.9rem',color:'var(--text-secondary)', fontFamily:'var(--font-body)'}}>
                New to CommunityConnect?{' '}
                <span 
                  onClick={()=>{setIsLogin(false); setStep('emailauth'); setMethod('email')}}
                  style={{color:'var(--primary-500)',fontWeight:700,cursor:'pointer',textDecoration:'underline'}}
                >
                  Create an account
                </span>
              </p>
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

        {/* STEP: PROFILE SETUP */}
        {step === 'profile' && (
          <>
            <div style={{textAlign:'center',marginBottom:'2rem'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>👤</div>
              <h2 style={{fontSize:'1.6rem'}}>Complete Your {role === 'ngo' ? 'Organization' : 'Volunteer'} Profile</h2>
              <p style={{color:'var(--text-secondary)',marginTop:'0.4rem'}}>Tell us more to customize your experience.</p>
            </div>
            
            <div style={{display:'flex',flexDirection:'column',gap:'1.2rem'}}>
              {role === 'volunteer' ? (
                <>
                  <div><label style={labelStyle}>Full Name</label>
                  <input style={inputStyle} value={form.name||''} placeholder="Priya Sharma" onChange={e=>set('name',e.target.value)}/></div>
                  
                  <div style={rowStyle}>
                    <div style={colStyle}><label style={labelStyle}>City</label>
                    <input style={inputStyle} value={form.city||''} placeholder="Mumbai" onChange={e=>set('city',e.target.value)}/></div>
                    <div style={colStyle}><label style={labelStyle}>Date of Birth</label>
                    <input type="date" style={inputStyle} value={form.dob||''} onChange={e=>set('dob',e.target.value)}/></div>
                  </div>

                  <div style={rowStyle}>
                    <div style={colStyle}><label style={labelStyle}>Age</label>
                    <input type="number" style={inputStyle} value={form.age||''} placeholder="24" onChange={e=>set('age',e.target.value)}/></div>
                    <div style={colStyle}><label style={labelStyle}>Gender</label>
                    <select style={inputStyle} value={form.gender||'Male'} onChange={e=>set('gender',e.target.value)}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select></div>
                  </div>

                  <div><label style={labelStyle}>Skills (comma separated)</label>
                  <input style={inputStyle} placeholder="First Aid, Teaching..." onChange={e=>set('skills',e.target.value.split(',').map(s=>s.trim()))}/></div>
                  
                  <div><label style={labelStyle}>Interests (comma separated)</label>
                  <input style={inputStyle} placeholder="Education, Environment..." onChange={e=>set('interests',e.target.value.split(',').map(s=>s.trim()))}/></div>
                </>
              ) : (
                <>
                  <div><label style={labelStyle}>Organization / Company Name</label>
                  <input style={inputStyle} value={form.org||''} placeholder="Goonj NGO" onChange={e=>set('org',e.target.value)}/></div>
                  
                  <div style={rowStyle}>
                    <div style={colStyle}><label style={labelStyle}>City</label>
                    <input style={inputStyle} value={form.city||''} placeholder="Delhi" onChange={e=>set('city',e.target.value)}/></div>
                    <div style={colStyle}><label style={labelStyle}>Year Established</label>
                    <input type="number" style={inputStyle} value={form.established||''} placeholder="1999" onChange={e=>set('established',e.target.value)}/></div>
                  </div>

                  <div><label style={labelStyle}>Registration ID</label>
                  <input style={inputStyle} value={form.regId||''} placeholder="NGO-8822-DL" onChange={e=>set('regId',e.target.value)}/></div>
                  
                  <div><label style={labelStyle}>Mission / Vision Statement</label>
                  <textarea style={{...inputStyle, minHeight:'80px'}} placeholder="What is your organization's primary goal?" onChange={e=>set('vision',e.target.value)}/></div>
                </>
              )}

              <button 
                className="btn-magic" 
                style={{width:'100%',padding:'1rem',marginTop:'1rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem'}} 
                onClick={handleProfileSubmit}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Start My Journey'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
