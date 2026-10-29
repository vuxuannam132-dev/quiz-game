import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { uploadToImgBB } from '@/lib/imgbb';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('image') as File;
    if (!file) return NextResponse.json({ error: 'Vui lòng chọn ảnh' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File phải là ảnh' }, { status: 400 });
    if (file.size > 32 * 1024 * 1024) return NextResponse.json({ error: 'Ảnh tối đa 32MB' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToImgBB(buffer, file.name);
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: 'Lỗi upload: ' + e.message }, { status: 500 });
  }
}
