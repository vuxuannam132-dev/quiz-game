'use client';

import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { RoomMode, RoomStatus } from '@/types';
import { useState, useEffect } from 'react';

interface RoomCodeProps {
  code: string;
  studentsCount: number;
  mode: RoomMode;
  status: RoomStatus;
}

export function RoomCode({ code, studentsCount, mode, status }: RoomCodeProps) {
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoinUrl(`${window.location.origin}/room/${code}/student`);
    }
  }, [code]);

  return (
    <div className="bg-white border-b-4 border-slate-200 px-8 py-4 shadow-sm flex items-center justify-between">
      {/* Left: Brand + Code */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎮</span>
          <span className="text-2xl font-black text-brand-dark tracking-tight">QUIZ</span>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Mã PIN:</span>
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="bg-brand-dark text-white px-5 py-2 rounded-2xl font-black text-3xl tracking-widest shadow-inner font-mono"
          >
            {code}
          </motion.div>
        </div>
      </div>

      {/* Center: Instruction & Mode badge */}
      <div className="text-center hidden md:flex flex-col items-center">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
            mode === 'exam' ? 'bg-red-100 text-brand-red border-red-200' :
            mode === 'practice' ? 'bg-amber-100 text-amber-700 border-amber-200' :
            'bg-blue-100 text-brand-blue border-blue-200'
          }`}>
            {mode === 'exam' ? '🏆 Chế độ Thi đấu' : mode === 'practice' ? '⚡ Chế độ Luyện tập' : '📚 Chế độ Học tập'}
          </span>
          {status === 'paused' && (
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              ⏸ Tạm dừng
            </span>
          )}
        </div>
        <p className="text-xs font-bold text-slate-400 uppercase">Vào bằng trình duyệt:</p>
        <p className="text-lg font-black text-brand-blue">
          {typeof window !== 'undefined' ? window.location.host : ''}/room/join
        </p>
      </div>

      {/* Right: QR Code & Player Count */}
      <div className="flex items-center gap-5">
        {/* QR Code thumbnail */}
        {joinUrl && (
          <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200 flex flex-col items-center">
            <QRCodeSVG value={joinUrl} size={54} level="M" />
            <span className="text-[10px] font-bold text-slate-500 mt-1">Quét vào chơi</span>
          </div>
        )}

        {/* Players count */}
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200">
          <span className="text-2xl">👥</span>
          <div>
            <div className="text-xl font-black text-slate-800 leading-none">{studentsCount}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Người chơi</div>
          </div>
        </div>
      </div>
    </div>
  );
}
