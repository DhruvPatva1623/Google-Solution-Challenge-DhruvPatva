import { useState, useEffect, useRef } from 'react';

export function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let startTime = null;
        const step = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          setCount(Math.floor(progress * end));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.1 });

    if (ref.current) {
      started.current = false; // Reset on re-observe
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [end, duration, ref.current]); // Added ref.current to dependencies

  return [count, ref];
}
