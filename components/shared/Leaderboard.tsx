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
    1: 'bg-amber-50 border-amber-300 text-amber-950',
    2: 'bg-slate-50 border-slate-300 text-slate-800',
    3: 'bg-orange-50 border-orange-300 text-orange-950',
  };

  const rankBadgeColors: Record<number, string> = {
    1: 'bg-amber-400 text-white',
    2: 'bg-slate-400 text-white',
    3: 'bg-orange-400 text-white',
  };

  return (
    <div className="w-full">
      <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
        <span>🏆</span> {title}
      </h2>
      <div className="space-y-2.5">
        <AnimatePresence>
          {entries.map((entry, index) => (
            <motion.div
              key={entry.studentName + entry.rank}
              initial={animate ? { opacity: 0, x: -30 } : false}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ delay: index * 0.05 }}
              className={`
                flex items-center gap-3 p-3 rounded-2xl border-2 transition-all
                ${rankColors[entry.rank] || 'bg-white border-slate-200 text-slate-800'}
              `}
            >
              <div
                className={`text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  rankBadgeColors[entry.rank] || 'bg-slate-200 text-slate-700'
                }`}
              >
                {getRankSuffix(entry.rank)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm text-slate-900 truncate">{entry.studentName}</div>
                <div className="text-xs font-semibold text-slate-500">{entry.correctCount} câu đúng</div>
              </div>
              <div className="text-sm font-black tabular-nums text-brand-blue">
                {formatScore(entry.totalScore)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {entries.length === 0 && (
          <div className="text-center text-slate-400 py-6 text-xs font-bold">
            Chưa có học sinh nào trên bảng xếp hạng
          </div>
        )}
      </div>
    </div>
  );
}
