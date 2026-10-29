'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface AttentionBannerProps {
  visible: boolean;
}

export function AttentionBanner({ visible }: AttentionBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.95)' }}
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="text-center"
          >
            <div className="text-9xl mb-6">⚠️</div>
            <h1
              className="text-5xl font-black text-yellow-400 mb-4"
              style={{ textShadow: '0 0 30px rgba(234, 179, 8, 0.8)' }}
            >
              CHÚ Ý LÊN BẢNG!
            </h1>
            <p className="text-2xl text-gray-300">Giáo viên đang giải thích</p>
          </motion.div>

          {/* Flashing border */}
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], borderColor: ['#eab308', '#ffffff', '#eab308'] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute inset-4 rounded-3xl border-4 border-yellow-400 pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
