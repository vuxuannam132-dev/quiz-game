# 🎮 Quiz Game Web System (Neon PostgreSQL + Next.js 14)

Hệ thống quiz tương tác cho lớp học, xây dựng bằng Next.js 14, Neon PostgreSQL và Drizzle ORM.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database**: **Neon PostgreSQL** (serverless) qua **Drizzle ORM**
- **Cache**: Upstash Redis (fallback in-memory khi dev)
- **Auth**: NextAuth.js v4 (credentials)
- **Styling**: Tailwind CSS + Framer Motion
- **Sound**: Howler.js
- **Deploy**: Vercel

## Khởi động nhanh (Localhost)

### 1. Lấy connection string Neon (miễn phí)
- Vào https://neon.tech → Tạo project mới (chọn region Singapore)
- Copy connection string dán vào `.env.local`:
  ```
  DATABASE_URL=postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
  ```

### 2. Tạo bảng và dữ liệu mẫu
```bash
npm run seed
```

### 3. Chạy dev server
```bash
npm run dev
```
Mở http://localhost:3000 — Đăng nhập admin: `admin@quiz.vn` / `admin123`

## Deploy lên Vercel

1. Push code lên GitHub:
   ```bash
   git init && git add . && git commit -m "init"
   git remote add origin <your-repo>
   git push -u origin main
   ```
2. Import project trên [Vercel](https://vercel.com)
3. Thêm biến môi trường:
   - `DATABASE_URL` (từ Neon)
   - `NEXTAUTH_SECRET` (chuỗi 32 ký tự ngẫu nhiên)
   - `NEXTAUTH_URL` (URL Vercel của bạn)
4. Deploy!

## Các chế độ phòng

- **Học tập (Learning)**: Không giới hạn thời gian, GV có thể tạm dừng để hiện banner "Chú ý lên bảng!"
- **Luyện tập (Practice)**: Không giới hạn thời gian, tùy chọn theo dõi tab
- **Thi cử (Exam)**: Đếm ngược từng câu, bắt buộc theo dõi chuyển tab, tự truất quyền sau số lần quy định
