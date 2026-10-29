'use client';

import { motion } from 'framer-motion';
import { IQuestion } from '@/types';

interface QuestionNavProps {
  questions: Partial<IQuestion>[];
  currentIndex: number;
  onSelect?: (index: number) => void;
}

const TYPE_ICONS: Record<string, string> = {
  multiple_choice: '🔤',
  true_false: '✅',
  matching: '🔗',
};

export function QuestionNav({ questions, currentIndex, onSelect }: QuestionNavProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
      <h3 className="text-white font-bold text-sm mb-3 opacity-70">Danh sách câu hỏi</h3>
      <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
        {questions.map((q, index) => (
          <motion.div
            key={(q._id as string) || index}
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelect?.(index)}
            className={`
              flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm
              ${index === currentIndex
                ? 'bg-electric-blue/20 border border-electric-blue/50 text-white'
                : 'hover:bg-white/5 text-gray-400 hover:text-white'
              }
            `}
          >
            <span className="shrink-0 font-bold text-xs mt-0.5 w-5 text-center">
              {index + 1}
            </span>
            <span className="shrink-0 text-xs mt-0.5">
              {TYPE_ICONS[q.type || 'multiple_choice'] || '❓'}
            </span>
            <span className="truncate leading-tight">{q.content || '...'}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
