'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoomCreator } from '@/components/admin/RoomCreator';
import { CreateRoomResponse } from '@/types';

interface Room {
  _id: string;
  code: string;
  adminCode: string;
  mode: string;
  status: string;
  studentsCount: number;
  questionCount: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  waiting: 'bg-blue-500/20 text-blue-300',
  playing: 'bg-green-500/20 text-green-300',
  paused: 'bg-yellow-500/20 text-yellow-300',
  finished: 'bg-gray-500/20 text-gray-400',
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<CreateRoomResponse | null>(null);

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

  useEffect(() => { fetchRooms(); }, []);

  const handleCreated = (result: CreateRoomResponse) => {
    setCreatedRoom(result);
    setShowCreator(false);
    fetchRooms();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã copy: ' + text);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white">🎮 Quản lý phòng</h1>
          <button
            onClick={() => setShowCreator(true)}
            className="px-4 py-2 bg-electric-blue hover:bg-blue-400 text-white font-bold rounded-xl transition-colors"
          >
            + Tạo phòng mới
          </button>
        </div>

        {/* Created room success */}
        {createdRoom && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 mb-6 border border-green-500/30"
          >
            <h3 className="text-green-400 font-bold mb-3">✅ Phòng đã được tạo!</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Mã phòng (học sinh)</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-electric-blue tracking-widest">{createdRoom.code}</span>
                  <button onClick={() => copyToClipboard(createdRoom.code)} className="text-gray-400 hover:text-white text-sm">📋 Copy</button>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-1">Mã điều khiển (giáo viên)</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-hot-pink tracking-widest">{createdRoom.adminCode}</span>
                  <button onClick={() => copyToClipboard(createdRoom.adminCode)} className="text-gray-400 hover:text-white text-sm">📋 Copy</button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <a href={`/room/${createdRoom.code}/teacher`} target="_blank" className="px-4 py-2 bg-hot-pink/20 text-hot-pink hover:bg-hot-pink/30 rounded-lg text-sm font-medium transition-colors">
                🎛️ Mở trang điều khiển
              </a>
              <a href={`/room/${createdRoom.code}/projector`} target="_blank" className="px-4 py-2 bg-electric-blue/20 text-electric-blue hover:bg-electric-blue/30 rounded-lg text-sm font-medium transition-colors">
                📺 Mở máy chiếu
              </a>
              <button onClick={() => setCreatedRoom(null)} className="text-gray-500 hover:text-white text-sm ml-auto">Đóng</button>
            </div>
          </motion.div>
        )}

        {/* Rooms list */}
        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Đang tải...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Chưa có phòng nào</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-gray-400 text-sm">Mã phòng</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm">Chế độ</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm">Học sinh</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm">Ngày tạo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <code className="text-electric-blue font-mono font-bold">{room.code}</code>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm capitalize">{room.mode}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[room.status] || 'bg-white/10 text-gray-400'}`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{room.studentsCount || 0}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(room.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <a href={`/room/${room.code}/teacher`} target="_blank" className="text-xs px-2 py-1 rounded bg-hot-pink/20 text-hot-pink hover:bg-hot-pink/30">
                          Điều khiển
                        </a>
                        <a href={`/room/${room.code}/projector`} target="_blank" className="text-xs px-2 py-1 rounded bg-electric-blue/20 text-electric-blue hover:bg-electric-blue/30">
                          Máy chiếu
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Creator Modal */}
      <AnimatePresence>
        {showCreator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-white font-bold text-lg mb-4">🎮 Tạo phòng mới</h2>
              <RoomCreator onCreated={handleCreated} onCancel={() => setShowCreator(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
