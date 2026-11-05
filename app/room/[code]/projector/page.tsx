'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRoomPolling } from '@/hooks/useRoomPolling';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSound } from '@/hooks/useSound';
import { ProjectorView } from '@/components/projector/ProjectorView';
import { AudioToggle } from '@/components/shared/AudioToggle';

export default function ProjectorPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { roomState, loading } = useRoomPolling(code, 1500);
  const { leaderboard, refresh: refreshLeaderboard } = useLeaderboard(code);

  const {
    play,
    playBGM,
    stopBGM,
    soundEnabled,
    toggleSound,
  } = useSound(true);

  // Background Music Orchestration based on current room state
  useEffect(() => {
    if (!roomState) return;

    if (roomState.status === 'waiting') {
      playBGM('lobby');
    } else if (roomState.status === 'playing') {
      if (roomState.showRanking || roomState.questionRevealed) {
        stopBGM();
      } else {
        // While question is active: play dramatic countdown battle music
        playBGM('question_battle');
      }
    } else if (roomState.status === 'finished') {
      playBGM('victory');
    } else {
      stopBGM();
    }
  }, [
    roomState?.status,
    roomState?.currentQuestionIndex,
    roomState?.questionRevealed,
    roomState?.showRanking,
    playBGM,
    stopBGM,
  ]);

  // Trigger SFX on reveal
  useEffect(() => {
    if (roomState?.questionRevealed) {
      play('reveal');
      refreshLeaderboard();
    }
  }, [roomState?.questionRevealed, play, refreshLeaderboard]);

  // Trigger SFX on finish
  useEffect(() => {
    if (roomState?.status === 'finished') {
      play('finish');
      refreshLeaderboard();
    }
  }, [roomState?.status, play, refreshLeaderboard]);

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
    <div className="min-h-screen bg-brand-bg select-none relative">
      <ProjectorView
        roomState={roomState}
        code={code}
        leaderboard={leaderboard}
        isMiniPreview={false}
        onTickSound={(sec) => {
          if (sec <= 5 && sec > 0) {
            play('urgent_tick');
          }
        }}
      />

      {/* Floating Audio Toggle placed at bottom-left corner of the screen */}
      <AudioToggle soundEnabled={soundEnabled} onToggle={toggleSound} />
    </div>
  );
}
