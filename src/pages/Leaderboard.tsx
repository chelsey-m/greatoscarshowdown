import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LeaderboardEntry, Result } from '@/types/database';

const RANK_DISPLAY = [
  { emoji: '👑', label: 'CHAMPION', color: 'text-arcade-gold' },
  { emoji: '🥈', label: 'RUNNER UP', color: 'text-muted-foreground' },
  { emoji: '🥉', label: 'BRONZE', color: 'text-arcade-red' },
];

type Movement = 'up' | 'down' | 'same';

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [movements, setMovements] = useState<Record<string, Movement>>({});
  const [hasResults, setHasResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCategories, setTotalCategories] = useState(0);
  const [completedCategories, setCompletedCategories] = useState(0);
  const prevRanks = useRef<Record<string, number>>({});

  const buildLeaderboard = useCallback(async () => {
    const [predRes, resRes, profilesRes, catCountRes] = await Promise.all([
      supabase.from('predictions').select('user_id, category_id, nominee_id, submitted_at').not('submitted_at', 'is', null),
      supabase.from('results').select('*'),
      supabase.from('profiles').select('id, display_name, submitted_at').not('submitted_at', 'is', null),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
    ]);

    if (!profilesRes.data) { setLoading(false); return; }

    const resultsData = resRes.data || [];
    const resultsExist = resultsData.length > 0;
    setHasResults(resultsExist);
    setCompletedCategories(resultsData.length);
    setTotalCategories(catCountRes.count ?? 0);

    const resultMap: Record<string, string> = {};
    resultsData.forEach((r: Result) => { resultMap[r.category_id] = r.nominee_id; });

    const scores: Record<string, number> = {};
    const profileMap: Record<string, string> = {};
    profilesRes.data.forEach((p: { id: string; display_name: string }) => {
      scores[p.id] = 0;
      profileMap[p.id] = p.display_name;
    });

    if (resultsExist && predRes.data) {
      predRes.data.forEach((p: { user_id: string; category_id: string; nominee_id: string }) => {
        if (!(p.user_id in scores)) return;
        if (resultMap[p.category_id] && p.nominee_id === resultMap[p.category_id]) {
          scores[p.user_id]++;
        }
      });
    }

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

    // Calculate movements
    const prev = prevRanks.current;
    if (Object.keys(prev).length > 0 && resultsExist) {
      const newMovements: Record<string, Movement> = {};
      leaderboard.forEach((entry) => {
        const oldRank = prev[entry.user_id];
        if (oldRank === undefined) {
          newMovements[entry.user_id] = 'same';
        } else if (entry.rank < oldRank) {
          newMovements[entry.user_id] = 'up';
        } else if (entry.rank > oldRank) {
          newMovements[entry.user_id] = 'down';
        } else {
          newMovements[entry.user_id] = 'same';
        }
      });
      setMovements(newMovements);
    }

    // Store current ranks for next comparison
    const rankSnap: Record<string, number> = {};
    leaderboard.forEach((e) => { rankSnap[e.user_id] = e.rank; });
    prevRanks.current = rankSnap;

    setEntries(leaderboard);
    setLoading(false);
  }, []);

  useEffect(() => {
    buildLeaderboard();

    // Real-time: re-fetch when results or profiles change
    const resultsChannel = supabase
      .channel('leaderboard-results')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => {
        buildLeaderboard();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('leaderboard-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        buildLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(resultsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [buildLeaderboard]);

  const champion = hasResults ? entries.find((e) => e.rank === 1) : null;

  const MovementIcon = ({ userId }: { userId: string }) => {
    const m = movements[userId];
    if (!m || !hasResults) return null;
    if (m === 'up') return <TrendingUp className="h-3.5 w-3.5 text-primary" />;
    if (m === 'down') return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

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
          {hasResults ? 'Live scores — updates as winners are announced 🎮' : 'Ballots are in. Scores go live on Oscar night 🎬'}
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
            NO BALLOTS YET. Submit your picks to join! 🎬
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-2.5"
          >
            {/* Champion highlight card */}
            {champion && (
              <motion.div
                key={`champion-${champion.user_id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4"
              >
                <Card className="pixel-border shadow-arcade glow-gold border-2 border-primary/40 rounded-lg overflow-hidden">
                  <CardContent className="flex items-center gap-4 py-6 px-5">
                    <motion.span
                      className="text-4xl"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      👑
                    </motion.span>
                    <div className="flex-1 min-w-0">
                      <p className="font-pixel text-[8px] text-arcade-gold leading-relaxed mb-0.5">CHAMPION</p>
                      <p className="font-bold text-lg text-foreground truncate">{champion.display_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-pixel text-3xl text-arcade-gradient">{champion.score}</span>
                      <span className="text-xs text-muted-foreground font-bold ml-1">pts</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Full ranked list */}
            <div className="space-y-1.5">
              {entries.map((entry, i) => {
                const isTop3 = entry.rank <= 3 && hasResults;
                const rankInfo = isTop3 ? RANK_DISPLAY[entry.rank - 1] : null;

                return (
                  <motion.div
                    key={entry.user_id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card
                      className={`rounded-lg overflow-hidden transition-all ${
                        isTop3
                          ? 'pixel-border shadow-arcade'
                          : 'border border-border'
                      }`}
                    >
                      <CardContent className="flex items-center gap-3 px-4 py-3">
                        {/* Rank */}
                        <div className="w-8 flex-shrink-0 text-center">
                          {rankInfo ? (
                            <span className="text-xl">{rankInfo.emoji}</span>
                          ) : (
                            <span className="font-bold text-muted-foreground text-sm">
                              {hasResults ? entry.rank : ''}
                            </span>
                          )}
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">
                            {entry.display_name}
                          </p>
                          {rankInfo && (
                            <p className={`font-pixel text-[7px] ${rankInfo.color} leading-relaxed`}>
                              {rankInfo.label}
                            </p>
                          )}
                        </div>

                        {/* Movement indicator */}
                        <MovementIcon userId={entry.user_id} />

                        {/* Score */}
                        {hasResults ? (
                          <div className="flex items-baseline gap-1">
                            <span className={`font-pixel text-arcade-gradient ${isTop3 ? 'text-lg' : 'text-base'}`}>
                              {entry.score}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-bold">pts</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold">Picks submitted ✅</span>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default Leaderboard;
