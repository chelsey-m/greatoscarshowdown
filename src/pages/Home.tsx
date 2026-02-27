import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

import howToPlayImg from '@/assets/how-to-play.png';
import scoringImg from '@/assets/scoring.png';
import importantImg from '@/assets/important.png';
import grandPrizeImg from '@/assets/grand-prize.png';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

interface SectionProps {
  title: string;
  emoji: string;
  image: string;
  imageAlt: string;
  items: string[];
  reverse?: boolean;
  titleColor?: string;
}

const Section = ({ title, emoji, image, imageAlt, items, reverse, titleColor = 'text-primary' }: SectionProps) => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-40px' }}
    variants={fadeUp}
    className="py-10"
  >
    <h2 className={`font-pixel text-[11px] ${titleColor} mb-6 text-center`}>
      {emoji} {title}
    </h2>

    <div className={`flex flex-col ${reverse ? 'sm:flex-row-reverse' : 'sm:flex-row'} items-center gap-6 sm:gap-8`}>
      {/* Text */}
      <div className="flex-1 space-y-2.5 text-center sm:text-left">
        {items.map((text, i) => (
          <p key={i} className="text-sm text-foreground font-nunito font-semibold leading-relaxed">
            {text}
          </p>
        ))}
      </div>

      {/* Image */}
      <div className="flex-shrink-0 w-[55%] sm:w-[40%] max-w-[220px]">
        <div className="relative">
          {/* Spotlight glow */}
          <div className="absolute inset-0 rounded-2xl bg-arcade-gold/10 blur-2xl scale-110" />
          <img
            src={image}
            alt={imageAlt}
            className="relative w-full rounded-2xl object-cover shadow-lg shadow-black/40"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  </motion.section>
);

const Divider = () => (
  <div className="border-t border-border/30" />
);

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg px-5 pt-8 pb-20">
      {/* Hero */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="text-center mb-6"
      >
        <motion.div
          className="text-2xl mb-4"
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          🏆🎬🍕
        </motion.div>
        <h1 className="font-pixel text-xs sm:text-sm text-primary leading-relaxed mb-3 drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]">
          🏆 The Great Oscar Showdown 🏆
        </h1>
        <p className="text-sm text-muted-foreground font-nunito font-bold tracking-wide">
          Logan Square Edition • 2026
        </p>
      </motion.section>

      <Divider />

      {/* How to Play */}
      <Section
        title="How to Play"
        emoji="🎮"
        image={howToPlayImg}
        imageAlt="Presenter dog at podium holding How to Play card"
        items={[
          'Pick ONE nominee per category',
          'Picks auto-save as you go',
          'Most correct picks wins eternal glory',
        ]}
      />

      <Divider />

      {/* Scoring */}
      <Section
        title="Scoring"
        emoji="🍕"
        image={scoringImg}
        imageAlt="Accountant dog with calculator and envelope"
        items={[
          '1 point per correct pick',
          'Leaderboard updates live',
          'Ties may trigger a dramatic showdown',
        ]}
        reverse
      />

      <Divider />

      {/* Important */}
      <Section
        title="Important"
        emoji="⚠️"
        image={importantImg}
        imageAlt="Security cat at velvet rope"
        titleColor="text-secondary"
        items={[
          'Picks lock at ceremony start 🔒',
          'Must be logged in to save picks',
          'Once locked, your destiny is sealed',
        ]}
      />

      <Divider />

      {/* Grand Prize */}
      <Section
        title="Grand Prize"
        emoji="🏆"
        image={grandPrizeImg}
        imageAlt="Dog and cat in formal wear holding Oscar trophies"
        titleColor="text-arcade-gold"
        items={[
          'Undetermined.',
          'Possibly pizza.',
          'Possibly power.',
          'Possibly both.',
        ]}
        reverse
      />

      <Divider />

      {/* CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center pt-8"
      >
        <Button
          onClick={() => navigate('/picks')}
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-base min-h-[52px] rounded-xl gap-2 shadow-[0_0_15px_hsl(var(--arcade-gold)/0.4)]"
          size="lg"
        >
          🎬 Click HERE to Make Your Picks
        </Button>
      </motion.section>
    </div>
  );
};

export default Home;
