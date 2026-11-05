import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rooms, gameSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { LeaderboardEntry } from '@/types';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const code = params.code.toUpperCase().trim();
    console.log('[LEADERBOARD DEBUG] code:', code);
    console.log('[LEADERBOARD DEBUG] DATABASE_URL prefix:', process.env.DATABASE_URL?.slice(0, 60));

    const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    console.log('[LEADERBOARD DEBUG] room found:', !!room, 'status:', room?.status);
    console.log('[LEADERBOARD DEBUG] room.students:', JSON.stringify(room?.students));

    if (!room) return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 });

    let sessions: any[] = [];
    try {
      sessions = await db.select().from(gameSessions).where(eq(gameSessions.roomCode, code));
      console.log('[LEADERBOARD DEBUG] sessions count:', sessions.length);
      console.log('[LEADERBOARD DEBUG] sessions data:', JSON.stringify(sessions.map(s => ({ studentName: s.studentName, totalScore: s.totalScore, roomCode: s.roomCode }))));
    } catch (sessionErr: any) {
      console.error('[LEADERBOARD DEBUG] sessions query THREW:', sessionErr?.message);
    }

    // Map existing sessions
    const playerMap = new Map<string, {
      studentName: string;
      totalScore: number;
      correctCount: number;
      totalTimeSpent: number;
      submittedAt: number;
      disqualified?: boolean;
    }>();

    sessions.forEach((s) => {
      const answers = (s.answers ?? []) as Array<{
        questionId: string;
        answer: string;
        correct: boolean;
        timeSpent: number;
        points: number;
      }>;

      const correctCount = answers.filter((a) => a.correct).length;
      const totalTimeSpent = answers.reduce((acc, a) => acc + (Number(a.timeSpent) || 0), 0);
      const score = Number(s.totalScore) || 0;

      const existing = playerMap.get(s.studentName);
      if (!existing || score > existing.totalScore) {
        playerMap.set(s.studentName, {
          studentName: s.studentName,
          totalScore: score,
          correctCount,
          totalTimeSpent: Number(totalTimeSpent.toFixed(2)),
          submittedAt: s.submittedAt ? new Date(s.submittedAt).getTime() : 0,
          disqualified: s.disqualified,
        });
      }
    });

    // Also include any students in room.students who may not have a session yet
    const studentsInRoom = (room?.students ?? []) as Array<{ name: string; sessionId: string }>;
    console.log('[LEADERBOARD DEBUG] studentsInRoom count:', studentsInRoom.length);
    studentsInRoom.forEach((stu) => {
      if (stu.name && !playerMap.has(stu.name)) {
        playerMap.set(stu.name, {
          studentName: stu.name,
          totalScore: 0,
          correctCount: 0,
          totalTimeSpent: 0,
          submittedAt: 0,
        });
      }
    });

    const mapped = Array.from(playerMap.values());
    console.log('[LEADERBOARD DEBUG] playerMap size:', playerMap.size, 'mapped:', mapped.length);

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

    console.log('[LEADERBOARD DEBUG] returning leaderboard size:', leaderboard.length);
    return NextResponse.json(leaderboard);
  } catch (e: any) {
    console.error('[LEADERBOARD DEBUG] CAUGHT ERROR:', e?.message, e?.stack);
    return NextResponse.json({ error: 'Lỗi lấy bảng xếp hạng: ' + e.message }, { status: 500 });
  }
}
