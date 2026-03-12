import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
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
          className="space-y-2.5"
        >
          {entries.map((entry, i) => {
            const isTop3 = entry.rank <= 3;
            const rankInfo = isTop3 ? RANK_DISPLAY[entry.rank - 1] : null;
            const isChampion = entry.rank === 1;

            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`rounded-lg overflow-hidden transition-all ${
                    isChampion
                      ? 'pixel-border shadow-arcade glow-gold border-2 border-primary/40'
                      : isTop3
                        ? 'pixel-border shadow-arcade'
                        : 'border border-border'
                  }`}
                >
                  <CardContent className={`flex items-center gap-3 px-4 ${isChampion ? 'py-5' : 'py-3'}`}>
                    {/* Rank */}
                    <div className="w-10 flex-shrink-0 text-center">
                      {rankInfo ? (
                        <motion.span
                          className={isChampion ? 'text-3xl' : 'text-2xl'}
                          animate={isTop3 ? { scale: [1, 1.12, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                        >
                          {rankInfo.emoji}
                        </motion.span>
                      ) : (
                        <span className="font-bold text-muted-foreground text-sm">{entry.rank}</span>
                      )}
                    </div>

                    {/* Name + label */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${isChampion ? 'text-base text-foreground' : 'text-sm text-foreground'}`}>
                        {entry.display_name}
                      </p>
                      {rankInfo && (
                        <p className={`font-pixel text-[8px] ${rankInfo.color} leading-relaxed`}>
                          {rankInfo.label}
                        </p>
                      )}
                    </div>

                    {/* Score */}
                    <span className={`font-pixel text-arcade-gradient ${isChampion ? 'text-2xl' : isTop3 ? 'text-xl' : 'text-base'}`}>
                      {entry.score}
                    </span>
                    <span className="text-xs text-muted-foreground font-bold">pts</span>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default Leaderboard;
