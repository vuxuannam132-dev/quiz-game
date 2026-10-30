'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  leaderboard: externalLeaderboard = [],
  isMiniPreview = false,
}: ProjectorViewProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(externalLeaderboard);
  const confettiFiredRef = useRef(false);

  // Sync external leaderboard or fetch directly to guarantee data is never empty
  useEffect(() => {
    if (externalLeaderboard && externalLeaderboard.length > 0) {
      setLeaderboard(externalLeaderboard);
    }
  }, [externalLeaderboard]);

  useEffect(() => {
    if (code && (roomState.status === 'finished' || roomState.showRanking || leaderboard.length === 0)) {
      fetch(`/api/leaderboard/${code}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setLeaderboard(data);
          }
        })
        .catch(() => {});
    }
  }, [code, roomState.status, roomState.showRanking, roomState.currentQuestionIndex]);

  // Grand celebration confetti for finished screen
  useEffect(() => {
    if (roomState.status === 'finished' && !confettiFiredRef.current && typeof window !== 'undefined') {
      confettiFiredRef.current = true;
      import('canvas-confetti').then(({ default: confetti }) => {
        // First burst
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#E21B3C', '#1368CE', '#26890C', '#FFA602'],
        });
        // Follow-up bursts
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 60,
            origin: { x: 0.1, y: 0.7 },
          });
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 60,
            origin: { x: 0.9, y: 0.7 },
          });
        }, 600);
      });
    }
  }, [roomState.status]);

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${code}/student` : '';
  const currentQ = roomState?.currentQuestion;
  const roundStats = roomState?.roundStats;

  // ==========================================
  // 1. FINISHED SCREEN: GRAND PODIUM 3D
  // ==========================================
  if (roomState.status === 'finished') {
    const first = leaderboard[0];
    const second = leaderboard[1];
    const third = leaderboard[2];
    const runnersUp = leaderboard.slice(3, isMiniPreview ? 5 : 8);

    return (
      <div className={`w-full h-full flex flex-col items-center justify-between bg-slate-950 text-white ${isMiniPreview ? 'p-3' : 'min-h-screen p-6 md:p-10'} select-none overflow-y-auto`}>
        {/* Title */}
        <div className="text-center my-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-2 mb-1"
          >
            <span className={isMiniPreview ? 'text-2xl' : 'text-5xl'}>👑</span>
            <h1
              className={`font-black tracking-tight ${isMiniPreview ? 'text-2xl' : 'text-5xl md:text-6xl'}`}
              style={{
                background: 'linear-gradient(135deg, #FFE259 0%, #FFA751 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              BẢNG VÀNG VINH DANH
            </h1>
          </motion.div>
          <p className={`text-slate-400 font-bold ${isMiniPreview ? 'text-[11px]' : 'text-sm'}`}>
            {roomState.name ? `Phòng: ${roomState.name}` : `Mã phòng: ${code}`} • Tổng kết trận đấu
          </p>
        </div>

        {/* PODIUM 3D */}
        {leaderboard.length > 0 ? (
          <div className="w-full max-w-4xl mx-auto my-auto flex flex-col items-center">
            <div className="flex items-end justify-center gap-2 sm:gap-4 w-full px-2 pt-6 pb-2">
              {/* RANK 2 - SILVER */}
              <div className="flex-1 max-w-[200px] flex flex-col items-center">
                {second ? (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-full flex flex-col items-center text-center mb-2"
                  >
                    <span className={isMiniPreview ? 'text-2xl' : 'text-4xl'}>🥈</span>
                    <p className={`font-black text-slate-200 truncate w-full ${isMiniPreview ? 'text-xs' : 'text-base sm:text-lg'}`}>
                      {second.studentName}
                    </p>
                    <span className={`font-black text-slate-300 font-mono ${isMiniPreview ? 'text-[10px]' : 'text-sm'}`}>
                      {formatScore(second.totalScore)}
                    </span>
                  </motion.div>
                ) : (
                  <div className="h-10" />
                )}
                <div
                  className={`w-full rounded-t-3xl border-t-4 border-l-2 border-r-2 border-slate-400 bg-gradient-to-b from-slate-600 to-slate-800 shadow-xl flex items-center justify-center font-black ${
                    isMiniPreview ? 'h-24 text-2xl text-slate-300' : 'h-40 md:h-52 text-4xl text-slate-300'
                  }`}
                >
                  2
                </div>
              </div>

              {/* RANK 1 - GOLD (CENTER, HIGHEST) */}
              <div className="flex-1 max-w-[240px] flex flex-col items-center">
                {first && (
                  <motion.div
                    initial={{ y: 60, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="w-full flex flex-col items-center text-center mb-2"
                  >
                    <span className={`${isMiniPreview ? 'text-3xl' : 'text-6xl'} animate-bounce`}>🏆</span>
                    <p className={`font-black text-yellow-300 truncate w-full drop-shadow-md ${isMiniPreview ? 'text-sm' : 'text-xl sm:text-2xl'}`}>
                      {first.studentName}
                    </p>
                    <span className={`font-black text-yellow-400 font-mono ${isMiniPreview ? 'text-xs' : 'text-base'}`}>
                      {formatScore(first.totalScore)} pts
                    </span>
                  </motion.div>
                )}
                <div
                  className={`w-full rounded-t-3xl border-t-4 border-l-2 border-r-2 border-yellow-400 bg-gradient-to-b from-yellow-500 via-amber-600 to-amber-900 shadow-[0_0_35px_rgba(234,179,8,0.4)] flex items-center justify-center font-black ${
                    isMiniPreview ? 'h-32 text-3xl text-yellow-100' : 'h-52 md:h-64 text-6xl text-yellow-100'
                  }`}
                >
                  1
                </div>
              </div>

              {/* RANK 3 - BRONZE */}
              <div className="flex-1 max-w-[200px] flex flex-col items-center">
                {third ? (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-full flex flex-col items-center text-center mb-2"
                  >
                    <span className={isMiniPreview ? 'text-2xl' : 'text-4xl'}>🥉</span>
                    <p className={`font-black text-amber-200 truncate w-full ${isMiniPreview ? 'text-xs' : 'text-base sm:text-lg'}`}>
                      {third.studentName}
                    </p>
                    <span className={`font-black text-amber-300 font-mono ${isMiniPreview ? 'text-[10px]' : 'text-sm'}`}>
                      {formatScore(third.totalScore)}
                    </span>
                  </motion.div>
                ) : (
                  <div className="h-10" />
                )}
                <div
                  className={`w-full rounded-t-3xl border-t-4 border-l-2 border-r-2 border-amber-600 bg-gradient-to-b from-amber-700 to-amber-950 shadow-xl flex items-center justify-center font-black ${
                    isMiniPreview ? 'h-16 text-xl text-amber-200' : 'h-28 md:h-36 text-3xl text-amber-200'
                  }`}
                >
                  3
                </div>
              </div>
            </div>

            {/* Runners-up List */}
            {runnersUp.length > 0 && (
              <div className={`w-full max-w-2xl mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 ${isMiniPreview ? 'hidden' : 'block'}`}>
                {runnersUp.map((entry) => (
                  <div
                    key={entry.studentName}
                    className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-400 font-mono">#{entry.rank}</span>
                      <span className="text-white truncate">{entry.studentName}</span>
                    </div>
                    <span className="text-yellow-400 font-mono shrink-0 ml-2">
                      {formatScore(entry.totalScore)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="my-auto text-center p-8 bg-white/5 rounded-3xl border border-white/10 max-w-md">
            <span className="text-5xl block mb-2">🏁</span>
            <h3 className="text-lg font-black text-slate-300">Trận đấu đã kết thúc</h3>
            <p className="text-xs text-slate-400 mt-1">Chưa có người chơi nào hoàn thành lượt câu hỏi trong phiên này.</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-2 text-[11px] text-slate-500 font-medium">
          Cảm ơn tất cả các bạn học sinh đã tham gia trận đấu! 🎉
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. WAITING LOBBY (QR CODE + PIN + COVER)
  // ==========================================
  if (roomState.status === 'waiting') {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-brand-bg text-center ${isMiniPreview ? 'p-3' : 'min-h-screen p-8'}`}>
        {/* Room Header with Name and optional Cover Image */}
        <div className="mb-4 max-w-xl mx-auto flex flex-col items-center">
          {roomState.coverImage && (
            <div className="mb-3 rounded-2xl overflow-hidden shadow-lg border-2 border-white max-h-36 flex justify-center bg-slate-100">
              <img
                src={roomState.coverImage}
                alt="Ảnh phòng"
                className="max-h-36 object-contain rounded-2xl"
              />
            </div>
          )}

          {roomState.name ? (
            <h2 className={`font-black text-slate-900 tracking-tight ${isMiniPreview ? 'text-lg mb-0.5' : 'text-3xl md:text-4xl mb-1'}`}>
              {roomState.name}
            </h2>
          ) : (
            <h2 className={`font-black text-slate-900 tracking-tight ${isMiniPreview ? 'text-xl mb-1' : 'text-4xl md:text-5xl mb-2'}`}>
              Sẵn sàng tham gia!
            </h2>
          )}
          <p className={`text-slate-600 font-medium ${isMiniPreview ? 'text-xs mb-2' : 'text-base mb-6'}`}>
            Mở camera điện thoại quét mã QR hoặc nhập mã PIN bên dưới:
          </p>
        </div>

        {/* QR Code Container */}
        <div className={`bg-white rounded-3xl shadow-xl border-4 border-slate-200 flex flex-col items-center ${isMiniPreview ? 'p-3 mb-3' : 'p-6 mb-6'}`}>
          {joinUrl && (
            <QRCodeSVG
              value={joinUrl}
              size={isMiniPreview ? 130 : 220}
              level="H"
              includeMargin={true}
            />
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Mã PIN:</span>
            <span className={`font-black font-mono tracking-widest text-brand-dark ${isMiniPreview ? 'text-2xl' : 'text-5xl'}`}>
              {code}
            </span>
          </div>
        </div>

        <div className="bg-white px-5 py-2 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className={`font-bold text-slate-700 ${isMiniPreview ? 'text-xs' : 'text-sm'}`}>
            Đã có <strong className="text-brand-blue font-black">{roomState.studentsCount}</strong> bạn vào phòng
          </span>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. ROUND RANKING & ANSWER STATS SCREEN
  // ==========================================
  if (roomState.showRanking) {
    const totalAns = roundStats?.totalAnswered ?? 0;
    const pctCorrect = roundStats?.percentCorrect ?? 0;
    const pctWrong = roundStats?.percentWrong ?? 0;

    return (
      <div className={`w-full h-full flex flex-col justify-between bg-slate-900 text-white ${isMiniPreview ? 'p-3' : 'min-h-screen p-6 md:p-8'} select-none overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-brand-yellow block">
              📊 Tổng kết vòng {roomState.currentQuestionIndex + 1} / {roomState.totalQuestions}
            </span>
            <h2 className={`font-black text-white ${isMiniPreview ? 'text-base' : 'text-2xl md:text-3xl'}`}>
              Bảng Xếp Hạng Thời Gian Thực
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            PIN: {code}
          </span>
        </div>

        {/* Round Statistics Cards (% Correct / % Wrong & Choice Distribution) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3 max-w-4xl mx-auto w-full">
          {/* Correct % Card */}
          <div className="p-3.5 bg-green-500/20 border-2 border-green-500/40 rounded-2xl flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <div>
              <span className="text-xs font-bold text-green-300 block uppercase">Trả lời đúng</span>
              <p className={`font-black text-green-400 font-mono ${isMiniPreview ? 'text-xl' : 'text-3xl'}`}>
                {pctCorrect}% <span className="text-xs font-normal text-slate-300">({roundStats?.correctCount ?? 0}/{totalAns})</span>
              </p>
            </div>
          </div>

          {/* Wrong % Card */}
          <div className="p-3.5 bg-red-500/20 border-2 border-red-500/40 rounded-2xl flex items-center gap-3">
            <span className="text-3xl">💥</span>
            <div>
              <span className="text-xs font-bold text-red-300 block uppercase">Trả lời sai</span>
              <p className={`font-black text-red-400 font-mono ${isMiniPreview ? 'text-xl' : 'text-3xl'}`}>
                {pctWrong}% <span className="text-xs font-normal text-slate-300">({roundStats?.wrongCount ?? 0}/{totalAns})</span>
              </p>
            </div>
          </div>

          {/* Answer Breakdown (Options A, B, C, D) */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase mb-1">Phân bố lựa chọn</span>
            <div className="grid grid-cols-4 gap-1 text-center font-bold text-xs">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const count = roundStats?.optionCounts?.[opt] ?? 0;
                const isCorrect = currentQ && currentQ.correctAnswer === opt;
                return (
                  <div
                    key={opt}
                    className={`py-1 rounded-lg border ${
                      isCorrect ? 'bg-green-500 text-white border-green-400 font-black' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>{opt}:</span> {count}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Leaderboard Top 5 Table */}
        <div className="w-full max-w-4xl mx-auto flex-1 my-2 flex flex-col justify-center">
          <div className="space-y-2">
            {leaderboard.slice(0, isMiniPreview ? 4 : 5).map((entry, index) => (
              <motion.div
                key={entry.studentName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`flex items-center justify-between rounded-2xl border-2 transition-all ${
                  isMiniPreview ? 'px-3 py-2 text-xs' : 'px-5 py-3 text-sm sm:text-base'
                } ${
                  index === 0
                    ? 'bg-yellow-500/20 border-yellow-500/60 shadow-lg text-yellow-300'
                    : index === 1
                    ? 'bg-slate-400/20 border-slate-400/50 text-slate-200'
                    : index === 2
                    ? 'bg-amber-600/20 border-amber-600/50 text-amber-200'
                    : 'bg-white/5 border-white/10 text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`${isMiniPreview ? 'text-lg w-6' : 'text-2xl w-8'} font-black text-center`}>
                    {getRankSuffix(entry.rank)}
                  </span>
                  <span className="font-black truncate max-w-[150px] sm:max-w-xs">{entry.studentName}</span>
                  <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                    • {entry.correctCount} đúng
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {entry.totalTimeSpent !== undefined && (
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      ⏱ {entry.totalTimeSpent}s
                    </span>
                  )}
                  <span className={`font-mono font-black ${isMiniPreview ? 'text-sm' : 'text-xl'}`}>
                    {formatScore(entry.totalScore)} pts
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center pt-2 text-[11px] text-slate-400 font-medium">
          Chờ giáo viên bấm sang câu hỏi tiếp theo...
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. PLAYING / PAUSED: QUESTION DISPLAY OR ANSWER REVEAL
  // ==========================================
  if (currentQ) {
    return (
      <div className={`w-full h-full flex flex-col justify-between bg-brand-bg ${isMiniPreview ? 'p-3' : 'min-h-screen p-6 md:p-8'} select-none`}>
        {/* Top Info Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="bg-slate-200 text-slate-800 font-black px-3 py-1 rounded-full text-xs">
              Câu {roomState.currentQuestionIndex + 1} / {roomState.totalQuestions}
            </span>
            <span className="font-mono font-black text-slate-500 text-xs tracking-wider">
              PIN: {code}
            </span>
          </div>

          {/* Countdown Timer with clean reset on every question index */}
          {roomState.mode === 'exam' && roomState.settings?.timeLimit && (
            <div className="flex items-center gap-2">
              <Timer
                key={`${roomState.currentQuestionIndex}_${roomState.status}`}
                resetKey={roomState.currentQuestionIndex}
                timeLimit={roomState.settings.timeLimit}
                onTimeUp={() => {}}
                isRunning={roomState.status === 'playing' && !roomState.questionRevealed}
              />
            </div>
          )}
        </div>

        {/* ANSWER REVEAL VIEW */}
        {roomState.questionRevealed ? (
          <div className="flex-1 flex flex-col justify-center my-auto py-2">
            <div className="text-center mb-3">
              <span className="text-3xl block mb-1">🎉</span>
              <h3 className={`font-black text-slate-900 ${isMiniPreview ? 'text-lg' : 'text-3xl sm:text-4xl'}`}>
                Đáp án chính xác!
              </h3>
            </div>

            {/* Answer Options Grid (FULL TEXT, NO TRUNCATE) */}
            {currentQ.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto w-full">
                {currentQ.options.map((option, idx) => {
                  const isCorrect = option.key === currentQ.correctAnswer;
                  const style = KAHOOT_COLORS[idx % KAHOOT_COLORS.length];
                  return (
                    <div
                      key={option.key}
                      className={`
                        rounded-2xl text-white flex items-center gap-3 border-b-4 transition-all
                        ${isMiniPreview ? 'p-2.5 min-h-[50px]' : 'p-4 sm:p-5 min-h-[80px]'}
                        ${isCorrect
                          ? `${style.bg} border-black/20 shadow-xl ring-4 ring-green-400 font-black`
                          : 'bg-slate-300 border-slate-400 opacity-35 text-slate-700'
                        }
                      `}
                    >
                      <div className={`rounded-xl bg-black/20 flex items-center justify-center font-black shrink-0 ${isMiniPreview ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-xl'}`}>
                        {isCorrect ? '✓' : option.key}
                      </div>
                      <div className={`font-extrabold flex-1 break-words whitespace-normal leading-snug ${isMiniPreview ? 'text-xs' : 'text-base sm:text-xl md:text-2xl'}`}>
                        {option.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PROMINENT, BOLD EXPLANATION CARD */}
            {currentQ.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 text-slate-900 text-center mx-auto max-w-2xl shadow-md ${
                  isMiniPreview ? 'mt-2.5 p-2.5 text-xs' : 'mt-5 p-4 sm:p-5 text-sm sm:text-base'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl">💡</span>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Giải thích chi tiết
                  </span>
                </div>
                <p className="font-bold text-slate-800 leading-relaxed break-words whitespace-normal">
                  {currentQ.explanation}
                </p>
              </motion.div>
            )}
          </div>
        ) : (
          /* QUESTION DISPLAY VIEW (FULL TEXT, NO TRUNCATE) */
          <div className="flex-1 flex flex-col justify-between my-auto py-2">
            {/* Question Text */}
            <div className="text-center my-auto px-2">
              <h2 className={`font-black text-slate-900 leading-snug mx-auto max-w-4xl break-words whitespace-normal ${
                isMiniPreview ? 'text-sm sm:text-base mb-2' : 'text-2xl sm:text-4xl md:text-5xl mb-6'
              }`}>
                {currentQ.content}
              </h2>

              {currentQ.imageUrl && (
                <div className="flex justify-center mb-3">
                  <img
                    src={currentQ.imageUrl}
                    alt="Hình minh họa"
                    className={`rounded-2xl shadow-md object-contain border-2 border-white ${isMiniPreview ? 'max-h-24' : 'max-h-60'}`}
                  />
                </div>
              )}
            </div>

            {/* 4 Kahoot Answer Blocks (FULL TEXT, NO TRUNCATE) */}
            {currentQ.options && currentQ.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto w-full pb-1">
                {currentQ.options.map((option, idx) => {
                  const style = KAHOOT_COLORS[idx % KAHOOT_COLORS.length];
                  return (
                    <div
                      key={option.key}
                      className={`
                        ${style.bg} ${style.border} border-b-4 rounded-2xl text-white
                        flex items-center gap-3 shadow-md
                        ${isMiniPreview ? 'p-2.5 min-h-[50px]' : 'p-4 sm:p-5 min-h-[80px]'}
                      `}
                    >
                      <div className={`rounded-xl bg-black/20 flex items-center justify-center font-black shrink-0 ${isMiniPreview ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-xl'}`}>
                        {style.shape}
                      </div>
                      <div className={`font-black flex-1 break-words whitespace-normal leading-snug ${isMiniPreview ? 'text-xs' : 'text-base sm:text-xl md:text-2xl'}`}>
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
