import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms, gameSessions } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const code = params.code.toUpperCase();
    const { studentName, sessionId } = await req.json();
    if (!studentName?.trim() || !sessionId) return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
    if (studentName.trim().length < 2 || studentName.trim().length > 50) return NextResponse.json({ error: 'Tên phải 2-50 ký tự' }, { status: 400 });

    const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    if (!room) return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 });
    if (room.status === 'finished') return NextResponse.json({ error: 'Phòng đã kết thúc' }, { status: 400 });

    const students = (room.students ?? []) as Array<{ name: string; sessionId: string; joinedAt: string }>;
    const existing = students.find(s => s.sessionId === sessionId);
    if (!existing) {
      students.push({ name: studentName.trim(), sessionId, joinedAt: new Date().toISOString() });
      await db.update(rooms).set({ students }).where(eq(rooms.code, code));
    }

    // Upsert game session
    const [existingSession] = await db.select({ id: gameSessions.id })
      .from(gameSessions)
      .where(and(eq(gameSessions.roomCode, code), eq(gameSessions.sessionId, sessionId)))
      .limit(1);

    if (!existingSession) {
      await db.insert(gameSessions).values({
        id: randomUUID(),
        roomCode: code,
        studentName: studentName.trim(),
        sessionId,
        answers: [],
        totalScore: 0,
        tabSwitchCount: 0,
        disqualified: false,
        submittedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, mode: room.mode, settings: room.settings, studentName: existing?.name ?? studentName.trim() });
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi tham gia: ' + e.message }, { status: 500 });
  }
}
