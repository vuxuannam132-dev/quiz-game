'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RoomStateResponse, UseRoomPollingReturn } from '@/types';

export function useRoomPolling(
  code: string,
  intervalMs: number = 2000
): UseRoomPollingReturn {
  const [roomState, setRoomState] = useState<RoomStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchRoomState = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/room/${code}`, {
        cache: 'no-store',
      });
      if (!isMountedRef.current) return;

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Không thể tải trạng thái phòng');
        return;
      }

      const data: RoomStateResponse = await res.json();
      setRoomState(data);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError('Mất kết nối, đang thử lại...');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [code]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch
    fetchRoomState();

    // Set up polling
    intervalRef.current = setInterval(fetchRoomState, intervalMs);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [code, intervalMs, fetchRoomState]);

  return { roomState, loading, error, refresh: fetchRoomState };
}
