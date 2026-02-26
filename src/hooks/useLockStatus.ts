import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppSettings } from '@/types/database';

// March 15, 2026 7:00 PM America/Chicago (CDT = UTC-5)
const HARDCODED_LOCK_ISO = '2026-03-16T00:00:00Z';

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

      const effectiveLockTime = (data as AppSettings)?.lock_time || HARDCODED_LOCK_ISO;
      setLockTime(effectiveLockTime);

      const now = Date.now();
      const lock = new Date(effectiveLockTime).getTime();
      const manualLock = (data as AppSettings)?.submissions_locked ?? false;
      setIsLocked(manualLock || now >= lock);
      setLoading(false);
    };

    checkLock();
    const interval = setInterval(checkLock, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isLocked, lockTime, loading };
};
