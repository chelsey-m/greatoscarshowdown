import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

const Login = () => {
  const { user, loading, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error } = await signInWithMagicLink(email);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 sparkle">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            🏆🍻🎬
          </motion.div>
          <h1 className="text-4xl font-black text-party-gradient mb-1">
            The Golden Malört
          </h1>
          <p className="text-lg text-foreground font-bold">Oscar Pool 2026 🍿</p>
          <p className="text-sm text-muted-foreground mt-2">
            Chicago's finest house party meets Hollywood's biggest night ⭐
          </p>
        </div>

        <Card className="border-border shadow-party bg-card rounded-2xl">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl">
              {sent ? 'Check Your Inbox ✉️' : 'Join the Party 🎉'}
            </CardTitle>
            <CardDescription className="text-base">
              {sent
                ? "Magic link sent! Click it and you're in. 🔮"
                : "Drop your email — we'll send a magic link. No password needed."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4 py-4">
                <motion.div
                  className="text-5xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  🎉
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  Didn't get it? Check spam, or{' '}
                  <button
                    onClick={() => setSent(false)}
                    className="text-primary underline underline-offset-2 font-semibold"
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 min-h-[48px] text-base rounded-xl"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-party-gradient text-primary-foreground font-bold text-base min-h-[48px] rounded-xl"
                  disabled={submitting}
                >
                  {submitting ? 'Sending... ✨' : 'Send Magic Link 🪄'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          No Malört required. But encouraged. 🥂
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
