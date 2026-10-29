'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoomCreator } from '@/components/admin/RoomCreator';
import { CreateRoomResponse } from '@/types';
import { QRCodeSVG } from 'qrcode.react';

interface Room {
  _id: string;
  code: string;
  mode: string;
  status: string;
  studentsCount: number;
  questionCount: number;
  createdAt: string;
}

const STATUS_TAGS: Record<string, { label: string; color: string }> = {
  waiting: { label: 'Đang chờ', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  playing: { label: 'Đang chơi', color: 'bg-green-100 text-green-800 border-green-300' },
  paused: { label: 'Tạm dừng', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  finished: { label: 'Đã xong', color: 'bg-slate-100 text-slate-600 border-slate-300' },
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<CreateRoomResponse | null>(null);
  const [qrModalCode, setQrModalCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCreated = (result: CreateRoomResponse) => {
    setCreatedRoom(result);
    setShowCreator(false);
    fetchRooms();
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa phòng ${code} không? Dữ liệu phòng sẽ bị xóa hoàn toàn.`)) return;

    try {
      const res = await fetch(`/api/room/${code}`, { method: 'DELETE' });
      if (res.ok) {
        setRooms((prev) => prev.filter((r) => r.code !== code));
        if (createdRoom?.code === code) {
          setCreatedRoom(null);
        }
        if (qrModalCode === code) {
          setQrModalCode(null);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi xóa phòng');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ');
    }
  };

  const copyJoinLink = async (code: string) => {
    const url = `${origin}/room/${code}/student`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      prompt('Sao chép link tham gia sau:', url);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>🎮</span> Quản lý phòng chơi
          </h1>
          <p className="text-slate-500 text-sm mt-1">Tạo phòng, mở máy chiếu và điều khiển trận đấu</p>
        </div>

        <button
          onClick={() => setShowCreator(true)}
          className="btn-liquid bg-brand-red hover:bg-red-600 text-white font-black px-6 py-3 rounded-2xl shadow-button-3d flex items-center justify-center gap-2"
        >
          <span className="text-xl leading-none">＋</span> Tạo phòng mới
        </button>
      </div>

      {/* Success banner when a new room is created */}
      <AnimatePresence>
        {createdRoom && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-8 p-6 bg-white border-2 border-green-500 rounded-3xl shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6"
          >
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left w-full lg:w-auto">
              <div className="p-2 bg-white rounded-2xl border-2 border-slate-200 shadow-sm shrink-0">
                <QRCodeSVG
                  value={`${origin}/room/${createdRoom.code}/student`}
                  size={110}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-green-700 font-black text-lg">
                  <span>🎉</span> Phòng đã sẵn sàng!
                </div>
                <p className="text-slate-600 text-sm mt-1">
                  Chiếu mã PIN hoặc mã QR lên bảng cho học sinh tham gia.
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <span className="text-slate-500 font-bold text-sm">MÃ PIN:</span>
                  <span className="text-4xl font-black text-brand-dark tracking-widest font-mono bg-slate-100 px-4 py-1 rounded-2xl border border-slate-200">
                    {createdRoom.code}
                  </span>
                  <button
                    onClick={() => copyJoinLink(createdRoom.code)}
                    className="text-xs font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
                  >
                    <span>{copiedCode === createdRoom.code ? '✓ Đã copy link' : '🔗 Copy link'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto">
              <a
                href={`/room/${createdRoom.code}/projector`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-liquid bg-brand-blue hover:bg-blue-600 text-white font-bold px-5 py-3 rounded-2xl shadow-button-3d text-center flex-1 whitespace-nowrap"
              >
                📺 Mở máy chiếu
              </a>
              <a
                href={`/room/${createdRoom.code}/teacher`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-liquid bg-brand-dark hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-2xl shadow-button-3d text-center flex-1 whitespace-nowrap"
              >
                🎛️ Bảng điều khiển
              </a>
              <button
                onClick={() => setCreatedRoom(null)}
                className="text-slate-400 hover:text-slate-600 font-bold px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                title="Đóng thông báo"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rooms Table */}
      <div className="liquid-glass rounded-3xl overflow-hidden shadow-sm bg-white/80 border border-slate-200">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold flex items-center justify-center gap-3">
            <span className="animate-spin text-xl">⏳</span> Đang tải danh sách phòng...
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-16 text-center">
            <span className="text-6xl block mb-3">🎲</span>
            <h3 className="text-xl font-bold text-slate-800">Chưa có phòng chơi nào</h3>
            <p className="text-slate-500 text-sm mt-1 mb-6">Hãy tạo một phòng mới để bắt đầu trận đấu!</p>
            <button
              onClick={() => setShowCreator(true)}
              className="bg-brand-red text-white font-bold px-6 py-2.5 rounded-2xl shadow-button-3d text-sm hover:bg-red-600 transition-colors"
            >
              + Tạo phòng ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-black uppercase text-slate-500">
                  <th className="px-6 py-4">Mã phòng</th>
                  <th className="px-6 py-4">Chế độ</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Số câu</th>
                  <th className="px-6 py-4">Học sinh</th>
                  <th className="px-6 py-4">Link tham gia</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((room) => {
                  const tag = STATUS_TAGS[room.status] || STATUS_TAGS.waiting;
                  return (
                    <tr key={room._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-2xl text-slate-900 tracking-wider">
                          {room.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700 capitalize">
                        {room.mode === 'exam' ? '🏆 Thi đấu' : room.mode === 'practice' ? '⚡ Luyện tập' : '📚 Học tập'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tag.color}`}>
                          {tag.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-600">
                        {room.questionCount} câu
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-600">
                        {room.studentsCount} bạn
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setQrModalCode(room.code)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                          title="Xem mã QR và link tham gia"
                        >
                          <span>📱 Mã QR</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/room/${room.code}/projector`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-50 text-brand-blue hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                          >
                            📺 Chiếu
                          </a>
                          <a
                            href={`/room/${room.code}/teacher`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                          >
                            🎛️ Điều khiển
                          </a>
                          <button
                            onClick={() => handleDelete(room.code)}
                            title="Xóa phòng"
                            className="text-red-500 hover:bg-red-50 hover:text-red-700 p-1.5 rounded-xl transition-colors text-sm font-bold flex items-center justify-center"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code & Preview Link Modal */}
      <AnimatePresence>
        {qrModalCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>📱</span> Mã QR tham gia
                </h3>
                <button
                  onClick={() => setQrModalCode(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="my-6 flex justify-center">
                <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
                  <QRCodeSVG
                    value={`${origin}/room/${qrModalCode}/student`}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <div className="mb-4">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Mã PIN</span>
                <p className="font-mono font-black text-3xl tracking-widest text-brand-dark mt-1">
                  {qrModalCode}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-6 text-left">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Đường dẫn trực tiếp:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${origin}/room/${qrModalCode}/student`}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none"
                  />
                  <button
                    onClick={() => copyJoinLink(qrModalCode)}
                    className="shrink-0 text-xs font-bold px-3 py-1.5 bg-brand-blue hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    {copiedCode === qrModalCode ? '✓ Đã copy' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`/room/${qrModalCode}/student`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-liquid flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm text-center"
                >
                  👁️ Mở màn học sinh
                </a>
                <button
                  onClick={() => setQrModalCode(null)}
                  className="btn-liquid flex-1 py-2.5 bg-brand-dark hover:bg-slate-800 text-white font-bold rounded-xl text-sm"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creator Modal */}
      <AnimatePresence>
        {showCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-2xl font-black text-slate-900">🚀 Tạo phòng chơi mới</h2>
                <button
                  onClick={() => setShowCreator(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              <RoomCreator onCreated={handleCreated} onCancel={() => setShowCreator(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
