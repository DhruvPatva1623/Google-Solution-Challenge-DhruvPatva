import { useState, useEffect, useRef } from 'react'
import { AlertCircle, Mic, Heart, Compass, Award, User, MapPin, CheckCircle, ShieldCheck, Activity, Star, Clock, AlertTriangle, ChevronRight, Menu, X, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Firebase
import { auth, db, googleProvider } from './firebase';
import { onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [toasts, setToasts] = useState([]);
  
  const cursorRef = useRef(null);
  const blobRef = useRef(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ id: user.uid, ...userDoc.data() });
        } else {
          setCurrentUser({ 
            id: user.uid, 
            email: user.email, 
            name: user.displayName,
            role: 'Volunteer' 
          });
        }
      } else {
        setCurrentUser(null);
        setShowDashboard(false);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle login
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          role: 'Volunteer',
          createdAt: serverTimestamp(),
          points: 0,
          tasksCompleted: 0
        });
      }
      
      addToast('Successfully signed in!', 'success');
      setShowAuthModal(false);
      setShowDashboard(true);
    } catch (error) {
      console.error('Login error:', error);
      addToast('Failed to sign in. Please try again.', 'error');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowDashboard(false);
      addToast('Signed out successfully', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      addToast('Failed to sign out', 'error');
    }
  };

  // Toast functions
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Cursor effects
  useEffect(() => {
    let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
    let cursorX = mouseX, cursorY = mouseY, blobX = mouseX, blobY = mouseY, running = true;
    
    const handleMouse = (e) => {
      mouseX = e.clientX; 
      mouseY = e.clientY;
    };
    
    window.addEventListener('mousemove', handleMouse);
    
    const loop = () => {
      cursorX += (mouseX - cursorX) * 0.3; 
      cursorY += (mouseY - cursorY) * 0.3;
      blobX += (mouseX - blobX) * 0.04; 
      blobY += (mouseY - blobY) * 0.04;
      
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cursorX-7}px,${cursorY-7}px)`;
      }
      if (blobRef.current) {
        blobRef.current.style.transform = `translate(${blobX}px,${blobY}px)`;
      }
      
      if (running) requestAnimationFrame(loop);
    };
    
    loop();
    
    return () => { 
      running = false; 
      window.removeEventListener('mousemove', handleMouse); 
    };
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid var(--primary-500)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="cosmic-layer" />
      <div className="particles" />
      <div className="aurora-blur" style={{top:'10%',left:'20%',width:'500px',height:'500px',background:'var(--accent-highlight)'}}/>
      <div className="aurora-blur" style={{bottom:'0%',right:'10%',width:'600px',height:'600px',background:'var(--primary-500)',animationDelay:'-4s'}}/>
      
      <div ref={blobRef} className="cursor-blob" />
      <div ref={cursorRef} className="cursor-trail" />

      <div className="app-container">
        {/* Navbar */}
        <nav className="navbar glass-panel">
          <div className="navbar-content">
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <Heart size={28} style={{color:'var(--primary-500)'}} />
              <span style={{fontWeight:800,fontSize:'1.5rem'}}>CommunityConnect</span>
            </div>
            
            <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  padding: '0.5rem',
                  background: 'transparent',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)'
                }}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {currentUser ? (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px'
                  }}>
                    <img 
                      src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.name}`} 
                      alt="Avatar"
                      style={{width:'32px',height:'32px',borderRadius:'50%'}}
                    />
                    <span style={{fontWeight:600}}>{currentUser.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn-magic"
                    style={{display:'flex',alignItems:'center',gap:'0.5rem'}}
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-magic"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {!showDashboard ? (
            <motion.main 
              key="landing"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              style={{ position: 'relative', paddingTop: '120px', minHeight: '100vh' }}
            >
              {/* Hero Section */}
              <section style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                maxWidth: '1200px',
                margin: '0 auto'
              }}>
                <h1 className="hero-title" style={{
                  fontSize: 'clamp(2.5rem, 8vw, 6rem)',
                  fontWeight: 900,
                  marginBottom: '1.5rem',
                  lineHeight: 1.1
                }}>
                  Volunteer. Impact. <span className="text-gradient">Transform.</span>
                </h1>
                
                <p className="hero-subtitle" style={{
                  fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
                  color: 'var(--text-secondary)',
                  maxWidth: '600px',
                  margin: '0 auto 2.5rem',
                  lineHeight: 1.8
                }}>
                  Join India's most intelligent volunteer coordination platform. 
                  Powered by AI, driven by compassion.
                </p>

                <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
                  <button 
                    onClick={() => currentUser ? setShowDashboard(true) : setShowAuthModal(true)}
                    className="btn-magic"
                    style={{fontSize:'1.1rem',padding:'1rem 2.5rem'}}
                  >
                    {currentUser ? 'Go to Dashboard' : 'Get Started'}
                  </button>
                  <button 
                    className="btn-secondary"
                    style={{
                      padding: '1rem 2.5rem',
                      fontSize: '1.1rem',
                      background: 'transparent',
                      border: '2px solid var(--primary-500)',
                      borderRadius: '99px',
                      color: 'var(--primary-500)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Learn More
                  </button>
                </div>
              </section>

              {/* Impact Stats */}
              <section style={{padding:'4rem 2rem',maxWidth:'1200px',margin:'0 auto'}}>
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',
                  gap:'1.5rem',
                  textAlign:'center'
                }}>
                  {[
                    {val:'50,389+',label:'Lives Impacted',icon:'❤️',color:'var(--accent-pink)'},
                    {val:'10,245+',label:'Active Volunteers',icon:'🙋‍♂️',color:'var(--primary-500)'},
                    {val:'8,742+',label:'Tasks Completed',icon:'✅',color:'var(--accent-highlight)'},
                    {val:'127+',label:'NGO Partners',icon:'🤝',color:'#fbbf24'}
                  ].map((m,i)=>(
                    <div key={i} className="card-3d glass-panel" style={{padding:'2rem'}}>
                      <div style={{fontSize:'3rem',marginBottom:'1rem'}}>{m.icon}</div>
                      <div style={{fontSize:'2.5rem',fontWeight:900,color:m.color,marginBottom:'0.5rem'}}>
                        {m.val}
                      </div>
                      <div style={{color:'var(--text-secondary)',fontWeight:600,fontSize:'0.9rem'}}>
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Features */}
              <section style={{padding:'4rem 2rem',maxWidth:'1200px',margin:'0 auto'}}>
                <h2 style={{
                  fontSize:'3rem',
                  fontWeight:900,
                  textAlign:'center',
                  marginBottom:'3rem'
                }}>
                  Why Choose Us?
                </h2>
                
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',
                  gap:'2rem'
                }}>
                  {[
                    {icon:'🎯',title:'Smart Matching',desc:'AI-powered task recommendations based on your skills and location'},
                    {icon:'📱',title:'Real-time Updates',desc:'Stay connected with live notifications and progress tracking'},
                    {icon:'🏆',title:'Gamified Experience',desc:'Earn points, unlock badges, and climb the leaderboard'},
                    {icon:'🔒',title:'Blockchain Verified',desc:'Your volunteer hours securely stored on Polygon network'}
                  ].map((f,i)=>(
                    <div key={i} className="card-3d glass-panel" style={{padding:'2rem'}}>
                      <div style={{fontSize:'3rem',marginBottom:'1rem'}}>{f.icon}</div>
                      <h3 style={{fontSize:'1.5rem',fontWeight:800,marginBottom:'0.5rem'}}>
                        {f.title}
                      </h3>
                      <p style={{color:'var(--text-secondary)',lineHeight:1.7}}>
                        {f.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Footer */}
              <footer style={{
                marginTop:'100px',
                borderTop:'1px solid rgba(255,255,255,0.05)',
                padding:'3rem 2rem',
                textAlign:'center'
              }}>
                <p style={{color:'var(--text-secondary)'}}>
                  © 2026 CommunityConnect. Built for Google Solution Challenge.
                </p>
              </footer>
            </motion.main>
          ) : (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              style={{paddingTop:'120px',minHeight:'100vh',padding:'120px 2rem 2rem'}}
            >
              <div style={{maxWidth:'1200px',margin:'0 auto'}}>
                <h1 style={{fontSize:'3rem',fontWeight:900,marginBottom:'2rem'}}>
                  Welcome back, {currentUser?.name}! 👋
                </h1>
                
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',
                  gap:'2rem',
                  marginBottom:'3rem'
                }}>
                  <div className="glass-panel" style={{padding:'2rem',borderRadius:'20px'}}>
                    <h3 style={{fontSize:'1.2rem',marginBottom:'0.5rem',color:'var(--text-secondary)'}}>
                      Your Points
                    </h3>
                    <div style={{fontSize:'3rem',fontWeight:900,color:'var(--primary-500)'}}>
                      {currentUser?.points || 0}
                    </div>
                  </div>
                  
                  <div className="glass-panel" style={{padding:'2rem',borderRadius:'20px'}}>
                    <h3 style={{fontSize:'1.2rem',marginBottom:'0.5rem',color:'var(--text-secondary)'}}>
                      Tasks Completed
                    </h3>
                    <div style={{fontSize:'3rem',fontWeight:900,color:'var(--accent-highlight)'}}>
                      {currentUser?.tasksCompleted || 0}
                    </div>
                  </div>
                  
                  <div className="glass-panel" style={{padding:'2rem',borderRadius:'20px'}}>
                    <h3 style={{fontSize:'1.2rem',marginBottom:'0.5rem',color:'var(--text-secondary)'}}>
                      Your Rank
                    </h3>
                    <div style={{fontSize:'3rem',fontWeight:900,color:'var(--accent-pink)'}}>
                      #247
                    </div>
                  </div>
                </div>

                <div className="glass-panel" style={{padding:'2rem',borderRadius:'20px'}}>
                  <h2 style={{fontSize:'2rem',fontWeight:800,marginBottom:'1.5rem'}}>
                    Available Tasks
                  </h2>
                  <p style={{color:'var(--text-secondary)',fontSize:'1.1rem'}}>
                    Task listing coming soon! Start contributing to your community.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Modal */}
        <AnimatePresence>
          {showAuthModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem'
              }}
              onClick={() => setShowAuthModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-panel"
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: '450px',
                  width: '100%',
                  padding: '3rem',
                  borderRadius: '24px',
                  textAlign: 'center'
                }}
              >
                <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🚀</div>
                <h2 style={{fontSize:'2rem',fontWeight:900,marginBottom:'1rem'}}>
                  Welcome to CommunityConnect
                </h2>
                <p style={{color:'var(--text-secondary)',marginBottom:'2rem',lineHeight:1.7}}>
                  Sign in with Google to start making a difference in your community
                </p>
                
                <button
                  onClick={handleLogin}
                  className="btn-magic"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1.1rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                    <svg width="20" height="20" viewBox="0 0 20 20">
                      <path fill="currentColor" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
                      <path fill="currentColor" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"/>
                      <path fill="currentColor" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"/>
                      <path fill="currentColor" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"/>
                    </svg>
                    Continue with Google
                  </div>
                </button>

                <button
                  onClick={() => setShowAuthModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Notifications */}
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              style={{
                position: 'fixed',
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : 'var(--primary-500)',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontWeight: 600,
                zIndex: 10000,
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
              }}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

export default App;