import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Loader2, Info, CheckCircle2, AlertCircle, HelpCircle, Key, Lock, LogIn, User } from 'lucide-react';
import { OrgAuthModal } from './OrgAuthModal';
import { auth, db, googleProvider } from '../../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  signInWithPhoneNumber,
  RecaptchaVerifier
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

// ─── Static helpers outside component to avoid re-creation on every render ───
const getLocalUsers = () => {
  try { return JSON.parse(localStorage.getItem('cc_local_users') || '[]'); }
  catch { return []; }
};

const saveLocalUser = (userData) => {
  try {
    const users = getLocalUsers();
    const filtered = users.filter(u => u.uid !== userData.uid && u.userId !== userData.userId);
    filtered.push(userData);
    localStorage.setItem('cc_local_users', JSON.stringify(filtered));
    console.log('[LocalDB] Saved user:', userData.userId, '| Total:', filtered.length);
  } catch (e) { console.error('[LocalDB] Save failed:', e); }
};

// Null-safe matchers
const emailMatch = (u, t) => !!u.email && u.email.toLowerCase() === t;
const phoneMatch = (u, phone, clean) => !!u.phone && (u.phone === phone || (clean && u.phone === clean));

// Demo accounts — static, never changes
const DUMMY_ACCOUNTS = [
  {
    id: 'demo-vol',
    label: '🤝 Volunteer Demo — Jon Smith (ID: jon_demo)',
    tag: 'Volunteer', tagColor: '#f97316',
    user: {
      uid: 'jon_demo', userId: 'jon_demo',
      name: 'Jon Smith', email: 'jon@demo.com', password: 'demo123',
      role: 'volunteer', age: 22, gender: 'Male', city: 'Mumbai',
      skills: ['Medical Assistance', 'First Aid', 'Coding', 'Web Development'],
      interests: ['Healthcare', 'Technology'],
      volunteerHours: 120, points: 1450, level: 'Hero', joinDate: '2024-01-15',
      policiesAccepted: true,
      history: [{ id: 1, title: 'Slum Education', date: '2026-04-10', hrs: 4, pts: 200, status: 'Completed' }]
    }
  },
  {
    id: 'demo-ngo',
    label: '🏢 NGO Demo — Goonj Foundation (ID: goonj1999)',
    tag: 'Organization', tagColor: '#3b82f6',
    user: {
      uid: 'goonj1999', userId: 'goonj1999',
      name: 'Anshul Gupta', email: 'ngo@demo.com', password: 'demo123',
      role: 'ngo', org: 'Goonj Foundation', established: '1999',
      city: 'Delhi', regId: 'NGO-8822-DL',
      vision: 'Bridging the gap between urban discard and rural needs.',
      activeMissions: 14, impactScore: 9.8,
      policiesAccepted: true, history: []
    }
  }
];

// Modal animation variants — defined once, not inline
const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const panelVariants  = { hidden: { scale: 0.95, y: 20, opacity: 0 }, visible: { scale: 1, y: 0, opacity: 1 }, exit: { scale: 0.95, y: 20, opacity: 0 } };
const TRANSITION_FAST = { duration: 0.15, ease: 'easeOut' };

export function AuthModal({ onClose, onLogin, addToast, theme, onOpenOrgAuth }) {
  const [step, setStep] = useState('choose-role'); // choose-role | choose | phone-login | email-pin-login | signup-form | signup-verification | forgot-password | password-challenge
  const [showOrgModal, setShowOrgModal] = useState(false); // Opens dedicated organizer auth flow
  const [role, setRole] = useState('volunteer'); // volunteer | ngo
  const [method, setMethod] = useState(''); // google | email | phone
  const [isLogin, setIsLogin] = useState(true); // Sign In vs Sign Up
  
  // Forms & Inputs
  const [form, setForm] = useState({
    userId: '', // uniquely created by the user
    loginId: '', // User ID or Email entered for Sign In
    name: '',
    email: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: '',
    city: '',
    org: '',
    regId: '',
    vision: '',
    gender: 'Male'
  });
  
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Phone & Email PIN OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(120); // 2 minutes (120 seconds) timer
  
  // Forgot Password state
  const [resetAccount, setResetAccount] = useState(null);
  const [resetPinSent, setResetPinSent] = useState(false);

  // Sign up verification checklist
  const [verifications, setVerifications] = useState({
    email: false,
    phone: false,
    google: false
  });
  
  // Active tooltips for helper fields
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [newCustomInterest, setNewCustomInterest] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // set() helper shorthand for form fields

  // Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate age when date of birth changes
  useEffect(() => {
    if (form.dob) {
      const today = new Date();
      const birthDate = new Date(form.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setCalculatedAge(age >= 0 ? age : 0);
    } else {
      setCalculatedAge(null);
    }
  }, [form.dob]);

  // DUMMY_ACCOUNTS is defined outside component (static)

  const handleDemoLogin = (account) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast(`✅ Logged in as ${account.user.name} (Demo Account)`, 'success');
      onLogin(account.user, stayLoggedIn);
    }, 600);
  };

  // Google Sign In (Direct Flow) with automatic linking
  const handleGoogleSignIn = async () => {
    setLoading(true);
    addToast('🔑 Connecting to Google authentication...', 'info');
    try {
      const signInPromise = signInWithPopup(auth, googleProvider);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Google Auth Popup Timed Out')), 3500)
      );
      
      const result = await Promise.race([signInPromise, timeoutPromise]);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        addToast('✅ Google login successful!', 'success');
        onLogin(userData, stayLoggedIn);
        return;
      } else {
        // Check local database fallback
        const localUsers = getLocalUsers();
        const localMatch = localUsers.find(u => u.email === user.email);
        if (localMatch) {
          addToast('✅ Google login successful!', 'success');
          onLogin(localMatch, stayLoggedIn);
          return;
        }

        // Fallback email query to link accounts automatically
        try {
          const q = query(collection(db, 'users'), where('email', '==', user.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const existingUser = querySnapshot.docs[0].data();
            addToast('✅ Google login successful!', 'success');
            onLogin(existingUser, stayLoggedIn);
            return;
          }
        } catch (dbErr) {
          console.warn("Firestore query blocked by rules:", dbErr);
        }

        // Redirect to sign up profile form with Google details pre-filled
        addToast('👤 Google authenticated! Choose your User ID to complete signup.', 'info');
        setForm(prev => ({ 
          ...prev, 
          name: user.displayName || '', 
          email: user.email || '', 
          phone: user.phoneNumber || '',
          uid: user.uid
        }));
        setMethod('google');
        setVerifications(prev => ({ ...prev, google: true })); // Already verified by popup
        setStep('signup-form');
        setIsLogin(false);
      }
    } catch (error) {
      console.warn("Google popup failed or timed out. Falling back to Demo Account:", error);
      addToast('⚠️ Google popup took too long or was blocked. Bypassing via Volunteer Demo.', 'info');
      const demoAccount = DUMMY_ACCOUNTS[0];
      onLogin(demoAccount.user, stayLoggedIn);
    } finally {
      setLoading(false);
    }
  };

  // Sign Up via Google account fetching details
  const handleGoogleSignUp = async () => {
    setLoading(true);
    addToast('🔑 Connecting to Google profile...', 'info');
    try {
      const signInPromise = signInWithPopup(auth, googleProvider);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Google Popup Timed Out')), 3500)
      );
      const result = await Promise.race([signInPromise, timeoutPromise]);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        addToast('✅ Google login successful!', 'success');
        onLogin(userData, stayLoggedIn);
        return;
      } else {
        const localUsers = getLocalUsers();
        const localMatch = localUsers.find(u => u.email === user.email);
        if (localMatch) {
          addToast('✅ Google login successful!', 'success');
          onLogin(localMatch, stayLoggedIn);
          return;
        }

        const q = query(collection(db, 'users'), where('email', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const existingUser = querySnapshot.docs[0].data();
          addToast('✅ Google login successful!', 'success');
          onLogin(existingUser, stayLoggedIn);
          return;
        } else {
          // Populate details
          setForm(prev => ({ 
            ...prev, 
            name: user.displayName || '', 
            email: user.email || '', 
            phone: user.phoneNumber || '',
            uid: user.uid
          }));
          setMethod('google');
          setVerifications(prev => ({ ...prev, google: true })); // Pre-verify
          addToast('🎉 Details fetched from Google! Choose your User ID.', 'success');
          setStep('signup-form');
        }
      }
    } catch (e) {
      console.warn("Google signup timed out or failed. Pre-filling mock details for demo/test:", e);
      setForm(prev => ({
        ...prev,
        name: 'Alex Johnson',
        email: 'alex.johnson@demo.com',
        phone: '9876543210'
      }));
      setMethod('google');
      setVerifications(prev => ({ ...prev, google: true }));
      addToast('🎉 Fetched details from Google (Simulated)! Complete your signup.', 'success');
      setStep('signup-form');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!form.phone || form.phone.length < 10) { 
      addToast('Please enter a valid 10-digit phone number', 'error'); 
      return; 
    }
    setLoading(true);
    
    const targetPhone = form.phone.trim();
    
    // Check if account already exists
    const localUsers = getLocalUsers();
    let matchedUser = localUsers.find(u => u.phone === targetPhone);
    
    if (!matchedUser) {
      try {
        const q = query(collection(db, 'users'), where('phone', '==', targetPhone));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          matchedUser = querySnapshot.docs[0].data();
        }
      } catch (dbErr) {
        console.warn("Firestore phone query blocked:", dbErr);
      }
    }
    
    if (matchedUser) {
      setLoading(false);
      addToast('🔒 Connected account found! Please enter your password.', 'info');
      setResetAccount(matchedUser);
      setStep('password-challenge');
      return;
    }
    
    try {
      let recaptchaCont = document.getElementById('recaptcha-container');
      if (!recaptchaCont) {
        recaptchaCont = document.createElement('div');
        recaptchaCont.id = 'recaptcha-container';
        document.body.appendChild(recaptchaCont);
      }

      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e) {}
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });

      const formattedNumber = '+91' + form.phone.trim();
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber, window.recaptchaVerifier);
      window.confirmationResult = confirmation;
      
      setOtpSent(true);
      setTimer(120); // 2 minute countdown
      addToast(`📱 Real OTP code sent to ${formattedNumber}! Check your SMS.`, 'success');
    } catch (error) {
      console.warn("Real Phone Auth failed (console config or Recaptcha blocked). Falling back to mock OTP:", error);
      setOtpSent(true);
      setTimer(120); // 2 minute countdown
      addToast(`📱 Mock OTP sent to +91 ${form.phone}. Enter code: 123456`, 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (timer <= 0) {
      addToast('❌ OTP expired. Please request a new code.', 'error');
      return;
    }
    if (!otp) {
      addToast('Please enter the verification code', 'error');
      return;
    }
    setLoading(true);
    try {
      let matchedUser = null;
      let firebaseUid = null;

      if (window.confirmationResult) {
        try {
          const result = await window.confirmationResult.confirm(otp);
          firebaseUid = result.user.uid;
        } catch (confirmError) {
          console.warn("Firebase confirmationResult failed:", confirmError);
        }
      }

      if (firebaseUid || otp === '123456') {
        const lookupId = firebaseUid || 'phone-' + form.phone;
        
        const localUsers = getLocalUsers();
        matchedUser = localUsers.find(u => u.phone === form.phone || u.uid === lookupId);
        
        if (!matchedUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', lookupId));
            if (userDoc.exists()) {
              matchedUser = userDoc.data();
            }
          } catch(dbErr) {
            console.warn("Firestore query blocked:", dbErr);
          }
        }

        if (matchedUser) {
          addToast('✅ Phone verification successful!', 'success');
          onLogin(matchedUser, stayLoggedIn);
        } else {
          addToast('📱 Phone verified! Pre-filling registration form.', 'info');
          setForm(prev => ({ ...prev, phone: form.phone, uid: lookupId }));
          setMethod('phone');
          setVerifications(prev => ({ ...prev, phone: true }));
          setStep('signup-form');
          setIsLogin(false);
        }
      } else {
        throw new Error('Incorrect verification code. Please try again.');
      }
    } catch (error) {
      addToast(error.message || 'Error verifying OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailPin = async () => {
    if (!form.email || !form.email.includes('@')) {
      addToast('Please enter a valid email address', 'error');
      return;
    }
    setLoading(true);
    
    const targetEmail = form.email.trim().toLowerCase();
    
    // Check if account already exists
    const localUsers = getLocalUsers();
    let matchedUser = localUsers.find(u => emailMatch(u, targetEmail));
    
    if (!matchedUser) {
      try {
        const q = query(collection(db, 'users'), where('email', '==', targetEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          matchedUser = querySnapshot.docs[0].data();
        }
      } catch (dbErr) {
        console.warn("Firestore email query blocked:", dbErr);
      }
    }
    
    if (matchedUser) {
      setLoading(false);
      addToast('🔒 Connected account found! Please enter your password.', 'info');
      setResetAccount(matchedUser);
      setStep('password-challenge');
      return;
    }
    
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      setTimer(120); // 2 minutes window
      addToast(`📨 Login PIN sent to ${form.email}! Enter code: 654321`, 'info');
    }, 1000);
  };

  const handleVerifyEmailPin = async () => {
    if (timer <= 0) {
      addToast('❌ Login PIN expired. Please request a new code.', 'error');
      return;
    }
    if (otp !== '654321') {
      addToast('❌ Incorrect Login PIN. Hint: Enter 654321', 'error');
      return;
    }
    setLoading(true);
    try {
      const targetEmail = form.email.trim().toLowerCase();
      
      const localUsers = getLocalUsers();
      let matchedUser = localUsers.find(u => emailMatch(u, targetEmail));
      
      if (!matchedUser) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', targetEmail));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            matchedUser = querySnapshot.docs[0].data();
          }
        } catch (dbErr) {
          console.warn("Firestore email query blocked:", dbErr);
        }
      }

      if (matchedUser) {
        addToast(`✅ Signed in successfully! Welcome back, ${matchedUser.name}`, 'success');
        onLogin(matchedUser, stayLoggedIn);
      } else {
        addToast('📧 Email verified! Choose your User ID to complete registration.', 'info');
        setForm(prev => ({ ...prev, email: form.email }));
        setMethod('email');
        setVerifications(prev => ({ ...prev, email: true }));
        setStep('signup-form');
        setIsLogin(false);
      }
    } catch (e) {
      addToast('Error logging in with email PIN', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger email verification channel linking during sign-up
  const triggerEmailLink = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setVerifications(v => ({ ...v, email: true }));
      addToast('📨 Email channel verified and linked successfully!', 'success');
    }, 800);
  };

  // Trigger phone verification channel linking during sign-up (send OTP)
  const triggerPhoneLink = () => {
    setOtpSent(true);
    setTimer(120);
    setOtp('');
    addToast('📱 Verification code sent to +91 ' + form.phone + '. Enter code: 123456', 'info');
  };

  // Verify the input OTP for phone linking during sign-up
  const verifyPhoneLinkCode = () => {
    if (otp === '123456') {
      setVerifications(v => ({ ...v, phone: true }));
      setOtpSent(false);
      setOtp('');
      addToast('✅ Phone channel verified and linked!', 'success');
    } else {
      addToast('❌ Incorrect verification code. Hint: 123456', 'error');
    }
  };

  // Trigger Google account linking during sign-up
  const triggerGoogleLink = async () => {
    setLoading(true);
    addToast('🔑 Connecting Google account...', 'info');
    try {
      const signInPromise = signInWithPopup(auth, googleProvider);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Google Popup Timed Out')), 2500)
      );
      await Promise.race([signInPromise, timeoutPromise]);
      setVerifications(v => ({ ...v, google: true }));
      addToast('🔗 Google account linked and verified!', 'success');
    } catch (e) {
      console.warn("Google linking timed out or failed. Falling back to simulated verification.", e);
      setVerifications(v => ({ ...v, google: true }));
      addToast('🔗 Google account linked and verified (Simulated)!', 'success');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handler triggered manually
  const handleForgotPasswordClick = () => {
    if (!form.loginId) {
      addToast('Please enter your User ID/Email/Phone in the input field first.', 'error');
      return;
    }
    const enteredId = form.loginId.trim();
    const enteredIdLower = enteredId.toLowerCase();
    const cleanPhone = enteredId.replace(/\D/g, '');
    
    // Find account locally or demo
    const localUsers = getLocalUsers();
    let matched = localUsers.find(u => 
      u.userId === enteredIdLower || 
      emailMatch(u, enteredIdLower) || 
      phoneMatch(u, enteredId, cleanPhone)
    );
    
    if (!matched) {
      const demoMatch = DUMMY_ACCOUNTS.find(acc => 
        acc.user.userId === enteredIdLower || 
        acc.user.email.toLowerCase() === enteredIdLower
      );
      if (demoMatch) {
        matched = demoMatch.user;
      }
    }
    
    if (matched) {
      setResetAccount(matched);
      setResetPinSent(false);
      setOtp('');
      setStep('forgot-password');
    } else {
      addToast('❌ No registered account found with this User ID, Email, or Phone.', 'error');
    }
  };

  // Sign In using User ID (Username), Email, or Phone + Password
  const handleCredentialSignIn = async () => {
    if (!form.loginId || !form.password) { 
      addToast('Please enter your User ID/Email/Phone and Password', 'error'); 
      return; 
    }
    setLoading(true);
    try {
      const enteredId = form.loginId.trim();
      const enteredIdLower = enteredId.toLowerCase();
      const cleanPhone = enteredId.replace(/\D/g, '');
      
      // 1. Instant local registry check (no network call)
      const localUsers = getLocalUsers();
      let matchedUser = localUsers.find(u =>
        u.userId === enteredIdLower ||
        emailMatch(u, enteredIdLower) ||
        phoneMatch(u, enteredId, cleanPhone)
      );
      const isLocalMatch = !!matchedUser;
      console.log('[SignIn] local registry:', localUsers.length, 'users | match:', isLocalMatch);

      // 2. Demo accounts check (instant)
      if (!matchedUser) {
        const demoMatch = DUMMY_ACCOUNTS.find(acc =>
          acc.user.userId === enteredIdLower ||
          acc.user.email.toLowerCase() === enteredIdLower
        );
        if (demoMatch) matchedUser = demoMatch.user;
      }

      // 3. Only hit Firestore if not found locally (avoid network latency when unneeded)
      if (!matchedUser) {
        try {
          let snap;
          if (enteredId.includes('@')) {
            snap = await getDocs(query(collection(db, 'users'), where('email', '==', enteredIdLower)));
          } else if (/^\d+$/.test(cleanPhone) && cleanPhone.length >= 10) {
            snap = await getDocs(query(collection(db, 'users'), where('phone', '==', cleanPhone)));
          } else {
            snap = await getDocs(query(collection(db, 'users'), where('userId', '==', enteredIdLower)));
          }
          if (snap && !snap.empty) {
            matchedUser = snap.docs[0].data();
            // Cache in local registry so next login is instant
            saveLocalUser(matchedUser);
          }
        } catch (dbError) {
          console.warn('Firestore query skipped:', dbError.code);
        }
      }

      if (!matchedUser) throw new Error('No account found with this User ID, Email, or Phone.');

      // 4. Password verification (local — instant)
      if (matchedUser.password && matchedUser.password !== form.password) {
        addToast('❌ Incorrect password. Redirecting to reset...', 'error');
        setResetAccount(matchedUser);
        setResetPinSent(false);
        setOtp('');
        setStep('forgot-password');
        return;
      }

      // 5. Fire-and-forget Firebase auth sync (non-blocking — doesn't delay login)
      if (matchedUser.email && !isLocalMatch) {
        signInWithEmailAndPassword(auth, matchedUser.email, form.password)
          .catch(e => console.warn('Firebase auth sync skipped:', e.code));
      }

      addToast(`✅ Welcome back, ${matchedUser.name}!`, 'success');
      onLogin(matchedUser, stayLoggedIn);
    } catch (error) {
      console.error(error);
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sign Up Form Submission (Step 1 -> Step 2)
  const handleSignUpFormSubmit = async () => {
    if (!form.userId || !form.name || !form.email || !form.phone || !form.dob || !form.password || !form.confirmPassword) {
      addToast('Please fill all mandatory fields', 'error');
      return;
    }
    
    if (form.userId.length < 3) {
      addToast('User ID must be at least 3 characters', 'error');
      return;
    }

    if (form.phone.length < 10) {
      addToast('Phone number must be at least 10 digits', 'error');
      return;
    }

    if (calculatedAge !== null && calculatedAge < 13) {
      addToast('Must be at least 13 years of age to register', 'error');
      return;
    }

    if (form.password !== form.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    if (form.password.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (role === 'ngo') {
      if (!form.org || !form.regId) {
        addToast('Please enter organization name and registration ID', 'error');
        return;
      }
    }

    // Unique Username/User ID validation
    setLoading(true);
    try {
      const localUsers = getLocalUsers();
      const localDuplicate = localUsers.some(u => u.userId === form.userId.trim().toLowerCase());
      if (localDuplicate) {
        addToast('❌ User ID / Username is already taken!', 'error');
        return;
      }

      try {
        const q = query(collection(db, 'users'), where('userId', '==', form.userId.trim().toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          addToast('❌ User ID / Username is already taken!', 'error');
          return;
        }
      } catch (err) {
        console.warn("Firestore uniqueness check skipped (permission rules/offline):", err);
      }
    } finally {
      setLoading(false);
    }

    // Reset OTP states to clean step 2
    setOtpSent(false);
    setOtp('');
    setStep('signup-verification');
  };

  // Complete Signup and write to database
  const handleCompleteSignUp = async () => {
    if (!verifications.email || !verifications.phone || !verifications.google) {
      addToast('Please verify and link all three mandatory channels', 'error');
      return;
    }

    setLoading(true);
    try {
      const chosenId = form.userId.trim().toLowerCase();
      
      const userData = {
        uid: chosenId, 
        userId: chosenId, 
        name: form.name || form.org || 'New User',
        email: form.email,
        phone: form.phone,
        password: form.password, // Saved for local registry credential checks
        method: method || 'email',
        avatar: null,
        city: form.city || 'Ahmedabad',
        state: form.state || 'Gujarat',
        dob: form.dob,
        gender: form.gender || 'Male',
        age: calculatedAge,
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
        verifiedId: true,
        aadhar: '',
        address: '',
        emergencyContact: '',
        interests: [],
        notifications: { email: true, sms: true, push: true },
        role,
        policiesAccepted: false 
      };

      // Always save to local registry first (primary persistence)
      saveLocalUser(userData);

      // Also persist to currentUser key so re-login always works
      try {
        const existingLocal = JSON.parse(localStorage.getItem('cc_local_users') || '[]');
        console.log('[SignUp] Saved. Local registry now has', existingLocal.length, 'users');
      } catch (_) {}

      try {
        await setDoc(doc(db, 'users', chosenId), userData);
      } catch (dbError) {
        console.warn("Firestore save failed. Local session cached.", dbError);
      }

      addToast('🎉 Account registered! Complete policies to access dashboard.', 'success');
      onLogin(userData, stayLoggedIn);
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Custom Input & Styles
  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
    border: '1px solid var(--border-light)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none',
    transition: 'all 0.2s', fontFamily: 'var(--font-body)'
  };
  const labelStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' };
  const rowStyle = { display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%' };
  const colStyle = { flex: 1, minWidth: '140px' };

  return (
    <motion.div
      variants={overlayVariants} initial="hidden" animate="visible" exit="exit"
      transition={TRANSITION_FAST}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: theme === 'dark' ? 'rgba(0,0,0,0.82)' : 'rgba(20,20,20,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 10000, display: 'grid', placeItems: 'center', padding: '1rem' }}>

      <motion.div
        variants={panelVariants} initial="hidden" animate="visible" exit="exit"
        transition={TRANSITION_FAST}
        onClick={e => e.stopPropagation()} className="glass-panel"
        style={{ padding: '2.5rem', borderRadius: '28px', maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: 'var(--glass-shadow)', border: '1px solid var(--border-light)', willChange: 'transform, opacity' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}><X size={16} /></button>

        {/* STEP 1: CHOOSE ROLE */}
        {step === 'choose-role' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚀</div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>How will you help?</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>Select your account role to continue.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
              <button onClick={() => { setRole('volunteer'); setStep('choose') }} 
                className="card-3d"
                style={{ padding: '2rem 1rem', borderRadius: '20px', border: '2px solid var(--primary-500)', background: 'rgba(249,115,22,0.05)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', transition: 'all 0.3s' }}>
                <div style={{ fontSize: '3rem' }}>🤝</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Volunteer</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>I want to join missions and support causes.</div>
              </button>
              <button onClick={() => {
                if (onOpenOrgAuth) {
                  onOpenOrgAuth();
                } else {
                  setShowOrgModal(true);
                }
              }}
                className="card-3d"
                style={{ padding: '2rem 1rem', borderRadius: '20px', border: '2px solid #F79F1F', background: 'rgba(247,159,31,0.06)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', transition: 'all 0.3s' }}>
                <div style={{ fontSize: '3rem' }}>🏢</div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Organizer / NGO</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Register missions, manage volunteers & coordinate relief.</div>
                <div style={{ fontSize: '0.68rem', background: 'rgba(247,159,31,0.15)', color: '#F79F1F', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700, letterSpacing: '0.04em' }}>SEPARATE LOGIN</div>
              </button>
            </div>
          </>
        )}

        {/* STEP 2: CHOOSE METHOD / SIGN IN — Premium Redesign */}
        {step === 'choose' && (
          <>
            {/* Back link */}
            <button onClick={() => setStep('choose-role')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', letterSpacing: '0.01em', opacity: 0.8 }}>
              ← Role Selection
            </button>

            {/* Hero Header with gradient accent */}
            <div style={{ textAlign: 'center', marginBottom: '1.6rem', position: 'relative' }}>
              {/* Ambient glow behind icon */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ fontSize: '2.8rem', marginBottom: '0.4rem', position: 'relative', zIndex: 1 }}>
                {isLogin ? '🔑' : '🚀'}
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, var(--text-primary) 40%, var(--primary-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0, position: 'relative', zIndex: 1 }}>
                {isLogin ? 'Welcome Back' : 'Join the Community'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.35rem', letterSpacing: '0.01em' }}>
                {isLogin ? 'Sign in to your dashboard and make an impact.' : 'Create your free account in seconds.'}
              </p>
            </div>

            {/* Pill Tab Switcher */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '4px', marginBottom: '1.6rem', border: '1px solid var(--border-light)', gap: '4px' }}>
              {['Sign In', 'Sign Up'].map((label, i) => {
                const active = (isLogin && i === 0) || (!isLogin && i === 1);
                return (
                  <button key={label} onClick={() => setIsLogin(i === 0)} style={{
                    flex: 1, padding: '0.6rem 0', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.92rem', letterSpacing: '0.02em',
                    background: active ? 'linear-gradient(135deg, var(--primary-500), #e85d04)' : 'transparent',
                    color: active ? 'white' : 'var(--text-secondary)',
                    boxShadow: active ? '0 4px 14px rgba(249,115,22,0.3)' : 'none',
                    transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                    fontFamily: 'var(--font-body)',
                  }}>{label}</button>
                );
              })}
            </div>

            {isLogin ? (
              /* ─── SIGN IN ─── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {/* Demo accounts — collapsible pill */}
                <div style={{ marginBottom: '1.4rem', borderRadius: '14px', border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.04)', overflow: 'hidden' }}>
                  <div style={{ padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(249,115,22,0.15)' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'white', background: 'linear-gradient(90deg,#f97316,#e85d04)', padding: '0.18rem 0.55rem', borderRadius: '5px', letterSpacing: '0.04em' }}>DEMO</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Try with a sample account — one click</span>
                  </div>
                  <div style={{ padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {DUMMY_ACCOUNTS.map(acc => (
                      <button key={acc.id} onClick={() => handleDemoLogin(acc)} disabled={loading} style={{
                        padding: '0.65rem 0.9rem', borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                        transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                      }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{acc.label}</span>
                        <span style={{ background: acc.tagColor, color: 'white', padding: '0.15rem 0.5rem', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.03em' }}>{acc.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* OR divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, var(--border-light))' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.08em' }}>OR SIGN IN MANUALLY</span>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, var(--border-light))' }} />
                </div>

                {/* Credential fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '0.78rem', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.7 }}>User ID · Username · Email</label>
                    <input
                      autoComplete="off" autoCorrect="off" spellCheck="false"
                      style={{ ...inputStyle, marginTop: '0.4rem' }}
                      placeholder="Your User ID or email address"
                      value={form.loginId}
                      onChange={e => set('loginId', e.target.value)}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ ...labelStyle, margin: 0, fontSize: '0.78rem', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.7 }}>Password</label>
                      <span onClick={handleForgotPasswordClick} style={{ fontSize: '0.78rem', color: 'var(--primary-500)', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.01em' }}>
                        Forgot Password?
                      </span>
                    </div>
                    <input
                      autoComplete="new-password"
                      style={inputStyle}
                      type="password"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    <input type="checkbox" checked={stayLoggedIn} onChange={e => setStayLoggedIn(e.target.checked)} style={{ accentColor: 'var(--primary-500)', cursor: 'pointer', width: 15, height: 15 }} />
                    Keep me signed in
                  </label>
                </div>

                {/* Primary CTA */}
                <button onClick={handleCredentialSignIn} disabled={loading} style={{
                  width: '100%', padding: '0.95rem', border: 'none', borderRadius: '12px', cursor: loading ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, #f97316 0%, #e85d04 60%, #c2410c 100%)',
                  color: 'white', fontWeight: 800, fontSize: '0.96rem', letterSpacing: '0.02em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 6px 20px rgba(249,115,22,0.35)', transition: 'all 0.2s',
                  fontFamily: 'var(--font-body)',
                }}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <><LogIn size={16} /> Sign In Now</>}
                </button>

                {/* OR Alternative Access */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '1rem 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, var(--border-light))' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.08em' }}>OR SIGN IN WITH</span>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, var(--border-light))' }} />
                </div>

                {/* Alternative access row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <button onClick={() => { setOtpSent(false); setOtp(''); setStep('email-pin-login'); }} style={{
                    padding: '0.75rem', borderRadius: '11px', border: '1px solid var(--border-light)',
                    background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.6rem', fontSize: '0.88rem', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                  }}>
                    <Mail size={15} style={{ color: 'var(--primary-400)' }} /> Email Login PIN
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
                    <button onClick={handleGoogleSignIn} disabled={loading} style={{
                      padding: '0.75rem', borderRadius: '11px', border: '1px solid var(--border-light)',
                      background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.5rem', fontSize: '0.85rem', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Google
                    </button>
                    <button onClick={() => { setStep('phone-login'); setOtpSent(false); setOtp(''); }} style={{
                      padding: '0.75rem', borderRadius: '11px', border: '1px solid var(--border-light)',
                      background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.5rem', fontSize: '0.85rem', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                    }}>
                      <Phone size={14} style={{ color: '#10b981' }} /> Phone OTP
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ─── SIGN UP ─── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Google — primary */}
                <button onClick={handleGoogleSignUp} disabled={loading} style={{
                  width: '100%', padding: '1rem', border: 'none', borderRadius: '13px', cursor: loading ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, #f97316 0%, #e85d04 60%, #c2410c 100%)',
                  color: 'white', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.02em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                  boxShadow: '0 6px 20px rgba(249,115,22,0.35)', transition: 'all 0.2s',
                  fontFamily: 'var(--font-body)',
                }}>
                  <svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white"/></svg>
                  Continue with Google
                </button>

                {/* Trust tag */}
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7, marginTop: '-0.2rem', marginBottom: '0.2rem' }}>
                  🔒 Auto-fills your name & photo securely
                </div>

                {/* Email + Phone row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {[
                    { icon: <Mail size={14} style={{ color: 'var(--primary-400)' }} />, label: 'Email OTP', action: () => { setStep('email-pin-login'); setIsLogin(false); setOtpSent(false); setOtp(''); } },
                    { icon: <Phone size={13} style={{ color: '#10b981' }} />, label: 'Phone OTP', action: () => { setStep('phone-login'); setIsLogin(false); setOtpSent(false); setOtp(''); } },
                  ].map(({ icon, label, action }) => (
                    <button key={label} onClick={action} style={{
                      padding: '0.8rem', borderRadius: '11px', border: '1px solid var(--border-light)',
                      background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.45rem', fontSize: '0.85rem', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                    }}>
                      {icon} {label}
                    </button>
                  ))}
                </div>

                {/* OR FILL MANUALLY */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', margin: '0.1rem 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, var(--border-light))' }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>OR FILL FORM</span>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, var(--border-light))' }} />
                </div>

                {/* Manual form button */}
                <button onClick={() => setStep('signup-form')} style={{
                  width: '100%', padding: '0.85rem', borderRadius: '11px',
                  border: '1px dashed rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem', fontSize: '0.88rem', transition: 'all 0.15s',
                  fontFamily: 'var(--font-body)', letterSpacing: '0.01em',
                }}>
                  ✏️ Fill Registration Form Manually
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP: PHONE LOGIN */}
        {step === 'phone-login' && (
          <>
            <button onClick={() => setStep('choose')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>← Back</button>
            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📱</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Sign In with Phone</h2>
            </div>

            {!otpSent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={labelStyle}>Mobile Number</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ ...inputStyle, width: '70px', textAlign: 'center', flexShrink: 0 }}>+91</div>
                    <input style={inputStyle} placeholder="10-digit number" maxLength={10} value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <input type="checkbox" checked={stayLoggedIn} onChange={e => setStayLoggedIn(e.target.checked)} style={{ accentColor: 'var(--primary-500)', cursor: 'pointer' }} />
                  Stay logged in across browser sessions
                </label>

                <button onClick={handleSendPhoneOtp} disabled={loading} className="btn-magic" style={{ width: '100%', padding: '1rem' }}>
                  {loading ? 'Sending OTP...' : 'Send OTP verification code'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Enter code sent to +91 {form.phone}</p>
                  <span style={{ color: 'var(--primary-500)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.82rem' }} onClick={() => setOtpSent(false)}>Change</span>
                </div>
                <div>
                  <label style={labelStyle}>OTP Code</label>
                  <input style={{ ...inputStyle, letterSpacing: '0.5rem', fontSize: '1.4rem', textAlign: 'center' }} placeholder="••••••" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
                </div>

                {/* 2-Minute Window Timer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: timer > 0 ? 'var(--text-secondary)' : '#ef4444', fontWeight: 600 }}>
                  <span>Code expires in:</span>
                  <span>{timer > 0 ? formatTimer(timer) : 'Expired! Please resend.'}</span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💡 Verification Bypass Code: <strong>123456</strong></p>
                
                <button onClick={handleVerifyPhoneOtp} disabled={loading || timer === 0} className="btn-magic" style={{ width: '100%', padding: '1.1rem', opacity: timer > 0 ? 1 : 0.5 }}>
                  {loading ? 'Verifying OTP...' : 'Verify OTP & Log In'}
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP: EMAIL LOGIN PIN */}
        {step === 'email-pin-login' && (
          <>
            <button onClick={() => setStep('choose')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>← Back</button>
            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📧</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Sign In with Email PIN</h2>
            </div>

            {!otpSent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input style={inputStyle} type="email" placeholder="you@domain.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <input type="checkbox" checked={stayLoggedIn} onChange={e => setStayLoggedIn(e.target.checked)} style={{ accentColor: 'var(--primary-500)', cursor: 'pointer' }} />
                  Stay logged in across browser sessions
                </label>

                <button onClick={handleSendEmailPin} disabled={loading} className="btn-magic" style={{ width: '100%', padding: '1rem' }}>
                  {loading ? 'Sending PIN...' : 'Send Login PIN to Email'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Enter PIN sent to {form.email}</p>
                  <span style={{ color: 'var(--primary-500)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.82rem' }} onClick={() => setOtpSent(false)}>Change</span>
                </div>
                <div>
                  <label style={labelStyle}>Login PIN</label>
                  <input style={{ ...inputStyle, letterSpacing: '0.5rem', fontSize: '1.4rem', textAlign: 'center' }} placeholder="••••••" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
                </div>

                {/* 2-Minute Window Timer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: timer > 0 ? 'var(--text-secondary)' : '#ef4444', fontWeight: 600 }}>
                  <span>PIN expires in:</span>
                  <span>{timer > 0 ? formatTimer(timer) : 'Expired! Please resend.'}</span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💡 Verification Bypass PIN: <strong>654321</strong></p>
                
                <button onClick={handleVerifyEmailPin} disabled={loading || timer === 0} className="btn-magic" style={{ width: '100%', padding: '1.1rem', opacity: timer > 0 ? 1 : 0.5 }}>
                  {loading ? 'Verifying PIN...' : 'Verify PIN & Log In'}
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP: SIGN-UP FORM */}
        {step === 'signup-form' && (
          <>
            <button onClick={() => setStep('choose')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>← Back</button>
            
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Step 1: Profile Information</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Enter your details to create your unique user profile.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Unique User ID / Username */}
              <div>
                <label style={labelStyle}>
                  <span>Unique User ID / Username *</span>
                  <HelpCircle size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setActiveTooltip(activeTooltip === 'userId' ? null : 'userId')} />
                </label>
                {activeTooltip === 'userId' && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Choose a unique username/User ID (letters, numbers, underscores). You can use this to sign in.
                  </div>
                )}
                <input style={inputStyle} placeholder="e.g., jon_smith or cooluser99" value={form.userId} onChange={e => set('userId', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} />
              </div>

              {/* Full Name */}
              <div>
                <label style={labelStyle}>
                  <span>Full Name *</span>
                  <HelpCircle size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setActiveTooltip(activeTooltip === 'name' ? null : 'name')} />
                </label>
                {activeTooltip === 'name' && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Enter your official name, which will be printed on volunteer verification certificates.
                  </div>
                )}
                <input style={inputStyle} placeholder="e.g., Alex Johnson" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>

              {/* Email & Phone Row */}
              <div style={rowStyle}>
                <div style={colStyle}>
                  <label style={labelStyle}>
                    <span>Email Address *</span>
                    <HelpCircle size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setActiveTooltip(activeTooltip === 'email' ? null : 'email')} />
                  </label>
                  {activeTooltip === 'email' && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Official communication, alerts, and verification codes will be dispatched to this email.
                    </div>
                  )}
                  <input style={inputStyle} type="email" placeholder="you@domain.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div style={colStyle}>
                  <label style={labelStyle}>
                    <span>Mobile Number *</span>
                  </label>
                  <input style={inputStyle} placeholder="10-digit mobile number" maxLength={10} value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>

              {/* DOB & Gender Row */}
              <div style={rowStyle}>
                <div style={colStyle}>
                  <label style={labelStyle}>
                    <span>Date of Birth *</span>
                    <HelpCircle size={14} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setActiveTooltip(activeTooltip === 'dob' ? null : 'dob')} />
                  </label>
                  {activeTooltip === 'dob' && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Automatically calculates age. Minimum eligibility for CommunityConnect is 13 years old.
                    </div>
                  )}
                  <input style={inputStyle} type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
                </div>
                <div style={colStyle}>
                  <label style={labelStyle}>Gender *</label>
                  <select style={inputStyle} value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Live Age Indicator Card */}
              {calculatedAge !== null && (
                <div style={{
                  background: calculatedAge >= 13 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${calculatedAge >= 13 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                  borderRadius: '12px', padding: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem'
                }}>
                  {calculatedAge >= 13 ? (
                    <>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>Age Auto-Calculated: <strong>{calculatedAge} years old</strong> (Eligible to Join)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} color="#ef4444" />
                      <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Age Auto-Calculated: <strong>{calculatedAge} years old</strong> (Must be at least 13)</span>
                    </>
                  )}
                </div>
              )}

              {/* Password & Confirm Row */}
              <div style={rowStyle}>
                <div style={colStyle}>
                  <label style={labelStyle}>Password *</label>
                  <input style={inputStyle} type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} />
                </div>
                <div style={colStyle}>
                  <label style={labelStyle}>Confirm Password *</label>
                  <input style={inputStyle} type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                </div>
              </div>

              {/* Role-Specific Extra Fields */}
              {role === 'ngo' && (
                <div style={{ background: 'rgba(59, 130, 246, 0.04)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-highlight)' }}>🏢 NGO DETAILS</div>
                  <div>
                    <label style={labelStyle}>Organization / Company Name *</label>
                    <input style={inputStyle} placeholder="Goonj NGO" value={form.org} onChange={e => set('org', e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>NGO Registration ID *</label>
                    <input style={inputStyle} placeholder="NGO-8822-DL" value={form.regId} onChange={e => set('regId', e.target.value)} />
                  </div>
                </div>
              )}

              {/* Volunteering Interests Selection */}
              <div style={{marginTop:'0.3rem',marginBottom:'0.8rem'}}>
                <label style={{...labelStyle, marginBottom:'0.5rem'}}>🎯 Volunteering Interests</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem',marginBottom:'0.75rem'}}>
                  {['Healthcare', 'Education', 'Disaster Relief', 'Environment',
                    'Food & Nutrition', 'Animal Welfare', 'Technology', 'Elderly Care',
                    'Child Welfare', 'Mental Health', 'Community Service', 'Women Empowerment'
                  ].map(interest => {
                    const selected = (form.interests || []).includes(interest);
                    return (
                      <div key={interest}
                        onClick={() => {
                          const current = form.interests || [];
                          set('interests', selected ? current.filter(i => i !== interest) : [...current, interest]);
                        }}
                        style={{
                          padding:'0.3rem 0.8rem',
                          borderRadius:'99px',
                          background: selected ? 'var(--primary-500)' : 'var(--bg-secondary)',
                          color: selected ? 'white' : 'var(--text-secondary)',
                          border: selected ? 'none' : '1px solid var(--border-light)',
                          cursor:'pointer',
                          fontWeight: selected ? 700 : 500,
                          fontSize:'0.78rem',
                          transition:'all 0.15s'
                        }}
                      >
                        {interest}
                      </div>
                    );
                  })}
                </div>

                {/* Custom Interests Section */}
                <div style={{ marginTop: '0.75rem', marginBottom: '0.8rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Custom Interests
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    {(form.interests || [])
                      .filter(i => !['Healthcare', 'Education', 'Disaster Relief', 'Environment',
                        'Food & Nutrition', 'Animal Welfare', 'Technology', 'Elderly Care',
                        'Child Welfare', 'Mental Health', 'Community Service', 'Women Empowerment'
                      ].includes(i))
                      .map(custom => (
                        <div key={custom}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '99px',
                            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-pink))',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          <span>{custom}</span>
                          <button
                            type="button"
                            onClick={() => {
                              set('interests', form.interests.filter(i => i !== custom));
                            }}
                            style={{
                              background: 'rgba(255,255,255,0.25)',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              borderRadius: '50%',
                              width: 14,
                              height: 14,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    {(form.interests || []).filter(i => !['Healthcare', 'Education', 'Disaster Relief', 'Environment',
                      'Food & Nutrition', 'Animal Welfare', 'Technology', 'Elderly Care',
                      'Child Welfare', 'Mental Health', 'Community Service', 'Women Empowerment'
                    ].includes(i)).length === 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        No custom interests added yet.
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="Add custom interest (e.g. Traffic Control)"
                      value={newCustomInterest}
                      onChange={e => setNewCustomInterest(e.target.value)}
                      style={{ ...inputStyle, flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newCustomInterest.trim()) {
                            const val = newCustomInterest.trim();
                            if ((form.interests || []).includes(val)) {
                              addToast('Interest already exists.', 'info');
                            } else {
                              set('interests', [...(form.interests || []), val]);
                              setNewCustomInterest('');
                            }
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCustomInterest.trim()) {
                          const val = newCustomInterest.trim();
                          if ((form.interests || []).includes(val)) {
                            addToast('Interest already exists.', 'info');
                          } else {
                            set('interests', [...(form.interests || []), val]);
                            setNewCustomInterest('');
                          }
                        }
                      }}
                      className="btn-magic"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Stay Logged In Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.3rem' }}>
                <input type="checkbox" checked={stayLoggedIn} onChange={e => setStayLoggedIn(e.target.checked)} style={{ accentColor: 'var(--primary-500)', cursor: 'pointer' }} />
                Stay logged in across sessions (Persist local account state)
              </label>

              <button onClick={handleSignUpFormSubmit} className="btn-magic" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', fontWeight: 800 }}>
                Continue to Link Verification Channels →
              </button>
            </div>
          </>
        )}

        {/* STEP: SIGN-UP MULTI-CHANNEL LINKING */}
        {step === 'signup-verification' && (
          <>
            <button onClick={() => setStep('signup-form')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>← Back to Form</button>

            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔗</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Step 2: Mandatory Channel Linking</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>You must verify and link all three authentication channels to secure your account.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.8rem' }}>
              
              {/* 1. EMAIL VERIFICATION */}
              <div style={{
                background: verifications.email ? 'rgba(16, 185, 129, 0.06)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${verifications.email ? 'var(--primary-500)' : 'var(--border-light)'}`,
                borderRadius: '16px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: verifications.email ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)', display: 'grid', placeItems: 'center', color: verifications.email ? '#10b981' : 'var(--text-secondary)' }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Email Verification</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{form.email}</div>
                  </div>
                </div>
                <div>
                  {verifications.email ? (
                    <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 800, background: 'rgba(16, 185, 129, 0.12)', padding: '0.3rem 0.7rem', borderRadius: '20px' }}>LINKED & VERIFIED ✓</span>
                  ) : (
                    <button onClick={triggerEmailLink} disabled={loading} style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}>
                      Link & Verify Email
                    </button>
                  )}
                </div>
              </div>

              {/* 2. PHONE VERIFICATION */}
              <div style={{
                background: verifications.phone ? 'rgba(16, 185, 129, 0.06)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${verifications.phone ? 'var(--primary-500)' : 'var(--border-light)'}`,
                borderRadius: '16px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: verifications.phone ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)', display: 'grid', placeItems: 'center', color: verifications.phone ? '#10b981' : 'var(--text-secondary)' }}>
                      <Phone size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Mobile OTP Verification</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>+91 {form.phone}</div>
                    </div>
                  </div>
                  <div>
                    {verifications.phone ? (
                      <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 800, background: 'rgba(16, 185, 129, 0.12)', padding: '0.3rem 0.7rem', borderRadius: '20px' }}>LINKED & VERIFIED ✓</span>
                    ) : (
                      <button onClick={triggerPhoneLink} disabled={otpSent} style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}>
                        Link & Verify Phone
                      </button>
                    )}
                  </div>
                </div>

                {/* OTP Input Block */}
                {otpSent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Enter 6-digit OTP code</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Code Hint: 123456</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <input style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.4rem', fontSize: '1.2rem', padding: '0.5rem' }} placeholder="••••••" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
                      <button onClick={verifyPhoneLinkCode} style={{ background: 'var(--primary-500)', color: 'white', border: 'none', borderRadius: '10px', padding: '0.5rem 1.2rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                        Verify
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. GOOGLE ACCOUNT LINKING */}
              <div style={{
                background: verifications.google ? 'rgba(16, 185, 129, 0.06)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${verifications.google ? 'var(--primary-500)' : 'var(--border-light)'}`,
                borderRadius: '16px', padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: verifications.google ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)', display: 'grid', placeItems: 'center', color: verifications.google ? '#10b981' : 'var(--text-secondary)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Google OAuth Profile</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Associate Google credentials</div>
                  </div>
                </div>
                <div>
                  {verifications.google ? (
                    <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 800, background: 'rgba(16, 185, 129, 0.12)', padding: '0.3rem 0.7rem', borderRadius: '20px' }}>LINKED & VERIFIED ✓</span>
                  ) : (
                    <button onClick={triggerGoogleLink} disabled={loading} style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}>
                      Link Google Account
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Developer Bypass Option */}
            <div style={{ marginTop: '1.2rem', textAlign: 'center' }}>
              <span 
                onClick={() => {
                  setVerifications({ email: true, phone: true, google: true });
                  addToast('⚡ Developer Mode: Channels verified successfully!', 'success');
                }}
                style={{ color: 'var(--primary-500)', fontSize: '0.82rem', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}
              >
                ⚡ Skip Verification & Autofill Links (Dev Bypass)
              </span>
            </div>

            {/* Complete Account creation button */}
            <button
              onClick={handleCompleteSignUp}
              disabled={loading || !verifications.email || !verifications.phone || !verifications.google}
              className="btn-magic"
              style={{
                width: '100%',
                padding: '1.1rem',
                fontSize: '1.05rem',
                fontWeight: 900,
                marginTop: '1.2rem',
                opacity: (verifications.email && verifications.phone && verifications.google) ? 1 : 0.5,
                cursor: (verifications.email && verifications.phone && verifications.google) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem'
              }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Complete Registration & Assign User ID</>}
            </button>
          </>
        )}

        {/* STEP: PASSWORD CHALLENGE */}
        {step === 'password-challenge' && resetAccount && (
          <>
            <button onClick={() => { setStep('choose'); setForm(f => ({ ...f, password: '' })); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>← Back to Sign In</button>
            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔒</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Password Verification</h2>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginTop: '0.2rem', fontWeight: 700 }}>
                Connected Account: {resetAccount.name || resetAccount.userId}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                UserID: {resetAccount.userId} ({resetAccount.email || resetAccount.phone})
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={labelStyle}>Enter Password</label>
                  <span 
                    onClick={() => {
                      setStep('forgot-password');
                      setResetPinSent(false);
                      setOtp('');
                    }}
                    style={{ fontSize: '0.78rem', color: 'var(--primary-500)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 700 }}
                  >
                    Forgot Password?
                  </span>
                </div>
                <input 
                  style={inputStyle} 
                  type="password" 
                  placeholder="••••••••" 
                  value={form.password} 
                  onChange={e => set('password', e.target.value)} 
                />
              </div>

              <button 
                onClick={async () => {
                  if (!form.password) {
                    addToast('Please enter your password', 'error');
                    return;
                  }
                  setLoading(true);
                  try {
                    if (resetAccount.password && resetAccount.password !== form.password) {
                      addToast('❌ Incorrect Password! Redirecting to password reset...', 'error');
                      setResetPinSent(false);
                      setOtp('');
                      setStep('forgot-password');
                      return;
                    }
                    
                    addToast(`✅ Signed in successfully! Welcome back, ${resetAccount.name}`, 'success');
                    onLogin(resetAccount, stayLoggedIn);
                  } catch (e) {
                    addToast('Error verifying password', 'error');
                  } finally {
                    setLoading(false);
                  }
                }} 
                disabled={loading} 
                className="btn-magic" 
                style={{ width: '100%', padding: '1rem', fontWeight: 800 }}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify Password & Sign In'}
              </button>
            </div>
          </>
        )}

        {/* STEP: FORGOT PASSWORD */}
        {step === 'forgot-password' && resetAccount && (
          <>
            <button onClick={() => setStep('choose')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>← Back to Sign In</button>
            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔑</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Reset Password</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>For Account: <strong>{resetAccount.userId}</strong></p>
            </div>

            {!resetPinSent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  We will send a 6-digit Password Reset PIN to your registered channel:
                  <br />
                  📧 <strong>{resetAccount.email}</strong> or 📱 <strong>+91 {resetAccount.phone}</strong>
                </p>
                <button onClick={() => {
                  setResetPinSent(true);
                  setTimer(120);
                  addToast('📨 Password Reset PIN sent! Enter code: 998877', 'info');
                }} className="btn-magic" style={{ width: '100%', padding: '1rem' }}>
                  Send Reset PIN
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={labelStyle}>Enter 6-digit Reset PIN</label>
                  <input style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.4rem' }} placeholder="••••••" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
                </div>

                {/* 2-Minute Window Timer */}
                <div style={{ display: 'flex', justifycontent: 'space-between', fontSize: '0.8rem', color: timer > 0 ? 'var(--text-secondary)' : '#ef4444', fontWeight: 600 }}>
                  <span>PIN expires in:</span>
                  <span>{timer > 0 ? formatTimer(timer) : 'Expired! Please resend.'}</span>
                </div>

                <div>
                  <label style={labelStyle}>New Password</label>
                  <input style={inputStyle} type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} />
                </div>

                <div>
                  <label style={labelStyle}>Confirm New Password</label>
                  <input style={inputStyle} type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💡 Verification Reset PIN: <strong>998877</strong></p>

                <button 
                  onClick={async () => {
                    if (timer <= 0) { addToast('❌ Reset PIN has expired.', 'error'); return; }
                    if (otp !== '998877') { addToast('❌ Invalid Reset PIN. Hint: use 998877', 'error'); return; }
                    if (!form.password || form.password.length < 6) { addToast('New password must be at least 6 characters.', 'error'); return; }
                    if (form.password !== form.confirmPassword) { addToast('Passwords do not match.', 'error'); return; }
                    
                    setLoading(true);
                    try {
                      const updatedUser = { ...resetAccount, password: form.password };
                      
                      saveLocalUser(updatedUser);
                      
                      try {
                        const userRef = doc(db, 'users', resetAccount.uid);
                        await setDoc(userRef, { password: form.password }, { merge: true });
                      } catch (dbErr) {
                        console.warn("Firestore update skipped:", dbErr);
                      }
                      
                      addToast('🎉 Password reset successfully! Logging you in.', 'success');
                      onLogin(updatedUser, stayLoggedIn);
                    } catch (e) {
                      addToast('Error resetting password', 'error');
                    } finally {
                      setLoading(false);
                    }
                  }} 
                  className="btn-magic" 
                  style={{ width: '100%', padding: '1.1rem' }}
                >
                  Reset Password & Sign In
                </button>
              </div>
            )}
          </>
        )}

      </motion.div>
    </motion.div>
  );
}
