import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  lockTime: string;
  onExpired: () => void;
}

const CountdownTimer = ({ lockTime, onExpired }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const target = new Date(lockTime).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('00:00:00');
        onExpired();
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockTime, onExpired]);

  if (expired) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 text-center py-4 px-5 rounded-lg bg-card border-2 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
    >
      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">
        ⏳ Picks lock in
      </p>
      <p className="font-pixel text-lg sm:text-xl text-primary tracking-widest drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]">
        {timeLeft}
      </p>
    </motion.div>
  );
};

export default CountdownTimer;
