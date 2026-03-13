import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLockStatus } from '@/hooks/useLockStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Confetti from '@/components/Confetti';
import LoginModal from '@/components/LoginModal';
import BallotLockedModal from '@/components/BallotLockedModal';
import CountdownTimer from '@/components/CountdownTimer';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, Send } from 'lucide-react';
import DisplayNameModal from '@/components/DisplayNameModal';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import type { Category, Nominee, Prediction } from '@/types/database';

const CATEGORY_ICONS = ['🎬', '🍿', '⭐', '🎭', '🎵', '📸', '🎨', '✨', '🌟', '💫', '🎮', '🎯'];

/** Convert "ALL CAPS" or "all lower" to Title Case, preserving accented chars */
const toTitleCase = (str: string) =>
  str
    .toLowerCase()
    .replace(/(?:^|\s|[-'("])([a-zA-ZÀ-ÖØ-öø-ÿ])/g, (match) => match.toUpperCase());

const Predictions = () => {
  const { user } = useAuth();
  const { lockTime, loading: lockLoading } = useLockStatus();
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Record<string, Nominee[]>>({});
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  
  const [showBallotModal, setShowBallotModal] = useState(false);
  const [ballotModalShown, setBallotModalShown] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);

  const effectiveLocked = isSubmitted;

  useEffect(() => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      setShowLoginModal(false);
    }
  }, [user]);

  // Check if user already submitted
  useEffect(() => {
    if (!user) return;
    const checkSubmission = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('submitted_at')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.submitted_at) {
        setIsSubmitted(true);
      }
    };
    checkSubmission();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, nomRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('nominees').select('*'),
      ]);

      if (catRes.error || nomRes.error) {
        toast.error('Failed to load categories. Please refresh 🔄');
        return;
      }

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
    if (effectiveLocked || isSubmitted) return;
    const newPredictions = { ...predictions, [categoryId]: nomineeId };
    setPredictions(newPredictions);
    autoSave(categoryId, nomineeId);
  };

  const handleSubmitFinalVotes = async () => {
    if (!user) return;

    // Validate all categories are picked
    const pickedCount = categories.filter((cat) => predictions[cat.id]).length;
    const totalCount = categories.length;
    if (pickedCount < totalCount) {
      toast.error(
        `You must select a winner for all ${totalCount} categories before submitting.\n${pickedCount} / ${totalCount} picks complete.`
      );
      return;
    }

    // Check display name first
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.display_name?.trim()) {
      setShowNameModal(true);
      return;
    }

    setSubmitting(true);

    const now = new Date().toISOString();

    // Upsert all predictions with submitted_at timestamp
    const rows = categories
      .filter((cat) => predictions[cat.id])
      .map((cat) => ({
        user_id: user.id,
        category_id: cat.id,
        nominee_id: predictions[cat.id],
        updated_at: now,
        submitted_at: now,
      }));

    try {
      const { error: predError } = await supabase
        .from('predictions')
        .upsert(rows, { onConflict: 'user_id,category_id' });

      if (predError) {
        console.error('Prediction upsert error:', predError);
        throw predError;
      }
    } catch (err: any) {
      console.error('Prediction save failed:', err);
      toast.error(err?.message || 'Failed to save predictions. Please try again 😬');
      setSubmitting(false);
      return;
    }

    // Always mark profile as submitted, regardless of prediction state
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ submitted_at: now })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }
    } catch (err: any) {
      console.error('Profile submission failed:', err);
      toast.error(err?.message || 'Failed to mark ballot as submitted. Please try again 😬');
      setSubmitting(false);
      return;
    }

    setIsSubmitted(true);
    setSubmitting(false);
    setShowConfetti(true);
    setShowBallotModal(true);
    setBallotModalShown(true);
    toast.success('🎉 Your ballot has been officially submitted!');
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const allPicked = categories.length > 0 && categories.every((cat) => predictions[cat.id]);

  if (lockLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 pt-6 pb-12">
      <Confetti trigger={showConfetti} />
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
      />
      <BallotLockedModal
        open={showBallotModal}
        onClose={() => setShowBallotModal(false)}
      />
      {user && (
        <DisplayNameModal
          open={showNameModal}
          userId={user.id}
          message="Please choose a leaderboard name before submitting your ballot."
          onComplete={(name) => {
            setShowNameModal(false);
            toast.success('Name saved! You can now submit your ballot.');
          }}
          onClose={() => setShowNameModal(false)}
        />
      )}

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
          {isSubmitted
            ? '🔒 Your ballot is locked. Good luck!'
            : 'Choose your champion for each round 🎮🔮'}
        </p>
      </motion.div>

      {/* Countdown or Locked Banner */}
      {isSubmitted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-center py-4 px-5 rounded-lg bg-card border-2 border-destructive/40"
        >
          <p className="font-bold text-sm text-foreground">
            🔒 Your ballot is locked.
          </p>
        </motion.div>
      )}
      {lockTime && !isSubmitted && <CountdownTimer lockTime={lockTime} onExpired={() => {}} />}

      {/* Progress Bar */}
      {categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-5 px-1"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground tracking-wide">
              {Object.keys(predictions).length}/{categories.length} picks made
            </span>
            {isSubmitted ? (
              <span className="text-xs font-bold text-primary">✅ Submitted!</span>
            ) : allPicked ? (
              <span className="text-xs font-bold text-primary">✅ All set! Submit below</span>
            ) : null}
          </div>
          <Progress
            value={(Object.keys(predictions).length / categories.length) * 100}
            className="h-2.5 bg-muted"
          />
        </motion.div>
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
                <CardTitle className="font-nunito text-sm leading-relaxed flex items-center gap-2 font-extrabold tracking-[0.5px] [text-rendering:geometricPrecision] [-webkit-font-smoothing:antialiased]" style={{ color: '#7FE7FF', textShadow: 'none' }}>
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
                        disabled={effectiveLocked || isSubmitted}
                        className={`px-4 py-3 rounded-lg text-sm font-nunito font-semibold normal-case transition-all min-h-[44px] border-2 ${
                          isSelected
                            ? 'bg-primary text-primary-foreground glow-selected border-primary'
                            : 'bg-muted text-foreground hover:bg-muted/80 border-border hover:border-primary/50'
                        } ${effectiveLocked || isSubmitted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-95'}`}
                      >
                        {toTitleCase(nom.nominee_name)}
                        {nom.film_title && (
                          <span className={`block text-xs mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {toTitleCase(nom.film_title)}
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

      {/* Submit Final Votes Button */}
      {user && !isSubmitted && !effectiveLocked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-center"
        >
          <Button
            size="lg"
            disabled={!allPicked || submitting}
            onClick={handleSubmitFinalVotes}
            className="font-pixel text-xs gap-2 px-8 py-6 shadow-arcade"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'SUBMITTING...' : 'SUBMIT FINAL VOTES 🎬'}
          </Button>
          {!allPicked && (
            <p className="text-xs text-muted-foreground mt-2 text-center absolute mt-16">
              Pick all categories first
            </p>
          )}
        </motion.div>
      )}

      {isSubmitted && (
        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-bold">
            BALLOT SUBMITTED. May the best guesser win 🏆
          </span>
        </div>
      )}
    </div>
  );
};

export default Predictions;
