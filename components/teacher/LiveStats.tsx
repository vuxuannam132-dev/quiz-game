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
  A: 'bg-[#E21B3C]',
  B: 'bg-[#1368CE]',
  C: 'bg-[#FFA602]',
  D: 'bg-[#26890C]',
};

export function LiveStats({ stats, totalStudents, answeredCount }: LiveStatsProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-900 font-black text-lg flex items-center gap-2">
          <span>📊</span> Thống kê trả lời
        </h3>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          {answeredCount}/{totalStudents} học sinh
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <motion.div
            className="h-full bg-brand-blue rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${totalStudents > 0 ? (answeredCount / totalStudents) * 100 : 0}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => {
          const color = BAR_COLORS[stat.key as keyof typeof BAR_COLORS] || 'bg-slate-400';
          return (
            <div key={stat.key} className="flex items-center gap-3">
              <span className="w-6 font-black text-slate-800 text-sm text-center">{stat.key}</span>
              <div className="flex-1 h-9 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200">
                <motion.div
                  className={`h-full ${color} rounded-lg`}
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-800 text-xs font-black drop-shadow-sm">
                  {stat.count} ({stat.percentage.toFixed(0)}%)
                </span>
              </div>
              {stat.isCorrect && (
                <span className="text-green-600 font-black text-lg">✓</span>
              )}
            </div>
          );
        })}
        {stats.length === 0 && (
          <div className="text-slate-400 text-center py-4 text-xs font-bold">
            Chưa có câu trả lời nào được gửi
          </div>
        )}
      </div>
    </div>
  );
}
