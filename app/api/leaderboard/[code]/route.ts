import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { LeaderboardEntry } from '@/types';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const code = params.code.toUpperCase().trim();
    const sessions = await db.select().from(gameSessions)
      .where(eq(gameSessions.roomCode, code));

    const activeSessions = sessions.filter((s) => !s.disqualified);

    // Compute metrics for each player
    const mapped = activeSessions.map((s) => {
      const answers = (s.answers ?? []) as Array<{
        questionId: string;
        answer: string;
        correct: boolean;
        timeSpent: number;
        points: number;
      }>;

      const correctCount = answers.filter((a) => a.correct).length;
      const totalTimeSpent = answers.reduce((acc, a) => acc + (Number(a.timeSpent) || 0), 0);

      return {
        studentName: s.studentName,
        totalScore: s.totalScore || 0,
        correctCount,
        totalTimeSpent: Number(totalTimeSpent.toFixed(2)),
        submittedAt: s.submittedAt ? new Date(s.submittedAt).getTime() : 0,
      };
    });

    // Sort: 1) totalScore DESC, 2) totalTimeSpent ASC (tie-break), 3) submittedAt ASC
    mapped.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      if (a.totalTimeSpent !== b.totalTimeSpent) {
        return a.totalTimeSpent - b.totalTimeSpent;
      }
      return a.submittedAt - b.submittedAt;
    });

    const leaderboard: LeaderboardEntry[] = mapped.map((item, index) => ({
      rank: index + 1,
      studentName: item.studentName,
      totalScore: item.totalScore,
      correctCount: item.correctCount,
      totalTimeSpent: item.totalTimeSpent,
    }));

    return NextResponse.json(leaderboard);
  } catch (e: any) {
    console.error('Leaderboard error:', e);
    return NextResponse.json({ error: 'Lỗi lấy bảng xếp hạng: ' + e.message }, { status: 500 });
  }
}
