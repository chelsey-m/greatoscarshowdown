import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLockStatus } from '@/hooks/useLockStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Confetti from '@/components/Confetti';
import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';
import type { Category, Nominee, Prediction } from '@/types/database';

const CATEGORY_EMOJIS = ['🎬', '🍿', '⭐', '🎭', '🎵', '📸', '🎨', '✨', '🌟', '💫', '🎪', '🎯'];

const Predictions = () => {
  const { user } = useAuth();
  const { isLocked, loading: lockLoading } = useLockStatus();
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Record<string, Nominee[]>>({});
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, nomRes, predRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('nominees').select('*'),
        supabase.from('predictions').select('*').eq('user_id', user!.id),
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
      if (predRes.data) {
        const map: Record<string, string> = {};
        predRes.data.forEach((p: Prediction) => {
          map[p.category_id] = p.nominee_id;
        });
        setPredictions(map);
      }
    };

    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (isLocked || !user) return;
    setSaving(true);

    const upserts = Object.entries(predictions)
      .filter(([_, nominee_id]) => nominee_id)
      .map(([category_id, nominee_id]) => ({
        user_id: user.id,
        category_id,
        nominee_id,
        updated_at: new Date().toISOString(),
      }));

    const { error } = await supabase
      .from('predictions')
      .upsert(upserts, { onConflict: 'user_id,category_id' });

    setSaving(false);
    if (!error) {
      setSaved(true);
      setShowConfetti(true);
      setTimeout(() => {
        setSaved(false);
        setShowConfetti(false);
      }, 3000);
    }
  };

  if (lockLoading) return null;

  return (
    <div className="mx-auto max-w-lg px-5 pt-6 pb-28">
      <Confetti trigger={showConfetti} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <h1 className="text-3xl font-black text-party-gradient mb-1">
          Make Your Picks 🎬
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLocked
            ? '🔒 Locked. No drama.'
            : 'This is your Oscar prophecy 🔮 No take-backs after showtime 🍿'}
        </p>
      </motion.div>

      <div className="space-y-5">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="border-border rounded-2xl shadow-party bg-card overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>{CATEGORY_EMOJIS[i % CATEGORY_EMOJIS.length]}</span>
                  {cat.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex flex-wrap gap-2">
                  {(nominees[cat.id] || []).map((nom) => {
                    const isSelected = predictions[cat.id] === nom.id;
                    return (
                      <motion.button
                        key={nom.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          !isLocked &&
                          setPredictions((prev) => ({ ...prev, [cat.id]: nom.id }))
                        }
                        disabled={isLocked}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                          isSelected
                            ? 'bg-party-gradient text-primary-foreground glow-selected'
                            : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                        } ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-95'}`}
                      >
                        {nom.name}
                        {nom.film && (
                          <span className={`block text-xs mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                            {nom.film}
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

      {!isLocked && categories.length > 0 && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border z-40"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-party-gradient text-primary-foreground font-bold text-base min-h-[52px] rounded-xl gap-2"
            size="lg"
          >
            {saved ? (
              <>
                <CheckCircle className="h-5 w-5" /> Saved! 🎉
              </>
            ) : saving ? (
              'Saving... ✨'
            ) : (
              'Lock It In 🔒'
            )}
          </Button>
        </motion.div>
      )}

      {isLocked && (
        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span className="text-sm font-medium">
            Locked and loaded. May the best guesser win 🏆
          </span>
        </div>
      )}
    </div>
  );
};

export default Predictions;
