'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRoomPolling } from '@/hooks/useRoomPolling';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSound } from '@/hooks/useSound';
import { ProjectorView } from '@/components/projector/ProjectorView';

export default function ProjectorPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { roomState, loading } = useRoomPolling(code, 1500);
  const { leaderboard, refresh: refreshLeaderboard } = useLeaderboard(code);
  const soundEnabled = roomState?.settings?.soundEnabled ?? true;
  const { play } = useSound(soundEnabled);

  useEffect(() => {
    if (roomState?.questionRevealed || roomState?.showRanking) {
      play('reveal');
      refreshLeaderboard();
    }
  }, [roomState?.questionRevealed, roomState?.showRanking]);

  useEffect(() => {
    if (roomState?.status === 'finished') {
      play('finish');
      refreshLeaderboard();
    }
  }, [roomState?.status]);

  if (loading && !roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-2xl font-black text-slate-400 animate-pulse">
          Đang kết nối màn chiếu...
        </div>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-center p-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Phòng không tồn tại</h2>
          <p className="text-slate-500 font-semibold">Vui lòng kiểm tra lại mã PIN</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg select-none">
      <ProjectorView
        roomState={roomState}
        code={code}
        leaderboard={leaderboard}
        isMiniPreview={false}
      />
    </div>
  );
}
