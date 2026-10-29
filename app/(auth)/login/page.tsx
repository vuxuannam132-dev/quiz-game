'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email hoặc mật khẩu không chính xác');
      } else {
        router.push('/admin');
      }
    } catch {
      setError('Đã xảy ra lỗi kết nối, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border-2 border-slate-200 rounded-3xl p-8 max-w-sm w-full shadow-xl"
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">👨‍🏫</div>
          <h1 className="text-2xl font-black text-slate-900">Giáo viên đăng nhập</h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">Quản lý câu hỏi và điều khiển trận đấu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 text-brand-red text-xs font-bold text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@quiz.vn"
              required
              className="w-full bg-slate-100 border-2 border-slate-200 focus:border-brand-blue rounded-2xl px-4 py-3 text-slate-900 font-medium focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-100 border-2 border-slate-200 focus:border-brand-blue rounded-2xl px-4 py-3 text-slate-900 font-medium focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-liquid w-full py-3.5 bg-brand-blue hover:bg-blue-600 text-white font-black text-lg rounded-2xl shadow-button-3d transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập →'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <a href="/" className="text-xs font-bold text-slate-400 hover:text-slate-600">
            ← Quay lại trang chủ
          </a>
        </div>
      </motion.div>
    </div>
  );
}
