'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoomPolling } from '@/hooks/useRoomPolling';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { ControlPanel } from '@/components/teacher/ControlPanel';
import { Leaderboard } from '@/components/shared/Leaderboard';
import { ProjectorView } from '@/components/projector/ProjectorView';

export default function TeacherPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const { roomState, loading, refresh } = useRoomPolling(code, 1500);
  const { leaderboard, refresh: refreshLB } = useLeaderboard(code);

  const [projectorWindow, setProjectorWindow] = useState<Window | null>(null);

  const handleAction = useCallback(async (action: string) => {
    try {
      const res = await fetch(`/api/room/${code}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Lỗi thực hiện tác vụ');
        return;
      }

      await refresh();
      if (action === 'reveal' || action === 'finish' || action === 'show_ranking' || action === 'ranking' || action === 'next') {
        refreshLB();
      }
    } catch {
      alert('Không thể kết nối máy chủ');
    }
  }, [code, refresh, refreshLB]);

  useEffect(() => {
    refreshLB();
  }, [refreshLB]);

  // Open dedicated Projector window for dual-monitor / projector display
  const openExternalProjector = () => {
    const url = `/room/${code}/projector`;
    const win = window.open(
      url,
      `Projector_${code}`,
      'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
    if (win) {
      win.focus();
      setProjectorWindow(win);
    } else {
      alert('Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép popup để mở màn hình máy chiếu.');
    }
  };

  if (loading && !roomState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg font-black text-slate-400">
        <div className="flex items-center gap-3">
          <span className="animate-spin text-2xl">⟳</span> Đang tải phòng điều khiển Studio...
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

  const currentQ = roomState.currentQuestion;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Studio Bar */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                {roomState.name ? `Studio • ${roomState.name}` : 'Phòng thi đấu Studio'}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black font-mono text-slate-900 tracking-wider">
                  {code}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                  roomState.status === 'playing'
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : roomState.status === 'finished'
                    ? 'bg-slate-100 text-slate-600 border-slate-300'
                    : 'bg-blue-100 text-brand-blue border-blue-300'
                }`}>
                  {roomState.status === 'playing' ? '🎮 Đang chơi' : roomState.status === 'finished' ? '🏁 Đã xong' : '⏳ Chờ bắt đầu'}
                </span>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 hidden md:inline">
                  {roomState.mode === 'exam' ? '🏆 Thi đấu Kahoot' : roomState.mode === 'practice' ? '⚡ Luyện tập' : '📚 Học tập'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={openExternalProjector}
              className="btn-liquid bg-brand-blue hover:bg-blue-600 text-white font-black px-5 py-2.5 rounded-2xl shadow-button-3d text-xs sm:text-sm flex items-center gap-2 transition-all"
              title="Mở cửa sổ chiếu phụ để kéo sang máy chiếu hoặc màn hình phụ"
            >
              <span>📺</span> Mở màn chiếu ngoài
            </button>

            <button
              onClick={() => router.push('/admin/rooms')}
              className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-xs font-bold px-4 py-2.5 rounded-2xl transition-colors"
            >
              Quản lý phòng
            </button>
          </div>
        </div>

        {/* 2-Column Unified Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 7 COLS: MINI PROJECTOR LIVE MONITOR */}
          <div className="lg:col-span-7 space-y-4">
            {/* Monitor Card */}
            <div className="bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-2xl border-4 border-slate-800">
              {/* Monitor Titlebar */}
              <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-red-400">
                    🔴 Live Preview - Màn chiếu học sinh
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">
                    {roomState.studentsCount} bạn trực tuyến
                  </span>
                  <button
                    onClick={openExternalProjector}
                    className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                    title="Mở tab riêng"
                  >
                    ↗
                  </button>
                </div>
              </div>

              {/* Live Projector Screen Aspect Ratio Box */}
              <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-700 bg-brand-bg shadow-inner relative flex flex-col">
                <ProjectorView
                  roomState={roomState}
                  code={code}
                  leaderboard={leaderboard}
                  isMiniPreview={true}
                />
              </div>

              {/* Monitor caption note */}
              <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
                💡 <em>Học sinh trong lớp chỉ nhìn thấy những gì đang hiển thị trên khung màn chiếu này.</em>
              </p>
            </div>

            {/* Secret Teacher Cheat-Sheet / Correct Answer Indicator */}
            {currentQ && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Thông tin câu hỏi hiện tại (Dành riêng cho giáo viên)
                  </span>
                  {roomState.questionRevealed ? (
                    <span className="text-xs font-black bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200">
                      ✓ Đã công bố
                    </span>
                  ) : (
                    <span className="text-xs font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
                      ⏳ Đang làm bài
                    </span>
                  )}
                </div>

                <div className="p-3 bg-green-50 rounded-2xl border border-green-200 mb-3">
                  <span className="text-xs font-bold text-green-800 uppercase block mb-0.5">
                    Đáp án đúng:
                  </span>
                  <p className="text-base font-black text-green-900">
                    ⭐ {currentQ.correctAnswer}: {
                      currentQ.options?.find((o) => o.key === currentQ.correctAnswer)?.text || currentQ.correctAnswer
                    }
                  </p>
                </div>

                {currentQ.explanation && (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                    💡 <strong>Ghi chú giải thích:</strong> {currentQ.explanation}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* RIGHT 5 COLS: CONTROLS & LEADERBOARD */}
          <div className="lg:col-span-5 space-y-6">
            {/* Control Panel */}
            <ControlPanel
              roomState={roomState}
              roomCode={code}
              onAction={handleAction}
            />

            {/* Live Leaderboard */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <Leaderboard
                entries={leaderboard.slice(0, 5)}
                title="Bảng xếp hạng trực tiếp"
                animate={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
