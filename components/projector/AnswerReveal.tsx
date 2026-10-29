'use client';

import { motion } from 'framer-motion';
import { IQuestion } from '@/types';
import { useEffect, useRef } from 'react';

interface AnswerRevealProps {
  question: Partial<IQuestion>;
  onRevealComplete?: () => void;
  skipEffects?: boolean;
}

const KAHOOT_COLORS = [
  { key: 'A', bg: 'bg-[#E21B3C]', shape: '▲' },
  { key: 'B', bg: 'bg-[#1368CE]', shape: '◆' },
  { key: 'C', bg: 'bg-[#D89E00]', shape: '●' },
  { key: 'D', bg: 'bg-[#26890C]', shape: '■' },
];

export function AnswerReveal({ question, onRevealComplete, skipEffects }: AnswerRevealProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!skipEffects && !firedRef.current && typeof window !== 'undefined') {
      firedRef.current = true;
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#E21B3C', '#1368CE', '#D89E00', '#26890C'],
        });
      });
    }
    onRevealComplete?.();
  }, [skipEffects, onRevealComplete]);

  if (!question) return null;

  return (
    <div className="flex-1 flex flex-col justify-center p-8 max-w-5xl mx-auto w-full">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-center mb-8"
      >
        <span className="inline-block text-6xl mb-2">🎉</span>
        <h2 className="text-4xl font-black text-slate-800">Đáp án chính xác!</h2>
      </motion.div>

      {/* Answer Cards for Multiple Choice and True/False */}
      {question.options && question.options.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, idx) => {
            const isCorrect = option.key === question.correctAnswer;
            const style = KAHOOT_COLORS[idx % KAHOOT_COLORS.length];
            return (
              <motion.div
                key={option.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: isCorrect ? 1 : 0.35,
                  scale: isCorrect ? 1.04 : 0.98,
                }}
                className={`
                  p-6 rounded-3xl text-white flex items-center gap-5 border-b-8
                  ${isCorrect ? `${style.bg} border-black/20 shadow-2xl ring-8 ring-green-400` : 'bg-slate-400 border-slate-500'}
                `}
              >
                <div className="w-14 h-14 rounded-2xl bg-black/20 flex items-center justify-center text-3xl font-black shrink-0">
                  {isCorrect ? '✓' : '✕'}
                </div>
                <div className="text-2xl md:text-3xl font-black flex-1">
                  {option.text}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Matching answer display */}
      {question.type === 'matching' && question.matchingPairs && question.matchingPairs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.matchingPairs.map((pair, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-green-600 border-b-8 border-green-800 text-white flex items-center justify-between font-bold text-xl shadow-lg ring-4 ring-green-400"
            >
              <span>{pair.left}</span>
              <span className="text-2xl">➔</span>
              <span>{pair.right}</span>
            </div>
          ))}
        </div>
      )}

      {question.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-blue-50 border-2 border-brand-blue/30 rounded-3xl p-6 text-center"
        >
          <span className="font-bold text-brand-blue text-sm uppercase tracking-wider block mb-1">💡 Giải thích:</span>
          <p className="text-slate-800 text-lg font-medium">{question.explanation}</p>
        </motion.div>
      )}
    </div>
  );
}
