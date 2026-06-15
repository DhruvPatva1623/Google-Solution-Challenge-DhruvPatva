import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, KeyRound, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '0.85rem 1rem', borderRadius: '10px',
  border: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-primary)', fontSize: '0.92rem', fontFamily: 'var(--font-body)',
  outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block',
  marginBottom: '0.4rem',
};

const ORG_TYPES = ['Non-Profit (NGO)', 'Government Body', 'Educational Institution',
  'Healthcare / Hospital', 'Corporate CSR', 'Faith-Based Org', 'Community Group', 'Other'];

// ─── Demo NGO Accounts (no Firestore needed) ─────────────────────────────────
const DEMO_NGO_ACCOUNTS = [
  {
    id: 'demo-goonj',
    emoji: '🧡',
    label: 'Goonj Foundation',
    sublabel: 'Non-Profit · Delhi · ID: GOONJ1999',
    user: {
      uid: 'GOONJ1999', userId: 'GOONJ1999',
      name: 'Anshul Gupta', email: 'ngo@demo.com',
      role: 'ngo', org: 'Goonj Foundation', orgType: 'Non-Profit (NGO)',
      city: 'Delhi', area: 'Delhi', companyId: 'GOONJ1999', companyName: 'Goonj Foundation',
      regId: 'NGO-8822-DL', established: '1999',
      vision: 'Bridging the gap between urban discard and rural needs.',
      activeMissions: 14, impactScore: 9.8,
      policiesAccepted: true, isDemo: true, history: []
    }
  },
  {
    id: 'demo-cry',
    emoji: '💛',
    label: 'CRY India',
    sublabel: 'Non-Profit · Mumbai · ID: CRY1979',
    user: {
      uid: 'CRY1979', userId: 'CRY1979',
      name: 'Puja Marwaha', email: 'cry@demo.com',
      role: 'ngo', org: 'CRY India', orgType: 'Non-Profit (NGO)',
      city: 'Mumbai', area: 'Mumbai', companyId: 'CRY1979', companyName: 'CRY India',
      regId: 'NGO-1979-MH', established: '1979',
      vision: 'Child Rights and You — restoring childhoods, fulfilling promises.',
      activeMissions: 9, impactScore: 9.4,
      policiesAccepted: true, isDemo: true, history: []
    }
  },
  {
    id: 'demo-unicef',
    emoji: '💙',
    label: 'UNICEF India',
    sublabel: 'Government Body · New Delhi · ID: UNICEF-IN',
    user: {
      uid: 'UNICEF-IN', userId: 'UNICEF-IN',
      name: 'Demo Coordinator', email: 'unicef@demo.com',
      role: 'ngo', org: 'UNICEF India', orgType: 'Government Body',
      city: 'New Delhi', area: 'Pan-India', companyId: 'UNICEF-IN', companyName: 'UNICEF India',
      regId: 'UN-INDIA-001', established: '1949',
      vision: 'For every child — health, education, equality, protection.',
      activeMissions: 22, impactScore: 9.9,
      policiesAccepted: true, isDemo: true, history: []
    }
  }
];

// ─── Main Component ───────────────────────────────────────────────────────────
export function OrgAuthModal({ onClose, onLogin, addToast, theme }) {
  const [step, setStep] = useState('choose'); // choose | signin | signup | success
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  // Sign-in form
  const [signInForm, setSignInForm] = useState({ companyId: '', password: '' });

  // Sign-up form
  const [signUpForm, setSignUpForm] = useState({
    orgName: '', orgType: '', area: '', companyId: '',
    contactEmail: '', password: '', confirmPassword: '',
  });
  const [companyIdAvailable, setCompanyIdAvailable] = useState(null); // null | true | false
  const [checkingId, setCheckingId] = useState(false);

  const setSignIn = (k, v) => setSignInForm(p => ({ ...p, [k]: v }));
  const setSignUp = (k, v) => setSignUpForm(p => ({ ...p, [k]: v }));

  // ── One-click Demo Login ────────────────────────────────────────────────────
  const handleDemoLogin = (account) => {
    localStorage.setItem('currentUser', JSON.stringify(account.user));
    localStorage.setItem('isDemoLogin', 'true');
    addToast(`🏢 Demo: Logged in as ${account.label}`, 'success');
    onLogin(account.user, true);
  };

  // ── Check companyId availability ────────────────────────────────────────────
  const checkCompanyId = async (id) => {
    if (!id || id.length < 4) { setCompanyIdAvailable(null); return; }
    setCheckingId(true);
    try {
      const snap = await getDoc(doc(db, 'organizers', id.toUpperCase()));
      setCompanyIdAvailable(!snap.exists());
    } catch {
      setCompanyIdAvailable(null);
    } finally {
      setCheckingId(false);
    }
  };

  // ── Organizer Sign In ───────────────────────────────────────────────────────
  const handleSignIn = async () => {
    setError('');
    const { companyId, password } = signInForm;
    if (!companyId.trim() || !password.trim()) {
      setError('Please enter your NGO ID and password.'); return;
    }
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'organizers', companyId.toUpperCase()));
      if (!snap.exists()) { setError('Organisation ID not found. Check your NGO ID.'); return; }
      const org = snap.data();
      if (org.password !== password) { setError('Incorrect password.'); return; }

      const userData = {
        uid: org.companyId, userId: org.companyId,
        name: org.contactName || org.orgName,
        email: org.contactEmail,
        role: 'ngo', org: org.orgName, orgType: org.orgType,
        city: org.area, companyId: org.companyId, companyName: org.orgName,
        policiesAccepted: true,
        regId: org.companyId,
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      addToast(`🏢 Welcome back, ${org.orgName}!`, 'success');
      onLogin(userData, true);
    } catch (e) {
      setError('Sign in failed. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Organizer Sign Up ───────────────────────────────────────────────────────
  const handleSignUp = async () => {
    setError('');
    const { orgName, orgType, area, companyId, contactEmail, password, confirmPassword } = signUpForm;
    if (!orgName || !orgType || !area || !companyId || !contactEmail || !password) {
      setError('All fields are required.'); return;
    }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (companyIdAvailable === false) { setError('Company ID is already taken. Choose another.'); return; }
    const idRegex = /^[A-Z0-9_-]{4,20}$/;
    if (!idRegex.test(companyId.toUpperCase())) {
      setError('Company ID must be 4–20 chars, letters/numbers/dashes only.'); return;
    }
    setLoading(true);
    try {
      const orgId = companyId.toUpperCase();
      // Final uniqueness check
      const existing = await getDoc(doc(db, 'organizers', orgId));
      if (existing.exists()) { setError('Company ID already taken.'); return; }

      const orgData = {
        orgName, orgType, area, companyId: orgId,
        contactEmail, password, // NOTE: in production, hash this server-side
        contactName: orgName,
        createdAt: serverTimestamp(),
        role: 'ngo', activeMissions: 0, impactScore: 0,
        policiesAccepted: true,
      };
      await setDoc(doc(db, 'organizers', orgId), orgData);

      const userData = {
        uid: orgId, userId: orgId,
        name: orgName, email: contactEmail,
        role: 'ngo', org: orgName, orgType,
        city: area, companyId: orgId, companyName: orgName,
        policiesAccepted: true, regId: orgId,
      };
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setStep('success');
      setTimeout(() => {
        addToast(`🎉 Organisation "${orgName}" registered successfully!`, 'success');
        onLogin(userData, true);
      }, 1800);
    } catch (e) {
      setError('Registration failed. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="org-auth-container"
    >
      {/* Left branding panel */}
      <div className="org-auth-left">
        {/* Animated Background blobs & grids */}
        <div className="org-auth-dot-grid" />
        <div className="org-auth-blob org-auth-blob-1" />
        <div className="org-auth-blob org-auth-blob-2" />

        {/* Top brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 2 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'linear-gradient(135deg, #F79F1F, #e67e22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '1.2rem', color: 'white',
            boxShadow: '0 4px 12px rgba(247,159,31,0.3)',
          }}>
            C
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              CommunityConnect
            </div>
            <div style={{ fontSize: '0.68rem', color: '#F79F1F', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.1rem' }}>
              Organizer Portal
            </div>
          </div>
        </div>

        {/* Hero & Stats */}
        <div style={{ zIndex: 2, margin: 'auto 0' }}>
          <h1 style={{
            fontSize: '2.8rem', fontWeight: 900, lineHeight: 1.15,
            color: '#ffffff', letterSpacing: '-0.03em', marginBottom: '2.5rem'
          }}>
            Coordinate.<br />
            Mobilize.<br />
            <span style={{ color: '#F79F1F' }}>Create Impact.</span>
          </h1>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px', padding: '1.75rem', backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F79F1F', letterSpacing: '-0.02em', marginBottom: '0.1rem' }}>127+</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Active NGOs</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F79F1F', letterSpacing: '-0.02em', marginBottom: '0.1rem' }}>50K+</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Lives Impacted</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F79F1F', letterSpacing: '-0.02em', marginBottom: '0.1rem' }}>8.7K+</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Completed Missions</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#F79F1F', letterSpacing: '-0.02em', marginBottom: '0.1rem' }}>99.9%</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Real-time Uptime</div>
            </div>
          </div>
        </div>

        {/* Footer badges */}
        <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, color: '#cbd5e1',
              background: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem',
              borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              🏆 Google Solution Challenge '26
            </span>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, color: '#cbd5e1',
              background: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem',
              borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              ⚡ Firestore Real-time
            </span>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, color: '#cbd5e1',
              background: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem',
              borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              🔒 End-to-End Secure
            </span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="org-auth-right">
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '2rem', right: '2rem',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, width: 38, height: 38, color: '#94a3b8',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', transition: 'all 0.2s', zIndex: 10,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = '#94a3b8';
        }}
        >✕</button>

        <div className="org-auth-form-wrapper">
          {/* Gold Accent Line */}
          <div style={{
            width: 48, height: 4,
            background: '#F79F1F',
            borderRadius: 2,
            marginBottom: '2rem',
          }} />

          <AnimatePresence mode="wait">
            {/* ── CHOOSE ── */}
            {step === 'choose' && (
              <motion.div key="choose" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '14px',
                    background: 'linear-gradient(135deg, #0A3D62, #1a5276)',
                    border: '1px solid rgba(247,159,31,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1.25rem', boxShadow: '0 8px 24px rgba(10,61,98,0.5)',
                  }}>
                    <Building2 size={26} color="#F79F1F" />
                  </div>
                  <h2 style={{
                    fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #fff 50%, #F79F1F)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text', margin: 0,
                  }}>Organizer Portal</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
                    Access tools to publish SOS requests, launch live broadcasts, and coordinate volunteer teams.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <button onClick={() => setStep('signin')} style={{
                    width: '100%', padding: '1.1rem', borderRadius: 13, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #0A3D62 0%, #1a5276 100%)',
                    color: 'white', fontWeight: 800, fontSize: '0.98rem', letterSpacing: '0.02em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    boxShadow: '0 6px 20px rgba(10,61,98,0.4)', fontFamily: 'var(--font-body)',
                  }}>
                    <KeyRound size={18} /> Sign In with NGO ID
                  </button>
                  <button onClick={() => setStep('signup')} style={{
                    width: '100%', padding: '1.1rem', borderRadius: 13, cursor: 'pointer',
                    background: 'rgba(247,159,31,0.08)',
                    border: '1px solid rgba(247,159,31,0.3)',
                    color: '#F79F1F', fontWeight: 700, fontSize: '0.98rem', letterSpacing: '0.02em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                    fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                  }}>
                    <Sparkles size={18} /> Register New Organisation
                  </button>
                  <button onClick={onClose} style={{
                    background: 'none', border: 'none', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.88rem', padding: '0.5rem',
                    fontFamily: 'var(--font-body)', marginTop: '0.5rem',
                  }}>
                    ← Back to Volunteer Login
                  </button>

                  {/* ── Demo Accounts ── */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem'
                    }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                        ⚡ Quick Demo Login
                      </span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {DEMO_NGO_ACCOUNTS.map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => handleDemoLogin(acc)}
                          style={{
                            width: '100%', padding: '0.85rem 1.1rem', borderRadius: 12,
                            border: '1px solid rgba(247,159,31,0.15)',
                            background: 'rgba(247,159,31,0.04)',
                            cursor: 'pointer', textAlign: 'left',
                            display: 'flex', alignItems: 'center', gap: '0.85rem',
                            transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(247,159,31,0.10)';
                            e.currentTarget.style.borderColor = 'rgba(247,159,31,0.35)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(247,159,31,0.04)';
                            e.currentTarget.style.borderColor = 'rgba(247,159,31,0.15)';
                          }}
                        >
                          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{acc.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                              {acc.label}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {acc.sublabel}
                            </div>
                          </div>
                          <span style={{ fontSize: '0.68rem', background: 'rgba(247,159,31,0.15)', color: '#F79F1F', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 800, letterSpacing: '0.05em' }}>DEMO</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SIGN IN ── */}
            {step === 'signin' && (
              <motion.div key="signin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => { setStep('choose'); setError(''); }} style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem',
                  marginBottom: '1.5rem', fontFamily: 'var(--font-body)', padding: 0,
                }}>
                  <ArrowLeft size={15} /> Back
                </button>

                <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                  <h2 style={{
                    fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #fff 50%, #F79F1F)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0,
                  }}>Organizer Sign In</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
                    Enter your unique NGO ID and secure key to unlock special coordination functions.
                  </p>
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '0.85rem 1.1rem', fontSize: '0.88rem', color: '#f87171', marginBottom: '1.25rem' }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={labelStyle}>NGO / Company ID</label>
                    <input
                      autoComplete="off" style={inputStyle}
                      placeholder="e.g., GOONJ1999 or CRY1979"
                      value={signInForm.companyId}
                      onChange={e => setSignIn('companyId', e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        autoComplete="new-password"
                        style={{ ...inputStyle, paddingRight: '2.8rem' }}
                        type={showPass ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={signInForm.password}
                        onChange={e => setSignIn('password', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                      />
                      <button onClick={() => setShowPass(p => !p)} style={{
                        position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center',
                      }}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button onClick={handleSignIn} disabled={loading} style={{
                  width: '100%', padding: '1.1rem', border: 'none', borderRadius: 13,
                  background: 'linear-gradient(135deg, #0A3D62 0%, #1a5276 100%)',
                  color: 'white', fontWeight: 800, fontSize: '0.98rem', cursor: loading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  boxShadow: '0 6px 20px rgba(10,61,98,0.4)', fontFamily: 'var(--font-body)',
                }}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <><KeyRound size={17} /> Sign In to Organizer Panel</>}
                </button>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  No account?{' '}
                  <span onClick={() => { setStep('signup'); setError(''); }} style={{ color: '#F79F1F', cursor: 'pointer', fontWeight: 700 }}>
                    Register your organisation
                  </span>
                </p>
              </motion.div>
            )}

            {/* ── SIGN UP ── */}
            {step === 'signup' && (
              <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button onClick={() => { setStep('choose'); setError(''); }} style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem',
                  marginBottom: '1.5rem', fontFamily: 'var(--font-body)', padding: 0,
                }}>
                  <ArrowLeft size={15} /> Back
                </button>

                <div style={{ textAlign: 'left', marginBottom: '1.75rem' }}>
                  <h2 style={{
                    fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #fff 50%, #F79F1F)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0,
                  }}>Register Organisation</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
                    Establish a verified organizer account to broadcast emergencies and recruit volunteers.
                  </p>
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '0.85rem 1.1rem', fontSize: '0.88rem', color: '#f87171', marginBottom: '1.25rem' }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {/* Organisation Name */}
                  <div>
                    <label style={labelStyle}>Organisation Name *</label>
                    <input autoComplete="off" style={inputStyle} placeholder="e.g., Red Cross Delhi"
                      value={signUpForm.orgName} onChange={e => setSignUp('orgName', e.target.value)} />
                  </div>

                  {/* Org Type */}
                  <div>
                    <label style={labelStyle}>Organisation Type *</label>
                    <select
                      value={signUpForm.orgType}
                      onChange={e => setSignUp('orgType', e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">Select type…</option>
                      {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Area / City */}
                  <div>
                    <label style={labelStyle}>Operating Area / City *</label>
                    <input autoComplete="off" style={inputStyle} placeholder="e.g., Delhi NCR"
                      value={signUpForm.area} onChange={e => setSignUp('area', e.target.value)} />
                  </div>

                  {/* Company ID */}
                  <div>
                    <label style={labelStyle}>
                      Unique NGO ID *
                      <span style={{ marginLeft: '0.4rem', fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: '#94a3b8' }}>
                        (letters/numbers only — used to login)
                      </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        autoComplete="off" style={{ ...inputStyle, paddingRight: '2.5rem', textTransform: 'uppercase' }}
                        placeholder="e.g., REDCROSS-DL"
                        value={signUpForm.companyId}
                        onChange={e => {
                          const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                          setSignUp('companyId', val);
                          setCompanyIdAvailable(null);
                        }}
                        onBlur={e => checkCompanyId(e.target.value)}
                      />
                      <div style={{ position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem' }}>
                        {checkingId && <Loader2 size={15} className="animate-spin" color="var(--text-secondary)" />}
                        {companyIdAvailable === true && <CheckCircle size={15} color="#10b981" />}
                        {companyIdAvailable === false && <span style={{ color: '#f87171', fontSize: '0.75rem' }}>Taken</span>}
                      </div>
                    </div>
                    {companyIdAvailable === true && (
                      <p style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '0.3rem', fontWeight: 600 }}>✓ ID is available</p>
                    )}
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label style={labelStyle}>Contact Email *</label>
                    <input autoComplete="off" type="email" style={inputStyle} placeholder="admin@redcross-dl.org"
                      value={signUpForm.contactEmail} onChange={e => setSignUp('contactEmail', e.target.value)} />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={labelStyle}>Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        autoComplete="new-password"
                        style={{ ...inputStyle, paddingRight: '2.8rem' }}
                        type={showPass ? 'text' : 'password'}
                        placeholder="Min. 6 characters"
                        value={signUpForm.password}
                        onChange={e => setSignUp('password', e.target.value)}
                      />
                      <button onClick={() => setShowPass(p => !p)} style={{
                        position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center',
                      }}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={labelStyle}>Confirm Password *</label>
                    <input
                      autoComplete="new-password"
                      style={inputStyle} type="password"
                      placeholder="Re-enter password"
                      value={signUpForm.confirmPassword}
                      onChange={e => setSignUp('confirmPassword', e.target.value)}
                    />
                  </div>
                </div>

                <button onClick={handleSignUp} disabled={loading} style={{
                  width: '100%', padding: '1.1rem', border: 'none', borderRadius: 13,
                  background: 'linear-gradient(135deg, #F79F1F 0%, #e67e22 100%)',
                  color: 'white', fontWeight: 800, fontSize: '0.98rem', cursor: loading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  boxShadow: '0 6px 20px rgba(247,159,31,0.35)', fontFamily: 'var(--font-body)',
                }}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={17} /> Register Organisation</>}
                </button>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Already registered?{' '}
                  <span onClick={() => { setStep('signin'); setError(''); }} style={{ color: '#F79F1F', cursor: 'pointer', fontWeight: 700 }}>
                    Sign in
                  </span>
                </p>
              </motion.div>
            )}

            {/* ── SUCCESS ── */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
                  style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.75rem',
                    boxShadow: '0 12px 30px rgba(16,185,129,0.4)',
                  }}
                >
                  <CheckCircle size={42} color="white" />
                </motion.div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  Organisation Registered!
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Your NGO profile has been created successfully. Activating your organizer dashboard...
                </p>
                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                  <Loader2 size={28} className="animate-spin" color="#F79F1F" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default OrgAuthModal;
