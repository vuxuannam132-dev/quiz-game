'use client';

import { motion } from 'framer-motion';
import { IQuestion } from '@/types';

interface QuestionDisplayProps {
  question: Partial<IQuestion>;
  questionNumber: number;
  totalQuestions: number;
}

const KAHOOT_COLORS = [
  { key: 'A', bg: 'bg-[#E21B3C]', border: 'border-[#B0142E]', shape: '▲' },
  { key: 'B', bg: 'bg-[#1368CE]', border: 'border-[#0D4B96]', shape: '◆' },
  { key: 'C', bg: 'bg-[#D89E00]', border: 'border-[#A37700]', shape: '●' },
  { key: 'D', bg: 'bg-[#26890C]', border: 'border-[#1C6609]', shape: '■' },
];

export function QuestionDisplay({ question, questionNumber, totalQuestions }: QuestionDisplayProps) {
  if (!question) return null;

  return (
    <div className="flex-1 flex flex-col justify-between p-8 max-w-6xl mx-auto w-full">
      {/* Top Question Header */}
      <div className="text-center mb-6">
        <span className="inline-block bg-slate-200 text-slate-700 px-4 py-1 rounded-full text-sm font-bold mb-3">
          Câu {questionNumber} / {totalQuestions}
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight drop-shadow-sm">
          {question.content}
        </h1>

        {question.imageUrl && (
          <div className="mt-6 flex justify-center">
            <img
              src={question.imageUrl}
              alt="Câu hỏi"
              className="max-h-64 rounded-2xl shadow-xl object-contain border-4 border-white"
            />
          </div>
        )}
      </div>

      {/* 4 Answer Options (Kahoot grid) */}
      {question.options && question.options.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          {question.options.map((option, idx) => {
            const style = KAHOOT_COLORS[idx % KAHOOT_COLORS.length];
            return (
              <motion.div
                key={option.key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`
                  ${style.bg} ${style.border} border-b-8 rounded-3xl p-6 text-white
                  flex items-center gap-5 shadow-lg min-h-[110px]
                `}
              >
                <div className="w-14 h-14 rounded-2xl bg-black/20 flex items-center justify-center text-3xl font-black shrink-0">
                  {style.shape}
                </div>
                <div className="flex-1 text-2xl md:text-3xl font-extrabold leading-snug">
                  {option.text}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Matching type display */}
      {question.type === 'matching' && question.matchingPairs && question.matchingPairs.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-slate-200">
          <p className="text-slate-700 font-bold text-lg mb-4">Nối các cặp tương ứng:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.matchingPairs.map((pair, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 font-bold text-slate-800"
              >
                <span className="text-lg">{pair.left}</span>
                <span className="text-brand-blue text-2xl font-black">↔</span>
                <span className="text-lg">{pair.right}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
