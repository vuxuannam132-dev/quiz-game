'use client';

import { useState, useCallback } from 'react';
import { LeaderboardEntry, UseLeaderboardReturn } from '@/types';

export function useLeaderboard(roomCode: string): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!roomCode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard/${roomCode}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  return { leaderboard, loading, refresh };
}
