import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  displayName: string | null;
  needsDisplayName: boolean;
  setDisplayName: (name: string) => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayNameState] = useState<string | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  const checkProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .maybeSingle();

    // Auto-create profile row with email-based name if it doesn't exist
    if (!data) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const autoName = authUser?.email?.split('@')[0] || 'Player';
      await supabase.from('profiles').upsert({ id: userId, user_id: userId, display_name: autoName }, { onConflict: 'id' });
      setDisplayNameState(autoName);
    } else {
      setDisplayNameState(data.display_name || null);
    }
    setProfileChecked(true);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer to avoid Supabase auth deadlock
        setTimeout(() => {
          checkProfile(session.user.id).then(() => setLoading(false));
        }, 0);
      } else {
        setDisplayNameState(null);
        setProfileChecked(false);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkProfile(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const needsDisplayName = !!user && profileChecked && !displayName;

  const setDisplayName = (name: string) => {
    setDisplayNameState(name);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, displayName, needsDisplayName, setDisplayName, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
