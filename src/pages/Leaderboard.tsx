import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import type { LeaderboardEntry, Result } from '@/types/database';

const RANK_DISPLAY = [
  { emoji: '🏆', label: 'Cinema Psychic', color: 'text-party-gold' },
  { emoji: '🥈', label: 'Malört Oracle', color: 'text-muted-foreground' },
  { emoji: '🥉', label: 'Popcorn Prophet', color: 'text-party-orange' },
];

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const [predRes, resRes] = await Promise.all([
        supabase.from('predictions').select('user_id, category_id, nominee_id'),
        supabase.from('results').select('*'),
      ]);

      if (!predRes.data || !resRes.data) {
        setLoading(false);
        return;
      }

      const resultMap: Record<string, string> = {};
      resRes.data.forEach((r: Result) => { resultMap[r.category_id] = r.nominee_id; });

      const scores: Record<string, number> = {};
      predRes.data.forEach((p: { user_id: string; category_id: string; nominee_id: string }) => {
        if (!scores[p.user_id]) scores[p.user_id] = 0;
        const actualNomineeId = resultMap[p.category_id];
        if (actualNomineeId && p.nominee_id === actualNomineeId) {
          scores[p.user_id]++;
        }
      });

      const leaderboard: LeaderboardEntry[] = Object.entries(scores)
        .map(([user_id, score]) => ({
          user_id,
          email: user_id.slice(0, 8) + '...',
          score,
          rank: 0,
        }))
        .sort((a, b) => b.score - a.score || a.email.localeCompare(b.email));

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
    <div className="mx-auto max-w-lg px-5 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <h1 className="text-3xl font-black text-party-gradient mb-1">
          Leaderboard 🏆
        </h1>
        <p className="text-sm text-muted-foreground">
          Who's the real cinema psychic? (Probably not you. 🍻)
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <motion.div
            className="text-4xl"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            🍿
          </motion.div>
        </div>
      ) : entries.length === 0 ? (
        <Card className="border-border rounded-2xl">
          <CardContent className="py-12 text-center text-muted-foreground text-base">
            No results yet. Leaderboard goes live when winners are announced 🎬🥂
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {/* Top 3 podium cards */}
          {entries.filter(e => e.rank <= 3).map((entry, i) => {
            const display = RANK_DISPLAY[entry.rank - 1];
            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`rounded-2xl border-border ${entry.rank === 1 ? 'shadow-party border-primary/40' : ''}`}>
                  <CardContent className="flex items-center gap-4 py-5 px-5">
                    <span className="text-3xl">{display.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-base truncate">{entry.email}</p>
                      <p className={`text-xs font-semibold ${display.color}`}>{display.label}</p>
                    </div>
                    <span className="text-3xl font-black text-party-gradient">{entry.score}</span>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Rest of leaderboard */}
          {entries.filter(e => e.rank > 3).length > 0 && (
            <Card className="border-border rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-16 text-center text-xs">#</TableHead>
                    <TableHead className="text-xs">Player</TableHead>
                    <TableHead className="text-right text-xs">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.filter(e => e.rank > 3).map((entry, i) => (
                    <motion.tr
                      key={entry.user_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.03 }}
                      className="border-border hover:bg-muted/30"
                    >
                      <TableCell className="text-center font-bold text-muted-foreground">
                        {entry.rank}
                      </TableCell>
                      <TableCell className="font-medium">{entry.email}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-primary font-bold text-lg">{entry.score}</span>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Leaderboard;
