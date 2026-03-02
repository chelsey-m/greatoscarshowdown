import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const LoginModal = ({ open, onOpenChange, onSuccess }: LoginModalProps) => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    if (isSignUp) {
      const trimmed = displayName.trim();
      if (trimmed.length < 3 || trimmed.length > 20) {
        setError('Display name must be 3–20 characters');
        setSubmitting(false);
        return;
      }
      if (!/^[a-zA-Z0-9 _]+$/.test(trimmed)) {
        setError('Only letters, numbers, spaces, and underscores allowed');
        setSubmitting(false);
        return;
      }
    }
    const { error } = isSignUp
      ? await signUp(email, password, displayName)
      : await signIn(email, password);
    if (error) {
      setError(error.message);
    } else {
      onOpenChange(false);
      onSuccess?.();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pixel-border shadow-arcade bg-card rounded-xl max-w-md mx-auto border-2 border-primary/30 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0 duration-200"
        style={{ boxShadow: '0 0 30px 2px hsl(var(--primary) / 0.15)' }}
      >
        <DialogHeader className="text-center pb-3">
          <DialogTitle className="font-pixel text-xs leading-relaxed tracking-wide">
            🎮 PLAYER SELECT 🎮
          </DialogTitle>
          <DialogDescription className="text-base mt-2 text-muted-foreground">
            Choose your fighter.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Player Name
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={30}
                  className="min-h-[48px] text-base rounded-lg border-2 border-border focus:border-primary"
                />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Player ID
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="player@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9 min-h-[48px] text-base rounded-lg border-2 border-border focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Access Code
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pl-9 min-h-[48px] text-base rounded-lg border-2 border-border focus:border-primary"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {isSignUp ? (
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-bold text-base min-h-[48px] rounded-xl"
              disabled={submitting}
            >
              {submitting ? 'CREATING... ✨' : '🆕 CREATE NEW PLAYER'}
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full bg-secondary text-secondary-foreground font-bold text-base min-h-[48px] rounded-xl glow-gold"
              disabled={submitting}
            >
              {submitting ? 'LOADING... ✨' : '🔥 ENTER THE ARENA'}
            </Button>
          )}
        </form>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {isSignUp ? 'Already a player?' : 'New challenger?'}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-primary underline underline-offset-2 font-semibold"
          >
            {isSignUp ? '🔥 Enter the Arena' : '🆕 Create New Player'}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
