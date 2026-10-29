'use client';

import { motion } from 'framer-motion';
import { LeaderboardEntry } from '@/types';
import { formatScore, getRankSuffix } from '@/lib/gameLogic';

interface ProjectorLeaderboardProps {
  entries: LeaderboardEntry[];
}

export function ProjectorLeaderboard({ entries }: ProjectorLeaderboardProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <motion.h1
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-6xl font-black text-center mb-12"
        style={{
          background: 'linear-gradient(135deg, #FFD700, #FF6600, #FF0080)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        🏆 Kết quả cuối cùng!
      </motion.h1>

      <div className="w-full max-w-2xl space-y-4">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.studentName}
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            className={`
              flex items-center gap-6 p-6 rounded-2xl border-2
              ${index === 0 ? 'bg-yellow-500/20 border-yellow-500/60 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : ''}
              ${index === 1 ? 'bg-gray-400/20 border-gray-400/60' : ''}
              ${index === 2 ? 'bg-orange-600/20 border-orange-600/60' : ''}
              ${index > 2 ? 'bg-white/5 border-white/10' : ''}
            `}
          >
            <div className="text-5xl w-16 text-center">{getRankSuffix(entry.rank)}</div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-white">{entry.studentName}</div>
              <div className="text-gray-400">{entry.correctCount} câu đúng</div>
            </div>
            <div className={`text-3xl font-black tabular-nums ${
              index === 0 ? 'text-yellow-400' :
              index === 1 ? 'text-gray-300' :
              index === 2 ? 'text-orange-400' : 'text-white'
            }`}>
              {formatScore(entry.totalScore)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
