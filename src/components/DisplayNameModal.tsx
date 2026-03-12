import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9 _]+$/;

interface DisplayNameModalProps {
  open: boolean;
  userId: string;
  onComplete: (name: string) => void;
  onClose?: () => void;
  message?: string;
}

const DisplayNameModal = ({ open, userId, onComplete, onClose, message }: DisplayNameModalProps) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = (val: string): string | null => {
    const trimmed = val.trim();
    if (trimmed.length < 3) return 'Must be at least 3 characters';
    if (trimmed.length > 20) return 'Must be 20 characters or less';
    if (!DISPLAY_NAME_REGEX.test(trimmed)) return 'Only letters, numbers, spaces, and underscores allowed';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    // Check if another user already has this display name
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('display_name', trimmed)
      .neq('id', userId)
      .maybeSingle();

    if (existing) {
      setError('That username is already taken. Please choose another.');
      setSubmitting(false);
      return;
    }

    // Ensure profile row exists, then update display_name
    await supabase.from('profiles').upsert({ id: userId, user_id: userId, display_name: '' }, { onConflict: 'id' });

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', userId);

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    onComplete(trimmed);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && onClose) onClose(); }}>
      <DialogContent
        className="pixel-border shadow-arcade bg-card rounded-xl max-w-md mx-auto border-2 border-primary/30 backdrop-blur-md"
        style={{ boxShadow: '0 0 30px 2px hsl(var(--primary) / 0.15)' }}
      >
        <DialogHeader className="text-center pb-3">
          <DialogTitle className="font-pixel text-xs leading-relaxed tracking-wide">
            🎮 CHOOSE YOUR NAME 🎮
          </DialogTitle>
          <DialogDescription className="text-base mt-2 text-muted-foreground">
            Pick a display name for the leaderboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Display Name
            </label>
            <Input
              type="text"
              placeholder="e.g. CinemaKing99"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              maxLength={20}
              className="min-h-[48px] text-base rounded-lg border-2 border-border focus:border-primary"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              3–20 chars · letters, numbers, spaces, underscores
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-secondary text-secondary-foreground font-bold text-base min-h-[48px] rounded-xl glow-gold"
            disabled={submitting}
          >
            {submitting ? 'SAVING... ✨' : '🏆 LOCK IT IN'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DisplayNameModal;
