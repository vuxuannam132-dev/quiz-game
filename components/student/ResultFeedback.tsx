'use client';

import { motion } from 'framer-motion';
import { formatScore } from '@/lib/gameLogic';

interface ResultFeedbackProps {
  correct: boolean;
  points: number;
  correctAnswer?: string;
  explanation?: string;
}

export function ResultFeedback({ correct, points, correctAnswer, explanation }: ResultFeedbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="p-6 space-y-4"
    >
      {/* Result */}
      <div
        className={`
          flex flex-col items-center p-6 rounded-2xl border-2
          ${correct
            ? 'bg-green-500/20 border-green-400'
            : 'bg-red-500/20 border-red-400'
          }
        `}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-3"
        >
          {correct ? '✅' : '❌'}
        </motion.div>
        <h2 className={`text-2xl font-black ${correct ? 'text-green-400' : 'text-red-400'}`}>
          {correct ? 'Chính xác!' : 'Sai rồi!'}
        </h2>
        {correct && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-3xl font-bold text-yellow-400"
          >
            +{formatScore(points)} điểm
          </motion.div>
        )}
      </div>

      {/* Correct answer hint for wrong */}
      {!correct && correctAnswer && (
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4">
          <p className="text-blue-300 text-sm font-bold mb-1">Đáp án đúng:</p>
          <p className="text-white font-bold">{correctAnswer}</p>
        </div>
      )}

      {/* Explanation */}
      {explanation && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-sm mb-1">💡 Giải thích:</p>
          <p className="text-gray-200 text-sm">{explanation}</p>
        </div>
      )}
    </motion.div>
  );
}
