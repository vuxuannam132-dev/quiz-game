'use client';

import { motion } from 'framer-motion';
import { RoomMode, RoomStatus } from '@/types';

interface RoomCodeProps {
  code: string;
  studentsCount: number;
  mode: RoomMode;
  status: RoomStatus;
}

const MODE_LABELS: Record<RoomMode, { label: string; color: string }> = {
  learning: { label: 'Học tập', color: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
  practice: { label: 'Luyện tập', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' },
  exam: { label: 'Thi cử', color: 'bg-red-500/20 text-red-300 border-red-500/50' },
};

const STATUS_LABELS: Record<RoomStatus, string> = {
  waiting: '⏳ Chờ bắt đầu',
  playing: '🎮 Đang chơi',
  paused: '⏸ Tạm dừng',
  finished: '🏁 Đã kết thúc',
};

export function RoomCode({ code, studentsCount, mode, status }: RoomCodeProps) {
  const modeInfo = MODE_LABELS[mode];

  return (
    <div className="flex items-center gap-6 px-8 py-4 bg-black/30 backdrop-blur-sm border-b border-white/10">
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">Mã phòng:</span>
        <motion.span
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-4xl font-black text-electric-blue tracking-widest"
          style={{ textShadow: '0 0 20px rgba(0, 212, 255, 0.8)' }}
        >
          {code}
        </motion.span>
      </div>

      <div className="flex items-center gap-2 text-white">
        <span className="text-2xl">👥</span>
        <span className="text-xl font-bold">{studentsCount}</span>
        <span className="text-gray-400 text-sm">học sinh</span>
      </div>

      <div className={`px-3 py-1 rounded-full border text-sm font-medium ${modeInfo.color}`}>
        {modeInfo.label}
      </div>

      <div className="ml-auto text-gray-300 text-sm font-medium">
        {STATUS_LABELS[status]}
      </div>
    </div>
  );
}
