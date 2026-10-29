import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameSessions } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const code = params.code.toUpperCase();
    const sessions = await db.select().from(gameSessions)
      .where(eq(gameSessions.roomCode, code))
      .orderBy(desc(gameSessions.totalScore))
      .limit(10);

    const leaderboard = sessions
      .filter((s) => !s.disqualified)
      .map((s, i: number) => ({
        rank: i + 1,
        studentName: s.studentName,
        totalScore: s.totalScore,
        correctCount: ((s.answers ?? []) as Array<{ correct: boolean }>).filter((a) => a.correct).length,
      }));

    return NextResponse.json(leaderboard);
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi bảng xếp hạng' }, { status: 500 });
  }
}
