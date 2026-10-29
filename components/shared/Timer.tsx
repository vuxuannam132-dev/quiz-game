'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  timeLimit: number;
  onTimeUp: () => void;
  isRunning: boolean;
  onTick?: (remaining: number) => void;
}

export function Timer({ timeLimit, onTimeUp, isRunning, onTick }: TimerProps) {
  const [remaining, setRemaining] = useState(timeLimit);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  const onTickRef = useRef(onTick);

  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);

  useEffect(() => {
    setRemaining(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        onTickRef.current?.(next);
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          onTimeUpRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const percentage = (remaining / timeLimit) * 100;
  const isUrgent = remaining <= 5;
  const isWarning = remaining <= 10;

  const color = isUrgent
    ? '#ef4444'
    : isWarning
    ? '#eab308'
    : '#22c55e';

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className="relative w-20 h-20"
      >
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - percentage / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
          style={{ color }}
        >
          {remaining}
        </div>
      </motion.div>
      <div className="text-xs text-gray-400">giây</div>
    </div>
  );
}
