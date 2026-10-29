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
        setError('Email hoặc mật khẩu không đúng');
      } else {
        router.push('/admin');
      }
    } catch {
      setError('Đã xảy ra lỗi, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="text-2xl font-black text-white">Đăng nhập</h1>
          <p className="text-gray-400 text-sm mt-1">Quiz Game Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-electric-blue focus:outline-none"
              placeholder="admin@quiz.vn"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-electric-blue focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-electric-blue hover:bg-blue-400 text-white font-bold rounded-xl transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? '⟳ Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
