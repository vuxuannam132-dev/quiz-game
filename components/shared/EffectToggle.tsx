'use client';

import { motion } from 'framer-motion';

interface EffectToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function EffectToggle({ enabled, onToggle }: EffectToggleProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm"
    >
      {enabled ? (
        <>
          <span className="text-lg">✨</span>
          <span>Hiệu ứng</span>
        </>
      ) : (
        <>
          <span className="text-lg">⬜</span>
          <span>Tắt hiệu ứng</span>
        </>
      )}
    </motion.button>
  );
}
