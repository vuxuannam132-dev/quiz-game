import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/db';
import { rooms } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { generateRoomCode } from '@/lib/gameLogic';
import { setRoomStateInCache } from '@/lib/redis';

async function uniqueCode(field: 'code' | 'adminCode'): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateRoomCode();
    const col = field === 'code' ? rooms.code : rooms.adminCode;
    const [existing] = await db.select({ id: rooms.id }).from(rooms).where(eq(col, code)).limit(1);
    if (!existing) return code;
  }
  return generateRoomCode();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const body = await req.json();
    const { questionIds, mode, settings } = body;
    if (!questionIds?.length) return NextResponse.json({ error: 'Vui lòng chọn câu hỏi' }, { status: 400 });
    if (!['learning', 'practice', 'exam'].includes(mode)) return NextResponse.json({ error: 'Chế độ không hợp lệ' }, { status: 400 });

    const code = await uniqueCode('code');
    const adminCode = await uniqueCode('adminCode');

    const roomSettings = {
      timeLimit: settings?.timeLimit ?? null,
      totalTime: settings?.totalTime ?? null,
      soundEnabled: settings?.soundEnabled !== false,
      skipEffects: settings?.skipEffects ?? false,
      monitorTabSwitch: settings?.monitorTabSwitch ?? mode === 'exam',
      maxTabSwitches: settings?.maxTabSwitches ?? 3,
    };

    await db.insert(rooms).values({
      code,
      adminCode,
      createdBy: (session.user as any).id,
      questionIds,
      mode,
      settings: roomSettings,
      status: 'waiting',
      currentQuestionIndex: 0,
      questionRevealed: false,
      students: [],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await setRoomStateInCache(code, {
      status: 'waiting', mode, currentQuestionIndex: 0,
      questionRevealed: false, settings: roomSettings,
      studentsCount: 0, totalQuestions: questionIds.length,
    });

    return NextResponse.json({ code, adminCode }, { status: 201 });
  } catch (e: any) {
    console.error('Create room error:', e);
    return NextResponse.json({ error: 'Lỗi tạo phòng: ' + e.message }, { status: 500 });
  }
}
