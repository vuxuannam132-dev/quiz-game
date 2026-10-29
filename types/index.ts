// Types for Quiz Game — Neon PostgreSQL + Drizzle ORM version
export type UserRole = 'admin' | 'teacher';
export type QuestionType = 'multiple_choice' | 'true_false' | 'matching';
export type RoomMode = 'learning' | 'practice' | 'exam';
export type RoomStatus = 'waiting' | 'playing' | 'paused' | 'finished';

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  createdAt: Date;
}

export interface IQuestionOption {
  key: string;
  text: string;
  imageUrl?: string;
}

export interface IMatchingPair {
  left: string;
  right: string;
}

export interface IQuestion {
  _id: string;
  createdBy: string | IUser;
  type: QuestionType;
  subject: string;
  grade: number;
  content: string;
  imageUrl?: string;
  options: IQuestionOption[];
  correctAnswer?: string;
  matchingPairs?: IMatchingPair[];
  explanation?: string;
  tags: string[];
  createdAt: Date;
}

export interface IRoomSettings {
  timeLimit?: number;
  totalTime?: number;
  soundEnabled: boolean;
  skipEffects: boolean;
  monitorTabSwitch: boolean;
  maxTabSwitches: number;
}

export interface IRoomStudent {
  name: string;
  sessionId: string;
  joinedAt: Date;
}

export interface IRoom {
  _id: string;
  code: string;
  adminCode: string;
  createdBy: string | IUser;
  questionIds: string[] | IQuestion[];
  mode: RoomMode;
  settings: IRoomSettings;
  status: RoomStatus;
  currentQuestionIndex: number;
  questionRevealed: boolean;
  students: IRoomStudent[];
  createdAt: Date;
  expiresAt: Date;
}

export interface IAnswerRecord {
  questionId: string;
  answer: string;
  correct: boolean;
  timeSpent: number;
  points: number;
}

export interface IGameSession {
  _id: string;
  roomCode: string;
  studentName: string;
  sessionId: string;
  answers: IAnswerRecord[];
  totalScore: number;
  tabSwitchCount: number;
  disqualified: boolean;
  disqualifiedReason?: string;
  submittedAt: Date;
}

// API Response types
export interface RoomStateResponse {
  status: RoomStatus;
  mode: RoomMode;
  currentQuestionIndex: number;
  questionRevealed: boolean;
  currentQuestion: Partial<IQuestion> | null;
  settings: IRoomSettings;
  studentsCount: number;
  totalQuestions: number;
}

export interface AnswerResponse {
  correct: boolean;
  points: number;
  correctAnswer: string;
  explanation?: string;
}

export interface LeaderboardEntry {
  rank: number;
  studentName: string;
  totalScore: number;
  correctCount: number;
}

export interface CreateRoomResponse {
  code: string;
  adminCode: string;
}

export interface JoinRoomResponse {
  success: boolean;
  mode: RoomMode;
  settings: IRoomSettings;
  studentName: string;
}

// Component prop types
export interface TimerProps {
  timeLimit: number;
  onTimeUp: () => void;
  isRunning: boolean;
}

export interface LeaderboardProps {
  entries: LeaderboardEntry[];
  animate?: boolean;
}

export interface QuestionDisplayProps {
  question: Partial<IQuestion>;
  revealed: boolean;
  selectedAnswer?: string;
}

// Hook return types
export interface UseRoomPollingReturn {
  roomState: RoomStateResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseSoundReturn {
  play: (sound: SoundType) => void;
  stop: (sound?: SoundType) => void;
}

export type SoundType = 'correct' | 'wrong' | 'countdown' | 'reveal' | 'finish' | 'tick';

export interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export interface UseTabMonitorOptions {
  enabled: boolean;
  onSwitch: (count: number) => void;
  onDisqualify?: () => void;
  maxSwitches?: number;
  mode: RoomMode;
}
