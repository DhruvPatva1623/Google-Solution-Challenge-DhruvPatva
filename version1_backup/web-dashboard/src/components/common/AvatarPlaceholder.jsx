export function AvatarPlaceholder({ name, size = 80 }) {
  const initials = name ? name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : '?';
  const colors = [
    'linear-gradient(135deg,#f97316,#ec4899)',
    'linear-gradient(135deg,#8b5cf6,#3b82f6)',
    'linear-gradient(135deg,#10b981,#06b6d4)',
    'linear-gradient(135deg,#f59e0b,#ef4444)'
  ];
  const color = colors[(name?.charCodeAt(0)||0) % colors.length];
  
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      display: 'grid',
      placeItems: 'center',
      fontSize: size * 0.35,
      fontWeight: 800,
      color: 'white',
      flexShrink: 0
    }}>
      {initials}
    </div>
  );
}
