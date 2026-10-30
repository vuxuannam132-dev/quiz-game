'use client';

import { useState, useCallback, useEffect } from 'react';
import { LeaderboardEntry, UseLeaderboardReturn } from '@/types';

export function useLeaderboard(roomCode: string): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!roomCode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard/${roomCode}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2500);
    return () => clearInterval(interval);
  }, [refresh]);

  return { leaderboard, loading, refresh };
}
