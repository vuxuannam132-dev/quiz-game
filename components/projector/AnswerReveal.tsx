'use client';

import { motion } from 'framer-motion';
import { IQuestion } from '@/types';
import { useEffect, useRef } from 'react';

interface AnswerRevealProps {
  question: Partial<IQuestion>;
  onRevealComplete?: () => void;
  skipEffects?: boolean;
}

const OPTION_COLORS = {
  A: 'border-blue-500',
  B: 'border-red-500',
  C: 'border-yellow-500',
  D: 'border-green-500',
};

export function AnswerReveal({ question, onRevealComplete, skipEffects }: AnswerRevealProps) {
  const confettiRef = useRef(false);

  useEffect(() => {
    if (!skipEffects && !confettiRef.current && typeof window !== 'undefined') {
      confettiRef.current = true;
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00d4ff', '#ff0080', '#39ff14', '#ff6600', '#FFD700'],
        });
      });
    }
    onRevealComplete?.();
  }, [skipEffects, onRevealComplete]);

  if (!question) return null;

  return (
    <div className="flex flex-col gap-6 p-8 w-full">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-center text-5xl font-black text-lime-green mb-4"
      >
        ✅ Đáp án đúng!
      </motion.div>

      {(question.type === 'multiple_choice' || question.type === 'true_false') ? (
        <div className="grid grid-cols-2 gap-4">
          {question.options?.map((option, index) => {
            const isCorrect = option.key === question.correctAnswer;
            const key = option.key as keyof typeof OPTION_COLORS;
            return (
              <motion.div
                key={option.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: isCorrect ? 1.05 : 0.95,
                }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative p-6 rounded-xl border-2 backdrop-blur-sm transition-all
                  ${isCorrect
                    ? 'bg-green-500/30 border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.5)]'
                    : 'bg-red-900/20 border-red-800/50 opacity-60'
                  }
                `}
              >
                {isCorrect && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-3 -right-3 bg-green-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold"
                  >
                    ✓
                  </motion.div>
                )}
                <div className="flex items-center gap-4">
                  <span className={`text-3xl font-black ${isCorrect ? 'text-green-400' : 'text-gray-500'}`}>
                    {option.key}
                  </span>
                  <p className={`text-xl font-semibold ${isCorrect ? 'text-white' : 'text-gray-500'}`}>
                    {option.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : question.type === 'matching' ? (
        <div className="bg-white/5 rounded-xl p-6">
          <p className="text-gray-300 text-lg mb-4">Đáp án đúng:</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {question.matchingPairs?.map((pair, i) => (
                <div key={i} className="bg-green-600/30 border border-green-500/50 rounded-lg p-3 text-white text-lg">
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
      ) : null}

      {question.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-6"
        >
          <p className="text-blue-300 text-sm font-bold mb-2">💡 Giải thích:</p>
          <p className="text-white text-lg">{question.explanation}</p>
        </motion.div>
      )}
    </div>
  );
}
