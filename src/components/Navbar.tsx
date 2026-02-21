import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { to: '/', label: 'Picks', emoji: '🎬' },
    { to: '/my-picks', label: 'My Picks', emoji: '🍿' },
    { to: '/leaderboard', label: 'Board', emoji: '🏆' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-party-gradient">
            🍻 Golden Malört
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ to, label, emoji }) => (
            <Link key={to} to={to}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={isActive(to) ? 'default' : 'ghost'}
                  size="sm"
                  className={`gap-1.5 text-sm min-h-[44px] px-3 ${
                    isActive(to) ? 'bg-party-gradient text-primary-foreground' : ''
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="hidden sm:inline font-semibold">{label}</span>
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
