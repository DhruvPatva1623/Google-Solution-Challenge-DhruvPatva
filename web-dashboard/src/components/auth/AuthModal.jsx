import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Phone, Mail } from 'lucide-react';

export function AuthModal({ onClose, onLogin, addToast }) {
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
        role:'volunteer',
        bio:'Passionate social worker with 3 years of NGO experience. Love making communities stronger through education and healthcare.',
        volunteerHours:340, points:4820, level:'Champion',
        joinDate:'2024-03-10', verifiedId:true, aadhar:'xxxx-5678',
        address:'Bandra West, Mumbai - 400050',
        emergencyContact:'Rajesh Sharma — +91 9812345678',
        interests:['Education','Healthcare','Women Empowerment'],
        notifications:{email:true, sms:true, push:true},
        history: [
          {id: 1, title: 'Blood Donation Camp', date: '2026-04-10', hrs: 4, status: 'Completed', pts: 200},
          {id: 2, title: 'Tree Plantation Drive', date: '2026-03-22', hrs: 6, status: 'Completed', pts: 300},
          {id: 3, title: 'Scholarship Form Fill-Up', date: '2026-03-05', hrs: 3, status: 'Completed', pts: 150}
        ]
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
        role:'ngo',
        bio:'NGO coordinator with 6+ years experience in disaster relief and rural development. Coordinated 500+ volunteers across 12 states.',
        volunteerHours:620, points:3950, level:'Legend',
        joinDate:'2023-08-05', verifiedId:true, aadhar:'xxxx-9012',
        address:'Vasant Kunj, New Delhi - 110070',
        emergencyContact:'Anita Verma — +91 9887654321',
        interests:['Disaster Relief','Rural Development','Education'],
        notifications:{email:true, sms:false, push:true},
        history: [
          {id: 4, title: 'Flood Relief - Kheda', date: '2026-02-15', hrs: 12, status: 'Completed', pts: 600},
          {id: 5, title: 'Rural Healthcare Camp', date: '2026-01-10', hrs: 8, status: 'Completed', pts: 400}
        ]
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
