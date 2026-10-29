import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-between">
      {/* Top Bar */}
      <header className="px-8 py-5 border-b-2 border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎮</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            QUIZ<span className="text-brand-red">GAME</span>
          </span>
        </div>

        <Link
          href="/login"
          className="btn-liquid bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-2xl text-sm shadow-sm"
        >
          Giáo viên đăng nhập
        </Link>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
        <div className="inline-block bg-red-100 text-brand-red px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-6">
          Nền tảng thi đấu trực tiếp cho lớp học
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight tracking-tight mb-6">
          Học tập vui hơn, <br />
          <span className="text-brand-red">Thi đấu</span> hứng khởi hơn!
        </h1>

        <p className="text-xl text-slate-600 max-w-2xl mb-10 font-medium">
          Chiếu câu hỏi lên màn hình lớp học, học sinh dùng điện thoại hoặc máy tính quét mã QR để trả lời tức thì.
        </p>

        {/* Big Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link
            href="/room/join"
            className="btn-liquid flex-1 py-4 bg-brand-red hover:bg-red-600 text-white font-black text-xl rounded-2xl shadow-button-3d text-center"
          >
            🚀 Nhập mã PIN
          </Link>

          <Link
            href="/login"
            className="btn-liquid flex-1 py-4 bg-brand-blue hover:bg-blue-600 text-white font-black text-xl rounded-2xl shadow-button-3d text-center"
          >
            👨‍🏫 Cho giáo viên
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs font-bold text-slate-400 border-t border-slate-200">
        Quiz Game System • Thiết kế theo phong cách thi đấu Kahoot
      </footer>
    </div>
  );
}
