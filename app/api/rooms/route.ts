import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/db';
import { rooms } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const rows = await db.select().from(rooms)
      .where(eq(rooms.createdBy, (session.user as any).id))
      .orderBy(desc(rooms.createdAt))
      .limit(50);

    const result = rows.map(r => ({
      _id: r.id, code: r.code, adminCode: r.adminCode,
      mode: r.mode, status: r.status,
      studentsCount: (r.students as any[]).length,
      questionCount: r.questionIds?.length ?? 0,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ rooms: result });
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi lấy phòng' }, { status: 500 });
  }
}
