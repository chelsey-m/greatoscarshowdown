import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ListChecks, Check, X, Minus } from 'lucide-react';
import type { Category, Prediction, Result } from '@/types/database';

const MyPicks = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, predRes, resRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('predictions').select('*').eq('user_id', user!.id),
        supabase.from('results').select('*'),
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (predRes.data) {
        const map: Record<string, string> = {};
        predRes.data.forEach((p: Prediction) => { map[p.category_id] = p.predicted_winner; });
        setPredictions(map);
      }
      if (resRes.data) {
        const map: Record<string, string> = {};
        resRes.data.forEach((r: Result) => { map[r.category_id] = r.actual_winner; });
        setResults(map);
      }
    };

    fetchData();
  }, [user]);

  const getStatus = (catId: string) => {
    const pick = predictions[catId];
    const result = results[catId];
    if (!pick) return 'none';
    if (!result) return 'pending';
    return pick.trim().toLowerCase() === result.trim().toLowerCase() ? 'correct' : 'wrong';
  };

  const score = categories.filter(c => getStatus(c.id) === 'correct').length;
  const hasResults = Object.keys(results).length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-black text-gold-gradient mb-2">
          <ListChecks className="inline h-8 w-8 mr-2" />
          My Picks
        </h1>
        {hasResults && (
          <p className="text-lg text-muted-foreground">
            Your score: <span className="text-primary font-bold">{score}</span> / {categories.length}
          </p>
        )}
      </motion.div>

      <div className="space-y-3">
        {categories.map((cat, i) => {
          const status = getStatus(cat.id);
          const pick = predictions[cat.id];

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className={`border-border ${status === 'correct' ? 'border-primary/40 shadow-gold/10' : ''}`}>
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{cat.name}</p>
                    <p className="font-medium text-foreground">
                      {pick || <span className="italic text-muted-foreground">No pick</span>}
                    </p>
                    {status === 'wrong' && results[cat.id] && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Winner: {results[cat.id]}
                      </p>
                    )}
                  </div>
                  <div>
                    {status === 'correct' && (
                      <Badge className="bg-primary/20 text-primary border-0 gap-1">
                        <Check className="h-3 w-3" /> Correct
                      </Badge>
                    )}
                    {status === 'wrong' && (
                      <Badge variant="destructive" className="gap-1 border-0">
                        <X className="h-3 w-3" /> Wrong
                      </Badge>
                    )}
                    {status === 'pending' && (
                      <Badge variant="secondary" className="gap-1 border-0">
                        <Minus className="h-3 w-3" /> Pending
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {categories.length === 0 && (
        <p className="text-center text-muted-foreground mt-12">
          No categories yet. Check back closer to show time! 🎬
        </p>
      )}
    </div>
  );
};

export default MyPicks;
