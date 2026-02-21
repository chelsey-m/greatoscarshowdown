import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  delay: number;
  size: number;
  color: string;
  duration: number;
}

const GOLD_COLORS = [
  'hsl(43 89% 55%)',
  'hsl(43 100% 65%)',
  'hsl(38 80% 40%)',
  'hsl(40 40% 80%)',
  'hsl(43 89% 75%)',
];

const Confetti = ({ trigger }: { trigger: boolean }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        size: Math.random() * 8 + 4,
        color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
        duration: Math.random() * 2 + 2,
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 4000);
    }
  }, [trigger]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: `${p.x}vw`, y: -20, rotate: 0, opacity: 1 }}
            animate={{ y: '110vh', rotate: 720, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.size > 8 ? '50%' : '2px',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Confetti;
