import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLockStatus } from '@/hooks/useLockStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Confetti from '@/components/Confetti';
import LoginModal from '@/components/LoginModal';
import CountdownTimer from '@/components/CountdownTimer';
import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, Nominee, Prediction } from '@/types/database';

const CATEGORY_ICONS = ['🎬', '🍿', '⭐', '🎭', '🎵', '📸', '🎨', '✨', '🌟', '💫', '🎮', '🎯'];

const Predictions = () => {
  const { user } = useAuth();
  const { isLocked, lockTime, loading: lockLoading } = useLockStatus();
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Record<string, Nominee[]>>({});
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [localLocked, setLocalLocked] = useState(false);

  const effectiveLocked = isLocked || localLocked;

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, nomRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('nominees').select('*'),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (nomRes.data) {
        const map: Record<string, Nominee[]> = {};
        nomRes.data.forEach((n: Nominee) => {
          if (!map[n.category_id]) map[n.category_id] = [];
          map[n.category_id].push(n);
        });
        setNominees(map);
      }

      if (user) {
        const predRes = await supabase.from('predictions').select('*').eq('user_id', user.id);
        if (predRes.data) {
          const map: Record<string, string> = {};
          predRes.data.forEach((p: Prediction) => {
            map[p.category_id] = p.nominee_id;
          });
          setPredictions(map);
        }
      }
    };

    fetchData();
  }, [user]);

  const autoSave = useCallback(
    async (categoryId: string, nomineeId: string) => {
      if (!user) {
        setShowLoginModal(true);
        return;
      }

      const { error } = await supabase
        .from('predictions')
        .upsert(
          {
            user_id: user.id,
            category_id: categoryId,
            nominee_id: nomineeId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,category_id' }
        );

      if (error) {
        toast.error('Failed to save pick 😬');
      } else {
        setJustSaved(categoryId);
        setTimeout(() => setJustSaved(null), 1500);
      }
    },
    [user]
  );

  const handleSelect = (categoryId: string, nomineeId: string) => {
    if (effectiveLocked) return;
    setPredictions((prev) => ({ ...prev, [categoryId]: nomineeId }));
    autoSave(categoryId, nomineeId);
  };

  const handleLockExpired = useCallback(() => {
    setLocalLocked(true);
  }, []);

  if (lockLoading) return null;

  return (
    <div className="mx-auto max-w-lg px-5 pt-6 pb-12">
      <Confetti trigger={showConfetti} />
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />

      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <motion.div
            className="text-3xl mb-4"
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            🏆🎬🍕
          </motion.div>
          <h1 className="font-pixel text-xs sm:text-sm text-arcade-gradient mb-3 leading-relaxed">
            🏆 THE GREAT OSCAR SHOWDOWN 🏆
          </h1>
          <p className="text-sm text-muted-foreground font-bold tracking-wide">
            Logan Square Edition • 2026
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <h1 className="font-pixel text-sm text-arcade-gradient mb-2 leading-relaxed">
          MAKE YOUR PICKS 🍿
        </h1>
        <p className="text-sm text-muted-foreground">
          {effectiveLocked
            ? '🔒 Picks are locked. Good luck.'
            : 'Choose your champion for each round 🎮🔮'}
        </p>
      </motion.div>

      {/* Countdown or Locked Banner */}
      {effectiveLocked ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-center py-4 px-5 rounded-lg bg-card border-2 border-destructive/40"
        >
          <p className="font-bold text-sm text-foreground">
            🔒 Picks are locked. Good luck.
          </p>
        </motion.div>
      ) : (
        lockTime && <CountdownTimer lockTime={lockTime} onExpired={handleLockExpired} />
      )}

      <div className="space-y-3">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="pixel-border rounded-lg shadow-arcade bg-card overflow-hidden">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="font-pixel text-[10px] leading-relaxed flex items-center gap-2 text-foreground">
                  <span>{CATEGORY_ICONS[i % CATEGORY_ICONS.length]}</span>
                  {cat.name}
                  {justSaved === cat.id && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="ml-auto"
                    >
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </motion.span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {(nominees[cat.id] || []).map((nom) => {
                    const isSelected = predictions[cat.id] === nom.id;
                    return (
                      <motion.button
                        key={nom.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelect(cat.id, nom.id)}
                        disabled={effectiveLocked}
                        className={`px-4 py-3 rounded-lg text-sm font-bold transition-all min-h-[44px] border-2 ${
                          isSelected
                            ? 'bg-primary text-primary-foreground glow-selected border-primary'
                            : 'bg-muted text-foreground hover:bg-muted/80 border-border hover:border-primary/50'
                        } ${effectiveLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-95'}`}
                      >
                        {nom.nominee_name}
                        {nom.film_title && (
                          <span className={`block text-xs mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {nom.film_title}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                  {(!nominees[cat.id] || nominees[cat.id].length === 0) && (
                    <p className="text-sm text-muted-foreground italic py-2">No nominees yet 🎬</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {effectiveLocked && (
        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-bold">
            GAME OVER. May the best guesser win 🏆
          </span>
        </div>
      )}
    </div>
  );
};

export default Predictions;
