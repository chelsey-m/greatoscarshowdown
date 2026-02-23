import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <nav className="sticky top-0 z-50 border-b-2 border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-pixel text-[10px] text-arcade-gradient">
              🏆 OSCAR SHOWDOWN
            </span>
          </Link>
        </div>
      </nav>
    );
  }

  const links = [
    { to: '/', label: 'Home', emoji: '🏠' },
    { to: '/picks', label: 'Picks', emoji: '🍿' },
    { to: '/my-picks', label: 'Mine', emoji: '🎮' },
    { to: '/leaderboard', label: 'Board', emoji: '🏆' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-pixel text-[10px] text-arcade-gradient">
            🏆 OSCAR SHOWDOWN
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ to, label, emoji }) => (
            <Link key={to} to={to}>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant={isActive(to) ? 'default' : 'ghost'}
                  size="sm"
                  className={`gap-1.5 text-sm min-h-[44px] px-3 font-bold ${
                    isActive(to) ? 'bg-primary text-primary-foreground glow-selected' : ''
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              </motion.div>
            </Link>
          ))}

          <Link to="/admin">
            <Button variant="ghost" size="sm" className="gap-1.5 text-sm min-h-[44px] px-3">
              <span>⚙️</span>
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="gap-1.5 text-sm text-muted-foreground min-h-[44px]"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
