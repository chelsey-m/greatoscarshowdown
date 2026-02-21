import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Trophy, ListChecks, Star, Shield, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { to: '/', label: 'Predictions', icon: Star },
    { to: '/my-picks', label: 'My Picks', icon: ListChecks },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-gold-gradient font-['Playfair_Display']">
            🏆 Golden Malört
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant={isActive(to) ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-1.5 text-xs"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              </motion.div>
            </Link>
          ))}

          <Link to="/admin">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
