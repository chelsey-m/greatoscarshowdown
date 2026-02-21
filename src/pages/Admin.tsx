import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';
import { Shield, Clock, Trophy, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, Result, AppSettings } from '@/types/database';

const Admin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [lockTime, setLockTime] = useState('');
  const [submissionsLocked, setSubmissionsLocked] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
      const [settingsRes, catRes, resRes] = await Promise.all([
        supabase.from('app_settings').select('*').single(),
        supabase.from('categories').select('*').order('name'),
        supabase.from('results').select('*'),
      ]);

      if (settingsRes.data) {
        const s = settingsRes.data as AppSettings;
        setSettings(s);
        setLockTime(s.lock_time ? new Date(s.lock_time).toISOString().slice(0, 16) : '');
        setSubmissionsLocked(s.submissions_locked);
      }

      if (catRes.data) setCategories(catRes.data);
      if (resRes.data) {
        const map: Record<string, string> = {};
        resRes.data.forEach((r: any) => { map[r.category_id] = r.actual_winner || r.nominee_id || ''; });
        setResults(map);
      }
    };

    fetchData();
  }, [user]);

  if (checkingRole) return null;
  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-sm border-border">
          <CardContent className="py-12 text-center">
            <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nice try. Admin access only. 🍸
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

    if (!error) toast.success('Settings saved!');
    else toast.error('Failed to save settings');
    setSaving(false);
  };

  const handleSaveResults = async () => {
    setSaving(true);
    const upserts = Object.entries(results)
      .filter(([_, winner]) => winner.trim())
      .map(([category_id, actual_winner]) => ({
        category_id,
        actual_winner: actual_winner.trim(),
      }));

    const { error } = await supabase
      .from('results')
      .upsert(upserts, { onConflict: 'category_id' });

    if (!error) toast.success('Results saved!');
    else toast.error('Failed to save results');
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-black text-gold-gradient mb-2">
          <Shield className="inline h-8 w-8 mr-2" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground">
          With great power comes great responsibility. And Malört.
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Lock Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Lock Settings
            </CardTitle>
            <CardDescription>Control when predictions close</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lockTime">Lock Time (local)</Label>
              <Input
                id="lockTime"
                type="datetime-local"
                value={lockTime}
                onChange={(e) => setLockTime(e.target.value)}
                className="bg-muted/50 mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="locked">Force Lock Submissions</Label>
              <Switch
                id="locked"
                checked={submissionsLocked}
                onCheckedChange={setSubmissionsLocked}
              />
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-gold-gradient text-primary-foreground font-semibold gap-2"
            >
              <Save className="h-4 w-4" /> Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Enter Results */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Enter Winners
            </CardTitle>
            <CardDescription>Type the actual winner for each category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.map((cat) => (
              <div key={cat.id}>
                <Label htmlFor={`result-${cat.id}`} className="text-sm text-muted-foreground">
                  {cat.name}
                </Label>
                <Input
                  id={`result-${cat.id}`}
                  placeholder="Actual winner..."
                  value={results[cat.id] || ''}
                  onChange={(e) =>
                    setResults((prev) => ({ ...prev, [cat.id]: e.target.value }))
                  }
                  className="bg-muted/50 mt-1"
                />
              </div>
            ))}
            {categories.length > 0 && (
              <Button
                onClick={handleSaveResults}
                disabled={saving}
                className="bg-gold-gradient text-primary-foreground font-semibold gap-2 mt-2"
              >
                <Save className="h-4 w-4" /> Save Results
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
