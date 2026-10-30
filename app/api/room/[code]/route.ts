import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/db';
import { rooms, questions, gameSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getRoomStateFromCache, setRoomStateInCache, invalidateRoomCache } from '@/lib/redis';
import { RoundStats } from '@/types';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const code = params.code.toUpperCase().trim();

    // Query room directly for accurate real-time state
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    if (!room) return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 });

    let currentQuestion = null;
    if (room.questionIds && room.questionIds.length > 0 && room.currentQuestionIndex < room.questionIds.length) {
      const qId = room.questionIds[room.currentQuestionIndex];
      const [q] = await db.select().from(questions).where(eq(questions.id, qId)).limit(1);
      if (q) {
        if (!room.questionRevealed) {
          const { correctAnswer, matchingPairs, ...rest } = q;
          currentQuestion = { ...rest, id: q.id, _id: q.id };
        } else {
          currentQuestion = { ...q, id: q.id, _id: q.id };
        }
      }
    }

    // Compute round statistics if question is revealed or showing ranking
    let roundStats: RoundStats | undefined;
    if ((room.questionRevealed || room.showRanking) && currentQuestion) {
      const qId = (currentQuestion as any).id;
      const sessions = await db.select({ answers: gameSessions.answers })
        .from(gameSessions)
        .where(eq(gameSessions.roomCode, code));

      let totalAnswered = 0;
      let correctCount = 0;
      let wrongCount = 0;
      const optionCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

      sessions.forEach((s) => {
        const answers = (s.answers ?? []) as Array<{ questionId: string; answer: string; correct: boolean }>;
        const ans = answers.find((a) => a.questionId === qId);
        if (ans) {
          totalAnswered++;
          if (ans.correct) correctCount++;
          else wrongCount++;
          if (ans.answer) {
            optionCounts[ans.answer] = (optionCounts[ans.answer] || 0) + 1;
          }
        }
      });

      const percentCorrect = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      const percentWrong = totalAnswered > 0 ? 100 - percentCorrect : 0;

      roundStats = {
        totalAnswered,
        correctCount,
        wrongCount,
        percentCorrect,
        percentWrong,
        optionCounts,
      };
    }

    const state = {
      code: room.code,
      name: room.name || '',
      coverImage: room.coverImage || undefined,
      status: room.status,
      mode: room.mode,
      currentQuestionIndex: room.currentQuestionIndex,
      questionRevealed: room.questionRevealed,
      showRanking: room.showRanking,
      currentQuestion,
      settings: room.settings,
      studentsCount: (room.students as any[])?.length ?? 0,
      totalQuestions: room.questionIds?.length ?? 0,
      roundStats,
    };

    return NextResponse.json(state);
  } catch (e: any) {
    console.error('Error fetching room state:', e);
    return NextResponse.json({ error: 'Lỗi lấy thông tin phòng: ' + (e?.message || e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const code = params.code.toUpperCase().trim();
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    if (!room) return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 });

    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (role !== 'admin' && room.createdBy !== userId) {
      return NextResponse.json({ error: 'Không có quyền xóa phòng này' }, { status: 403 });
    }

    // Delete room & game sessions
    await db.delete(rooms).where(eq(rooms.code, code));
    await db.delete(gameSessions).where(eq(gameSessions.roomCode, code));
    await invalidateRoomCache(code);

    return NextResponse.json({ success: true, message: 'Đã xóa phòng thành công' });
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi xóa phòng: ' + e.message }, { status: 500 });
  }
}
