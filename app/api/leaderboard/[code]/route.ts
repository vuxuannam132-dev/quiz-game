import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { LeaderboardEntry } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const code = params.code.toUpperCase().trim();
    const sql = neon(process.env.DATABASE_URL!);


    // 1. Fetch room using raw SQL for maximum reliability
    const roomRows = await sql`
      SELECT code, status, students 
      FROM rooms 
      WHERE code = ${code} 
      LIMIT 1
    `;

    if (!roomRows || roomRows.length === 0) {
      return NextResponse.json({ error: 'Phòng không tồn tại' }, { status: 404 });
    }

    const room = roomRows[0];

    // 2. Fetch game sessions using raw SQL
    const sessions = await sql`
      SELECT student_name, session_id, total_score, answers, submitted_at, disqualified
      FROM game_sessions 
      WHERE room_code = ${code}
    `;

    // 3. Map existing sessions
    const playerMap = new Map<string, {
      studentName: string;
      totalScore: number;
      correctCount: number;
      totalTimeSpent: number;
      submittedAt: number;
      disqualified?: boolean;
    }>();

    for (const s of sessions) {
      let answers: Array<{
        questionId: string;
        answer: string;
        correct: boolean;
        timeSpent: number;
        points: number;
      }> = [];

      try {
        if (typeof s.answers === 'string') {
          answers = JSON.parse(s.answers);
        } else if (Array.isArray(s.answers)) {
          answers = s.answers;
        }
      } catch {
        answers = [];
      }

      const correctCount = answers.filter((a) => a && a.correct).length;
      const totalTimeSpent = answers.reduce((acc, a) => acc + (Number(a?.timeSpent) || 0), 0);
      const score = Number(s.total_score) || 0;
      const studentName = String(s.student_name || '').trim();

      if (!studentName) continue;

      const existing = playerMap.get(studentName);
      if (!existing || score > existing.totalScore) {
        playerMap.set(studentName, {
          studentName,
          totalScore: score,
          correctCount,
          totalTimeSpent: Number(totalTimeSpent.toFixed(2)),
          submittedAt: s.submitted_at ? new Date(s.submitted_at).getTime() : 0,
          disqualified: Boolean(s.disqualified),
        });
      }
    }

    // 4. Also include any students in room.students who may not have a session yet
    let studentsInRoom: Array<{ name?: string; sessionId?: string }> = [];
    try {
      if (typeof room.students === 'string') {
        studentsInRoom = JSON.parse(room.students);
      } else if (Array.isArray(room.students)) {
        studentsInRoom = room.students;
      }
    } catch {
      studentsInRoom = [];
    }

    for (const stu of studentsInRoom) {
      const name = String(stu?.name || '').trim();
      if (name && !playerMap.has(name)) {
        playerMap.set(name, {
          studentName: name,
          totalScore: 0,
          correctCount: 0,
          totalTimeSpent: 0,
          submittedAt: 0,
        });
      }
    }

    const mapped = Array.from(playerMap.values());

    // 5. Sort: 1) totalScore DESC, 2) totalTimeSpent ASC (tie-break), 3) submittedAt ASC
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

    return NextResponse.json(leaderboard, {
      headers: {
        'X-Leaderboard-Version': 'v3-no-cache',
        'X-Debug-Sessions-Count': String(sessions.length),
        'X-Debug-Timestamp': new Date().toISOString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      }
    });
  } catch (e: any) {
    console.error('Leaderboard error:', e);
    return NextResponse.json({ error: 'Lỗi lấy bảng xếp hạng: ' + e.message }, { status: 500 });
  }
}


