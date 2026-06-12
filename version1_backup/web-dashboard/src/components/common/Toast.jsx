import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, ShieldCheck, X } from 'lucide-react';

export function Toast({ message, type = 'success', onClose }) {
  const colors = { 
    success: '#10b981', 
    error: '#ef4444', 
    info: '#3b82f6', 
    warning: '#f97316' 
  };
  
  const icons = { 
    success: <CheckCircle size={20}/>, 
    error: <AlertCircle size={20}/>, 
    info: <ShieldCheck size={20}/>, 
    warning: <AlertCircle size={20}/> 
  };

  useEffect(() => { 
    const t = setTimeout(onClose, 4000); 
    return () => clearTimeout(t); 
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.8 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      exit={{ opacity: 0, y: 50, scale: 0.8 }}
      style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        background: colors[type],
        color: 'white',
        padding: '0.8rem 1.5rem',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        boxShadow: `0 8px 30px ${colors[type]}66`,
        fontWeight: 600,
        maxWidth: '90vw'
      }}
    >
      {icons[type]}<span>{message}</span>
      <button 
        onClick={onClose} 
        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '0.5rem' }}
      >
        <X size={16}/>
      </button>
    </motion.div>
  );
}
