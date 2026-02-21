import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLockStatus } from '@/hooks/useLockStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Confetti from '@/components/Confetti';
import { motion } from 'framer-motion';
import { Lock, Save, CheckCircle } from 'lucide-react';
import type { Category, Prediction } from '@/types/database';

const Predictions = () => {
  const { user } = useAuth();
  const { isLocked, loading: lockLoading } = useLockStatus();
  const [categories, setCategories] = useState<Category[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, predRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('predictions').select('*').eq('user_id', user!.id),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (predRes.data) {
        const map: Record<string, string> = {};
        predRes.data.forEach((p: Prediction) => {
          map[p.category_id] = p.predicted_winner;
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
      .filter(([_, winner]) => winner.trim())
      .map(([category_id, predicted_winner]) => ({
        user_id: user.id,
        category_id,
        predicted_winner: predicted_winner.trim(),
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Confetti trigger={showConfetti} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-black text-gold-gradient mb-2">
          Make Your Picks
        </h1>
        <p className="text-muted-foreground">
          {isLocked
            ? '🔒 Predictions are locked. Hope you chose wisely.'
            : 'Pick your winners before the ceremony starts. No take-backs after lock.'}
        </p>
      </motion.div>

      <div className="space-y-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-border shadow-gold/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-primary">★</span>
                  {cat.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor={cat.id} className="sr-only">Your pick for {cat.name}</Label>
                <Input
                  id={cat.id}
                  placeholder={isLocked ? 'Locked' : 'Type your predicted winner...'}
                  value={predictions[cat.id] || ''}
                  onChange={(e) =>
                    setPredictions((prev) => ({ ...prev, [cat.id]: e.target.value }))
                  }
                  disabled={isLocked}
                  className="bg-muted/50"
                />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {!isLocked && categories.length > 0 && (
        <motion.div
          className="mt-8 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gold-gradient text-primary-foreground font-semibold px-8 py-3 text-base gap-2"
            size="lg"
          >
            {saved ? (
              <>
                <CheckCircle className="h-5 w-5" /> Saved! 🎉
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              <>
                <Save className="h-5 w-5" /> Lock In My Picks
              </>
            )}
          </Button>
        </motion.div>
      )}

      {isLocked && (
        <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span className="text-sm italic">
            "In the immortal words of every Oscar host: And the winner is…"
          </span>
        </div>
      )}
    </div>
  );
};

export default Predictions;
