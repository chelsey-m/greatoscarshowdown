import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import type { LeaderboardEntry, Result } from '@/types/database';

const RANK_DISPLAY = [
  { emoji: '👑', label: 'CHAMPION', color: 'text-arcade-gold' },
  { emoji: '🥈', label: 'RUNNER UP', color: 'text-muted-foreground' },
  { emoji: '🥉', label: 'BRONZE', color: 'text-arcade-red' },
];

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Only fetch profiles that have explicitly submitted their ballot
      const [predRes, resRes, profilesRes] = await Promise.all([
        supabase.from('predictions').select('user_id, category_id, nominee_id, submitted_at').not('submitted_at', 'is', null),
        supabase.from('results').select('*'),
        supabase.from('profiles').select('id, display_name, submitted_at').not('submitted_at', 'is', null),
      ]);

      if (!predRes.data || !resRes.data) {
        setLoading(false);
        return;
      }

      // Build set of submitted user IDs
      const submittedUsers = new Set<string>();
      const profileMap: Record<string, string> = {};
      (profilesRes.data || []).forEach((p: { id: string; display_name: string; submitted_at: string | null }) => {
        submittedUsers.add(p.id);
        profileMap[p.id] = p.display_name;
      });

      const resultMap: Record<string, string> = {};
      resRes.data.forEach((r: Result) => { resultMap[r.category_id] = r.nominee_id; });

      // Only score users who have submitted their ballot
      const scores: Record<string, number> = {};
      predRes.data.forEach((p: { user_id: string; category_id: string; nominee_id: string }) => {
        if (!submittedUsers.has(p.user_id)) return;
        if (!(p.user_id in scores)) scores[p.user_id] = 0;
        if (resultMap[p.category_id] && p.nominee_id === resultMap[p.category_id]) {
          scores[p.user_id]++;
        }
      });

      const leaderboard: LeaderboardEntry[] = Object.entries(scores)
        .map(([user_id, score]) => ({
          user_id,
          display_name: profileMap[user_id] || 'Anonymous Player',
          score,
          rank: 0,
        }))
        .sort((a, b) => b.score - a.score || a.display_name.localeCompare(b.display_name));

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
        <h1 className="font-pixel text-sm text-arcade-gradient mb-2 leading-relaxed">
          HIGH SCORES 🏆
        </h1>
        <p className="text-sm text-muted-foreground">
          Who's the real cinema psychic? 🎮
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
        <Card className="pixel-border rounded-lg">
          <CardContent className="py-12 text-center text-muted-foreground text-base">
            NO SCORES YET. Leaderboard goes live when winners drop 🎬
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
                <Card className={`pixel-border rounded-lg ${entry.rank === 1 ? 'shadow-arcade glow-gold' : 'shadow-arcade'}`}>
                  <CardContent className="flex items-center gap-4 py-5 px-5">
                    <motion.span
                      className="text-3xl"
                      animate={entry.rank <= 3 ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                    >
                      {display.emoji}
                    </motion.span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-base truncate">{entry.display_name}</p>
                      <p className={`font-pixel text-[8px] ${display.color} leading-relaxed`}>{display.label}</p>
                    </div>
                    <span className="font-pixel text-2xl text-arcade-gradient">{entry.score}</span>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Rest of leaderboard */}
          {entries.filter(e => e.rank > 3).length > 0 && (
            <Card className="pixel-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-16 text-center font-pixel text-[8px]">#</TableHead>
                    <TableHead className="font-pixel text-[8px]">PLAYER</TableHead>
                    <TableHead className="text-right font-pixel text-[8px]">PTS</TableHead>
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
                      <TableCell className="font-medium">{entry.display_name}</TableCell>
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
