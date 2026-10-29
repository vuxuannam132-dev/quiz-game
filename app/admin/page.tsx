import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { questions, rooms, gameSessions } from '@/lib/schema';
import { inArray, sql } from 'drizzle-orm';

async function getStats() {
  const [
    [{ count: totalQuestions }],
    [{ count: activeRooms }],
    [{ count: totalSessions }],
    recentRooms,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(questions),
    db.select({ count: sql<number>`count(*)` }).from(rooms).where(
      inArray(rooms.status, ['waiting', 'playing', 'paused'])
    ),
    db.select({ count: sql<number>`count(*)` }).from(gameSessions),
    db.select({
      id: rooms.id,
      code: rooms.code,
      mode: rooms.mode,
      status: rooms.status,
      createdAt: rooms.createdAt,
    }).from(rooms).orderBy(sql`${rooms.createdAt} desc`).limit(5),
  ]);

  return {
    totalQuestions: Number(totalQuestions),
    activeRooms: Number(activeRooms),
    totalSessions: Number(totalSessions),
    recentRooms,
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const { totalQuestions, activeRooms, totalSessions, recentRooms } = await getStats();

  const STATUS_COLORS: Record<string, string> = {
    waiting: 'bg-blue-500/20 text-blue-300',
    playing: 'bg-green-500/20 text-green-300',
    paused: 'bg-yellow-500/20 text-yellow-300',
    finished: 'bg-gray-500/20 text-gray-400',
  };
  const STATUS_LABELS: Record<string, string> = {
    waiting: 'Chờ', playing: 'Đang chơi', paused: 'Tạm dừng', finished: 'Kết thúc',
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">📊 Dashboard</h1>
            <p className="text-gray-400">Xin chào, {session.user?.name || session.user?.email}</p>
          </div>
          <Link href="/api/auth/signout" className="text-gray-400 hover:text-white text-sm">
            Đăng xuất
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Câu hỏi', value: totalQuestions, icon: '❓', color: 'text-electric-blue' },
            { label: 'Phòng đang hoạt động', value: activeRooms, icon: '🎮', color: 'text-lime-green' },
            { label: 'Phiên đã chơi', value: totalSessions, icon: '👥', color: 'text-hot-pink' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-6">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className={`text-4xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link href="/admin/questions" className="glass rounded-2xl p-6 hover:bg-white/10 transition-colors group">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="text-white font-bold text-lg group-hover:text-electric-blue transition-colors">Ngân hàng câu hỏi</h3>
            <p className="text-gray-400 text-sm">{totalQuestions} câu hỏi</p>
          </Link>
          <Link href="/admin/rooms" className="glass rounded-2xl p-6 hover:bg-white/10 transition-colors group">
            <div className="text-3xl mb-2">🎮</div>
            <h3 className="text-white font-bold text-lg group-hover:text-electric-blue transition-colors">Quản lý phòng</h3>
            <p className="text-gray-400 text-sm">{activeRooms} phòng đang hoạt động</p>
          </Link>
        </div>

        {/* Recent rooms */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">Phòng gần đây</h2>
          {recentRooms.length === 0 ? (
            <p className="text-gray-400 text-sm">Chưa có phòng nào</p>
          ) : (
            <div className="space-y-3">
              {recentRooms.map((room) => (
                <div key={room.id} className="flex items-center gap-4 py-2 border-b border-white/5">
                  <code className="text-electric-blue font-mono font-bold text-lg">{room.code}</code>
                  <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[room.status ?? ''] ?? 'bg-gray-500/20 text-gray-400'}`}>
                    {STATUS_LABELS[room.status ?? ''] ?? room.status}
                  </span>
                  <span className="text-gray-400 text-sm">{room.mode}</span>
                  <span className="text-gray-500 text-xs ml-auto">
                    {room.createdAt ? new Date(room.createdAt).toLocaleDateString('vi-VN') : ''}
                  </span>
                  <Link href={`/room/${room.code}/teacher`} className="text-xs text-electric-blue hover:underline">
                    Điều khiển →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
