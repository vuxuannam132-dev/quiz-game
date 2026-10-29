'use client';

import { motion } from 'framer-motion';
import { IQuestion } from '@/types';

interface AnswerGridProps {
  question: Partial<IQuestion>;
  onAnswer: (answer: string) => void;
  disabled: boolean;
  selectedAnswer?: string;
  revealedAnswer?: string;
  showResult?: boolean;
}

const KAHOOT_BUTTONS = [
  { key: 'A', bg: 'bg-[#E21B3C]', active: 'active:bg-[#B0142E]', shape: '▲' },
  { key: 'B', bg: 'bg-[#1368CE]', active: 'active:bg-[#0D4B96]', shape: '◆' },
  { key: 'C', bg: 'bg-[#D89E00]', active: 'active:bg-[#A37700]', shape: '●' },
  { key: 'D', bg: 'bg-[#26890C]', active: 'active:bg-[#1C6609]', shape: '■' },
];

export function AnswerGrid({
  question,
  onAnswer,
  disabled,
  selectedAnswer,
  revealedAnswer,
  showResult,
}: AnswerGridProps) {
  if (!question) return null;

  const buttons =
    question.options && question.options.length === 2
      ? KAHOOT_BUTTONS.slice(0, 2)
      : KAHOOT_BUTTONS;

  return (
    <div
      className={`grid ${
        buttons.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'
      } gap-3 p-4 h-[calc(100vh-180px)]`}
    >
      {buttons.map((btn, idx) => {
        const isSelected = selectedAnswer === btn.key;
        const optText = question.options?.[idx]?.text;

        let extraClass = '';
        if (showResult && revealedAnswer) {
          if (btn.key === revealedAnswer) {
            extraClass = 'ring-8 ring-green-400 scale-95';
          } else if (isSelected) {
            extraClass = 'opacity-40 animate-shake';
          } else {
            extraClass = 'opacity-30';
          }
        } else if (isSelected) {
          extraClass = 'ring-8 ring-white scale-95 shadow-none';
        }

        return (
          <motion.button
            key={btn.key}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            onClick={() => !disabled && onAnswer(btn.key)}
            disabled={disabled}
            className={`
              ${btn.bg} ${btn.active} rounded-3xl text-white shadow-button-3d
              flex flex-col items-center justify-center gap-2 p-4 transition-all
              disabled:opacity-60 disabled:cursor-not-allowed
              ${extraClass}
            `}
          >
            <span className="text-6xl drop-shadow-md">{btn.shape}</span>
            <span className="text-xl font-black uppercase tracking-wider">{btn.key}</span>
            {optText && (
              <span className="text-sm font-semibold opacity-90 truncate max-w-full px-2">
                {optText}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
