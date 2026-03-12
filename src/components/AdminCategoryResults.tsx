import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { Category, Nominee } from '@/types/database';

interface PlayerResult {
  display_name: string;
  predicted_nominee: string;
  is_correct: boolean;
}

interface CategoryResult {
  category: Category;
  winner_name: string;
  players: PlayerResult[];
}

const AdminCategoryResults = () => {
  const [categoryResults, setCategoryResults] = useState<CategoryResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      const [catRes, nomRes, resRes, predRes, profRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('nominees').select('*'),
        supabase.from('results').select('*'),
        supabase.from('predictions').select('user_id, category_id, nominee_id'),
        supabase.from('profiles').select('id, display_name, submitted_at').not('submitted_at', 'is', null),
      ]);

      const categories = catRes.data || [];
      const allNominees = nomRes.data || [];
      const results = resRes.data || [];
      const predictions = predRes.data || [];
      const submittedProfiles = profRes.data || [];

      const nomineeMap: Record<string, Nominee> = {};
      allNominees.forEach((n) => { nomineeMap[n.id] = n; });

      const profileMap: Record<string, string> = {};
      const submittedUserIds = new Set<string>();
      submittedProfiles.forEach((p: any) => {
        profileMap[p.id] = p.display_name || 'Anonymous Player';
        submittedUserIds.add(p.id);
      });

      const resultMap: Record<string, string> = {};
      results.forEach((r: any) => { resultMap[r.category_id] = r.nominee_id; });

      const built: CategoryResult[] = categories
        .filter((cat) => resultMap[cat.id])
        .map((cat) => {
          const winnerNomineeId = resultMap[cat.id];
          const winnerNom = nomineeMap[winnerNomineeId];
          const winnerName = winnerNom
            ? `${winnerNom.nominee_name}${winnerNom.film_title ? ` — ${winnerNom.film_title}` : ''}`
            : 'Unknown';

          const catPredictions = predictions.filter(
            (p: any) => p.category_id === cat.id && submittedUserIds.has(p.user_id)
          );

          const players: PlayerResult[] = catPredictions
            .map((p: any) => {
              const predNom = nomineeMap[p.nominee_id];
              return {
                display_name: profileMap[p.user_id] || 'Anonymous Player',
                predicted_nominee: predNom
                  ? `${predNom.nominee_name}${predNom.film_title ? ` — ${predNom.film_title}` : ''}`
                  : 'Unknown',
                is_correct: p.nominee_id === winnerNomineeId,
              };
            })
            .sort((a, b) => {
              if (a.is_correct !== b.is_correct) return a.is_correct ? -1 : 1;
              return a.display_name.localeCompare(b.display_name);
            });

          return { category: cat, winner_name: winnerName, players };
        });

      setCategoryResults(built);
      setLoading(false);
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <Card className="pixel-border rounded-lg">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">Loading results...</p>
        </CardContent>
      </Card>
    );
  }

  if (categoryResults.length === 0) {
    return (
      <Card className="pixel-border rounded-lg">
        <CardHeader className="pb-2">
          <CardTitle className="font-pixel text-[10px] leading-relaxed flex items-center gap-2">
            📋 CATEGORY RESULTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No winners entered yet. Results will appear here after saving winners above. 🎬
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="pixel-border rounded-lg">
        <CardHeader className="pb-2">
          <CardTitle className="font-pixel text-[10px] leading-relaxed flex items-center gap-2">
            📋 CATEGORY RESULTS
          </CardTitle>
          <CardDescription>Player predictions vs actual winners</CardDescription>
        </CardHeader>
      </Card>

      {categoryResults.map(({ category, winner_name, players }) => (
        <Card key={category.id} className="pixel-border rounded-lg overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {category.name}
            </CardTitle>
            <CardDescription className="text-sm font-bold text-accent flex items-center gap-1.5">
              🏆 {winner_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {players.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No submitted predictions for this category.</p>
            ) : (
              <div className="space-y-1.5">
                {players.map((player, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm border ${
                      player.is_correct
                        ? 'border-green-500/30 bg-green-500/10'
                        : 'border-destructive/30 bg-destructive/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {player.is_correct ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                      )}
                      <span className="font-semibold truncate">{player.display_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate ml-2 text-right max-w-[45%]">
                      {player.predicted_nominee}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminCategoryResults;
