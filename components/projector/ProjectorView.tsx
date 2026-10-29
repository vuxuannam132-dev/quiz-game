'use client';

import { motion } from 'framer-motion';
import { RoomStateResponse, LeaderboardEntry } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { Timer } from '@/components/shared/Timer';
import { formatScore, getRankSuffix } from '@/lib/gameLogic';

interface ProjectorViewProps {
  roomState: RoomStateResponse;
  code: string;
  leaderboard?: LeaderboardEntry[];
  isMiniPreview?: boolean;
}

const KAHOOT_COLORS = [
  { key: 'A', bg: 'bg-[#E21B3C]', border: 'border-[#B0142E]', shape: '▲' },
  { key: 'B', bg: 'bg-[#1368CE]', border: 'border-[#0D4B96]', shape: '◆' },
  { key: 'C', bg: 'bg-[#D89E00]', border: 'border-[#A37700]', shape: '●' },
  { key: 'D', bg: 'bg-[#26890C]', border: 'border-[#1C6609]', shape: '■' },
];

export function ProjectorView({
  roomState,
  code,
  leaderboard = [],
  isMiniPreview = false,
}: ProjectorViewProps) {
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${code}/student` : '';
  const currentQ = roomState?.currentQuestion;

  // 1. FINISHED SCREEN
  if (roomState.status === 'finished') {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white ${isMiniPreview ? 'p-4' : 'min-h-screen p-8'}`}>
        <h1 className={`font-black text-center mb-4 ${isMiniPreview ? 'text-2xl' : 'text-5xl md:text-6xl'}`}
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FF6600, #FF0080)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          🏆 Bảng Vàng Vinh Danh!
        </h1>

        <div className={`w-full ${isMiniPreview ? 'max-w-md space-y-2' : 'max-w-2xl space-y-4'}`}>
          {leaderboard.slice(0, isMiniPreview ? 3 : 5).map((entry, index) => (
            <div
              key={entry.studentName}
              className={`flex items-center gap-3 rounded-2xl border-2 ${isMiniPreview ? 'p-2.5 text-xs' : 'p-4 md:p-6 text-base'} ${
                index === 0
                  ? 'bg-yellow-500/20 border-yellow-500/60 shadow-[0_0_20px_rgba(234,179,8,0.25)]'
                  : index === 1
                  ? 'bg-slate-400/20 border-slate-400/50'
                  : index === 2
                  ? 'bg-amber-600/20 border-amber-600/50'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className={`${isMiniPreview ? 'text-2xl w-8' : 'text-4xl w-14'} text-center`}>
                {getRankSuffix(entry.rank)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-white truncate ${isMiniPreview ? 'text-sm' : 'text-xl'}`}>
                  {entry.studentName}
                </div>
                <div className="text-slate-400 text-[11px]">{entry.correctCount} câu đúng</div>
              </div>
              <div className={`font-black tabular-nums ${isMiniPreview ? 'text-base' : 'text-2xl'} ${
                index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-400' : 'text-white'
              }`}>
                {formatScore(entry.totalScore)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. WAITING LOBBY (QR CODE + PIN)
  if (roomState.status === 'waiting') {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-brand-bg text-center ${isMiniPreview ? 'p-4' : 'min-h-screen p-8'}`}>
        {!isMiniPreview && <span className="text-6xl mb-2 block animate-bounce">🎮</span>}
        <h2 className={`font-black text-slate-900 tracking-tight ${isMiniPreview ? 'text-xl mb-1' : 'text-4xl md:text-5xl mb-3'}`}>
          Sẵn sàng tham gia!
        </h2>
        <p className={`text-slate-600 ${isMiniPreview ? 'text-xs mb-3' : 'text-lg mb-6'}`}>
          Mở camera quét mã QR hoặc nhập mã PIN bên dưới:
        </p>

        {/* QR Code Container */}
        <div className={`bg-white rounded-3xl shadow-xl border-4 border-slate-200 flex flex-col items-center ${isMiniPreview ? 'p-3 mb-3' : 'p-6 mb-6'}`}>
          {joinUrl && (
            <QRCodeSVG
              value={joinUrl}
              size={isMiniPreview ? 140 : 230}
              level="H"
              includeMargin={true}
            />
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">PIN:</span>
            <span className={`font-black font-mono tracking-widest text-brand-dark ${isMiniPreview ? 'text-2xl' : 'text-5xl'}`}>
              {code}
            </span>
          </div>
        </div>

        <div className="bg-white px-5 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className={`font-bold text-slate-700 ${isMiniPreview ? 'text-xs' : 'text-sm'}`}>
            Đã có <strong className="text-brand-blue font-black">{roomState.studentsCount}</strong> học sinh vào phòng
          </span>
        </div>
      </div>
    );
  }

  // 3. PLAYING / PAUSED (QUESTION DISPLAY OR ANSWER REVEAL)
  if (currentQ) {
    return (
      <div className={`w-full h-full flex flex-col justify-between bg-brand-bg ${isMiniPreview ? 'p-4' : 'min-h-screen p-8'}`}>
        {/* Header / Pin info banner */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="bg-slate-200 text-slate-700 font-bold px-2.5 py-0.5 rounded-full text-xs">
              Câu {roomState.currentQuestionIndex + 1} / {roomState.totalQuestions}
            </span>
            <span className="font-mono font-black text-slate-500 text-xs tracking-wider">
              PIN: {code}
            </span>
          </div>

          {/* Timer if exam mode */}
          {roomState.mode === 'exam' && roomState.settings?.timeLimit && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-brand-red">⏱️</span>
              <Timer
                timeLimit={roomState.settings.timeLimit}
                onTimeUp={() => {}}
                isRunning={roomState.status === 'playing' && !roomState.questionRevealed}
              />
            </div>
          )}
        </div>

        {/* REVEALED ANSWER VIEW */}
        {roomState.questionRevealed ? (
          <div className="flex-1 flex flex-col justify-center my-3">
            <div className="text-center mb-3">
              <span className="text-2xl block mb-1">🎉</span>
              <h3 className={`font-black text-slate-900 ${isMiniPreview ? 'text-lg' : 'text-3xl'}`}>
                Đáp án chính xác!
              </h3>
            </div>

            {currentQ.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-4xl mx-auto w-full">
                {currentQ.options.map((option, idx) => {
                  const isCorrect = option.key === currentQ.correctAnswer;
                  const style = KAHOOT_COLORS[idx % KAHOOT_COLORS.length];
                  return (
                    <div
                      key={option.key}
                      className={`
                        rounded-2xl text-white flex items-center gap-3 border-b-4 transition-all
                        ${isMiniPreview ? 'p-2.5 min-h-[50px]' : 'p-5 min-h-[85px]'}
                        ${isCorrect
                          ? `${style.bg} border-black/20 shadow-lg ring-4 ring-green-400 font-black`
                          : 'bg-slate-300 border-slate-400 opacity-30 text-slate-700'
                        }
                      `}
                    >
                      <div className={`rounded-xl bg-black/20 flex items-center justify-center font-black shrink-0 ${isMiniPreview ? 'w-7 h-7 text-sm' : 'w-11 h-11 text-xl'}`}>
                        {isCorrect ? '✓' : '✕'}
                      </div>
                      <div className={`font-extrabold flex-1 truncate ${isMiniPreview ? 'text-xs' : 'text-xl md:text-2xl'}`}>
                        {option.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {currentQ.explanation && (
              <div className={`bg-white rounded-2xl border border-slate-200 text-slate-700 text-center mx-auto max-w-xl shadow-sm ${isMiniPreview ? 'mt-2 p-2 text-xs' : 'mt-4 p-3.5 text-sm'}`}>
                💡 <strong>Giải thích:</strong> {currentQ.explanation}
              </div>
            )}
          </div>
        ) : (
          /* QUESTION DISPLAY VIEW */
          <div className="flex-1 flex flex-col justify-between my-2">
            {/* Question Text */}
            <div className="text-center my-auto">
              <h2 className={`font-black text-slate-900 leading-snug mx-auto max-w-4xl ${isMiniPreview ? 'text-base sm:text-lg mb-2' : 'text-3xl md:text-5xl mb-6'}`}>
                {currentQ.content}
              </h2>

              {currentQ.imageUrl && (
                <div className="flex justify-center mb-2">
                  <img
                    src={currentQ.imageUrl}
                    alt="Hình minh họa"
                    className={`rounded-2xl shadow-md object-contain border-2 border-white ${isMiniPreview ? 'max-h-24' : 'max-h-60'}`}
                  />
                </div>
              )}
            </div>

            {/* 4 Kahoot Answer Blocks */}
            {currentQ.options && currentQ.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-4xl mx-auto w-full pb-1">
                {currentQ.options.map((option, idx) => {
                  const style = KAHOOT_COLORS[idx % KAHOOT_COLORS.length];
                  return (
                    <div
                      key={option.key}
                      className={`
                        ${style.bg} ${style.border} border-b-4 rounded-2xl text-white
                        flex items-center gap-3 shadow-md
                        ${isMiniPreview ? 'p-2.5 min-h-[50px]' : 'p-5 min-h-[85px]'}
                      `}
                    >
                      <div className={`rounded-xl bg-black/20 flex items-center justify-center font-black shrink-0 ${isMiniPreview ? 'w-7 h-7 text-sm' : 'w-11 h-11 text-xl'}`}>
                        {style.shape}
                      </div>
                      <div className={`font-black flex-1 truncate ${isMiniPreview ? 'text-xs' : 'text-xl md:text-2xl'}`}>
                        {option.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-brand-bg text-slate-400 font-bold p-6">
      Đang chuẩn bị màn chiếu...
    </div>
  );
}
