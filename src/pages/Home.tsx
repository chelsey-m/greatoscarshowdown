import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Divider = () => (
  <div className="my-8 border-t border-border/50" />
);

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg px-5 pt-8 pb-16">
      {/* Header */}
      <motion.section
        custom={0}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="text-center mb-4"
      >
        <motion.div
          className="text-2xl mb-4"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          🏆🥃🎬
        </motion.div>
        <h1 className="font-pixel text-xs sm:text-sm text-primary leading-relaxed mb-3 drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]">
          🏆 WELCOME TO THE 98TH ANNUAL MALÖRTSCARS 🏆
        </h1>
        <p className="text-base text-foreground font-bold">
          Logan Oscar Party 2026 🍿
        </p>
      </motion.section>

      <Divider />

      {/* How to Play */}
      <motion.section
        custom={1}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <h2 className="font-pixel text-[11px] text-primary mb-4 text-center">
          🎮 HOW TO PLAY
        </h2>
        <div className="space-y-2 text-center">
          <p className="text-sm text-foreground">Pick <strong>ONE</strong> nominee per category</p>
          <p className="text-sm text-foreground">Tap <strong>"LOCK IT IN"</strong> before the ceremony starts</p>
          <p className="text-sm text-foreground">No take-backs after the lock 🔒</p>
          <p className="text-sm text-foreground">Most correct picks wins <strong>eternal glory</strong></p>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4 italic">
          Trash talk is encouraged.
        </p>
      </motion.section>

      <Divider />

      {/* Scoring */}
      <motion.section
        custom={2}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <h2 className="font-pixel text-[11px] text-primary mb-4 text-center">
          🍕 SCORING
        </h2>
        <div className="space-y-2 text-center">
          <p className="text-sm text-foreground">• 1 point per correct pick</p>
          <p className="text-sm text-foreground">• Leaderboard updates live</p>
          <p className="text-sm text-foreground">• Ties may trigger a dramatic showdown</p>
        </div>
      </motion.section>

      <Divider />

      {/* Important */}
      <motion.section
        custom={3}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <h2 className="font-pixel text-[11px] text-secondary mb-4 text-center">
          🥃 IMPORTANT
        </h2>
        <div className="space-y-2 text-center">
          <p className="text-sm text-foreground">• Picks lock at ceremony start</p>
          <p className="text-sm text-foreground">• You must be logged in to save picks</p>
          <p className="text-sm text-foreground">• Once locked, your destiny is sealed</p>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4 italic">
          No Malört required. But encouraged.
        </p>
      </motion.section>

      <Divider />

      {/* Grand Prize */}
      <motion.section
        custom={4}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="text-center"
      >
        <h2 className="font-pixel text-[11px] text-arcade-gold mb-4">
          🏆 GRAND PRIZE
        </h2>
        <p className="text-sm text-foreground">
          Undetermined. Possibly pizza. Possibly power. Possibly both.
        </p>
      </motion.section>

      <Divider />

      {/* CTA */}
      <motion.section
        custom={5}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="text-center pt-2"
      >
        <Button
          onClick={() => navigate('/picks')}
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-base min-h-[52px] rounded-xl gap-2 shadow-[0_0_15px_hsl(var(--arcade-gold)/0.4)]"
          size="lg"
        >
          🎬 MAKE YOUR PICKS
        </Button>
      </motion.section>
    </div>
  );
};

export default Home;
