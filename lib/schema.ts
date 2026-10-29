import {
  pgTable, text, integer, boolean, jsonb, timestamp, serial, index, uniqueIndex
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'teacher'] }).notNull().default('teacher'),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Bảng bộ câu hỏi (Question Sets)
export const questionSets = pgTable('question_sets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description').default(''),
  subject: text('subject').default(''),
  grade: integer('grade'),
  coverImage: text('cover_image'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('question_sets_created_by_idx').on(t.createdBy),
]);

export const questions = pgTable('questions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  setId: text('set_id').references(() => questionSets.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['multiple_choice', 'true_false', 'matching'] }).notNull(),
  subject: text('subject').default(''),
  grade: integer('grade'),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  options: jsonb('options').$type<Array<{ key: string; text: string; imageUrl?: string }>>().default([]),
  correctAnswer: text('correct_answer'),
  matchingPairs: jsonb('matching_pairs').$type<Array<{ left: string; right: string }>>(),
  explanation: text('explanation'),
  tags: text('tags').array().default([]),
  orderIndex: integer('order_index').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('questions_created_by_idx').on(t.createdBy),
  index('questions_set_id_idx').on(t.setId),
]);

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  setId: text('set_id').references(() => questionSets.id),
  questionIds: text('question_ids').array().default([]),
  mode: text('mode', { enum: ['learning', 'practice', 'exam'] }).notNull(),
  settings: jsonb('settings').$type<{
    timeLimit?: number;
    totalTime?: number;
    soundEnabled: boolean;
    skipEffects: boolean;
    monitorTabSwitch: boolean;
    maxTabSwitches: number;
  }>().notNull(),
  status: text('status', { enum: ['waiting', 'playing', 'paused', 'finished'] }).notNull().default('waiting'),
  currentQuestionIndex: integer('current_question_index').notNull().default(0),
  questionRevealed: boolean('question_revealed').notNull().default(false),
  students: jsonb('students').$type<Array<{ name: string; sessionId: string; joinedAt: string }>>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
}, (t) => [
  index('rooms_created_by_idx').on(t.createdBy),
  index('rooms_code_idx').on(t.code),
]);

export const gameSessions = pgTable('game_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomCode: text('room_code').notNull(),
  studentName: text('student_name').notNull(),
  sessionId: text('session_id').notNull(),
  answers: jsonb('answers').$type<Array<{
    questionId: string;
    answer: string;
    correct: boolean;
    timeSpent: number;
    points: number;
  }>>().default([]),
  totalScore: integer('total_score').notNull().default(0),
  tabSwitchCount: integer('tab_switch_count').notNull().default(0),
  disqualified: boolean('disqualified').notNull().default(false),
  disqualifiedReason: text('disqualified_reason'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('game_sessions_room_session_idx').on(t.roomCode, t.sessionId),
  index('game_sessions_room_code_idx').on(t.roomCode),
]);

export type User = typeof users.$inferSelect;
export type QuestionSet = typeof questionSets.$inferSelect;
export type NewQuestionSet = typeof questionSets.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type GameSession = typeof gameSessions.$inferSelect;
export type NewGameSession = typeof gameSessions.$inferInsert;
