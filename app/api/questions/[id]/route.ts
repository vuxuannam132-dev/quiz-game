import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/db';
import { questions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const [q] = await db.select().from(questions).where(eq(questions.id, params.id)).limit(1);
    if (!q) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (role !== 'admin' && q.createdBy !== userId) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });

    const body = await req.json();
    const [updated] = await db.update(questions).set({
      type: body.type, subject: body.subject, grade: body.grade,
      content: body.content, imageUrl: body.imageUrl,
      options: body.options, correctAnswer: body.correctAnswer,
      matchingPairs: body.matchingPairs, explanation: body.explanation,
      tags: typeof body.tags === 'string' ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : (body.tags ?? q.tags),
    }).where(eq(questions.id, params.id)).returning();

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi cập nhật: ' + e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const [q] = await db.select().from(questions).where(eq(questions.id, params.id)).limit(1);
    if (!q) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (role !== 'admin' && q.createdBy !== userId) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });

    await db.delete(questions).where(eq(questions.id, params.id));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi xóa: ' + e.message }, { status: 500 });
  }
}
