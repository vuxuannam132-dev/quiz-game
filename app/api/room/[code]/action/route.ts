import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms, questions } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateRoomCache, setRoomStateInCache } from '@/lib/redis';

type RoomAction = 'start' | 'next' | 'prev' | 'reveal' | 'pause' | 'resume' | 'finish';

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const code = params.code.toUpperCase();
    const { adminCode, action } = await req.json() as { adminCode: string; action: RoomAction };
    if (!adminCode || !action) return NextResponse.json({ error: 'Thiếu adminCode hoặc action' }, { status: 400 });

    const [room] = await db.select().from(rooms)
      .where(and(eq(rooms.code, code), eq(rooms.adminCode, adminCode.toUpperCase())))
      .limit(1);
    if (!room) return NextResponse.json({ error: 'Mã điều khiển không hợp lệ' }, { status: 403 });

    const total = room.questionIds?.length ?? 0;
    let update: Partial<typeof room> = {};

    switch (action) {
      case 'start':   update = { status: 'playing', currentQuestionIndex: 0, questionRevealed: false }; break;
      case 'next':
        if (room.currentQuestionIndex >= total - 1) return NextResponse.json({ error: 'Câu hỏi cuối' }, { status: 400 });
        update = { currentQuestionIndex: room.currentQuestionIndex + 1, questionRevealed: false }; break;
      case 'prev':
        if (room.currentQuestionIndex <= 0) return NextResponse.json({ error: 'Câu hỏi đầu' }, { status: 400 });
        update = { currentQuestionIndex: room.currentQuestionIndex - 1, questionRevealed: false }; break;
      case 'reveal':  update = { questionRevealed: true }; break;
      case 'pause':   update = { status: 'paused' }; break;
      case 'resume':  update = { status: 'playing' }; break;
      case 'finish':  update = { status: 'finished' }; break;
      default: return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
    }

    const [updated] = await db.update(rooms).set(update).where(eq(rooms.code, code)).returning();
    await invalidateRoomCache(code);

    let currentQuestion = null;
    if (updated.questionIds && updated.questionIds.length > 0 && updated.currentQuestionIndex < updated.questionIds.length) {
      const qId = updated.questionIds[updated.currentQuestionIndex];
      const [q] = await db.select().from(questions).where(eq(questions.id, qId)).limit(1);
      if (q) {
        if (!updated.questionRevealed) {
          const { correctAnswer, matchingPairs, ...rest } = q;
          currentQuestion = rest;
        } else {
          currentQuestion = q;
        }
      }
    }

    const newState = {
      status: updated.status, mode: updated.mode,
      currentQuestionIndex: updated.currentQuestionIndex,
      questionRevealed: updated.questionRevealed,
      currentQuestion, settings: updated.settings,
      studentsCount: (updated.students as any[]).length,
      totalQuestions: total,
    };
    await setRoomStateInCache(code, newState);
    return NextResponse.json(newState);
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi action: ' + e.message }, { status: 500 });
  }
}
