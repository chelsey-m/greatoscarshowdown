import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Mail, Sparkles } from 'lucide-react';

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
    <div className="flex min-h-screen items-center justify-center px-4 sparkle">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <motion.h1
            className="text-5xl font-black text-gold-gradient mb-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            🏆
          </motion.h1>
          <h1 className="text-3xl font-black text-gold-gradient mb-1">
            The Golden Malört
          </h1>
          <p className="text-lg text-foreground font-semibold">Oscar Pool 2026</p>
          <p className="text-sm text-muted-foreground mt-1">
            Like a Logan Blvd house party, but with more trophies
          </p>
        </div>

        <Card className="border-border shadow-gold bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {sent ? 'Check Your Inbox ✉️' : 'Join the Pool'}
            </CardTitle>
            <CardDescription>
              {sent
                ? "We sent you a magic link. Click it and you're in."
                : "Enter your email. We'll send a magic link — no password needed."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-3">
                <Sparkles className="mx-auto h-10 w-10 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Didn't get it? Check spam, or{' '}
                  <button
                    onClick={() => setSent(false)}
                    className="text-primary underline underline-offset-2"
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gold-gradient text-primary-foreground font-semibold"
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Send Magic Link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          No Malört required to participate. But encouraged.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
