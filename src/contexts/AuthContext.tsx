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
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
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

    // Auto-create profile row if it doesn't exist
    if (!data) {
      await supabase.from('profiles').upsert({ id: userId, user_id: userId, display_name: '' }, { onConflict: 'id' });
      setDisplayNameState(null);
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

  const signUp = async (email: string, password: string, displayNameVal: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: undefined },
    });
    if (!error && data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        user_id: data.user.id,
        display_name: displayNameVal.trim(),
      }, { onConflict: 'id' });
      if (profileError) {
        return { error: { message: profileError.message.includes('unique') || profileError.message.includes('duplicate') ? 'That display name is already taken!' : profileError.message } };
      }
      setDisplayNameState(displayNameVal.trim());
    }
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
