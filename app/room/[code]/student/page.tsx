'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
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
import { AudioToggle } from '@/components/shared/AudioToggle';
import { RoomMode, LeaderboardEntry } from '@/types';

interface AnswerResult {
  correct: boolean;
  points: number;
  correctAnswer: string;
  explanation?: string;
}

export default function StudentPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase().trim();

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
  const [totalScore, setTotalScore] = useState(0);
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [monitorEnabled, setMonitorEnabled] = useState(false);
  const questionStartTimeRef = useRef<number>(Date.now());

  const [finalLeaderboard, setFinalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const finalLeaderboardFetchedRef = useRef(false);
  const [rankingLeaderboard, setRankingLeaderboard] = useState<LeaderboardEntry[]>([]);
  const showRankingRef = useRef(false);

  const { roomState, loading } = useRoomPolling(joined ? code : '', 1500);
  const { leaderboard } = useLeaderboard(code);
  const { play, soundEnabled, setSoundEnabled, toggleSound } = useSound(true);

  // Fetch leaderboard khi showRanking = true (live ranking cho học sinh)
  useEffect(() => {
    if (roomState?.showRanking && code) {
      showRankingRef.current = true;
      let cancelled = false;
      const fetchRankingLB = () => {
        fetch(`/api/leaderboard/${code}`, { cache: 'no-store' })
          .then((r) => r.json())
          .then((data) => {
            if (cancelled) return;
            if (Array.isArray(data) && data.length > 0) {
              setRankingLeaderboard(data);
            }
          })
          .catch(() => {});
      };
      fetchRankingLB();
      const id = setInterval(fetchRankingLB, 1500);
      return () => {
        cancelled = true;
        clearInterval(id);
      };
    } else if (!roomState?.showRanking) {
      showRankingRef.current = false;
    }
  }, [roomState?.showRanking, code]);

  // When game finishes, fetch leaderboard directly to guarantee data
  useEffect(() => {
    if (roomState?.status === 'finished' && code) {
      let cancelled = false;
      const fetchFinal = () => {
        fetch(`/api/leaderboard/${code}`, { cache: 'no-store', credentials: 'include' })
          .then((res) => res.json())
          .then((data) => {
            if (cancelled) return;
            if (Array.isArray(data) && data.length > 0) {
              setFinalLeaderboard(data);
            }
          })
          .catch(() => {});
      };
      fetchFinal();
      const id = setInterval(fetchFinal, 1500);
      return () => {
        cancelled = true;
        clearInterval(id);
      };
    }
  }, [roomState?.status, code]);

  useEffect(() => {
    const savedId = localStorage.getItem(`sessionId_${code}`) || uuidv4();
    localStorage.setItem(`sessionId_${code}`, savedId);
    setSessionId(savedId);

    const savedName = localStorage.getItem(`studentName_${code}`);
    if (savedName) {
      setStudentName(savedName);
      doJoin(savedName, savedId);
    }
  }, [code]);

  // Reset selected answer & record start time when question changes
  const currentQId = (roomState?.currentQuestion as any)?.id || (roomState?.currentQuestion as any)?._id;
  useEffect(() => {
    setSelectedAnswer(undefined);
    setAnswerResult(null);
    questionStartTimeRef.current = Date.now();
  }, [currentQId, roomState?.currentQuestionIndex]);

  const doJoin = async (name: string, sid: string) => {
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
      const savedPref = localStorage.getItem('quiz_sound_enabled');
      if (savedPref !== null) {
        setSoundEnabled(savedPref === 'true');
      } else {
        setSoundEnabled(data.settings?.soundEnabled ?? true);
      }
      setMonitorEnabled(data.settings?.monitorTabSwitch ?? false);
      if (data.studentName) {
        setStudentName(data.studentName);
        localStorage.setItem(`studentName_${code}`, data.studentName);
      } else {
        localStorage.setItem(`studentName_${code}`, name);
      }
    } catch (err: any) {
      setJoinError(err.message || 'Không thể tham gia phòng');
    } finally {
      setJoining(false);
    }
  };

  const isMe = useCallback((entry: LeaderboardEntry) => {
    if (entry.sessionId && sessionId && entry.sessionId === sessionId) return true;
    if (entry.studentName && studentName) {
      return entry.studentName.trim().toLowerCase() === studentName.trim().toLowerCase();
    }
    return false;
  }, [sessionId, studentName]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim().length < 2) return;
    const activeSid = sessionId || localStorage.getItem(`sessionId_${code}`) || uuidv4();
    localStorage.setItem(`sessionId_${code}`, activeSid);
    setSessionId(activeSid);
    setStudentName(nameInput.trim());
    doJoin(nameInput.trim(), activeSid);
  };

  const handleAnswer = useCallback(async (answer: string) => {
    if (selectedAnswer || submitting || !roomState?.currentQuestion) return;
    setSelectedAnswer(answer);
    setSubmitting(true);
    play('tick');

    const timeSpent = Math.max(0.1, Number(((Date.now() - questionStartTimeRef.current) / 1000).toFixed(2)));
    const activeSid = sessionId || (typeof window !== 'undefined' ? localStorage.getItem(`sessionId_${code}`) : '') || '';

    try {
      const questionId = (roomState.currentQuestion as any).id || (roomState.currentQuestion as any)._id;
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          sessionId: activeSid,
          questionId,
          answer,
          timeSpent,
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
  }, [selectedAnswer, submitting, roomState, code, sessionId, tabSwitchCount, play]);

  const handleTabSwitch = useCallback((count: number) => {
    setTabSwitchCount(count);
  }, []);

  const handleDisqualify = useCallback(() => {
    setDisqualified(true);
    play('wrong');
  }, [play]);

  useTabMonitor({
    enabled: joined && !!roomState?.settings?.monitorTabSwitch,
    onSwitch: handleTabSwitch,
    onDisqualify: handleDisqualify,
    maxSwitches: roomState?.settings?.maxTabSwitches || 3,
    mode: roomMode,
  });

  // Name Input Screen
  if (!joined) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 max-w-sm w-full shadow-xl text-center">
          <div className="text-6xl mb-3">👋</div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">Nhập biệt danh</h1>
          <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">
            Phòng: <span className="text-brand-blue font-mono font-black">{code}</span>
          </p>

          <form onSubmit={handleNameSubmit} className="space-y-4">
            {joinError && (
              <div className="bg-red-50 border-2 border-red-200 text-brand-red text-sm font-bold p-3 rounded-2xl">
                {joinError}
              </div>
            )}

            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Tên của bạn..."
              maxLength={30}
              autoFocus
              className="w-full bg-slate-100 border-4 border-slate-200 focus:border-brand-blue rounded-2xl py-4 text-center text-2xl font-black text-slate-900 placeholder:text-slate-300 focus:outline-none transition-all"
            />

            <button
              type="submit"
              disabled={nameInput.trim().length < 2 || joining}
              className="btn-liquid w-full py-4 bg-brand-blue hover:bg-blue-600 text-white font-black text-xl rounded-2xl shadow-button-3d transition-all disabled:opacity-40"
            >
              {joining ? 'Đang vào...' : 'Sẵn sàng! 🚀'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Disqualified
  if (disqualified) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="text-8xl mb-4">🚫</div>
        <h1 className="text-3xl font-black text-brand-red mb-2">Bị loại khỏi trận đấu!</h1>
        <p className="text-slate-500 font-medium">Bạn đã chuyển tab {tabSwitchCount} lần vi phạm quy chế thi.</p>
      </div>
    );
  }

  // Waiting in Lobby
  if (roomState?.status === 'waiting') {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="text-8xl mb-4 animate-bounce">🕹️</div>
        <h1 className="text-3xl font-black text-slate-900 mb-1">Xin chào, {studentName}!</h1>
        <p className="text-slate-500 font-bold mb-6">Bạn đã vào phòng thành công. Nhìn lên bảng chờ giáo viên bắt đầu nhé!</p>

        <div className="bg-white border-2 border-slate-200 rounded-2xl px-6 py-3 shadow-sm flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono font-black text-brand-dark tracking-widest text-lg">Mã PIN: {code}</span>
        </div>

        {/* Audio Toggle in Lobby */}
        <AudioToggle soundEnabled={soundEnabled} onToggle={toggleSound} />
      </div>
    );
  }

  // Teacher paused -> attention banner
  if (roomState?.status === 'paused' && roomMode === 'learning') {
    return <AttentionBanner visible={true} />;
  }

  // Game Finished
  if (roomState?.status === 'finished') {
    // Prefer finalLeaderboard (direct fetch), fallback to hook leaderboard
    const displayLeaderboard = finalLeaderboard.length > 0 ? finalLeaderboard : leaderboard;
    const myRank = displayLeaderboard.find(isMe);
    const myScore = myRank ? Math.max(myRank.totalScore, totalScore) : totalScore;
    return (
      <div className="min-h-screen bg-brand-bg p-6 max-w-md mx-auto text-center">
        <div className="text-7xl mb-4">🏆</div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Trận đấu kết thúc!</h1>
        {myRank ? (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl mb-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Thành tích của bạn</span>
            <div className="text-5xl font-black text-brand-yellow mb-2">{myScore.toLocaleString()}</div>
            <p className="font-bold text-slate-700">Hạng #{myRank.rank} • Đúng {myRank.correctCount} câu</p>
          </div>
        ) : displayLeaderboard.length === 0 ? (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl mb-6 text-center">
            <span className="text-3xl block mb-2 animate-spin inline-block">⟳</span>
            <p className="text-slate-500 font-bold text-sm">Đang tải kết quả...</p>
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl mb-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Điểm số của bạn</span>
            <div className="text-5xl font-black text-brand-yellow mb-2">{totalScore.toLocaleString()}</div>
            <p className="font-bold text-slate-700">{studentName}</p>
          </div>
        )}
        <Leaderboard entries={displayLeaderboard} />

        {/* Audio Toggle in Finished */}
        <AudioToggle soundEnabled={soundEnabled} onToggle={toggleSound} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white select-none">
      {/* Top Bar for student */}
      <div className="bg-slate-800/80 backdrop-blur-md px-5 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="font-black text-sm truncate max-w-[120px]">{studentName}</div>
        <div className="text-brand-yellow font-black text-lg">{totalScore.toLocaleString()} pts</div>
        {roomMode === 'exam' && tabSwitchCount > 0 && (
          <div className="text-red-400 text-xs font-bold">⚠️ Tab: {tabSwitchCount}</div>
        )}
      </div>

      {/* Main Answer Area (Kahoot Style - 4 BIG Shapes) */}
      {!roomState?.questionRevealed && roomState?.currentQuestion && (
        <div className="flex-1 flex flex-col justify-center">
          {selectedAnswer ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-bounce-in">
              <span className="text-7xl mb-4">✋</span>
              <h2 className="text-3xl font-black mb-2">Đã chọn đáp án:</h2>
              <div className="inline-block bg-white text-slate-900 px-8 py-3 rounded-2xl text-4xl font-black shadow-2xl mb-4">
                {selectedAnswer}
              </div>
              <p className="text-slate-400 font-bold text-sm">Chờ giáo viên công bố kết quả nhé...</p>
            </div>
          ) : (
            <AnswerGrid
              question={roomState.currentQuestion}
              onAnswer={handleAnswer}
              disabled={!!selectedAnswer || submitting}
              selectedAnswer={selectedAnswer}
            />
          )}
        </div>
      )}

      {/* When Showing Ranking: Show my current standing + mini top 5 */}
      {roomState?.showRanking ? (
        <div className="flex-1 flex flex-col justify-start p-4 text-center">
          <span className="text-5xl mb-2">🏆</span>
          <h2 className="text-xl font-black text-brand-yellow mb-1">Bảng Xếp Hạng Vòng Này</h2>

          {/* My rank card */}
          {(() => {
            const activeList = rankingLeaderboard.length > 0 ? rankingLeaderboard : leaderboard;
            const myRank = activeList.find(isMe);
            const myScore = myRank ? Math.max(myRank.totalScore, totalScore) : totalScore;
            return (
              <div className="bg-slate-800 border-2 border-slate-700 rounded-3xl p-5 shadow-xl mb-3 max-w-sm mx-auto w-full">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Thứ hạng của bạn</span>
                <div
                  className={`text-5xl font-black mb-1 ${
                    myRank?.rank === 1
                      ? 'text-brand-yellow'
                      : myRank?.rank === 2
                      ? 'text-slate-300'
                      : myRank?.rank === 3
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}
                >
                  {myRank ? `#${myRank.rank}` : activeList.length === 0 ? '...' : '-'}
                </div>
                <div className="text-2xl font-black text-brand-yellow">{myScore.toLocaleString()} pts</div>
                <p className="text-slate-400 text-xs mt-1">
                  {myRank ? `Đúng ${myRank.correctCount} câu` : 'Đang tính toán thứ hạng...'}
                </p>
              </div>
            );
          })()}

          {/* Mini top 5 leaderboard */}
          {(() => {
            const activeList = rankingLeaderboard.length > 0 ? rankingLeaderboard : leaderboard;
            if (activeList.length === 0) return null;
            return (
              <div className="max-w-sm mx-auto w-full space-y-1.5 mb-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Top {Math.min(5, activeList.length)} lớp
                </p>
                {activeList.slice(0, 5).map((entry, idx) => (
                  <div
                    key={entry.sessionId || entry.studentName}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold border ${
                      isMe(entry)
                        ? 'bg-blue-600/40 border-blue-400 text-white ring-1 ring-blue-400'
                        : idx === 0
                        ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-200'
                        : 'bg-white/5 border-white/10 text-slate-200'
                    }`}
                  >
                    <span className="w-5 text-center font-mono">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${entry.rank}`}
                    </span>
                    <span className="flex-1 truncate text-left">{entry.studentName}</span>
                    <span className="font-mono text-brand-yellow shrink-0">{entry.totalScore.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          <p className="text-slate-500 text-xs font-bold">Nhìn lên màn chiếu để xem toàn lớp!</p>
        </div>
      ) : roomState?.questionRevealed ? (
        /* When Revealed: Instant feedback */
        <div className="flex-1 flex flex-col justify-center p-6 text-center">
          {answerResult ? (
            <ResultFeedback
              correct={answerResult.correct}
              points={answerResult.points}
              correctAnswer={answerResult.correctAnswer}
              explanation={answerResult.explanation}
            />
          ) : (
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700">
              <span className="text-6xl block mb-3">⏰</span>
              <h3 className="text-2xl font-black text-slate-300">Hết giờ!</h3>
              <p className="text-slate-400 text-sm mt-1">Bạn chưa kịp bấm câu trả lời này.</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Audio Toggle in Game */}
      <AudioToggle soundEnabled={soundEnabled} onToggle={toggleSound} />
    </div>
  );
}
