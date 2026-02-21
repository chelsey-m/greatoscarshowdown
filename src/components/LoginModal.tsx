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
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error } = isSignUp
      ? await signUp(email, password)
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
      <DialogContent className="pixel-border shadow-arcade bg-card rounded-xl max-w-md mx-auto border-2 border-border">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="font-pixel text-xs leading-relaxed">
            {isSignUp ? 'CREATE ACCOUNT 🕹️' : 'SIGN IN 🎮'}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {isSignUp
              ? 'Sign up to lock in your picks.'
              : 'Log in to save your predictions.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-9 min-h-[48px] text-base rounded-lg border-2 border-border focus:border-primary"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="pl-9 min-h-[48px] text-base rounded-lg border-2 border-border focus:border-primary"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-secondary text-secondary-foreground font-bold text-base min-h-[44px] rounded-xl glow-gold"
            disabled={submitting}
          >
            {submitting
              ? 'LOADING... ✨'
              : isSignUp
                ? 'SIGN UP 🚀'
                : 'LOG IN 🪄'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-primary underline underline-offset-2 font-semibold"
          >
            {isSignUp ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
