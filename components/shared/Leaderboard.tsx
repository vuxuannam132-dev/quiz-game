'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LeaderboardEntry } from '@/types';
import { formatScore, getRankSuffix } from '@/lib/gameLogic';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  animate?: boolean;
  title?: string;
}

export function Leaderboard({ entries, animate = true, title = 'Bảng xếp hạng' }: LeaderboardProps) {
  const rankColors: Record<number, string> = {
    1: 'from-yellow-500/30 to-yellow-600/10 border-yellow-500/50',
    2: 'from-gray-400/30 to-gray-500/10 border-gray-400/50',
    3: 'from-orange-600/30 to-orange-700/10 border-orange-600/50',
  };

  const rankTextColors: Record<number, string> = {
    1: 'text-yellow-400',
    2: 'text-gray-300',
    3: 'text-orange-400',
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-center text-white mb-6">{title}</h2>
      <div className="space-y-3">
        <AnimatePresence>
          {entries.map((entry, index) => (
            <motion.div
              key={entry.studentName + entry.rank}
              initial={animate ? { opacity: 0, x: -50 } : false}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r
                ${rankColors[entry.rank] || 'from-white/5 to-white/0 border-white/10'}
              `}
            >
              <div
                className={`text-2xl font-black w-12 text-center ${rankTextColors[entry.rank] || 'text-white'}`}
              >
                {getRankSuffix(entry.rank)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{entry.studentName}</div>
                <div className="text-sm text-gray-400">{entry.correctCount} câu đúng</div>
              </div>
              <div className={`text-xl font-bold tabular-nums ${rankTextColors[entry.rank] || 'text-electric-blue'}`}>
                {formatScore(entry.totalScore)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {entries.length === 0 && (
          <div className="text-center text-gray-400 py-8">Chưa có dữ liệu</div>
        )}
      </div>
    </div>
  );
}
