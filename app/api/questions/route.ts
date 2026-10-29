import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/db';
import { questions } from '@/lib/schema';
import { eq, ilike, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    const setId = sp.get('setId');
    const type = sp.get('type');
    const subject = sp.get('subject');
    const search = sp.get('search');
    const page = parseInt(sp.get('page') ?? '1');
    const limit = parseInt(sp.get('limit') ?? '100');

    const conditions = [];
    if (setId) conditions.push(eq(questions.setId, setId));
    if (type) conditions.push(eq(questions.type, type as any));
    if (subject) conditions.push(ilike(questions.subject, `%${subject}%`));
    if (search) conditions.push(ilike(questions.content, `%${search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(questions).where(where);
    const rows = await db.select().from(questions).where(where)
      .orderBy(questions.createdAt)
      .limit(limit).offset((page - 1) * limit);

    // Normalize _id for full backwards compatibility
    const normalized = rows.map((r) => ({
      ...r,
      _id: r.id,
    }));

    return NextResponse.json({ 
      questions: normalized, 
      total: Number(count), 
      page, 
      totalPages: Math.ceil(Number(count) / limit) 
    });
  } catch (e: any) {
    console.error('Get questions error:', e);
    return NextResponse.json({ error: 'Lỗi lấy câu hỏi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const body = await req.json();
    const { 
      setId, 
      type, 
      subject, 
      grade, 
      content, 
      imageUrl, 
      options, 
      correctAnswer, 
      matchingPairs, 
      explanation, 
      tags 
    } = body;

    if (!type || !content) {
      return NextResponse.json({ error: 'Thiếu loại hoặc nội dung câu hỏi' }, { status: 400 });
    }

    const [q] = await db.insert(questions).values({
      id: randomUUID(),
      createdBy: (session.user as any).id,
      setId: setId || null,
      type, 
      subject: subject ?? '', 
      grade: grade ? Number(grade) : null,
      content: content.trim(), 
      imageUrl: imageUrl ?? null,
      options: options ?? [],
      correctAnswer: correctAnswer ?? null,
      matchingPairs: matchingPairs ?? null,
      explanation: explanation ?? null,
      tags: typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : (tags ?? []),
    }).returning();

    return NextResponse.json({ ...q, _id: q.id }, { status: 201 });
  } catch (e: any) {
    console.error('Create question error:', e);
    return NextResponse.json({ error: 'Lỗi tạo câu hỏi: ' + e.message }, { status: 500 });
  }
}
