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
import { QRCodeSVG } from 'qrcode.react';

export default function ProjectorPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { roomState, loading } = useRoomPolling(code, 1500);
  const { leaderboard, refresh: refreshLeaderboard } = useLeaderboard(code);
  const soundEnabled = roomState?.settings?.soundEnabled ?? true;
  const { play } = useSound(soundEnabled);

  useEffect(() => {
    if (roomState?.questionRevealed) {
      play('reveal');
      refreshLeaderboard();
    }
  }, [roomState?.questionRevealed]);

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
          <p className="text-slate-500">Vui lòng kiểm tra lại mã PIN</p>
        </div>
      </div>
    );
  }

  // Final Leaderboard Screen
  if (roomState.status === 'finished') {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center">
        <ProjectorLeaderboard entries={leaderboard} />
      </div>
    );
  }

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${code}/student` : '';

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      {/* Top Bar with Pin & QR Code */}
      <RoomCode
        code={code}
        studentsCount={roomState.studentsCount}
        mode={roomState.mode}
        status={roomState.status}
      />

      {/* Main Screen Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Waiting Lobby Screen */}
        {roomState.status === 'waiting' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full text-center">
            <span className="text-7xl mb-4 block animate-bounce">🎮</span>
            <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tight">
              Sẵn sàng tham gia!
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Mở camera điện thoại quét mã QR hoặc nhập mã PIN bên dưới:
            </p>

            {/* Huge QR Code Card */}
            <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-slate-200 flex flex-col items-center mb-8">
              {joinUrl && (
                <QRCodeSVG
                  value={joinUrl}
                  size={240}
                  level="H"
                  includeMargin={true}
                />
              )}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm font-bold text-slate-400 uppercase">Mã PIN:</span>
                <span className="text-5xl font-black font-mono tracking-widest text-brand-dark">
                  {code}
                </span>
              </div>
            </div>

            <div className="bg-white px-6 py-3 rounded-full border border-slate-200 shadow-sm flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-bold text-slate-700">
                Đã có <span className="text-brand-blue font-black">{roomState.studentsCount}</span> bạn vào phòng
              </span>
            </div>
          </div>
        )}

        {/* Question & Answer Reveal Screens */}
        {(roomState.status === 'playing' || roomState.status === 'paused') && roomState.currentQuestion && (
          <>
            {roomState.questionRevealed ? (
              <AnswerReveal
                question={roomState.currentQuestion}
                skipEffects={roomState.settings?.skipEffects}
              />
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <QuestionDisplay
                  question={roomState.currentQuestion}
                  questionNumber={roomState.currentQuestionIndex + 1}
                  totalQuestions={roomState.totalQuestions}
                />

                {/* Bottom Timer for Exam Mode */}
                {roomState.mode === 'exam' && roomState.settings?.timeLimit && (
                  <div className="flex justify-center pb-8">
                    <Timer
                      timeLimit={roomState.settings.timeLimit}
                      onTimeUp={() => {}}
                      isRunning={roomState.status === 'playing'}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
