'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useRoomPolling } from '@/hooks/useRoomPolling';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { ControlPanel } from '@/components/teacher/ControlPanel';
import { QuestionNav } from '@/components/teacher/QuestionNav';
import { LiveStats } from '@/components/teacher/LiveStats';
import { Leaderboard } from '@/components/shared/Leaderboard';
import { IQuestion } from '@/types';

export default function TeacherPage() {
  const params = useParams();
  const code = params.code as string;
  const [adminCode, setAdminCode] = useState('');
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [questions, setQuestions] = useState<Partial<IQuestion>[]>([]);
  const { roomState, loading, refresh } = useRoomPolling(code, 2000);
  const { leaderboard, refresh: refreshLB } = useLeaderboard(code);

  useEffect(() => {
    const saved = sessionStorage.getItem(`adminCode_${code}`);
    if (saved) setAdminCode(saved);
  }, [code]);

  const handleAdminCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Verify by trying an innocuous call
    const res = await fetch(`/api/room/${code}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminCode: adminCodeInput, action: 'resume' }),
    });
    // Even if resume fails on wrong room state, 403 = bad code
    if (res.status === 403) {
      setAuthError('Mã điều khiển không đúng');
      return;
    }
    sessionStorage.setItem(`adminCode_${code}`, adminCodeInput);
    setAdminCode(adminCodeInput);
    refresh();
  };

  const handleAction = useCallback(async (action: string) => {
    const res = await fetch(`/api/room/${code}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminCode, action }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Lỗi thực hiện action');
    }
    await refresh();
    if (action === 'reveal' || action === 'finish') refreshLB();
  }, [code, adminCode, refresh, refreshLB]);

  // Load all questions for the nav
  useEffect(() => {
    if (roomState && roomState.totalQuestions > 0) {
      setQuestions(Array.from({ length: roomState.totalQuestions }, (_, i) => ({
        _id: `q_${i}`,
        content: `Câu hỏi ${i + 1}`,
      })));
    }
  }, [roomState?.totalQuestions]);

  if (!adminCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 w-full max-w-sm">
          <h2 className="text-white font-bold text-xl mb-2 text-center">🔐 Xác thực giáo viên</h2>
          <p className="text-gray-400 text-sm text-center mb-6">
            Nhập mã điều khiển phòng <span className="text-electric-blue font-bold">{code.toUpperCase()}</span>
          </p>
          <form onSubmit={handleAdminCodeSubmit} className="space-y-4">
            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
            <input
              value={adminCodeInput}
              onChange={(e) => setAdminCodeInput(e.target.value.toUpperCase())}
              placeholder="XXXXXX"
              maxLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest focus:border-electric-blue focus:outline-none"
            />
            <button type="submit" className="w-full py-3 bg-electric-blue hover:bg-blue-400 text-white font-bold rounded-xl transition-colors">
              Xác nhận
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center text-electric-blue animate-pulse">
        Đang tải...
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        Phòng không tồn tại
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-black text-white">
            🎛️ Điều khiển phòng <span className="text-electric-blue">{code.toUpperCase()}</span>
          </h1>
          <div className="flex gap-2 text-sm">
            <a href={`/room/${code}/projector`} target="_blank" className="px-3 py-1 rounded bg-white/10 text-gray-300 hover:bg-white/20">
              📺 Máy chiếu
            </a>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Left: Question nav */}
          <div>
            <QuestionNav
              questions={questions}
              currentIndex={roomState.currentQuestionIndex}
            />
          </div>

          {/* Center: Current question + stats */}
          <div className="col-span-2 space-y-4">
            {roomState.currentQuestion && (
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm">
                    Câu {roomState.currentQuestionIndex + 1} / {roomState.totalQuestions}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${roomState.questionRevealed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {roomState.questionRevealed ? '✅ Đã công bố' : '⏳ Chờ công bố'}
                  </span>
                </div>
                <p className="text-white font-medium">{roomState.currentQuestion.content}</p>
                {roomState.currentQuestion.options && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {roomState.currentQuestion.options.map((opt) => (
                      <div
                        key={opt.key}
                        className={`p-2 rounded-lg text-sm ${
                          roomState.questionRevealed && opt.key === (roomState.currentQuestion as any).correctAnswer
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-white/5 text-gray-300'
                        }`}
                      >
                        <span className="font-bold mr-2">{opt.key}.</span>{opt.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <LiveStats
              stats={[]}
              totalStudents={roomState.studentsCount}
              answeredCount={0}
            />
          </div>

          {/* Right: Controls + leaderboard */}
          <div className="space-y-4">
            <ControlPanel
              roomState={roomState}
              roomCode={code.toUpperCase()}
              adminCode={adminCode}
              onAction={handleAction}
            />
            <div className="glass rounded-2xl p-4">
              <Leaderboard entries={leaderboard.slice(0, 5)} title="🏆 Top 5" animate={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
