'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioToggleProps {
  soundEnabled: boolean;
  onToggle: () => void;
  className?: string;
  label?: string;
}

export function AudioToggle({
  soundEnabled,
  onToggle,
  className = '',
  label,
}: AudioToggleProps) {
  // Shortcut: press 'm' to mute/unmute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === 'm' || e.key === 'M') {
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 select-none ${className}`}
      style={{ pointerEvents: 'auto' }}
    >
      <motion.button
        type="button"
        onClick={onToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full backdrop-blur-md shadow-2xl border transition-all duration-200 cursor-pointer ${
          soundEnabled
            ? 'bg-slate-900/90 border-emerald-500/50 text-white shadow-emerald-500/10 ring-1 ring-emerald-400/30 hover:border-emerald-400 hover:bg-slate-900'
            : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-slate-200'
        }`}
        title={
          soundEnabled
            ? 'Âm thanh: ĐANG BẬT (Nhấn để tắt hoặc phím M)'
            : 'Âm thanh: ĐÃ TẮT (Nhấn để bật hoặc phím M)'
        }
        aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
      >
        {/* Speaker Icon with Visual Feedback */}
        <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
          {soundEnabled ? (
            <span className="text-lg">🔊</span>
          ) : (
            <span className="text-lg opacity-60">🔇</span>
          )}

          {/* Status Dot */}
          <span
            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
              soundEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
            }`}
          />
        </div>

        {/* Animated Equalizer Waveform when ON */}
        <AnimatePresence mode="wait">
          {soundEnabled && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex items-end gap-0.5 h-3 overflow-hidden shrink-0"
            >
              <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
              <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s] h-2" />
              <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.45s] h-2.5" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Label */}
        <div className="text-left text-xs font-bold leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={soundEnabled ? 'text-emerald-300 font-black' : 'text-slate-400'}>
              {soundEnabled ? 'Âm thanh' : 'Đã tắt tiếng'}
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-white/10 text-slate-400">
              M
            </span>
          </div>
          {label && (
            <span className="text-[10px] text-slate-400 block font-normal">{label}</span>
          )}
        </div>
      </motion.button>
    </div>
  );
}
