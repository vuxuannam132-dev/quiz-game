import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/db';
import { questionSets, questions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const [set] = await db.select().from(questionSets).where(eq(questionSets.id, params.id)).limit(1);
    if (!set) return NextResponse.json({ error: 'Không tìm thấy bộ câu hỏi' }, { status: 404 });

    return NextResponse.json(set);
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi: ' + e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const userId = (session.user as any).id;
    const [set] = await db.select().from(questionSets).where(eq(questionSets.id, params.id)).limit(1);
    if (!set) return NextResponse.json({ error: 'Không tìm thấy bộ câu hỏi' }, { status: 404 });
    if (set.createdBy !== userId && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }

    const body = await req.json();
    const [updated] = await db.update(questionSets).set({
      title: body.title !== undefined ? body.title.trim() : set.title,
      description: body.description !== undefined ? body.description.trim() : set.description,
      subject: body.subject !== undefined ? body.subject.trim() : set.subject,
      grade: body.grade !== undefined ? (body.grade ? Number(body.grade) : null) : set.grade,
    }).where(eq(questionSets.id, params.id)).returning();

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi cập nhật: ' + e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const userId = (session.user as any).id;
    const [set] = await db.select().from(questionSets).where(eq(questionSets.id, params.id)).limit(1);
    if (!set) return NextResponse.json({ error: 'Không tìm thấy bộ câu hỏi' }, { status: 404 });
    if (set.createdBy !== userId && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }

    // Unlink questions or delete them
    await db.update(questions).set({ setId: null }).where(eq(questions.setId, params.id));
    await db.delete(questionSets).where(eq(questionSets.id, params.id));

    return NextResponse.json({ success: true, message: 'Đã xóa bộ câu hỏi' });
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi xóa bộ câu hỏi: ' + e.message }, { status: 500 });
  }
}
