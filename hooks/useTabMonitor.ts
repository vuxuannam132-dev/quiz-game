'use client';

import { useEffect, useRef, useCallback } from 'react';
import { UseTabMonitorOptions, RoomMode } from '@/types';

export function useTabMonitor({
  enabled,
  onSwitch,
  onDisqualify,
  maxSwitches = 3,
  mode,
}: UseTabMonitorOptions) {
  const switchCountRef = useRef(0);
  const isEnabledRef = useRef(enabled);

  useEffect(() => {
    isEnabledRef.current = enabled;
  }, [enabled]);

  const handleVisibilityChange = useCallback(() => {
    if (!isEnabledRef.current) return;
    
    if (document.hidden) {
      switchCountRef.current += 1;
      const count = switchCountRef.current;
      onSwitch(count);

      if (mode === 'exam' && onDisqualify && count >= maxSwitches) {
        onDisqualify();
      }
    }
  }, [onSwitch, onDisqualify, maxSwitches, mode]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, handleVisibilityChange]);

  return {
    getSwitchCount: () => switchCountRef.current,
    reset: () => { switchCountRef.current = 0; },
  };
}
