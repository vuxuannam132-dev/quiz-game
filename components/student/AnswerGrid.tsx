'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IQuestion } from '@/types';

interface AnswerGridProps {
  question: Partial<IQuestion>;
  onAnswer: (answer: string) => void;
  disabled: boolean;
  selectedAnswer?: string;
  revealedAnswer?: string;
  showResult?: boolean;
}

const OPTION_STYLES = {
  A: {
    normal: 'bg-blue-600/80 border-blue-500 hover:bg-blue-500',
    correct: 'bg-green-500/80 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)]',
    wrong: 'bg-red-700/50 border-red-800/50 opacity-60',
    selected: 'bg-blue-400 border-blue-300',
  },
  B: {
    normal: 'bg-red-600/80 border-red-500 hover:bg-red-500',
    correct: 'bg-green-500/80 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)]',
    wrong: 'bg-red-700/50 border-red-800/50 opacity-60',
    selected: 'bg-red-400 border-red-300',
  },
  C: {
    normal: 'bg-yellow-600/80 border-yellow-500 hover:bg-yellow-500',
    correct: 'bg-green-500/80 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)]',
    wrong: 'bg-red-700/50 border-red-800/50 opacity-60',
    selected: 'bg-yellow-400 border-yellow-300',
  },
  D: {
    normal: 'bg-green-700/80 border-green-600 hover:bg-green-600',
    correct: 'bg-green-500/80 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.5)]',
    wrong: 'bg-red-700/50 border-red-800/50 opacity-60',
    selected: 'bg-green-500 border-green-400',
  },
};

export function AnswerGrid({
  question,
  onAnswer,
  disabled,
  selectedAnswer,
  revealedAnswer,
  showResult,
}: AnswerGridProps) {
  if (!question) return null;

  const getStyle = (optionKey: string) => {
    const styles = OPTION_STYLES[optionKey as keyof typeof OPTION_STYLES] || OPTION_STYLES.A;
    if (showResult && revealedAnswer) {
      if (optionKey === revealedAnswer) return styles.correct;
      if (optionKey === selectedAnswer) return `${styles.wrong} animate-shake`;
      return 'bg-white/5 border-white/10 opacity-40';
    }
    if (selectedAnswer === optionKey) return styles.selected;
    return styles.normal;
  };

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {question.options?.map((option, index) => (
        <motion.button
          key={option.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          onClick={() => !disabled && onAnswer(option.key)}
          disabled={disabled}
          className={`
            min-h-[70px] flex flex-col items-start gap-1 p-4 rounded-xl border-2
            font-bold text-white transition-all
            disabled:cursor-not-allowed
            ${getStyle(option.key)}
          `}
        >
          <span className="text-2xl font-black opacity-80">{option.key}</span>
          <span className="text-sm leading-tight">{option.text}</span>
          {option.imageUrl && (
            <img src={option.imageUrl} alt="" className="max-h-16 object-contain rounded" />
          )}
        </motion.button>
      ))}
    </div>
  );
}
