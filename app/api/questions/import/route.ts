import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { db } from '@/lib/db';
import { questions } from '@/lib/schema';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const userId = (session.user as any).id;
    const body = await req.json();
    const { setId, questions: items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Không có câu hỏi nào để nhập' }, { status: 400 });
    }

    const validQuestions = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.content || !item.content.trim()) continue;

      const opts = Array.isArray(item.options) && item.options.length > 0
        ? item.options
        : [
            { key: 'A', text: '' },
            { key: 'B', text: '' },
            { key: 'C', text: '' },
            { key: 'D', text: '' },
          ];

      validQuestions.push({
        id: randomUUID(),
        createdBy: userId,
        setId: setId || null,
        type: (item.type || 'multiple_choice') as any,
        subject: item.subject ?? '',
        grade: item.grade ? Number(item.grade) : null,
        content: item.content.trim(),
        imageUrl: item.imageUrl ?? null,
        options: opts,
        correctAnswer: (item.correctAnswer || 'A').toUpperCase().trim(),
        matchingPairs: item.matchingPairs ?? null,
        explanation: item.explanation ?? null,
        tags: Array.isArray(item.tags) ? item.tags : [],
      });
    }

    if (validQuestions.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy câu hỏi hợp lệ' }, { status: 400 });
    }

    // Insert batch into Neon DB
    const inserted = await db.insert(questions).values(validQuestions).returning({ id: questions.id });

    return NextResponse.json({
      success: true,
      count: inserted.length,
      message: `Đã nhập thành công ${inserted.length} câu hỏi!`,
    }, { status: 201 });
  } catch (e: any) {
    console.error('Import questions error:', e);
    return NextResponse.json({ error: 'Lỗi nhập câu hỏi: ' + e.message }, { status: 500 });
  }
}
