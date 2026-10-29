'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomPolling } from '@/hooks/useRoomPolling';
import { useTabMonitor } from '@/hooks/useTabMonitor';
import { useSound } from '@/hooks/useSound';
import { AnswerGrid } from '@/components/student/AnswerGrid';
import { WaitingScreen } from '@/components/student/WaitingScreen';
import { AttentionBanner } from '@/components/student/AttentionBanner';
import { ResultFeedback } from '@/components/student/ResultFeedback';
import { Timer } from '@/components/shared/Timer';
import { Leaderboard } from '@/components/shared/Leaderboard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { RoomMode } from '@/types';

interface AnswerResult {
  correct: boolean;
  points: number;
  correctAnswer: string;
  explanation?: string;
}

export default function StudentPage() {
  const params = useParams();
  const code = params.code as string;
  const [studentName, setStudentName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [joined, setJoined] = useState(false);
  const [roomMode, setRoomMode] = useState<RoomMode>('learning');
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>();
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [disqualified, setDisqualified] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalScore, setTotalScore] = useState(0);
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const { roomState, loading } = useRoomPolling(joined ? code : '', 2000);
  const { leaderboard } = useLeaderboard(code);
  const { play } = useSound(soundEnabled);

  const handleJoin = useCallback(async (name: string, sid: string) => {
    setJoining(true);
    setJoinError('');
    try {
      const res = await fetch(`/api/room/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: name, sessionId: sid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJoined(true);
      setRoomMode(data.mode);
      setSoundEnabled(data.settings?.soundEnabled ?? true);
      localStorage.setItem(`studentName_${code}`, name);
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setJoining(false);
    }
  }, [code]);

  useEffect(() => {
    const savedName = localStorage.getItem(`studentName_${code}`);
    const savedId = localStorage.getItem(`sessionId_${code}`) || uuidv4();
    localStorage.setItem(`sessionId_${code}`, savedId);
    setSessionId(savedId);
    if (savedName) {
      setStudentName(savedName);
      handleJoin(savedName, savedId);
    }
  }, [code, handleJoin]);

  // Reset answer when question changes
  const currentQId = (roomState?.currentQuestion as any)?._id;
  useEffect(() => {
    setSelectedAnswer(undefined);
    setAnswerResult(null);
  }, [currentQId, roomState?.currentQuestionIndex]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim().length < 2) return;
    setStudentName(nameInput.trim());
    handleJoin(nameInput.trim(), sessionId);
  };

  const handleAnswer = async (answer: string) => {
    if (selectedAnswer || submitting || !roomState?.currentQuestion) return;
    setSelectedAnswer(answer);
    setSubmitting(true);
    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          sessionId,
          questionId: (roomState.currentQuestion as any)._id,
          answer,
          timeSpent: 0,
          tabSwitchCount,
        }),
      });
      const data = await res.json();
      if (res.ok && !data.alreadyAnswered) {
        setAnswerResult(data);
        if (data.correct) {
          play('correct');
          setTotalScore((s) => s + (data.points || 0));
        } else {
          play('wrong');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabSwitch = useCallback((count: number) => {
    setTabSwitchCount(count);
  }, []);

  const handleDisqualify = useCallback(() => {
    setDisqualified(true);
    play('wrong');
  }, [play]);

  useTabMonitor({
    enabled: joined && (roomMode === 'exam' || (roomMode === 'practice' && roomState?.settings?.monitorTabSwitch === true)),
    onSwitch: handleTabSwitch,
    onDisqualify: handleDisqualify,
    maxSwitches: roomState?.settings?.maxTabSwitches || 3,
    mode: roomMode,
  });

  // Name entry screen
  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎮</div>
            <h1 className="text-2xl font-black text-white">Tham gia phòng</h1>
            <p className="text-electric-blue font-bold text-xl tracking-widest mt-1">{code.toUpperCase()}</p>
          </div>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            {joinError && <p className="text-red-400 text-sm text-center">{joinError}</p>}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tên của bạn</label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Nhập tên..."
                maxLength={50}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-center text-lg focus:border-electric-blue focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={nameInput.trim().length < 2 || joining}
              className="w-full py-3 bg-electric-blue hover:bg-blue-400 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {joining ? '⟳ Đang tham gia...' : '🚀 Tham gia'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Disqualified
  if (disqualified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-6">
        <div className="text-8xl">🚫</div>
        <h1 className="text-3xl font-black text-red-400">Bị loại!</h1>
        <p className="text-gray-400">Bạn đã chuyển tab quá nhiều lần ({tabSwitchCount} lần).</p>
        <p className="text-gray-500 text-sm">Liên hệ giáo viên để được hỗ trợ.</p>
      </div>
    );
  }

  if (loading && !roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center text-electric-blue animate-pulse">
        Đang kết nối...
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        Không thể kết nối phòng
      </div>
    );
  }

  // Attention banner (learning mode paused)
  if (roomState.status === 'paused' && roomMode === 'learning') {
    return <AttentionBanner visible={true} />;
  }

  // Waiting
  if (roomState.status === 'waiting') {
    return (
      <WaitingScreen
        studentName={studentName}
        studentsCount={roomState.studentsCount}
        roomCode={code.toUpperCase()}
      />
    );
  }

  // Finished
  if (roomState.status === 'finished') {
    const myEntry = leaderboard.find((e) => e.studentName === studentName);
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-6xl mb-4">🏁</div>
          <h1 className="text-3xl font-black text-white mb-2">Kết thúc!</h1>
          {myEntry && (
            <div className="glass rounded-2xl p-6 mb-6">
              <p className="text-gray-400 text-sm mb-1">Điểm của bạn</p>
              <p className="text-5xl font-black text-yellow-400">{myEntry.totalScore.toLocaleString()}</p>
              <p className="text-gray-400 mt-2">Xếp hạng #{myEntry.rank} • {myEntry.correctCount} câu đúng</p>
            </div>
          )}
          <Leaderboard entries={leaderboard} />
        </div>
      </div>
    );
  }

  // Playing
  const showRevealResult = roomState.questionRevealed && (answerResult || selectedAnswer);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f0f23' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="text-white font-bold text-sm">{studentName}</div>
        <div className="text-yellow-400 font-bold">{totalScore.toLocaleString()} điểm</div>
        {roomMode === 'exam' && tabSwitchCount > 0 && (
          <div className="text-red-400 text-xs">⚠️ Tab: {tabSwitchCount}</div>
        )}
      </div>

      {/* Question content */}
      {roomState.currentQuestion && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">
              Câu {roomState.currentQuestionIndex + 1}/{roomState.totalQuestions}
            </span>
            {roomMode === 'exam' && roomState.settings?.timeLimit && !selectedAnswer && (
              <Timer
                timeLimit={roomState.settings.timeLimit}
                onTimeUp={() => handleAnswer('__timeout__')}
                isRunning={roomState.status === 'playing' && !selectedAnswer}
              />
            )}
          </div>

          {/* Question text */}
          <div className="glass rounded-2xl p-4 mb-4">
            {roomState.currentQuestion.imageUrl && (
              <img
                src={roomState.currentQuestion.imageUrl}
                alt="Question image"
                className="w-full max-h-48 object-contain rounded-lg mb-3"
              />
            )}
            <p className="text-white text-lg font-medium leading-relaxed">
              {roomState.currentQuestion.content}
            </p>
          </div>

          {/* Answer area */}
          <AnimatePresence mode="wait">
            {showRevealResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <ResultFeedback
                  correct={answerResult?.correct ?? false}
                  points={answerResult?.points ?? 0}
                  correctAnswer={answerResult?.correctAnswer ?? ''}
                  explanation={answerResult?.explanation}
                />
              </motion.div>
            ) : (
              <motion.div key="answers" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AnswerGrid
                  question={roomState.currentQuestion}
                  selectedAnswer={selectedAnswer}
                  onAnswer={handleAnswer}
                  disabled={!!selectedAnswer || submitting || roomState.status !== 'playing'}
                />
                {selectedAnswer && !answerResult && (
                  <div className="text-center mt-4 text-gray-400 text-sm animate-pulse">
                    ✅ Đã nộp bài, chờ công bố đáp án...
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Paused state */}
      {roomState.status === 'paused' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">⏸️</div>
            <h2 className="text-2xl font-black text-white">Tạm dừng</h2>
            <p className="text-gray-400 mt-2">Chờ giáo viên tiếp tục...</p>
          </div>
        </div>
      )}
    </div>
  );
}
