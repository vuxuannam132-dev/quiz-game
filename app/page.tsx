import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-6xl font-black neon-blue">🎮 Quiz Game</h1>
      <p className="text-gray-400 text-xl">Hệ thống quiz tương tác cho giáo viên và học sinh</p>
      <div className="flex gap-4">
        <Link href="/login" className="px-8 py-3 bg-electric-blue hover:bg-blue-400 text-white font-bold rounded-xl transition-colors">
          Đăng nhập
        </Link>
        <Link href="/room/join" className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors border border-white/20">
          Tham gia phòng
        </Link>
      </div>
    </div>
  );
}
