import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Lock, ChevronRight, Edit3, Download, LogOut } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { AvatarPlaceholder } from '../common/AvatarPlaceholder';

export function ProfilePanel({ user, onClose, onUpdate, addToast, onLogout }) {
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
    {id:'history',label:'History',icon:'📜'},
    {id:'achievements',label:'Awards',icon:'🏆'},
    {id:'settings',label:'Settings',icon:'⚙️'},
  ];

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'none',zIndex:10000,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',padding:'80px 1rem 1rem'}}>
      <motion.div initial={{x:100,opacity:0}} animate={{x:0,opacity:1}} exit={{x:100,opacity:0}} onClick={e=>e.stopPropagation()}
        className="glass-panel" style={{width:'min(560px,100%)',maxHeight:'calc(100vh - 80px)',borderRadius:'32px',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 30px 60px rgba(0,0,0,0.3), 0 0 100px var(--primary-500)22',border:'1px solid rgba(255,255,255,0.1)'}}>

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
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.2rem'}}>
                <span style={{background:'rgba(255,255,255,0.2)',padding:'0.1rem 0.6rem',borderRadius:'6px',fontSize:'0.65rem',fontWeight:800,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  {user.role === 'ngo' ? '🏢 Organization' : '🤝 Volunteer'}
                </span>
                <p style={{opacity:0.85,fontSize:'0.9rem'}}>{user.org || (user.role === 'ngo' ? 'Authorized NGO' : 'Community Member')} · {user.city || 'N/A'}</p>
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
                {editing
                  ? <input style={inputStyle(false)} value={(form.interests||[]).join(', ')} onChange={e=>set('interests',e.target.value.split(',').map(s=>s.trim()))}/>
                  : <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',marginTop:'0.3rem'}}>
                      {(user.interests||[]).map((s,i)=><span key={i} style={{background:'rgba(139,92,246,0.1)',color:'var(--accent-highlight)',padding:'0.3rem 0.8rem',borderRadius:'99px',fontSize:'0.82rem',fontWeight:600}}>{s}</span>)}
                    </div>
                }
              </div>
              {fieldBlock('Availability','availability',false,'text',['Weekdays only','Weekends only','Weekdays & Weekends','Flexible / Any time'])}
              {/* Activity chart */}
              <div style={{marginTop:'1.5rem',background:'rgba(255,255,255,0.03)',borderRadius:'24px',padding:'1.5rem',border:'1px solid var(--border-light)', boxShadow:'inset 0 0 20px rgba(0,0,0,0.2)'}}>
                <div style={{fontWeight:800,marginBottom:'1rem',fontSize:'0.95rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <span>📈</span> Monthly Activity
                </div>
                <div style={{height:200, width:'100%', position:'relative'}}>
                  <Bar 
                    data={{
                      labels:['Jan','Feb','Mar','Apr','May','Jun'],
                      datasets:[{
                        label: 'Hours',
                        data: ['Jan','Feb','Mar','Apr','May','Jun'].map((m,i) => (user.history||[]).reduce((acc,h) => new Date(h.date).getMonth() === i ? acc + (h.hrs||0) : acc, 0)),
                        backgroundColor:'rgba(249,115,22,0.6)',
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
                        y:{beginAtZero:true, grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'var(--text-secondary)', font:{size:10}}},
                        x:{grid:{display:false}, ticks:{color:'var(--text-secondary)', font:{size:10}}}
                      }
                    }} 
                  />
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
              <div style={{marginTop:'2rem',fontWeight:700,marginBottom:'1rem'}}>Account Actions</div>
              <button onClick={onLogout}
                style={{width:'100%',padding:'1rem',borderRadius:'14px',background:'rgba(239,68,68,0.1)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.3)',cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:'0.6rem',fontFamily:'var(--font-body)',transition:'all 0.2s'}}
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
