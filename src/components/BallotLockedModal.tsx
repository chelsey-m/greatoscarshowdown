import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import junedrunkImg from '@/assets/junedrunk.png';

const GOLD_CONFETTI_COLORS = [
  'hsl(43 95% 55%)',
  'hsl(38 90% 60%)',
  'hsl(48 100% 70%)',
  'hsl(35 85% 50%)',
  'hsl(50 90% 80%)',
  'hsl(0 0% 95%)',
];

interface ConfettiParticle {
  id: number;
  x: number;
  delay: number;
  size: number;
  color: string;
  duration: number;
}

const ModalConfetti = () => {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      size: Math.random() * 8 + 3,
      color: GOLD_CONFETTI_COLORS[Math.floor(Math.random() * GOLD_CONFETTI_COLORS.length)],
      duration: Math.random() * 3 + 2,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}%`, y: -10, rotate: 0, opacity: 1 }}
          animate={{ y: '110%', rotate: 720, opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn', repeat: Infinity, repeatDelay: Math.random() * 2 }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.size > 6 ? '50%' : '1px',
          }}
        />
      ))}
    </div>
  );
};

interface BallotLockedModalProps {
  open: boolean;
  onClose: () => void;
}

const BallotLockedModal = ({ open, onClose }: BallotLockedModalProps) => {
  const navigate = useNavigate();

  // Auto-close after 8 seconds
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleLeaderboard = useCallback(() => {
    onClose();
    navigate('/leaderboard');
  }, [onClose, navigate]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/85"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-sm rounded-2xl border-2 border-yellow-500/40 bg-card p-6 pt-5 shadow-[0_0_60px_rgba(234,179,8,0.15)] overflow-hidden"
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <ModalConfetti />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Header */}
              <motion.h2
                className="font-pixel text-xs sm:text-sm leading-relaxed mb-4"
                style={{
                  color: '#FFD700',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3)',
                }}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                🏆 BALLOT LOCKED IN 🏆
              </motion.h2>

              {/* Dog Image */}
              <motion.div
                className="mb-4 rounded-2xl overflow-hidden border-2 border-yellow-500/50"
                style={{
                  boxShadow: '0 0 30px rgba(234, 179, 8, 0.25), 0 0 60px rgba(234, 179, 8, 0.1)',
                  maxHeight: '45vh',
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, type: 'spring', damping: 15 }}
              >
                <motion.img
                  src={junedrunkImg}
                  alt="Glamorous dog in red gown celebrating with champagne and beer"
                  className="w-full object-cover"
                  style={{ maxHeight: '45vh' }}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                />
              </motion.div>

              {/* Message */}
              <motion.div
                className="mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="font-nunito text-sm font-bold text-foreground leading-relaxed">
                  Your picks are sealed.
                </p>
                <p className="font-nunito text-sm text-muted-foreground mt-1">
                  No edits. No take-backs.
                </p>
                <p className="font-nunito text-sm font-bold text-yellow-400 mt-1">
                  Only glory.
                </p>
              </motion.div>

              {/* Emoji row */}
              <motion.div
                className="text-2xl mb-5 tracking-widest"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                🍾🍺🎬✨🔥
              </motion.div>

              {/* Leaderboard button */}
              <motion.button
                onClick={handleLeaderboard}
                className="w-full py-3.5 rounded-xl font-nunito font-bold text-sm bg-primary text-primary-foreground transition-all"
                style={{
                  boxShadow: '0 0 20px rgba(234, 179, 8, 0.3), 0 4px 15px rgba(0,0,0,0.3)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                📊 View Leaderboard
              </motion.button>

              {/* Close text link */}
              <motion.button
                onClick={onClose}
                className="mt-3 text-sm text-muted-foreground hover:text-foreground font-nunito transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BallotLockedModal;
