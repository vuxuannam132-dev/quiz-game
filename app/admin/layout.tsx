'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-electric-blue text-2xl animate-pulse">⟳ Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <nav className="border-b border-white/10 bg-black/30 backdrop-blur-sm px-6 py-3 flex items-center gap-6">
        <Link href="/admin" className="text-xl font-black text-electric-blue">🎮 Quiz Admin</Link>
        <div className="flex gap-4 text-sm">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/admin/questions" className="text-gray-400 hover:text-white transition-colors">Câu hỏi</Link>
          <Link href="/admin/rooms" className="text-gray-400 hover:text-white transition-colors">Phòng</Link>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-gray-400 text-sm">{session?.user?.name || session?.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs px-3 py-1 rounded-lg bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
