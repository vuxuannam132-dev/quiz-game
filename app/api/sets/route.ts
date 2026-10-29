import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/db';
import { questionSets, questions } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const userId = (session.user as any).id;
    const sets = await db.select().from(questionSets)
      .where(eq(questionSets.createdBy, userId))
      .orderBy(desc(questionSets.createdAt));

    // Get question count for each set
    const setsWithCounts = await Promise.all(
      sets.map(async (s) => {
        const [cnt] = await db.select({ count: sql<number>`count(*)` })
          .from(questions)
          .where(eq(questions.setId, s.id));
        return {
          ...s,
          questionCount: Number(cnt?.count ?? 0),
        };
      })
    );

    return NextResponse.json({ sets: setsWithCounts });
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi lấy bộ câu hỏi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const body = await req.json();
    const { title, description, subject, grade, coverImage } = body;
    if (!title?.trim()) return NextResponse.json({ error: 'Vui lòng nhập tên bộ câu hỏi' }, { status: 400 });

    const [newSet] = await db.insert(questionSets).values({
      id: randomUUID(),
      createdBy: (session.user as any).id,
      title: title.trim(),
      description: description?.trim() ?? '',
      subject: subject?.trim() ?? '',
      grade: grade ? Number(grade) : null,
      coverImage: coverImage ?? null,
    }).returning();

    return NextResponse.json(newSet, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi tạo bộ câu hỏi: ' + e.message }, { status: 500 });
  }
}
