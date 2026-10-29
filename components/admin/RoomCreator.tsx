'use client';

import { useState, useEffect } from 'react';
import { IQuestion, RoomMode, CreateRoomResponse } from '@/types';

interface RoomCreatorProps {
  onCreated: (result: CreateRoomResponse) => void;
  onCancel: () => void;
}

interface QuestionSet {
  id: string;
  title: string;
  subject?: string;
  questionCount?: number;
}

export function RoomCreator({ onCreated, onCancel }: RoomCreatorProps) {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState<string>('');
  const [mode, setMode] = useState<RoomMode>('learning');
  const [settings, setSettings] = useState({
    timeLimit: 30,
    soundEnabled: true,
    skipEffects: false,
    monitorTabSwitch: false,
    maxTabSwitches: 3,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Load question sets & questions
  useEffect(() => {
    (async () => {
      setFetching(true);
      try {
        const [resSets, resQs] = await Promise.all([
          fetch('/api/sets'),
          fetch('/api/questions?limit=100'),
        ]);
        if (resSets.ok) {
          const data = await resSets.json();
          setSets(data.sets || []);
        }
        if (resQs.ok) {
          const data = await resQs.json();
          setQuestions(data.questions || []);
        }
      } catch (err) {
        console.error('Error fetching sets or questions:', err);
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  // When a set is selected, automatically select all its questions
  const handleSelectSet = (setId: string) => {
    setSelectedSetId(setId);
    if (!setId) {
      setSelectedIds([]);
      return;
    }
    const setQuestions = questions.filter((q: any) => q.setId === setId);
    if (setQuestions.length > 0) {
      setSelectedIds(setQuestions.map((q) => q._id));
    } else {
      // If set has no direct mapped questions yet, pick all
      setSelectedIds(questions.map((q) => q._id));
    }
  };

  // Toggle individual question cleanly using explicit ID
  const toggleQuestion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q._id));
    }
  };

  const filteredQuestions = questions.filter(
    (q) =>
      !search ||
      q.content.toLowerCase().includes(search.toLowerCase()) ||
      q.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIds: selectedIds,
          setId: selectedSetId || undefined,
          mode,
          settings: {
            ...settings,
            monitorTabSwitch: mode === 'exam' ? true : settings.monitorTabSwitch,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data);
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo phòng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-800">
      {/* Left: Question selection */}
      <div className="flex flex-col gap-4">
        {/* Choose Set */}
        {sets.length > 0 && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              📂 Chọn theo Bộ câu hỏi:
            </label>
            <select
              value={selectedSetId}
              onChange={(e) => handleSelectSet(e.target.value)}
              className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-800 focus:border-brand-blue focus:outline-none"
            >
              <option value="">-- Tự chọn câu hỏi lẻ --</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.questionCount || 0} câu)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search bar */}
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Tìm kiếm câu hỏi..."
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-brand-blue focus:outline-none"
          />
        </div>

        {/* Individual Questions List Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700">
            Danh sách câu hỏi ({selectedIds.length}/{questions.length} đã chọn):
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-bold text-brand-blue hover:underline cursor-pointer"
          >
            {selectedIds.length === questions.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
          </button>
        </div>

        {/* Questions list */}
        <div className="overflow-y-auto space-y-2 max-h-80 pr-1">
          {fetching ? (
            <div className="text-center py-8 text-slate-400">Đang tải câu hỏi...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              {questions.length === 0
                ? 'Chưa có câu hỏi nào trong ngân hàng'
                : 'Không tìm thấy câu hỏi phù hợp'}
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isChecked = selectedIds.includes(q._id);
              return (
                <div
                  key={q._id}
                  onClick={(e) => toggleQuestion(q._id, e)}
                  className={`
                    flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all
                    ${
                      isChecked
                        ? 'bg-blue-50 border-brand-blue shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-5 h-5 accent-brand-blue rounded-md pointer-events-none"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-800 truncate">{q.content}</p>
                    <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                      {q.subject && (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                          {q.subject}
                        </span>
                      )}
                      <span className="capitalize">{q.type}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Room Settings */}
      <div className="space-y-6 flex flex-col justify-between">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-3">Chế độ chơi:</label>
          <div className="space-y-3">
            {[
              {
                id: 'learning',
                title: '📚 Học tập',
                desc: 'Không giới hạn thời gian, giáo viên kiểm soát từng câu',
              },
              {
                id: 'practice',
                title: '⚡ Luyện tập',
                desc: 'Làm bài tự do, thi đấu vui vẻ',
              },
              {
                id: 'exam',
                title: '🏆 Thi đấu (Kahoot)',
                desc: 'Đếm ngược tính điểm theo tốc độ trả lời',
              },
            ].map((m) => (
              <div
                key={m.id}
                onClick={() => setMode(m.id as RoomMode)}
                className={`
                  p-4 rounded-2xl border-2 cursor-pointer transition-all
                  ${
                    mode === m.id
                      ? 'bg-red-50 border-brand-red shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }
                `}
              >
                <div className="font-black text-slate-800">{m.title}</div>
                <div className="text-xs text-slate-500 mt-1">{m.desc}</div>
              </div>
            ))}
          </div>

          {/* Time limit option for Exam */}
          {mode === 'exam' && (
            <div className="mt-4 flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-sm font-bold text-slate-700">⏱ Thời gian mỗi câu:</span>
              <select
                value={settings.timeLimit}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, timeLimit: Number(e.target.value) }))
                }
                className="bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800"
              >
                <option value={10}>10 giây</option>
                <option value={20}>20 giây</option>
                <option value={30}>30 giây</option>
                <option value={60}>60 giây</option>
              </select>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || selectedIds.length === 0}
            className="flex-2 py-3 px-6 rounded-2xl bg-brand-red hover:bg-red-600 text-white font-black shadow-button-3d transition-all disabled:opacity-50"
          >
            {loading ? 'Đang tạo...' : `🚀 Tạo phòng (${selectedIds.length} câu)`}
          </button>
        </div>
      </div>
    </div>
  );
}
