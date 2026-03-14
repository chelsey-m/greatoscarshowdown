import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';

const Login = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);
    if (error) {
      setError(error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12 sparkle">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="mb-10 text-center">
          <motion.div
            className="text-4xl mb-5"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1, y: [0, -6, 0] }}
            transition={{
              scale: { delay: 0.2, type: 'spring', stiffness: 200 },
              y: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
            }}
          >
            🏆🎬🍕
          </motion.div>
          <h1 className="font-pixel text-xs sm:text-sm text-arcade-gradient mb-4 leading-relaxed">
            🏆 THE GREAT OSCAR SHOWDOWN 🏆
          </h1>
          <p className="text-sm text-muted-foreground font-bold tracking-wide mt-3">
            Logan Square Edition • 2026
          </p>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <motion.button
              type="button"
              className="w-full font-pixel text-sm min-h-[48px] px-6 py-3 rounded-xl text-secondary-foreground bg-secondary border-2 border-accent/60"
              style={{
                boxShadow: '0 0 12px 1px hsl(43 70% 50% / 0.4), 0 0 3px 0.5px hsl(43 70% 50% / 0.2) inset',
              }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              onClick={() => {
                document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              🎮 PRESS START 🍕
            </motion.button>
          </motion.div>
        </div>

        <Card id="auth-card" className="pixel-border shadow-arcade bg-card rounded-xl">
          <CardHeader className="text-center pb-3">
            <CardTitle className="font-pixel text-xs leading-relaxed">
              {isSignUp ? 'CREATE ACCOUNT 🕹️' : 'SIGN IN 🎮'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isSignUp
                ? 'Sign up to join the showdown.'
                : 'Enter your credentials to play.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
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
            <p className="text-center text-sm text-muted-foreground mt-4">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-primary underline underline-offset-2 font-semibold"
              >
                {isSignUp ? 'Log in' : 'Sign up'}
              </button>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Deep dish optional. Victory mandatory. 🍕
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
