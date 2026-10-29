'use client';

import { motion } from 'framer-motion';

interface AnswerStat {
  key: string;
  count: number;
  percentage: number;
  isCorrect?: boolean;
}

interface LiveStatsProps {
  stats: AnswerStat[];
  totalStudents: number;
  answeredCount: number;
}

const BAR_COLORS = {
  A: 'bg-blue-500',
  B: 'bg-red-500',
  C: 'bg-yellow-500',
  D: 'bg-green-500',
};

export function LiveStats({ stats, totalStudents, answeredCount }: LiveStatsProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold">📊 Thống kê trả lời</h3>
        <span className="text-sm text-gray-400">
          {answeredCount}/{totalStudents} học sinh
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-electric-blue rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${totalStudents > 0 ? (answeredCount / totalStudents) * 100 : 0}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => {
          const color = BAR_COLORS[stat.key as keyof typeof BAR_COLORS] || 'bg-gray-500';
          return (
            <div key={stat.key} className="flex items-center gap-3">
              <span className="w-6 font-bold text-white text-sm">{stat.key}</span>
              <div className="flex-1 h-8 bg-white/10 rounded-lg overflow-hidden relative">
                <motion.div
                  className={`h-full ${color} opacity-80 rounded-lg`}
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-bold">
                  {stat.count} ({stat.percentage.toFixed(0)}%)
                </span>
              </div>
              {stat.isCorrect && (
                <span className="text-green-400 text-lg">✓</span>
              )}
            </div>
          );
        })}
        {stats.length === 0 && (
          <div className="text-gray-400 text-center py-4 text-sm">Chưa có câu trả lời</div>
        )}
      </div>
    </div>
  );
}
