'use client';

import { useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoomPolling } from '@/hooks/useRoomPolling';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { ControlPanel } from '@/components/teacher/ControlPanel';
import { LiveStats } from '@/components/teacher/LiveStats';
import { Leaderboard } from '@/components/shared/Leaderboard';

export default function TeacherPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const { roomState, loading, refresh } = useRoomPolling(code, 2000);
  const { leaderboard, refresh: refreshLB } = useLeaderboard(code);

  const handleAction = useCallback(async (action: string) => {
    try {
      const res = await fetch(`/api/room/${code}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Lỗi thực hiện');
        return;
      }

      await refresh();
      if (action === 'reveal' || action === 'finish') {
        refreshLB();
      }
    } catch {
      alert('Không thể kết nối máy chủ');
    }
  }, [code, refresh, refreshLB]);

  useEffect(() => {
    refreshLB();
  }, [refreshLB]);

  if (loading && !roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg font-black text-slate-400">
        <div className="flex items-center gap-3">
          <span className="animate-spin text-2xl">⟳</span> Đang tải bảng điều khiển...
        </div>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-brand-bg">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Không tìm thấy phòng chơi</h2>
        <p className="text-slate-500 mb-6 font-semibold">Phòng có thể đã bị xóa hoặc mã PIN không tồn tại.</p>
        <button
          onClick={() => router.push('/admin/rooms')}
          className="btn-liquid bg-brand-blue hover:bg-blue-600 text-white font-black px-6 py-3 rounded-2xl shadow-button-3d"
        >
          ← Quay lại Quản lý phòng
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1">
              Bảng điều khiển giáo viên
            </span>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black font-mono text-slate-900 tracking-wider">
                {code}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                roomState.status === 'playing'
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : roomState.status === 'finished'
                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                  : 'bg-blue-100 text-brand-blue border-blue-300'
              }`}>
                {roomState.status === 'playing' ? '🎮 Đang diễn ra' : roomState.status === 'finished' ? '🏁 Đã xong' : '⏳ Chờ bắt đầu'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <a
              href={`/room/${code}/projector`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-liquid bg-brand-blue hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-2xl shadow-button-3d text-sm text-center flex-1 sm:flex-initial"
            >
              📺 Màn hình máy chiếu
            </a>
            <button
              onClick={() => router.push('/admin/rooms')}
              className="text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-bold px-4 py-2.5 rounded-2xl transition-colors"
            >
              Quản lý phòng
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Question preview & control buttons */}
          <div className="lg:col-span-2 space-y-6">
            <ControlPanel
              roomState={roomState}
              roomCode={code}
              onAction={handleAction}
            />

            {roomState.currentQuestion ? (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-black text-slate-500">
                    Câu hỏi {roomState.currentQuestionIndex + 1} / {roomState.totalQuestions}
                  </span>
                  {roomState.questionRevealed ? (
                    <span className="text-xs font-black bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">
                      ✓ Đã công bố đáp án
                    </span>
                  ) : (
                    <span className="text-xs font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                      ⏳ Học sinh đang trả lời
                    </span>
                  )}
                </div>

                {roomState.currentQuestion.imageUrl && (
                  <div className="mb-4 rounded-2xl overflow-hidden max-h-64 flex justify-center bg-slate-50 border border-slate-200">
                    <img
                      src={roomState.currentQuestion.imageUrl}
                      alt="Hình ảnh minh họa"
                      className="max-h-64 object-contain rounded-2xl"
                    />
                  </div>
                )}

                <h3 className="text-xl font-black text-slate-800 leading-snug mb-4">
                  {roomState.currentQuestion.content}
                </h3>

                {roomState.currentQuestion.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {roomState.currentQuestion.options.map((opt) => {
                      const isCorrect = opt.key === (roomState.currentQuestion as any)?.correctAnswer;
                      return (
                        <div
                          key={opt.key}
                          className={`
                            p-4 rounded-2xl font-bold text-sm border-2 transition-all
                            ${roomState.questionRevealed && isCorrect
                              ? 'bg-green-50 border-green-500 text-green-900 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                            }
                          `}
                        >
                          <span className={`mr-2 font-black ${isCorrect && roomState.questionRevealed ? 'text-green-700' : 'text-slate-900'}`}>
                            {opt.key}.
                          </span>
                          {opt.text}
                          {roomState.questionRevealed && isCorrect && (
                            <span className="ml-2 text-green-600 font-black">✓ Đáp án đúng</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400 font-bold">
                {roomState.status === 'waiting'
                  ? 'Phòng đang ở chế độ chờ. Hãy bấm "Bắt đầu trận đấu" khi học sinh đã vào đủ.'
                  : roomState.status === 'finished'
                  ? 'Trận đấu đã kết thúc.'
                  : 'Không có câu hỏi nào đang hiển thị.'}
              </div>
            )}
          </div>

          {/* Right Col: Live Stats & Leaderboard */}
          <div className="space-y-6">
            <LiveStats
              stats={[]}
              totalStudents={roomState.studentsCount}
              answeredCount={0}
            />

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <Leaderboard entries={leaderboard.slice(0, 5)} title="Bảng xếp hạng trực tiếp" animate={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
