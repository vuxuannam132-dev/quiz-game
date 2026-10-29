'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-brand-blue text-xl font-black animate-pulse">
          Đang xác thực tài khoản...
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: '/admin', label: '📊 Tổng quan' },
    { href: '/admin/sets', label: '📁 Bộ câu hỏi' },
    { href: '/admin/questions', label: '❓ Ngân hàng câu hỏi' },
    { href: '/admin/rooms', label: '🎮 Phòng chơi' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-slate-800">
      {/* Top Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b-2 border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-3xl">🎮</span>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              QUIZ<span className="text-brand-red">GAME</span>
            </span>
          </Link>

          <div className="hidden md:flex gap-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-4 py-2 rounded-xl text-sm font-bold transition-all
                    ${isActive
                      ? 'bg-blue-50 text-brand-blue shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }
                  `}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-black uppercase text-slate-400">Giáo viên</div>
            <div className="text-sm font-bold text-slate-800">
              {session?.user?.name || session?.user?.email}
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-brand-red transition-colors text-slate-600"
          >
            Đăng xuất
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
