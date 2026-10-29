'use client';

import { motion } from 'framer-motion';

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm"
      title={enabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
    >
      {enabled ? (
        <>
          <span className="text-lg">🔊</span>
          <span>Âm thanh</span>
        </>
      ) : (
        <>
          <span className="text-lg">🔇</span>
          <span>Tắt tiếng</span>
        </>
      )}
    </motion.button>
  );
}
