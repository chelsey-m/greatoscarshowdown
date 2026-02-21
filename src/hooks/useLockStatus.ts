import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppSettings } from '@/types/database';

export const useLockStatus = () => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLock = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .single();

      if (data) {
        const settings = data as AppSettings;
        setLockTime(settings.lock_time);
        const now = new Date();
        const lock = new Date(settings.lock_time);
        setIsLocked(settings.submissions_locked || now >= lock);
      }
      setLoading(false);
    };

    checkLock();
    const interval = setInterval(checkLock, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isLocked, lockTime, loading };
};
