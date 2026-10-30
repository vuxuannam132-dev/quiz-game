'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  timeLimit: number;
  onTimeUp: () => void;
  isRunning: boolean;
  onTick?: (remaining: number) => void;
  resetKey?: any;
}

export function Timer({ timeLimit, onTimeUp, isRunning, onTick, resetKey }: TimerProps) {
  const [remaining, setRemaining] = useState(timeLimit);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  const onTickRef = useRef(onTick);

  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);

  // Reset to timeLimit whenever timeLimit or resetKey changes
  useEffect(() => {
    setRemaining(timeLimit);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [timeLimit, resetKey]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // If remaining was already 0 when resumed/started, reset to timeLimit
    setRemaining((prev) => (prev <= 0 ? timeLimit : prev));

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        onTickRef.current?.(next);
        if (next <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeUpRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, resetKey, timeLimit]);

  const percentage = (remaining / timeLimit) * 100;
  const isUrgent = remaining <= 5;
  const isWarning = remaining <= 10;

  const color = isUrgent
    ? '#ef4444'
    : isWarning
    ? '#eab308'
    : '#22c55e';

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        animate={isUrgent ? { scale: [1, 1.12, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className="relative w-16 h-16 sm:w-20 sm:h-20"
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="rgba(0,0,0,0.08)"
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
          className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl font-black font-mono"
          style={{ color }}
        >
          {remaining}
        </div>
      </motion.div>
      <div className="text-[10px] font-black uppercase text-slate-400">giây</div>
    </div>
  );
}
