'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function JoinRoomPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError('Mã phòng phải có 6 ký tự');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/room/${trimmed}`);
      if (!res.ok) {
        setError('Phòng không tồn tại hoặc đã kết thúc');
        return;
      }
      const data = await res.json();
      if (data.status === 'finished') {
        setError('Phòng đã kết thúc');
        return;
      }
      router.push(`/room/${trimmed}/student`);
    } catch {
      setError('Không thể kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-3xl font-black text-white">Tham gia Quiz</h1>
          <p className="text-gray-400 mt-2">Nhập mã phòng từ giáo viên</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 text-red-300 text-sm text-center">
                {error}
              </div>
            )}
            <div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                maxLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-3xl font-mono font-black tracking-widest focus:border-electric-blue focus:outline-none placeholder-gray-600"
              />
              <p className="text-gray-500 text-xs text-center mt-2">6 ký tự in hoa</p>
            </div>
            <button
              type="submit"
              disabled={code.trim().length !== 6 || loading}
              className="w-full py-4 bg-electric-blue hover:bg-blue-400 text-white text-lg font-black rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? '⟳ Đang kiểm tra...' : '🚀 Tham gia'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Trang chủ
          </a>
        </div>
      </motion.div>
    </div>
  );
}
