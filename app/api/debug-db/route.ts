import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(req: NextRequest) {
  try {
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    // Mask the password
    const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':***@');
    
    // Try raw SQL query
    const sql = neon(process.env.DATABASE_URL!);
    
    const rooms = await sql`SELECT code, status FROM rooms WHERE code = 'ZEYA8J' LIMIT 1`;
    const sessions = await sql`SELECT student_name, total_score FROM game_sessions WHERE room_code = 'ZEYA8J'`;
    
    return NextResponse.json({
      dbUrl: maskedUrl,
      roomFound: rooms.length > 0,
      roomStatus: rooms[0]?.status,
      sessionCount: sessions.length,
      sessions: sessions,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (e: any) {
    return NextResponse.json({ 
      error: e.message,
      stack: e.stack,
      dbUrl: (process.env.DATABASE_URL || 'NOT SET').replace(/:([^@]+)@/, ':***@'),
    }, { status: 500 });
  }
}
