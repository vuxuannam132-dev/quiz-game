'use client';

import { motion } from 'framer-motion';
import { IQuestion } from '@/types';

interface QuestionDisplayProps {
  question: Partial<IQuestion>;
  questionNumber: number;
  totalQuestions: number;
}

const OPTION_COLORS = {
  A: 'from-blue-600/80 to-blue-700/80 border-blue-500',
  B: 'from-red-600/80 to-red-700/80 border-red-500',
  C: 'from-yellow-600/80 to-yellow-700/80 border-yellow-500',
  D: 'from-green-600/80 to-green-700/80 border-green-500',
};

export function QuestionDisplay({ question, questionNumber, totalQuestions }: QuestionDisplayProps) {
  if (!question) return null;

  return (
    <div className="flex flex-col gap-6 p-8 w-full">
      {/* Question number */}
      <div className="flex items-center justify-between">
        <span className="text-electric-blue text-xl font-bold">
          Câu {questionNumber} / {totalQuestions}
        </span>
        {question.subject && (
          <span className="px-3 py-1 rounded-full bg-white/10 text-gray-300 text-sm">
            {question.subject}
          </span>
        )}
      </div>

      {/* Question content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={question._id as string}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
      >
        <p className="text-3xl font-bold text-white leading-relaxed">
          {question.content}
        </p>
        {question.imageUrl && (
          <div className="mt-6 flex justify-center">
            <div className="relative max-h-64 overflow-hidden rounded-xl">
              <img
                src={question.imageUrl}
                alt="Hình ảnh câu hỏi"
                className="max-h-64 object-contain rounded-xl"
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Options */}
      {question.type !== 'matching' && question.options && (
        <div className="grid grid-cols-2 gap-4">
          {question.options.map((option, index) => {
            const key = option.key as keyof typeof OPTION_COLORS;
            return (
              <motion.div
                key={option.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative p-6 rounded-xl border-2 bg-gradient-to-br backdrop-blur-sm
                  ${OPTION_COLORS[key] || 'from-gray-700/80 to-gray-800/80 border-gray-600'}
                `}
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl font-black text-white opacity-80">{option.key}</span>
                  <div className="flex-1">
                    <p className="text-xl font-semibold text-white">{option.text}</p>
                    {option.imageUrl && (
                      <img
                        src={option.imageUrl}
                        alt={`Lựa chọn ${option.key}`}
                        className="mt-2 max-h-24 object-contain rounded"
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Matching type display */}
      {question.type === 'matching' && (
        <div className="bg-white/5 rounded-xl p-6">
          <p className="text-gray-300 text-lg mb-4">Nối các cặp tương ứng:</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {question.matchingPairs?.map((pair, i) => (
                <div key={i} className="bg-blue-600/30 border border-blue-500/50 rounded-lg p-3 text-white text-lg">
                  {pair.left}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {question.matchingPairs?.map((pair, i) => (
                <div key={i} className="bg-green-600/30 border border-green-500/50 rounded-lg p-3 text-white text-lg">
                  {pair.right}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
