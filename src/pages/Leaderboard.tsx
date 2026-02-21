import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import type { LeaderboardEntry, Prediction, Result } from '@/types/database';

const RANK_ICONS = [Trophy, Medal, Award];
const RANK_COLORS = ['text-primary', 'text-champagne', 'text-muted-foreground'];

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const [predRes, resRes] = await Promise.all([
        supabase.from('predictions').select('user_id, category_id, predicted_winner'),
        supabase.from('results').select('*'),
      ]);

      if (!predRes.data || !resRes.data) {
        setLoading(false);
        return;
      }

      const resultMap: Record<string, string> = {};
      resRes.data.forEach((r: Result) => { resultMap[r.category_id] = r.actual_winner; });

      // Score by user
      const scores: Record<string, number> = {};
      predRes.data.forEach((p: Prediction) => {
        if (!scores[p.user_id]) scores[p.user_id] = 0;
        const actual = resultMap[p.category_id];
        if (actual && p.predicted_winner.trim().toLowerCase() === actual.trim().toLowerCase()) {
          scores[p.user_id]++;
        }
      });

      // Get user emails
      // Note: In production, you'd use a profiles table. For now we'll show user IDs truncated.
      const leaderboard: LeaderboardEntry[] = Object.entries(scores)
        .map(([user_id, score]) => ({
          user_id,
          email: user_id.slice(0, 8) + '...',
          score,
          rank: 0,
        }))
        .sort((a, b) => b.score - a.score || a.email.localeCompare(b.email));

      // Assign ranks
      leaderboard.forEach((entry, i) => {
        entry.rank = i === 0 || leaderboard[i - 1].score !== entry.score
          ? i + 1
          : leaderboard[i - 1].rank;
      });

      setEntries(leaderboard);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-black text-gold-gradient mb-2">
          <Trophy className="inline h-8 w-8 mr-2" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">
          Who's winning this thing? (Spoiler: probably not you.)
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            No results yet. Leaderboard populates once winners are announced. 🎬
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border shadow-gold/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, i) => {
                  const RankIcon = entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : null;
                  const rankColor = entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : '';

                  return (
                    <motion.tr
                      key={entry.user_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-border hover:bg-muted/30"
                    >
                      <TableCell className="text-center font-bold">
                        {RankIcon ? (
                          <RankIcon className={`mx-auto h-5 w-5 ${rankColor}`} />
                        ) : (
                          <span className="text-muted-foreground">{entry.rank}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{entry.email}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-primary font-bold text-lg">{entry.score}</span>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Leaderboard;
