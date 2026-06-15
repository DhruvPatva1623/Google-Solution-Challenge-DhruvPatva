import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Lock, ChevronRight, Edit3, Download, LogOut, Bell, Shield, Sliders, Globe } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { AvatarPlaceholder } from '../common/AvatarPlaceholder';
import i18n from 'i18next';

export function ProfilePanel({ user, onClose, onUpdate, addToast, onLogout, theme, setTheme }) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('personal');
  const [form, setForm] = useState({ ...user });
  const [fontSize, setFontSize] = useState(() => parseFloat(localStorage.getItem('fontSize') || '1'));
  const [newCustomInterest, setNewCustomInterest] = useState('');

  const INTEREST_OPTIONS = [
    'Healthcare', 'Education', 'Disaster Relief', 'Environment',
    'Food & Nutrition', 'Animal Welfare', 'Technology', 'Elderly Care',
    'Child Welfare', 'Mental Health', 'Community Service', 'Women Empowerment'
  ];

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleFontSizeChange = (val) => {
    setFontSize(val);
    document.documentElement.style.fontSize = `${val}rem`;
    localStorage.setItem('fontSize', val);
    addToast(`🔤 Font size set to ${val === 1 ? 'Normal' : val < 1 ? 'Small' : val < 1.2 ? 'Large' : 'Extra Large'}`, 'info');
  };

  const handleSave = async () => {
    try {
      await onUpdate(form);
      setEditing(false);
    } catch {
      addToast('❌ Failed to save profile. Please try again.', 'error');
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const handleDownloadFullProfile = () => {
    addToast('📜 Preparing your comprehensive Impact Portfolio...','info');
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        addToast('❌ Pop-up blocked! Please allow pop-ups to download.','error');
        return;
      }

      const historyRows = (user.history || []).map(h => `
        <tr>
          <td><strong>${h.title}</strong></td>
          <td>${h.date}</td>
          <td>${h.hrs}h</td>
          <td>+${h.pts} pts</td>
          <td style="color:#10b981; font-weight:700;">${h.status || 'Completed'}</td>
        </tr>
      `).join('') || `<tr><td colspan="5" style="text-align:center;color:#64748b;">No history records logged yet.</td></tr>`;

      // Calculate achievements to include in the downloaded portfolio
      const certifiedRecords = (() => {
        try { return JSON.parse(localStorage.getItem('cc_certified_records') || '{}'); } catch (e) { return {}; }
      })();
      const hasCertified = Object.keys(certifiedRecords).length > 0;
      const hrs = user.volunteerHours || 0;
      const pts = user.points || 0;
      const refs = user.referrals || 3;
      const tasks = (user.history || []).length;

      const achievementsList = [
        { icon:'🏅', title:'First Responder', earned: tasks > 0 || hrs > 0 },
        { icon:'🌟', title:'Super Volunteer', earned: hrs >= 120 },
        { icon:'🔗', title:'Community Builder', earned: refs >= 5 },
        { icon:'🏆', title:'Top 10 Achiever', earned: pts >= 3000 },
        { icon:'🌍', title:'City Hero', earned: hrs >= 10 },
        { icon:'📜', title:'Registry Certified', earned: hasCertified },
        { icon:'🚀', title:'Mission Leader', earned: tasks >= 10 },
        { icon:'💎', title:'Diamond Volunteer', earned: pts >= 5000 }
      ];

      const earnedAwardsHtml = achievementsList
        .filter(a => a.earned)
        .map(a => `<div style="display:inline-flex; align-items:center; gap:5px; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; padding:4px 8px; font-size:0.8rem; font-weight:600; margin-right:8px; margin-bottom:8px;">${a.icon} ${a.title}</div>`)
        .join('') || '<em style="color:#64748b; font-size:0.85rem;">No badges earned yet. Complete missions to unlock!</em>';

      printWindow.document.write(`
        <html>
          <head>
            <title>CommunityConnect Impact Portfolio - ${user.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
              body { margin: 0; padding: 40px; font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; }
              .portfolio { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { font-weight: 800; font-size: 1.4rem; color: #f97316; }
              .title { font-size: 1rem; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }
              .profile-box { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px; }
              .profile-box div { font-size: 0.95rem; line-height: 1.6; }
              .profile-box strong { color: #0f172a; }
              h2 { font-size: 1.2rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem; }
              th { background: #f1f5f9; color: #475569; font-weight: 700; }
              .badge { display: inline-block; background: rgba(249,115,22,0.1); color: #f97316; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.8rem; }
              .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b; }
              @media print { body { padding: 0; background: white; } .portfolio { box-shadow: none; border: none; padding: 0; } }
            </style>
          </head>
          <body>
            <div class="portfolio">
              <div class="header">
                <div class="logo">COMMUNITYCONNECT</div>
                <div class="title">Official Impact Portfolio</div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <h1 style="margin:0 0 10px; font-size:2rem; font-weight:800; color:#0f172a;">${user.name}</h1>
                <span class="badge">⭐ Level: ${user.level || 'Newcomer'}</span>
                <span class="badge" style="background:rgba(59,130,246,0.1); color:#3b82f6; margin-left:10px;">🏆 Points: ${user.points || 0}</span>
                <span class="badge" style="background:rgba(16,185,129,0.1); color:#10b981; margin-left:10px;">⏱️ Hours: ${user.volunteerHours || 0}h</span>
              </div>
 
              <div class="profile-box">
                <div>
                  <strong>City:</strong> ${user.city || 'N/A'}<br>
                  <strong>State:</strong> ${user.state || 'N/A'}<br>
                  <strong>Member Since:</strong> ${user.joinDate || 'N/A'}<br>
                  <strong>Aadhaar Verified:</strong> Last 4 digits: ${user.aadhar || 'XXXX'} (eKYC completed)
                </div>
                <div>
                  <strong>Skills:</strong> ${(user.skills || []).join(', ') || 'N/A'}<br>
                  <strong>Languages:</strong> ${(user.languages || []).join(', ') || 'N/A'}<br>
                  <strong>Official Verification ID:</strong> VR-8F3A2B92E<br>
                  <strong>Status:</strong> Active Certified Volunteer
                </div>
              </div>

              <h2>Earned Achievements & Credentials</h2>
              <div style="margin-bottom: 25px;">
                ${earnedAwardsHtml}
              </div>
 
              <h2>Volunteering Impact Record</h2>
              <table>
                <thead>
                  <tr>
                    <th>Mission / Project</th>
                    <th>Date Completed</th>
                    <th>Hours</th>
                    <th>Points</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${historyRows}
                </tbody>
              </table>
 
              <div class="footer">
                <div>
                  <strong>Registry Reference:</strong> CC-PORTFOLIO-${Math.random().toString(36).substr(2, 9).toUpperCase()}<br>
                  <strong>Generated On:</strong> ${new Date().toLocaleString()}
                </div>
                <div style="text-align: right;">
                  <div style="font-weight: 700; color:#0f172a; border-bottom:1px solid #94a3b8; padding-bottom:5px;">System Digital Seal</div>
                  CommunityConnect Verification Service
                </div>
              </div>
            </div>
            <script>setTimeout(() => { window.print(); }, 500);</script>
          </body>
        </html>
      `);
      printWindow.document.close();
      addToast('✅ Impact Portfolio downloaded! Opening print dialog...','success');
    }, 1500);
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
    {id:'history',label:'History',icon:'📜'},
    {id:'achievements',label:'Awards',icon:'🏆'},
    {id:'settings',label:'Settings',icon:'⚙️'},
  ];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'none',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
      <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.9,opacity:0}} onClick={e=>e.stopPropagation()}
        className="glass-panel" style={{width:'min(680px,100%)',maxHeight:'calc(100vh - 4rem)',borderRadius:'32px',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 30px 60px rgba(0,0,0,0.3), 0 0 100px var(--primary-500)22',border:'1px solid rgba(255,255,255,0.1)'}}>

        {/* Header */}
        <div style={{padding:'2rem',background:'linear-gradient(135deg,var(--primary-500),var(--accent-pink))',position:'relative',flexShrink:0}}>
          <button onClick={handleDownloadFullProfile} title="Download Impact Portfolio" style={{position:'absolute',top:'1rem',right:'3.5rem',background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'50%',width:32,height:32,display:'grid',placeItems:'center',cursor:'pointer',color:'white'}}><Download size={15}/></button>
          <button onClick={onClose} style={{position:'absolute',top:'1rem',right:'1rem',background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'50%',width:32,height:32,display:'grid',placeItems:'center',cursor:'pointer',color:'white'}}><X size={16}/></button>
          <div style={{display:'flex',alignItems:'center',gap:'1.5rem'}}>
            <div style={{position:'relative'}}>
              <AvatarPlaceholder name={user.name} size={80}/>
              {editing && <div style={{position:'absolute',bottom:0,right:0,background:'white',borderRadius:'50%',width:24,height:24,display:'grid',placeItems:'center',cursor:'pointer'}}><Camera size={14} color="#000"/></div>}
            </div>
            <div style={{color:'white'}}>
              <h2 style={{fontSize:'1.5rem',fontWeight:800}}>{user.name}</h2>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.2rem',flexWrap:'wrap'}}>
                <span style={{background:'rgba(255,255,255,0.2)',padding:'0.1rem 0.6rem',borderRadius:'6px',fontSize:'0.65rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  {user.role === 'ngo' ? '🏢 Organization' : '🤝 Volunteer'}
                </span>
                <span 
                  onClick={() => {
                    copyToClipboard(user.userId || user.uid);
                    if (addToast) addToast('📋 User ID copied to clipboard!', 'success');
                  }}
                  title="Click to copy User ID"
                  style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    border: '1px dashed rgba(255, 255, 255, 0.6)',
                    padding: '0.1rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)' }}
                >
                  ID: {user.userId || user.uid}
                </span>
                <p style={{opacity:0.85,fontSize:'0.9rem',width:'100%',margin:0}}>{user.org || (user.role === 'ngo' ? 'Authorized NGO' : 'Community Member')} · {user.city}</p>
              </div>
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
        <div style={{display:'flex',borderBottom:'1px solid var(--border-light)',flexShrink:0,background:'rgba(255,255,255,0.02)',backdropFilter:'blur(5px)'}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'1rem 0.5rem',background:'none',border:'none',cursor:'pointer',color:tab===t.id?'var(--primary-500)':'var(--text-secondary)',fontWeight:tab===t.id?700:500,fontSize:'0.8rem',borderBottom:tab===t.id?'3px solid var(--primary-500)':'3px solid transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.3rem',fontFamily:'var(--font-body)',transition:'all 0.2s',opacity:tab===t.id?1:0.6}}>
              <span style={{fontSize:'1.2rem'}}>{t.icon}</span><span style={{fontSize:'0.7rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.5px'}}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:'auto',padding:'2rem',background:'rgba(0,0,0,0.1)'}}>

          {tab === 'personal' && (
            <div>
              {/* Highlighted User ID Card */}
              <div style={{
                background: 'rgba(249, 115, 22, 0.08)',
                border: '1.5px dashed var(--primary-500)',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(249, 115, 22, 0.05)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                  CommunityConnect Verified User ID
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '1.2rem', fontFamily: 'monospace', color: 'var(--primary-500)', letterSpacing: '0.05em' }}>
                    {user.userId || user.uid}
                  </strong>
                  <button 
                    onClick={() => {
                      copyToClipboard(user.userId || user.uid);
                      if (addToast) addToast('📋 User ID copied!', 'success');
                    }}
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 1rem'}}>
                {fieldBlock('Full Name','name',false)}
                {fieldBlock('Gender','gender',false,'text',['Male','Female','Non-binary','Prefer not to say'])}
                {fieldBlock('Date of Birth','dob',false,'date')}
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
              {fieldBlock('Aadhaar (last 4)','aadhar',false)}
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
                <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginTop:'0.3rem',marginBottom:'0.4rem'}}>
                  {(form.interests||[]).map((s,i)=><span key={i} style={{background:'rgba(139,92,246,0.1)',color:'var(--accent-highlight)',padding:'0.3rem 0.8rem',borderRadius:'99px',fontSize:'0.82rem',fontWeight:600}}>{s}</span>)}
                </div>
                {editing && (
                  <p style={{fontSize:'0.75rem',color:'var(--primary-500)',margin:0,fontWeight:600}}>
                    ⚙️ Go to the Settings tab to manage interests.
                  </p>
                )}
              </div>
              {fieldBlock('Availability','availability',false,'text',['Weekdays only','Weekends only','Weekdays & Weekends','Flexible / Any time'])}
              {/* Activity chart */}
              <div style={{marginTop:'1.5rem',background:'rgba(255,255,255,0.03)',borderRadius:'24px',padding:'1.5rem',border:'1px solid var(--border-light)', boxShadow:'inset 0 0 20px rgba(0,0,0,0.2)'}}>
                <div style={{fontWeight:800,marginBottom:'1rem',fontSize:'0.95rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <span>📈</span> Monthly Activity
                </div>
                <div style={{height:200, width:'100%', position:'relative'}}>
                  {(() => {
                    const isDark = theme === 'dark';
                    const tickColor = isDark ? '#e2e8f0' : '#475569';
                    const gridColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.06)';
                    const barColor = isDark ? 'rgba(249,115,22,0.85)' : 'rgba(249,115,22,0.65)';
                    return (
                      <Bar 
                        data={{
                          labels:['Jan','Feb','Mar','Apr','May','Jun'],
                          datasets:[{
                            label: 'Hours',
                            data: ['Jan','Feb','Mar','Apr','May','Jun'].map((m,i) => (user.history||[]).reduce((acc,h) => new Date(h.date).getMonth() === i ? acc + (h.hrs||0) : acc, 0)),
                            backgroundColor: barColor,
                            borderColor:'var(--primary-500)',
                            borderWidth:2,
                            borderRadius:8
                          }]
                        }} 
                        options={{
                          maintainAspectRatio:false,
                          responsive:true,
                          plugins:{legend:{display:false}},
                          scales:{
                            y:{beginAtZero:true, grid:{color:gridColor}, ticks:{color:tickColor, font:{size:10}}},
                            x:{grid:{display:false}, ticks:{color:tickColor, font:{size:10}}}
                          }
                        }} 
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div>
              <div style={{fontWeight:800,fontSize:'1.1rem',marginBottom:'1.2rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                Mission History
                <span style={{fontSize:'0.75rem',background:'var(--bg-secondary)',padding:'0.2rem 0.6rem',borderRadius:'6px',color:'var(--text-secondary)',fontWeight:500}}>{(user.history||[]).length} total records</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'0.8rem'}}>
                {(user.history || []).length > 0 ? (user.history.map((h,i)=>(
                  <div key={h.id || i} style={{background:'var(--bg-secondary)',border:'1px solid var(--border-light)',borderRadius:'14px',padding:'1rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.8rem'}}>
                      <div style={{width:42,height:42,borderRadius:'12px',background:h.title.includes('Emergency')?'rgba(239,68,68,0.1)':'rgba(249,115,22,0.1)',display:'grid',placeItems:'center',fontSize:'1.2rem'}}>
                        {h.title.includes('Emergency')?'🚨':'🧡'}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:'0.9rem'}}>{h.title}</div>
                        <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{h.date} · {h.hrs}h session</div>
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:800,color:'var(--primary-500)',fontSize:'0.95rem'}}>+{h.pts} pts</div>
                      <div style={{fontSize:'0.65rem',color:'#10b981',fontWeight:700}}>● {h.status}</div>
                    </div>
                  </div>
                ))) : (
                  <div style={{textAlign:'center',padding:'3rem 1rem',color:'var(--text-secondary)'}}>
                    <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>📭</div>
                    <p>No missions logged yet. Check in to start recording your impact!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'achievements' && (
            <div>
              {(() => {
                const certifiedRecords = (() => {
                  try { return JSON.parse(localStorage.getItem('cc_certified_records') || '{}'); } catch (e) { return {}; }
                })();
                const hasCertified = Object.keys(certifiedRecords).length > 0;
                const hrs = user.volunteerHours || 0;
                const pts = user.points || 0;
                const refs = user.referrals || 3;
                const tasks = (user.history || []).length;

                const achievements = [
                  {
                    icon:'🏅', title:'First Responder', desc:'Completed your 1st emergency task',
                    earned: tasks > 0 || hrs > 0,
                    req: 'Complete at least 1 mission', stars: tasks > 0 ? 5 : 0,
                    progress: Math.min(100, (tasks > 0 ? 100 : hrs > 0 ? 60 : 0)),
                    maxLabel: '1 Task', curLabel: `${Math.min(tasks, 1)}/1`
                  },
                  {
                    icon:'🌟', title:'Super Volunteer', desc:'120+ hours of volunteer service',
                    earned: hrs >= 120,
                    req: 'Log 120+ volunteer hours', stars: Math.min(5, Math.floor((hrs/120)*5)),
                    progress: Math.min(100, (hrs/120)*100),
                    maxLabel: '120h', curLabel: `${hrs}/120h`
                  },
                  {
                    icon:'🔗', title:'Community Builder', desc:'Referred 5+ volunteers',
                    earned: refs >= 5,
                    req: 'Refer 5+ volunteers to the platform', stars: Math.min(5, Math.floor((refs/5)*5)),
                    progress: Math.min(100, (refs/5)*100),
                    maxLabel: '5 Referrals', curLabel: `${refs}/5`
                  },
                  {
                    icon:'🏆', title:'Top 10 Achiever', desc:'Earned 3,000+ impact points',
                    earned: pts >= 3000,
                    req: 'Earn 3,000+ impact points', stars: Math.min(5, Math.floor((pts/3000)*5)),
                    progress: Math.min(100, (pts/3000)*100),
                    maxLabel: '3000 pts', curLabel: `${pts}/3000`
                  },
                  {
                    icon:'🌍', title:'City Hero', desc:'Active across multiple districts',
                    earned: hrs >= 10,
                    req: 'Log hours in multiple active missions', stars: Math.min(5, Math.ceil(hrs/4)),
                    progress: Math.min(100, (hrs/40)*100),
                    maxLabel: '3 Cities', curLabel: `${Math.min(3, Math.floor(hrs/4) + (hrs > 0 ? 1 : 0))}/3`
                  },
                  {
                    icon:'📜', title:'Registry Certified', desc:'Official digital record secured',
                    earned: hasCertified,
                    req: 'Certify at least 1 mission in the digital registry', stars: hasCertified ? 5 : 0,
                    progress: hasCertified ? 100 : 0,
                    maxLabel: '1 Record', curLabel: `${hasCertified ? 1 : 0}/1`
                  },
                  {
                    icon:'🚀', title:'Mission Leader', desc:'Completed 10+ missions',
                    earned: tasks >= 10,
                    req: 'Complete 10 total missions', stars: Math.min(5, Math.floor((tasks/10)*5)),
                    progress: Math.min(100, (tasks/10)*100),
                    maxLabel: '10 Missions', curLabel: `${tasks}/10`
                  },
                  {
                    icon:'💎', title:'Diamond Volunteer', desc:'Earned Legend status',
                    earned: pts >= 5000,
                    req: 'Reach the Legend level (5000+ pts)', stars: Math.min(5, Math.floor((pts/5000)*5)),
                    progress: Math.min(100, (pts/5000)*100),
                    maxLabel: '5000 pts', curLabel: `${pts}/5000`
                  },
                ];

                const earned = achievements.filter(a => a.earned).length;

                return (
                  <div>
                    {/* Summary banner */}
                    <div style={{background:'linear-gradient(135deg,rgba(249,115,22,0.15),rgba(139,92,246,0.15))',border:'1px solid rgba(249,115,22,0.3)',borderRadius:'16px',padding:'1.2rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'1rem'}}>
                      <div style={{fontSize:'3rem'}}>🏅</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:800,fontSize:'1.1rem'}}>{earned} / {achievements.length} Awards Earned</div>
                        <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginTop:'0.2rem'}}>Keep volunteering to unlock all achievements!</div>
                        <div style={{height:6,background:'rgba(255,255,255,0.1)',borderRadius:'99px',marginTop:'0.6rem',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${(earned/achievements.length)*100}%`,background:'linear-gradient(90deg,#f97316,#8b5cf6)',borderRadius:'99px',transition:'width 1s ease'}}/>
                        </div>
                      </div>
                    </div>

                    {/* Achievement grid */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                      {achievements.map((a,i)=>(
                        <motion.div key={i} whileHover={{scale: a.earned ? 1.03 : 1.01}}
                          style={{background:'var(--bg-secondary)',border:`2px solid ${a.earned?'var(--primary-500)':'var(--border-light)'}`,borderRadius:'16px',padding:'1rem',textAlign:'center',opacity:a.earned?1:0.6,transition:'all 0.2s',position:'relative',overflow:'hidden',cursor:'pointer',boxShadow:a.earned?`0 4px 20px rgba(249,115,22,0.15)`:'none'}}
                          onClick={() => addToast(`${a.icon} ${a.title}: ${a.desc} — Progress: ${a.curLabel}`, a.earned ? 'success' : 'info')}
                        >
                          {/* Earned glow */}
                          {a.earned && <div style={{position:'absolute',inset:0,background:'radial-gradient(circle at 50% 0%,rgba(249,115,22,0.08),transparent 70%)',pointerEvents:'none'}}/>}
                          {a.earned && <div style={{position:'absolute',top:6,right:8,fontSize:'0.6rem',color:'var(--primary-500)',fontWeight:800,background:'rgba(249,115,22,0.1)',padding:'0.1rem 0.4rem',borderRadius:'4px'}}>✓ EARNED</div>}
                          
                          <div style={{fontSize:'2.2rem',marginBottom:'0.4rem'}}>{a.icon}</div>
                          <div style={{fontWeight:800,fontSize:'0.82rem',marginBottom:'0.2rem'}}>{a.title}</div>
                          <div style={{fontSize:'0.7rem',color:'var(--text-secondary)',marginBottom:'0.6rem',lineHeight:1.3}}>{a.desc}</div>
                          
                          {/* Star rating */}
                          <div style={{display:'flex',justifyContent:'center',gap:'2px',marginBottom:'0.5rem'}}>
                            {[1,2,3,4,5].map(star=>(
                              <span key={star} style={{fontSize:'0.75rem',color:star<=a.stars?'#f97316':'var(--border-light)',transition:'color 0.3s'}}>★</span>
                            ))}
                          </div>

                          {/* Progress bar */}
                          <div style={{height:4,background:'rgba(255,255,255,0.08)',borderRadius:'99px',overflow:'hidden',marginBottom:'0.3rem'}}>
                            <div style={{height:'100%',width:`${a.progress}%`,background:a.earned?'var(--primary-500)':'rgba(255,255,255,0.3)',borderRadius:'99px',transition:'width 1s ease'}}/>
                          </div>
                          <div style={{fontSize:'0.65rem',color:'var(--text-secondary)'}}>{a.curLabel}</div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Registry Certificate banner */}
                    <div style={{marginTop:'1.5rem',background:'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(236,72,153,0.1))',border:'1px solid var(--border-light)',borderRadius:'16px',padding:'1.2rem',textAlign:'center'}}>
                      <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>📜</div>
                      <div style={{fontWeight:700,marginBottom:'0.3rem'}}>Digital Registry Certificate</div>
                      <div style={{fontSize:'0.8rem',color:'var(--text-secondary)',marginBottom:'0.8rem'}}>Your volunteer service is secured in the official digital registry</div>
                      <div style={{fontSize:'0.7rem',color:'var(--accent-highlight)',fontFamily:'monospace',marginBottom:'1rem'}}>VR-8F3A2B92E · {user.joinDate}</div>
                      <div style={{display:'flex',gap:'0.7rem',justifyContent:'center',flexWrap:'wrap'}}>
                        <button onClick={handleDownloadFullProfile} style={{padding:'0.6rem 1.2rem',borderRadius:'99px',background:'var(--accent-highlight)',color:'white',border:'none',cursor:'pointer',fontWeight:600,fontSize:'0.82rem',display:'inline-flex',alignItems:'center',gap:'0.5rem'}}>
                          <Download size={13}/> Download Portfolio
                        </button>
                        <button onClick={() => addToast('🔗 Registry verification link copied!', 'success')} style={{padding:'0.6rem 1.2rem',borderRadius:'99px',background:'transparent',color:'var(--accent-highlight)',border:'1px solid var(--accent-highlight)',cursor:'pointer',fontWeight:600,fontSize:'0.82rem'}}>
                          🔗 Share Record
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {tab === 'settings' && (
            <div>
              {/* ── Notifications ── */}
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',fontWeight:800,marginBottom:'1rem',color:'var(--text-primary)',fontSize:'0.95rem'}}>
                <Bell size={16} color="var(--primary-500)"/> Notification Preferences
              </div>
              {[
                ['Email Notifications','email','📧'],
                ['SMS Alerts','sms','📱'],
                ['Push Notifications','push','🔔'],
                ['Notification Sound','sound','🔊'],
                ['Mission Updates','missions','🎯'],
                ['Weekly Impact Digest','digest','📊'],
              ].map(([label,key,icon])=>(
                <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid var(--border-light)'}}>
                  <span style={{fontWeight:500,display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.9rem'}}>{icon} {label}</span>
                  <div onClick={()=>{
                    const nextVal = !form.notifications?.[key];
                    const updatedNotifications = {...form.notifications,[key]:nextVal};
                    set('notifications', updatedNotifications);
                    onUpdate({...form, notifications: updatedNotifications});
                    addToast(`${icon} ${label} ${nextVal ? 'enabled' : 'disabled'}`, 'info');
                  }}
                    style={{width:46,height:26,borderRadius:'99px',background:form.notifications?.[key]?'var(--primary-500)':'var(--border-light)',cursor:'pointer',position:'relative',transition:'background 0.3s'}}>
                    <div style={{position:'absolute',top:3,left:form.notifications?.[key]?22:3,width:20,height:20,borderRadius:'50%',background:'white',transition:'left 0.3s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
                  </div>
                </div>
              ))}

              {/* ── Appearance ── */}
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',fontWeight:800,marginTop:'1.8rem',marginBottom:'1rem',color:'var(--text-primary)',fontSize:'0.95rem'}}>
                <Sliders size={16} color="var(--primary-500)"/> Appearance & Accessibility
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid var(--border-light)'}}>
                <span style={{fontWeight:500,display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.9rem'}}>🌐 Language / भाषा / ભાષા</span>
                <select 
                  value={localStorage.getItem('language') || 'en'} 
                  onChange={(e) => {
                    const nextLang = e.target.value;
                    i18n.changeLanguage(nextLang);
                    localStorage.setItem('language', nextLang);
                    addToast(`🌐 Language changed to ${nextLang === 'en' ? 'English' : nextLang === 'hi' ? 'Hindi' : 'Gujarati'}`, 'success');
                  }}
                  style={{padding:'0.35rem 0.8rem',borderRadius:'8px',background:'var(--bg-secondary)',border:'1px solid var(--border-light)',color:'var(--text-primary)',fontWeight:600,fontSize:'0.85rem'}}
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="hi">🇮🇳 हिन्दी</option>
                  <option value="gu">🇮🇳 ગુજરાતી</option>
                </select>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid var(--border-light)'}}>
                <span style={{fontWeight:500,display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.9rem'}}>{theme === 'dark' ? '🌙' : '☀️'} Theme Mode</span>
                <button 
                  onClick={() => {
                    const nextTheme = theme === 'dark' ? 'light' : 'dark';
                    if (setTheme) setTheme(nextTheme);
                    addToast(`🎨 Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} mode`, 'success');
                  }}
                  style={{padding:'0.4rem 1rem',borderRadius:'8px',border:'1px solid var(--primary-500)',background:'transparent',color:'var(--primary-500)',fontWeight:700,cursor:'pointer',fontSize:'0.85rem'}}
                >
                  {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </button>
              </div>

              {/* Font Size Slider */}
              <div style={{padding:'0.75rem 0',borderBottom:'1px solid var(--border-light)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.6rem'}}>
                  <span style={{fontWeight:500,display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.9rem'}}>🔤 Font Size</span>
                  <span style={{fontSize:'0.8rem',color:'var(--primary-500)',fontWeight:700}}>
                    {fontSize <= 0.85 ? 'Small' : fontSize <= 1 ? 'Normal' : fontSize <= 1.15 ? 'Large' : 'Extra Large'}
                  </span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'0.8rem'}}>
                  <span style={{fontSize:'0.7rem',color:'var(--text-secondary)'}}>A</span>
                  <input type="range" min="0.8" max="1.3" step="0.05" value={fontSize}
                    onChange={e=>handleFontSizeChange(parseFloat(e.target.value))}
                    style={{flex:1,accentColor:'var(--primary-500)'}}
                  />
                  <span style={{fontSize:'1.1rem',color:'var(--text-secondary)'}}>A</span>
                </div>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid var(--border-light)'}}>
                <span style={{fontWeight:500,display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.9rem'}}>♿ High Contrast Text</span>
                <div onClick={() => {
                  const val = !form.accessibility?.highContrastText;
                  const updatedAccessibility = { ...form.accessibility, highContrastText: val };
                  set('accessibility', updatedAccessibility);
                  if (val) document.documentElement.style.setProperty('--text-primary', '#ffffff');
                  else document.documentElement.style.removeProperty('--text-primary');
                  onUpdate({...form, accessibility: updatedAccessibility});
                  addToast(`♿ High contrast text ${val ? 'enabled' : 'disabled'}`, 'info');
                }}
                  style={{width:46,height:26,borderRadius:'99px',background:form.accessibility?.highContrastText ? 'var(--primary-500)' : 'var(--border-light)',cursor:'pointer',position:'relative',transition:'background 0.3s'}}>
                  <div style={{position:'absolute',top:3,left:form.accessibility?.highContrastText ? 22 : 3,width:20,height:20,borderRadius:'50%',background:'white',transition:'left 0.3s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
                </div>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid var(--border-light)'}}>
                <span style={{fontWeight:500,display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.9rem'}}>🎞️ Reduce Animations</span>
                <div onClick={() => {
                  const val = !form.accessibility?.reduceMotion;
                  const updatedAccessibility = { ...form.accessibility, reduceMotion: val };
                  set('accessibility', updatedAccessibility);
                  onUpdate({...form, accessibility: updatedAccessibility});
                  addToast(`🎞️ Animations ${val ? 'reduced' : 'enabled'}`, 'info');
                }}
                  style={{width:46,height:26,borderRadius:'99px',background:form.accessibility?.reduceMotion ? 'var(--primary-500)' : 'var(--border-light)',cursor:'pointer',position:'relative',transition:'background 0.3s'}}>
                  <div style={{position:'absolute',top:3,left:form.accessibility?.reduceMotion ? 22 : 3,width:20,height:20,borderRadius:'50%',background:'white',transition:'left 0.3s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
                </div>
              </div>

              {/* ── Privacy ── */}
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',fontWeight:800,marginTop:'1.8rem',marginBottom:'1rem',color:'var(--text-primary)',fontSize:'0.95rem'}}>
                <Shield size={16} color="var(--primary-500)"/> Privacy & Location
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid var(--border-light)'}}>
                <div>
                  <div style={{fontWeight:500,fontSize:'0.9rem'}}>📍 Real-Time GPS Access</div>
                  <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>Used for mission matching near you</div>
                </div>
                <div onClick={() => {
                  const val = !form.privacy?.gpsAccess;
                  const updatedPrivacy = { ...form.privacy, gpsAccess: val };
                  set('privacy', updatedPrivacy);
                  onUpdate({...form, privacy: updatedPrivacy});
                  addToast(`📍 GPS tracking ${val ? 'allowed' : 'blocked'}`, 'info');
                }}
                  style={{width:46,height:26,borderRadius:'99px',background:form.privacy?.gpsAccess ? 'var(--primary-500)' : 'var(--border-light)',cursor:'pointer',position:'relative',transition:'background 0.3s'}}>
                  <div style={{position:'absolute',top:3,left:form.privacy?.gpsAccess ? 22 : 3,width:20,height:20,borderRadius:'50%',background:'white',transition:'left 0.3s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
                </div>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid var(--border-light)'}}>
                <div>
                  <div style={{fontWeight:500,fontSize:'0.9rem'}}>👥 Show Profile in Leaderboard</div>
                  <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>Your rank is visible to other volunteers</div>
                </div>
                <div onClick={() => {
                  const val = !form.privacy?.showInLeaderboard;
                  const updatedPrivacy = { ...form.privacy, showInLeaderboard: val };
                  set('privacy', updatedPrivacy);
                  onUpdate({...form, privacy: updatedPrivacy});
                  addToast(`👥 Leaderboard visibility ${val ? 'on' : 'off'}`, 'info');
                }}
                  style={{width:46,height:26,borderRadius:'99px',background:(form.privacy?.showInLeaderboard ?? true) ? 'var(--primary-500)' : 'var(--border-light)',cursor:'pointer',position:'relative',transition:'background 0.3s'}}>
                  <div style={{position:'absolute',top:3,left:(form.privacy?.showInLeaderboard ?? true) ? 22 : 3,width:20,height:20,borderRadius:'50%',background:'white',transition:'left 0.3s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
                </div>
              </div>

              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.75rem 0',borderBottom:'1px solid var(--border-light)'}}>
                <div>
                  <div style={{fontWeight:500,fontSize:'0.9rem'}}>📊 Share Impact Data with NGOs</div>
                  <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>Allows NGOs to contact you for matching missions</div>
                </div>
                <div onClick={() => {
                  const val = !form.privacy?.shareWithNgo;
                  const updatedPrivacy = { ...form.privacy, shareWithNgo: val };
                  set('privacy', updatedPrivacy);
                  onUpdate({...form, privacy: updatedPrivacy});
                  addToast(`📊 NGO data sharing ${val ? 'on' : 'off'}`, 'info');
                }}
                  style={{width:46,height:26,borderRadius:'99px',background:(form.privacy?.shareWithNgo ?? true) ? 'var(--primary-500)' : 'var(--border-light)',cursor:'pointer',position:'relative',transition:'background 0.3s'}}>
                  <div style={{position:'absolute',top:3,left:(form.privacy?.shareWithNgo ?? true) ? 22 : 3,width:20,height:20,borderRadius:'50%',background:'white',transition:'left 0.3s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
                </div>
              </div>

              {/* ── Security ── */}
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',fontWeight:800,marginTop:'1.8rem',marginBottom:'1rem',color:'var(--text-primary)',fontSize:'0.95rem'}}>
                <Shield size={16} color="#10b981"/> Security
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
                {[
                  ['🔑 Change Password','security'],
                  ['🛡️ Two-Factor Authentication (2FA)','security'],
                  ['📤 Export My Data','export'],
                  ['📋 Download Activity Report','report'],
                ].map(([item,type],i)=>(
                  <button key={i} onClick={()=>{
                    if (type === 'export') {
                      addToast('📤 Preparing data export — you will receive an email shortly','info');
                    } else if (type === 'report') {
                      handleDownloadFullProfile();
                    } else {
                      addToast(`${item} — coming soon in full release`,'info');
                    }
                  }}
                    style={{padding:'0.75rem 1rem',borderRadius:'12px',border:'1px solid var(--border-light)',background:'var(--bg-secondary)',color:'var(--text-primary)',textAlign:'left',cursor:'pointer',fontWeight:500,display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:'var(--font-body)',fontSize:'0.9rem'}}>
                    {item} <ChevronRight size={16}/>
                  </button>
                ))}
              </div>

              {/* ── Volunteering Interests ── */}
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',fontWeight:800,marginTop:'1.8rem',marginBottom:'1rem',color:'var(--text-primary)',fontSize:'0.95rem'}}>
                🎯 Volunteering Interests
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginBottom:'1rem'}}>
                {INTEREST_OPTIONS.map(interest => {
                  const selected = (form.interests || []).includes(interest);
                  return (
                    <div key={interest}
                      onClick={() => {
                        const current = form.interests || [];
                        const updated = selected
                          ? current.filter(i => i !== interest)
                          : [...current, interest];
                        set('interests', updated);
                        onUpdate({ ...form, interests: updated });
                      }}
                      style={{
                        padding:'0.4rem 1rem',
                        borderRadius:'99px',
                        background: selected ? 'var(--primary-500)' : 'var(--bg-secondary)',
                        color: selected ? 'white' : 'var(--text-secondary)',
                        border: selected ? 'none' : '1px solid var(--border-light)',
                        cursor:'pointer',
                        fontWeight: selected ? 700 : 500,
                        fontSize:'0.82rem',
                        transition:'all 0.15s'
                      }}
                    >
                      {interest} {selected ? '✓' : '+ '}
                    </div>
                  );
                })}
              </div>

              {/* Custom Interests Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Custom Interests
                </div>
                
                {/* Render any non-predefined interests */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {(form.interests || [])
                    .filter(i => !INTEREST_OPTIONS.includes(i))
                    .map(custom => (
                      <div key={custom}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.3rem 0.8rem',
                          borderRadius: '99px',
                          background: 'linear-gradient(135deg, var(--primary-500), var(--accent-pink))',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}
                      >
                        <span>{custom}</span>
                        <button
                          onClick={() => {
                            const updated = (form.interests || []).filter(i => i !== custom);
                            set('interests', updated);
                            onUpdate({ ...form, interests: updated });
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.25)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            borderRadius: '50%',
                            width: 16,
                            height: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  {(form.interests || []).filter(i => !INTEREST_OPTIONS.includes(i)).length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      No custom interests added yet.
                    </span>
                  )}
                </div>

                {/* Add Input */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Add custom interest (e.g. Traffic Control)"
                    value={newCustomInterest}
                    onChange={e => setNewCustomInterest(e.target.value)}
                    style={{ ...inputStyle(false), flex: 1, padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newCustomInterest.trim()) {
                          const val = newCustomInterest.trim();
                          if ((form.interests || []).includes(val)) {
                            addToast('Interest already exists.', 'info');
                          } else {
                            const updated = [...(form.interests || []), val];
                            set('interests', updated);
                            onUpdate({ ...form, interests: updated });
                            setNewCustomInterest('');
                          }
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newCustomInterest.trim()) {
                        const val = newCustomInterest.trim();
                        if ((form.interests || []).includes(val)) {
                          addToast('Interest already exists.', 'info');
                        } else {
                          const updated = [...(form.interests || []), val];
                          set('interests', updated);
                          onUpdate({ ...form, interests: updated });
                          setNewCustomInterest('');
                        }
                      }
                    }}
                    className="btn-magic"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {(form.interests || []).length > 0 && (
                <p style={{fontSize:'0.75rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>
                  ✅ {form.interests.length} interest{form.interests.length !== 1 ? 's' : ''} selected — missions matching these will be prioritized.
                </p>
              )}

              {/* ── Danger Zone ── */}
              <div style={{marginTop:'1.8rem',background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'12px',padding:'1rem'}}>
                <div style={{fontWeight:800,color:'#ef4444',marginBottom:'0.8rem',fontSize:'0.9rem'}}>⚠️ Danger Zone</div>
                <button onClick={()=>addToast('❌ Account deletion requires email confirmation — feature in development','warning')}
                  style={{width:'100%',padding:'0.75rem',borderRadius:'10px',background:'rgba(239,68,68,0.1)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.3)',cursor:'pointer',fontWeight:600,fontFamily:'var(--font-body)',fontSize:'0.9rem'}}>
                  🗑️ Delete My Account
                </button>
              </div>

              <div style={{marginTop:'1.5rem',fontWeight:800,marginBottom:'1rem',color:'var(--text-primary)',fontSize:'0.95rem'}}>
                <LogOut size={16} style={{display:'inline',verticalAlign:'middle',marginRight:6}} color="#ef4444"/>  Account Actions
              </div>
              <button onClick={onLogout}
                style={{width:'100%',padding:'1rem',borderRadius:'14px',background:'rgba(239,68,68,0.1)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.3)',cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'0.6rem',fontFamily:'var(--font-body)',transition:'all 0.2s',fontSize:'0.95rem'}}
                onMouseEnter={e=>{e.currentTarget.style.background='#ef4444';e.currentTarget.style.color='white'}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.1)';e.currentTarget.style.color='#ef4444'}}>
                <LogOut size={18}/> Sign Out from CommunityConnect
              </button>
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
