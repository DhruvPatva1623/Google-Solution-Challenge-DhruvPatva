import { motion } from 'framer-motion';

export function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999999, background: '#111827',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', textAlign: 'center'
      }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 1, type: "spring", bounce: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}
      >
        <motion.span 
          animate={{ rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ fontSize: '3.5rem', display: 'inline-block' }}
        >
          🌍
        </motion.span>
        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontWeight: 900, 
          fontSize: 'clamp(2rem, 8vw, 3.5rem)', 
          margin: 0, 
          background: 'linear-gradient(135deg, #f97316, #ec4899)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          lineHeight: 1.2 
        }}>
          CommunityConnect
        </h1>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
        style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 3vw, 1.2rem)', fontWeight: 500, letterSpacing: '2px', lineHeight: 1.5 }}
      >
        WELCOME TO THE FUTURE OF IMPACT
      </motion.p>
      
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "min(300px, 80vw)" }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        style={{ height: "4px", background: "linear-gradient(90deg, #f97316, #ec4899)", marginTop: "2rem", borderRadius: "2px" }}
      />
    </motion.div>
  );
}
