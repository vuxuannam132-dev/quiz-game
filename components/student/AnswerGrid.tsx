'use client';

import { motion } from 'framer-motion';
import { IQuestion } from '@/types';
import { isAnswerCorrect, isTrueFalseMatch, isTrueValue, isFalseValue } from '@/lib/gameLogic';

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

  const isTF = question.type === 'true_false';

  // Build button items based on question options if available
  const items = (question.options && question.options.length > 0)
    ? question.options.map((opt, idx) => {
        const fallback = KAHOOT_BUTTONS[idx % KAHOOT_BUTTONS.length];
        const isTrueOpt = isTF && (isTrueValue(opt.key) || isTrueValue(opt.text));
        const isFalseOpt = isTF && (isFalseValue(opt.key) || isFalseValue(opt.text));
        
        const key = opt.key || fallback.key;
        const shape = isTF ? (isTrueOpt ? '▲' : '◆') : fallback.shape;
        const bg = isTF ? (isTrueOpt ? 'bg-[#E21B3C]' : 'bg-[#1368CE]') : fallback.bg;
        const active = isTF ? (isTrueOpt ? 'active:bg-[#B0142E]' : 'active:bg-[#0D4B96]') : fallback.active;
        const text = opt.text || (isTrueOpt ? 'Đúng' : isFalseOpt ? 'Sai' : '');

        return { key, shape, bg, active, text, isTrueOpt, isFalseOpt };
      })
    : (isTF ? KAHOOT_BUTTONS.slice(0, 2) : KAHOOT_BUTTONS).map((b, idx) => ({
        key: isTF ? (idx === 0 ? 'T' : 'F') : b.key,
        shape: b.shape,
        bg: b.bg,
        active: b.active,
        text: isTF ? (idx === 0 ? 'Đúng' : 'Sai') : '',
        isTrueOpt: isTF && idx === 0,
        isFalseOpt: isTF && idx === 1,
      }));

  return (
    <div
      className={`grid ${
        items.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'
      } gap-3 p-4 h-[calc(100vh-180px)]`}
    >
      {items.map((btn) => {
        const isSelected = selectedAnswer
          ? (selectedAnswer === btn.key || (isTF && isTrueFalseMatch(selectedAnswer, btn.key)))
          : false;

        let extraClass = '';
        if (showResult && revealedAnswer) {
          const isCorrect = isAnswerCorrect(question.type || '', btn.key, revealedAnswer, undefined, question.options);
          if (isCorrect) {
            extraClass = 'ring-8 ring-green-400 scale-95';
          } else if (isSelected) {
            extraClass = 'opacity-40 animate-shake';
          } else {
            extraClass = 'opacity-30';
          }
        } else if (isSelected) {
          extraClass = 'ring-8 ring-white scale-95 shadow-none';
        }

        const displayLabel = isTF
          ? (btn.text || (btn.isTrueOpt ? 'Đúng' : 'Sai'))
          : btn.key;

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
            <span className="text-xl font-black uppercase tracking-wider">{displayLabel}</span>
            {!isTF && btn.text && (
              <span className="text-sm font-semibold opacity-90 truncate max-w-full px-2">
                {btn.text}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
