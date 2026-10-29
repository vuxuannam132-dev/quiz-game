'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RoomStateResponse } from '@/types';

interface ControlPanelProps {
  roomState: RoomStateResponse;
  roomCode: string;
  adminCode: string;
  onAction: (action: string) => Promise<void>;
}

export function ControlPanel({ roomState, roomCode, adminCode, onAction }: ControlPanelProps) {
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

  const { status, currentQuestionIndex, questionRevealed, totalQuestions, mode } = roomState;
  const isLast = currentQuestionIndex >= totalQuestions - 1;

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
      <h3 className="text-white font-bold text-lg border-b border-white/10 pb-3">🎮 Điều khiển</h3>

      <div className="space-y-3">
        {/* Start button */}
        {status === 'waiting' && (
          <Button
            onClick={() => handleAction('start')}
            loading={loading === 'start'}
            color="green"
            icon="▶"
            label="Bắt đầu"
          />
        )}

        {/* Resume from pause */}
        {status === 'paused' && (
          <Button
            onClick={() => handleAction('resume')}
            loading={loading === 'resume'}
            color="green"
            icon="▶"
            label="Tiếp tục"
          />
        )}

        {/* Reveal answer */}
        {status === 'playing' && !questionRevealed && (
          <Button
            onClick={() => handleAction('reveal')}
            loading={loading === 'reveal'}
            color="blue"
            icon="📢"
            label="Công bố đáp án"
          />
        )}

        {/* Previous question */}
        {(status === 'playing' || status === 'paused') && currentQuestionIndex > 0 && (
          <Button
            onClick={() => handleAction('prev')}
            loading={loading === 'prev'}
            color="gray"
            icon="⏮"
            label="Câu trước"
          />
        )}

        {/* Next question */}
        {(status === 'playing' || status === 'paused') && questionRevealed && !isLast && (
          <Button
            onClick={() => handleAction('next')}
            loading={loading === 'next'}
            color="blue"
            icon="⏭"
            label="Câu tiếp theo"
          />
        )}

        {/* Pause (learning mode only) */}
        {status === 'playing' && mode === 'learning' && (
          <Button
            onClick={() => handleAction('pause')}
            loading={loading === 'pause'}
            color="yellow"
            icon="⏸"
            label="Dừng / Chú ý"
          />
        )}

        {/* Finish */}
        {(status === 'playing' || status === 'paused') && (
          <Button
            onClick={() => handleAction('finish')}
            loading={loading === 'finish'}
            color="red"
            icon="🏁"
            label="Kết thúc"
            confirm="Bạn có chắc muốn kết thúc phòng?"
          />
        )}
      </div>

      {/* Quick info */}
      <div className="border-t border-white/10 pt-3 space-y-2 text-sm">
        <div className="flex justify-between text-gray-400">
          <span>Mã phòng:</span>
          <span className="text-electric-blue font-mono font-bold">{roomCode}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Câu hiện tại:</span>
          <span className="text-white">{currentQuestionIndex + 1} / {totalQuestions}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Trạng thái:</span>
          <span className={`font-medium ${
            status === 'playing' ? 'text-green-400' :
            status === 'paused' ? 'text-yellow-400' :
            status === 'finished' ? 'text-gray-400' :
            'text-blue-400'
          }`}>
            {status === 'waiting' ? 'Chờ bắt đầu' :
             status === 'playing' ? 'Đang chơi' :
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
  color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
  icon: string;
  label: string;
  confirm?: string;
}

function Button({ onClick, loading, color, icon, label, confirm }: ButtonProps) {
  const colors = {
    green: 'bg-green-600 hover:bg-green-500 border-green-500',
    blue: 'bg-blue-600 hover:bg-blue-500 border-blue-500',
    yellow: 'bg-yellow-600 hover:bg-yellow-500 border-yellow-500',
    red: 'bg-red-700 hover:bg-red-600 border-red-600',
    gray: 'bg-gray-700 hover:bg-gray-600 border-gray-600',
  };

  const handleClick = () => {
    if (confirm && !window.confirm(confirm)) return;
    onClick();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      disabled={loading}
      className={`
        w-full flex items-center justify-center gap-2 px-4 py-3
        rounded-xl border font-bold text-white
        ${colors[color]}
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
      `}
    >
      {loading ? (
        <span className="animate-spin">⟳</span>
      ) : (
        <span>{icon}</span>
      )}
      <span>{label}</span>
    </motion.button>
  );
}
