import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms, questions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getRoomStateFromCache, setRoomStateInCache } from '@/lib/redis';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const code = params.code.toUpperCase();

    const cached = await getRoomStateFromCache(code);
    if (cached) return NextResponse.json(cached);

    const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    if (!room) return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 });

    let currentQuestion = null;
    if (room.questionIds && room.questionIds.length > 0 && room.currentQuestionIndex < room.questionIds.length) {
      const qId = room.questionIds[room.currentQuestionIndex];
      const [q] = await db.select().from(questions).where(eq(questions.id, qId)).limit(1);
      if (q) {
        if (!room.questionRevealed) {
          const { correctAnswer, matchingPairs, ...rest } = q;
          currentQuestion = rest;
        } else {
          currentQuestion = q;
        }
      }
    }

    const state = {
      status: room.status, mode: room.mode,
      currentQuestionIndex: room.currentQuestionIndex,
      questionRevealed: room.questionRevealed,
      currentQuestion, settings: room.settings,
      studentsCount: (room.students as any[]).length,
      totalQuestions: room.questionIds?.length ?? 0,
    };
    await setRoomStateInCache(code, state);
    return NextResponse.json(state);
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi lấy phòng' }, { status: 500 });
  }
}
