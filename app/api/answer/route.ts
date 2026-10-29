import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms, questions, gameSessions } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { calculateScore, isAnswerCorrect } from '@/lib/gameLogic';

export async function POST(req: NextRequest) {
  try {
    const { roomCode, sessionId, questionId, answer, timeSpent, tabSwitchCount } = await req.json();
    if (!roomCode || !sessionId || !questionId || answer === undefined) return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });

    const [room] = await db.select().from(rooms).where(eq(rooms.code, roomCode.toUpperCase())).limit(1);
    if (!room) return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 });
    if (room.status !== 'playing') return NextResponse.json({ error: 'Phòng chưa bắt đầu' }, { status: 400 });

    const [question] = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
    if (!question) return NextResponse.json({ error: 'Câu hỏi không tồn tại' }, { status: 404 });

    const correct = isAnswerCorrect(question.type, answer, question.correctAnswer ?? '', question.matchingPairs ?? undefined);
    const points = calculateScore({ correct, timeSpent: timeSpent ?? 0, timeLimit: room.settings?.timeLimit ?? undefined });

    const [session] = await db.select().from(gameSessions)
      .where(and(eq(gameSessions.roomCode, roomCode.toUpperCase()), eq(gameSessions.sessionId, sessionId)))
      .limit(1);
    if (!session) return NextResponse.json({ error: 'Phiên không tồn tại' }, { status: 404 });

    const answers = (session.answers ?? []) as Array<{ questionId: string; answer: string; correct: boolean; timeSpent: number; points: number }>;
    const alreadyAnswered = answers.find(a => a.questionId === questionId);

    if (!alreadyAnswered) {
      answers.push({ questionId, answer, correct, timeSpent: timeSpent ?? 0, points });
      const newTotal = session.totalScore + points;
      let updateData: any = { answers, totalScore: newTotal, submittedAt: new Date() };

      if (tabSwitchCount !== undefined) {
        updateData.tabSwitchCount = tabSwitchCount;
        if (room.mode === 'exam' && room.settings?.monitorTabSwitch && tabSwitchCount >= (room.settings?.maxTabSwitches ?? 3)) {
          updateData.disqualified = true;
          updateData.disqualifiedReason = `Chuyển tab ${tabSwitchCount} lần`;
        }
      }
      await db.update(gameSessions).set(updateData).where(eq(gameSessions.id, session.id));
    }

    return NextResponse.json({ correct, points: alreadyAnswered ? 0 : points, correctAnswer: question.correctAnswer, explanation: question.explanation, matchingPairs: question.matchingPairs, alreadyAnswered: !!alreadyAnswered });
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi gửi câu trả lời: ' + e.message }, { status: 500 });
  }
}
