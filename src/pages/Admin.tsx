import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import { Save, Users, Send, Gamepad2, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, Nominee, AppSettings } from '@/types/database';

interface SubmissionEntry {
  display_name: string;
  email: string;
  submitted_at: string;
}

interface AdminStats {
  totalUsers: number;
  usersWithPicks: number;
  submittedUsers: number;
  submissions: SubmissionEntry[];
}

const Admin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [lockTime, setLockTime] = useState('');
  const [submissionsLocked, setSubmissionsLocked] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Record<string, Nominee[]>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const [savedResults, setSavedResults] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmCat, setConfirmCat] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    usersWithPicks: 0,
    submittedUsers: 0,
    submissions: [],
  });

  useEffect(() => {
    if (!user) return;

    const checkAdmin = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
      setCheckingRole(false);
    };
    checkAdmin();

    const fetchData = async () => {
      const [settingsRes, catRes, resRes, profilesRes, predictionsRes, nomRes] = await Promise.all([
        supabase.from('app_settings').select('*').single(),
        supabase.from('categories').select('*').order('name'),
        supabase.from('results').select('*'),
        supabase.from('profiles').select('id, display_name, submitted_at'),
        supabase.from('predictions').select('user_id'),
        supabase.from('nominees').select('*').order('nominee_name'),
      ]);

      if (settingsRes.data) {
        const s = settingsRes.data as AppSettings;
        setSettings(s);
        setLockTime(s.lock_time ? new Date(s.lock_time).toISOString().slice(0, 16) : '');
        setSubmissionsLocked(s.submissions_locked);
      }

      if (catRes.data) setCategories(catRes.data);

      if (nomRes.data) {
        const grouped: Record<string, Nominee[]> = {};
        nomRes.data.forEach((n: Nominee) => {
          if (!grouped[n.category_id]) grouped[n.category_id] = [];
          grouped[n.category_id].push(n);
        });
        setNominees(grouped);
      }

      if (resRes.data) {
        const map: Record<string, string> = {};
        resRes.data.forEach((r: any) => { map[r.category_id] = r.nominee_id || ''; });
        setResults(map);
        setSavedResults({ ...map });
      }

      // Compute stats
      const profiles = profilesRes.data || [];
      const totalUsers = profiles.length;
      const usersWithPicks = new Set(
        (predictionsRes.data || []).map((p: { user_id: string }) => p.user_id)
      ).size;
      const submitted = profiles.filter((p: any) => p.submitted_at);
      const submittedUsers = submitted.length;
      const submissions: SubmissionEntry[] = submitted
        .map((p: any) => ({
          display_name: p.display_name || 'Anonymous Player',
          email: p.id,
          submitted_at: p.submitted_at,
        }))
        .sort((a: SubmissionEntry, b: SubmissionEntry) =>
          new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        );

      setStats({ totalUsers, usersWithPicks, submittedUsers, submissions });
    };

    fetchData();
  }, [user]);

  if (checkingRole) return null;
  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-5">
        <Card className="max-w-sm pixel-border rounded-lg">
          <CardContent className="py-12 text-center">
            <div className="text-5xl mb-4">🚫</div>
            <p className="text-muted-foreground text-base font-bold">
              ACCESS DENIED. Admin only. 🥃
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('app_settings')
      .update({
        lock_time: new Date(lockTime).toISOString(),
        submissions_locked: submissionsLocked,
      })
      .eq('id', settings?.id);

    if (!error) toast.success('Settings saved! 🎉');
    else toast.error('Failed to save settings 😬');
    setSaving(false);
  };

  const handleSaveResult = async (categoryId: string) => {
    const nomineeId = results[categoryId];
    if (!nomineeId) return;
    setSaving(true);
    const { error } = await supabase
      .from('results')
      .upsert({ category_id: categoryId, nominee_id: nomineeId }, { onConflict: 'category_id' });

    if (!error) {
      setSavedResults((prev) => ({ ...prev, [categoryId]: nomineeId }));
      toast.success('Winner saved! 🏆');
    } else {
      toast.error('Failed to save winner 😬');
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-lg px-5 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <h1 className="font-pixel text-sm text-arcade-gradient mb-2 leading-relaxed">
          ADMIN PANEL ⚙️
        </h1>
        <p className="text-sm text-muted-foreground">
          Great power. Great showdown. ⚡
        </p>
      </motion.div>

      <div className="space-y-5">
        {/* Stats Dashboard */}
        <Card className="pixel-border rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="font-pixel text-[10px] leading-relaxed flex items-center gap-2">
              📊 STATS
            </CardTitle>
            <CardDescription>Real-time player metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/50 border border-border">
                <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="font-pixel text-lg text-primary">{stats.totalUsers}</p>
                <p className="text-[10px] text-muted-foreground font-bold">SIGNED UP</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50 border border-border">
                <Gamepad2 className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="font-pixel text-lg text-primary">{stats.usersWithPicks}</p>
                <p className="text-[10px] text-muted-foreground font-bold">PICKING</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50 border border-border">
                <Send className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="font-pixel text-lg text-primary">{stats.submittedUsers}</p>
                <p className="text-[10px] text-muted-foreground font-bold">SUBMITTED</p>
              </div>
            </div>

            {stats.submissions.length > 0 ? (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="font-pixel text-[8px]">PLAYER</TableHead>
                      <TableHead className="text-right font-pixel text-[8px]">SUBMITTED</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.submissions.map((s, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell className="font-medium text-sm">{s.display_name}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {new Date(s.submitted_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No submissions yet 🎬</p>
            )}
          </CardContent>
        </Card>

        <Card className="pixel-border rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="font-pixel text-[10px] leading-relaxed flex items-center gap-2">
              {submissionsLocked ? '🔒' : '🔓'} LOCK
            </CardTitle>
            <CardDescription>
              {submissionsLocked ? '🔒 Locked. No drama.' : '🔓 Open for chaos.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lockTime" className="text-sm font-semibold">Lock Time</Label>
              <Input
                id="lockTime"
                type="datetime-local"
                value={lockTime}
                onChange={(e) => setLockTime(e.target.value)}
                className="bg-muted/50 mt-1 min-h-[44px] rounded-lg border-2 border-border"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="locked" className="text-sm font-semibold">Force Lock</Label>
              <Switch
                id="locked"
                checked={submissionsLocked}
                onCheckedChange={setSubmissionsLocked}
              />
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-primary text-primary-foreground font-bold gap-2 min-h-[44px] rounded-lg w-full glow-selected"
            >
              <Save className="h-4 w-4" /> SAVE SETTINGS
            </Button>
          </CardContent>
        </Card>

        {/* Winners with dropdowns */}
        <Card className="pixel-border rounded-lg">
          <CardHeader className="pb-2">
            <CardTitle className="font-pixel text-[10px] leading-relaxed flex items-center gap-2">
              🏆 ENTER WINNERS
            </CardTitle>
            <CardDescription>Select the winner for each category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map((cat) => {
              const catNominees = nominees[cat.id] || [];
              const isSaved = savedResults[cat.id] === results[cat.id] && !!results[cat.id];
              return (
                <div key={cat.id} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                    {cat.name}
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={results[cat.id] || ''}
                      onValueChange={(val) => setResults((prev) => ({ ...prev, [cat.id]: val }))}
                    >
                      <SelectTrigger className="bg-muted/50 min-h-[44px] rounded-lg border-2 border-border flex-1">
                        <SelectValue placeholder="Select winner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {catNominees.map((nom) => (
                          <SelectItem key={nom.id} value={nom.id}>
                            {nom.nominee_name}{nom.film_title ? ` — ${nom.film_title}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => handleSaveResult(cat.id)}
                      disabled={saving || !results[cat.id]}
                      size="icon"
                      className={`min-h-[44px] min-w-[44px] rounded-lg ${isSaved ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
