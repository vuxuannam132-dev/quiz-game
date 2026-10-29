'use client';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRoomPolling } from '@/hooks/useRoomPolling';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSound } from '@/hooks/useSound';
import { QuestionDisplay } from '@/components/projector/QuestionDisplay';
import { AnswerReveal } from '@/components/projector/AnswerReveal';
import { ProjectorLeaderboard } from '@/components/projector/Leaderboard';
import { RoomCode } from '@/components/projector/RoomCode';
import { Timer } from '@/components/shared/Timer';

export default function ProjectorPage() {
  const params = useParams();
  const code = params.code as string;
  const { roomState, loading } = useRoomPolling(code, 2000);
  const { leaderboard, refresh: refreshLeaderboard } = useLeaderboard(code);
  const soundEnabled = roomState?.settings?.soundEnabled ?? true;
  const { play } = useSound(soundEnabled);

  useEffect(() => {
    if (roomState?.questionRevealed) {
      play('reveal');
      refreshLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.questionRevealed]);

  useEffect(() => {
    if (roomState?.status === 'finished') {
      play('finish');
      refreshLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomState?.status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-electric-blue text-2xl animate-pulse">Đang tải...</div>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-xl">Phòng không tồn tại</div>
      </div>
    );
  }

  if (roomState.status === 'finished') {
    return (
      <div className="min-h-screen" style={{ background: '#0f0f23' }}>
        <ProjectorLeaderboard entries={leaderboard} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f0f23' }}>
      <RoomCode
        code={code.toUpperCase()}
        studentsCount={roomState.studentsCount}
        mode={roomState.mode}
        status={roomState.status}
      />

      <div className="flex-1 flex flex-col">
        {roomState.status === 'waiting' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-6xl animate-bounce">🎮</div>
            <h1 className="text-4xl font-black text-white">Chờ bắt đầu...</h1>
            <p className="text-gray-400 text-xl">
              Tham gia tại <span className="text-electric-blue font-bold">{typeof window !== 'undefined' ? window.location.hostname : ''}</span>
            </p>
            <div className="text-8xl font-black text-electric-blue tracking-widest" style={{ textShadow: '0 0 30px rgba(0,212,255,0.8)' }}>
              {code.toUpperCase()}
            </div>
            <p className="text-gray-500">{roomState.studentsCount} học sinh đã tham gia</p>
          </div>
        )}

        {(roomState.status === 'playing' || roomState.status === 'paused') && roomState.currentQuestion && (
          <>
            {roomState.questionRevealed ? (
              <AnswerReveal
                question={roomState.currentQuestion}
                skipEffects={roomState.settings?.skipEffects}
              />
            ) : (
              <div className="flex-1 flex flex-col">
                <QuestionDisplay
                  question={roomState.currentQuestion}
                  questionNumber={roomState.currentQuestionIndex + 1}
                  totalQuestions={roomState.totalQuestions}
                />
                {roomState.mode === 'exam' && roomState.settings?.timeLimit && (
                  <div className="flex justify-center pb-6">
                    <Timer
                      timeLimit={roomState.settings.timeLimit}
                      onTimeUp={() => {}}
                      isRunning={roomState.status === 'playing'}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="text-center py-3 text-gray-500 text-sm border-t border-white/5">
              {roomState.questionRevealed ? '✅ Đã công bố đáp án' : '⏳ Học sinh đang làm bài...'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
