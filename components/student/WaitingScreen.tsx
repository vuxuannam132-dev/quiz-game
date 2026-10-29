'use client';

import { motion } from 'framer-motion';

interface WaitingScreenProps {
  studentName: string;
  studentsCount: number;
  roomCode: string;
}

export function WaitingScreen({ studentName, studentsCount, roomCode }: WaitingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
        className="text-8xl"
      >
        🎮
      </motion.div>

      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Xin chào, <span className="text-electric-blue">{studentName}</span>!
        </h1>
        <p className="text-gray-400">Đang chờ giáo viên bắt đầu...</p>
      </div>

      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
      >
        <div className="text-gray-400 text-sm mb-1">Mã phòng</div>
        <div className="text-4xl font-black text-electric-blue tracking-widest">{roomCode}</div>
      </motion.div>

      <div className="flex items-center gap-2 text-gray-400">
        <span className="text-2xl">👥</span>
        <span>
          <span className="text-white font-bold">{studentsCount}</span> học sinh đã tham gia
        </span>
      </div>

      {/* Animated dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
            className="w-3 h-3 rounded-full bg-electric-blue"
          />
        ))}
      </div>
    </div>
  );
}
