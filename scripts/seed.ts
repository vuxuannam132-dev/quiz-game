import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../lib/schema';
import { users, questions } from '../lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

async function seed() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL không được cấu hình trong .env.local');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  const db = drizzle(sql, { schema });

  // Push schema (create tables if not exist)
  console.log('⏳ Đang tạo bảng...');
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'teacher',
      name TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      created_by TEXT NOT NULL,
      type TEXT NOT NULL,
      subject TEXT DEFAULT '',
      grade INTEGER,
      content TEXT NOT NULL,
      image_url TEXT,
      options JSONB DEFAULT '[]',
      correct_answer TEXT,
      matching_pairs JSONB,
      explanation TEXT,
      tags TEXT[] DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      admin_code TEXT NOT NULL UNIQUE,
      created_by TEXT NOT NULL,
      question_ids TEXT[] DEFAULT '{}',
      mode TEXT NOT NULL,
      settings JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting',
      current_question_index INTEGER NOT NULL DEFAULT 0,
      question_revealed BOOLEAN NOT NULL DEFAULT false,
      students JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      expires_at TIMESTAMP NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      room_code TEXT NOT NULL,
      student_name TEXT NOT NULL,
      session_id TEXT NOT NULL,
      answers JSONB DEFAULT '[]',
      total_score INTEGER NOT NULL DEFAULT 0,
      tab_switch_count INTEGER NOT NULL DEFAULT 0,
      disqualified BOOLEAN NOT NULL DEFAULT false,
      disqualified_reason TEXT,
      submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
      UNIQUE(room_code, session_id)
    )
  `;
  console.log('✅ Đã tạo bảng');

  // Admin user
  const [existing] = await db.select().from(users).where(eq(users.email, 'admin@quiz.vn')).limit(1);
  let adminId: string;
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    adminId = randomUUID();
    await db.insert(users).values({ id: adminId, email: 'admin@quiz.vn', passwordHash, role: 'admin', name: 'Quản trị viên' });
    console.log('✅ Tạo admin: admin@quiz.vn / admin123');
  } else {
    adminId = existing.id;
    console.log('ℹ️ Admin đã tồn tại');
  }

  // Sample questions
  const count = await sql`SELECT COUNT(*) FROM questions WHERE created_by = ${adminId}`;
  if (Number(count[0].count) >= 15) { console.log('ℹ️ Câu hỏi mẫu đã tồn tại'); return; }

  const sampleQuestions: schema.NewQuestion[] = [
    { id: randomUUID(), createdBy: adminId, type: 'multiple_choice', subject: 'Toán', grade: 10, content: 'Kết quả của 2 + 2 × 3 là?', options: [{ key: 'A', text: '8' }, { key: 'B', text: '12' }, { key: 'C', text: '10' }, { key: 'D', text: '6' }], correctAnswer: 'A', explanation: 'Nhân trước cộng sau: 2+(2×3)=8', tags: ['toán'] },
    { id: randomUUID(), createdBy: adminId, type: 'multiple_choice', subject: 'Lý', grade: 10, content: 'Đơn vị đo tốc độ trong hệ SI?', options: [{ key: 'A', text: 'km/h' }, { key: 'B', text: 'm/s' }, { key: 'C', text: 'mph' }, { key: 'D', text: 'cm/s' }], correctAnswer: 'B', explanation: 'Hệ SI dùng m/s', tags: ['vật lý'] },
    { id: randomUUID(), createdBy: adminId, type: 'multiple_choice', subject: 'Hóa', grade: 10, content: 'Nguyên tử khối của Oxy (O)?', options: [{ key: 'A', text: '14' }, { key: 'B', text: '16' }, { key: 'C', text: '18' }, { key: 'D', text: '12' }], correctAnswer: 'B', explanation: 'O có nguyên tử khối 16', tags: ['hóa học'] },
    { id: randomUUID(), createdBy: adminId, type: 'multiple_choice', subject: 'Văn', grade: 10, content: 'Tác giả của Truyện Kiều?', options: [{ key: 'A', text: 'Hồ Xuân Hương' }, { key: 'B', text: 'Nguyễn Du' }, { key: 'C', text: 'Nguyễn Trãi' }, { key: 'D', text: 'Đoàn Thị Điểm' }], correctAnswer: 'B', explanation: 'Nguyễn Du viết Truyện Kiều', tags: ['văn học'] },
    { id: randomUUID(), createdBy: adminId, type: 'multiple_choice', subject: 'Sử', grade: 10, content: 'Năm nào Việt Nam thống nhất?', options: [{ key: 'A', text: '1973' }, { key: 'B', text: '1976' }, { key: 'C', text: '1975' }, { key: 'D', text: '1954' }], correctAnswer: 'B', explanation: '2/7/1976 chính thức thống nhất', tags: ['lịch sử'] },
    { id: randomUUID(), createdBy: adminId, type: 'true_false', subject: 'Toán', grade: 9, content: 'Số Pi (π) là một số hữu tỉ', options: [{ key: 'A', text: 'Đúng' }, { key: 'B', text: 'Sai' }], correctAnswer: 'B', explanation: 'Pi là số vô tỉ', tags: ['toán'] },
    { id: randomUUID(), createdBy: adminId, type: 'true_false', subject: 'Lý', grade: 9, content: 'Ánh sáng truyền nhanh hơn âm thanh trong không khí', options: [{ key: 'A', text: 'Đúng' }, { key: 'B', text: 'Sai' }], correctAnswer: 'A', explanation: 'Ánh sáng ~300,000 km/s, âm thanh ~340 m/s', tags: ['vật lý'] },
    { id: randomUUID(), createdBy: adminId, type: 'true_false', subject: 'Sinh', grade: 9, content: 'DNA có cấu trúc xoắn kép phát hiện bởi Watson và Crick', options: [{ key: 'A', text: 'Đúng' }, { key: 'B', text: 'Sai' }], correctAnswer: 'A', explanation: 'Công bố năm 1953', tags: ['sinh học'] },
    { id: randomUUID(), createdBy: adminId, type: 'true_false', subject: 'Địa', grade: 9, content: 'Trái Đất là hành tinh lớn nhất Hệ Mặt Trời', options: [{ key: 'A', text: 'Đúng' }, { key: 'B', text: 'Sai' }], correctAnswer: 'B', explanation: 'Sao Mộc lớn nhất', tags: ['địa lý'] },
    { id: randomUUID(), createdBy: adminId, type: 'true_false', subject: 'Hóa', grade: 9, content: 'Nước (H₂O) tạo từ 2 nguyên tố H và O', options: [{ key: 'A', text: 'Đúng' }, { key: 'B', text: 'Sai' }], correctAnswer: 'A', explanation: '2H + O = H₂O', tags: ['hóa học'] },
    { id: randomUUID(), createdBy: adminId, type: 'matching', subject: 'Địa', grade: 10, content: 'Nối quốc gia với thủ đô', matchingPairs: [{ left: 'Việt Nam', right: 'Hà Nội' }, { left: 'Pháp', right: 'Paris' }, { left: 'Nhật Bản', right: 'Tokyo' }, { left: 'Anh', right: 'London' }], tags: ['địa lý'] },
    { id: randomUUID(), createdBy: adminId, type: 'matching', subject: 'Khoa học', grade: 10, content: 'Nối công thức với tên gọi', matchingPairs: [{ left: 'a²+b²=c²', right: 'Pythagoras' }, { left: 'F=ma', right: 'Newton II' }, { left: 'E=mc²', right: 'Einstein' }], tags: ['toán', 'lý'] },
    { id: randomUUID(), createdBy: adminId, type: 'matching', subject: 'Văn', grade: 10, content: 'Nối tác phẩm với tác giả', matchingPairs: [{ left: 'Truyện Kiều', right: 'Nguyễn Du' }, { left: 'Bình Ngô đại cáo', right: 'Nguyễn Trãi' }, { left: 'Nhật ký trong tù', right: 'Hồ Chí Minh' }], tags: ['văn học'] },
    { id: randomUUID(), createdBy: adminId, type: 'matching', subject: 'Hóa', grade: 10, content: 'Nối ký hiệu với tên nguyên tố', matchingPairs: [{ left: 'Fe', right: 'Sắt' }, { left: 'Au', right: 'Vàng' }, { left: 'Cu', right: 'Đồng' }, { left: 'Ag', right: 'Bạc' }], tags: ['hóa học'] },
    { id: randomUUID(), createdBy: adminId, type: 'matching', subject: 'Sử', grade: 10, content: 'Nối sự kiện với năm', matchingPairs: [{ left: 'Chiến thắng Điện Biên Phủ', right: '1954' }, { left: 'Giải phóng miền Nam', right: '1975' }, { left: 'Cách mạng tháng Tám', right: '1945' }], tags: ['lịch sử'] },
  ];

  await db.insert(questions).values(sampleQuestions);
  console.log(`✅ Đã tạo ${sampleQuestions.length} câu hỏi mẫu`);
  console.log('\n📋 Đăng nhập: admin@quiz.vn / admin123');
}

seed().catch((e) => { console.error('❌ Lỗi seed:', e); process.exit(1); });
