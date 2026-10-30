'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RoomStateResponse } from '@/types';

interface ControlPanelProps {
  roomState: RoomStateResponse;
  roomCode: string;
  adminCode?: string;
  onAction: (action: string) => Promise<void>;
}

export function ControlPanel({ roomState, roomCode, onAction }: ControlPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    if (loading) return;
    setLoading(action);
    try {
      await onAction(action);
    } finally {
      setLoading(null);
    }
  };

  const { status, currentQuestionIndex, questionRevealed, showRanking, totalQuestions, mode } = roomState;
  const isLast = currentQuestionIndex >= totalQuestions - 1;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-slate-900 font-black text-lg flex items-center gap-2">
          <span>🎮</span> Điều khiển trận đấu
        </h3>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          {mode === 'exam' ? '🏆 Chế độ Thi đấu' : mode === 'practice' ? '⚡ Chế độ Luyện tập' : '📚 Chế độ Học tập'}
        </span>
      </div>

      <div className="space-y-3">
        {/* Start button */}
        {status === 'waiting' && (
          <Button
            onClick={() => handleAction('start')}
            loading={loading === 'start'}
            variant="start"
            icon="▶"
            label="Bắt đầu trận đấu"
          />
        )}

        {/* Resume from pause */}
        {status === 'paused' && (
          <Button
            onClick={() => handleAction('resume')}
            loading={loading === 'resume'}
            variant="resume"
            icon="▶"
            label="Tiếp tục trận đấu"
          />
        )}

        {/* Reveal answer button */}
        {status === 'playing' && !questionRevealed && (
          <Button
            onClick={() => handleAction('reveal')}
            loading={loading === 'reveal'}
            variant="reveal"
            icon="📢"
            label="Công bố đáp án"
          />
        )}

        {/* When Question is Revealed: Option 1 (Show Ranking) or Option 2 (Next Question) */}
        {(status === 'playing' || status === 'paused') && questionRevealed && !showRanking && (
          <div className="space-y-2.5">
            <Button
              onClick={() => handleAction('show_ranking')}
              loading={loading === 'show_ranking'}
              variant="ranking"
              icon="📊"
              label="Xem Thống kê & Bảng xếp hạng"
            />
            <Button
              onClick={() => handleAction(isLast ? 'finish' : 'next')}
              loading={loading === (isLast ? 'finish' : 'next')}
              variant={isLast ? 'finish' : 'nextSecondary'}
              icon={isLast ? '🏆' : '⏭️'}
              label={isLast ? 'Kết thúc & Trao giải' : 'Câu tiếp theo (Bỏ qua BXH)'}
            />
          </div>
        )}

        {/* When Currently Showing Ranking: Button to advance to next question or finish */}
        {(status === 'playing' || status === 'paused') && showRanking && (
          <Button
            onClick={() => handleAction(isLast ? 'finish' : 'next')}
            loading={loading === (isLast ? 'finish' : 'next')}
            variant={isLast ? 'finish' : 'next'}
            icon={isLast ? '🏆' : '⏭️'}
            label={isLast ? 'Kết thúc & Bảng Vàng Vinh Danh' : 'Sang câu tiếp theo'}
          />
        )}

        {/* Secondary controls row */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 pt-1">
          {/* Previous question */}
          {(status === 'playing' || status === 'paused') && currentQuestionIndex > 0 && (
            <button
              onClick={() => handleAction('prev')}
              disabled={loading === 'prev'}
              className="btn-liquid flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-1.5 border border-slate-200"
            >
              {loading === 'prev' ? <span className="animate-spin">⟳</span> : <span>⏮</span>}
              <span>Câu trước</span>
            </button>
          )}

          {/* Pause (learning mode only) */}
          {status === 'playing' && mode === 'learning' && (
            <button
              onClick={() => handleAction('pause')}
              disabled={loading === 'pause'}
              className="btn-liquid flex-1 py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-sm transition-all flex items-center justify-center gap-1.5 border border-amber-200"
            >
              {loading === 'pause' ? <span className="animate-spin">⟳</span> : <span>⏸</span>}
              <span>Tạm dừng</span>
            </button>
          )}

          {/* Emergency finish button */}
          {(status === 'playing' || status === 'paused') && !isLast && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn kết thúc phòng chơi này ngay lập tức?')) {
                  handleAction('finish');
                }
              }}
              disabled={loading === 'finish'}
              className="btn-liquid flex-1 py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-brand-red font-bold text-sm transition-all flex items-center justify-center gap-1.5 border border-red-200"
            >
              {loading === 'finish' ? <span className="animate-spin">⟳</span> : <span>🏁</span>}
              <span>Kết thúc sớm</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick info */}
      <div className="border-t border-slate-100 pt-3 space-y-2 text-xs font-bold text-slate-500">
        <div className="flex justify-between items-center">
          <span>Mã phòng PIN:</span>
          <span className="text-slate-900 font-mono font-black text-sm">{roomCode}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Tiến độ câu hỏi:</span>
          <span className="text-brand-blue font-black">{currentQuestionIndex + 1} / {totalQuestions}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Trạng thái phòng:</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
            status === 'playing' ? 'bg-green-100 text-green-700 border-green-200' :
            status === 'paused' ? 'bg-amber-100 text-amber-700 border-amber-200' :
            status === 'finished' ? 'bg-slate-100 text-slate-600 border-slate-200' :
            'bg-blue-100 text-brand-blue border-blue-200'
          }`}>
            {status === 'waiting' ? 'Chờ bắt đầu' :
             status === 'playing' ? (showRanking ? 'Đang hiện BXH vòng' : questionRevealed ? 'Đã công bố đáp án' : 'Đang làm bài') :
             status === 'paused' ? 'Tạm dừng' : 'Đã kết thúc'}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ButtonProps {
  onClick: () => void;
  loading: boolean;
  variant: 'start' | 'resume' | 'reveal' | 'ranking' | 'next' | 'nextSecondary' | 'finish';
  icon: string;
  label: string;
}

function Button({ onClick, loading, variant, icon, label }: ButtonProps) {
  const styles = {
    start: 'bg-brand-red hover:bg-red-600 text-white shadow-button-3d',
    resume: 'bg-brand-green hover:bg-green-600 text-white shadow-button-3d',
    reveal: 'bg-brand-yellow hover:bg-amber-500 text-slate-900 shadow-button-3d',
    ranking: 'bg-brand-blue hover:bg-blue-600 text-white shadow-button-3d',
    next: 'bg-brand-red hover:bg-red-600 text-white shadow-button-3d',
    nextSecondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-200',
    finish: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black shadow-button-3d',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className={`
        w-full btn-liquid flex items-center justify-center gap-3 py-3.5 px-6
        rounded-2xl font-black text-base sm:text-lg
        ${styles[variant]}
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all
      `}
    >
      {loading ? (
        <span className="animate-spin text-xl">⟳</span>
      ) : (
        <span className="text-xl">{icon}</span>
      )}
      <span>{label}</span>
    </motion.button>
  );
}
