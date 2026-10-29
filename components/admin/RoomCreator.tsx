'use client';

import { useState, useEffect } from 'react';
import { RoomMode, CreateRoomResponse } from '@/types';

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
  const [questions, setQuestions] = useState<any[]>([]);
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
          fetch('/api/questions?limit=150'),
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

  const getQId = (q: any): string => q.id || q._id;

  // When a set is selected, automatically select all its questions
  const handleSelectSet = (setId: string) => {
    setSelectedSetId(setId);
    if (!setId) {
      setSelectedIds([]);
      return;
    }
    const setQuestions = questions.filter((q: any) => q.setId === setId || q.set_id === setId);
    if (setQuestions.length > 0) {
      setSelectedIds(setQuestions.map(getQId));
    } else {
      // If set has no direct mapped questions yet, pick all
      setSelectedIds(questions.map(getQId));
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
      setSelectedIds(questions.map(getQId));
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (selectedSetId) {
      // If a set is selected, show questions in this set
      const matchesSet = q.setId === selectedSetId || q.set_id === selectedSetId;
      if (!matchesSet) return false;
    }
    if (!search) return true;
    return (
      q.content.toLowerCase().includes(search.toLowerCase()) ||
      q.subject?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCreate = async () => {
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi để tạo phòng!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIds: selectedIds,
          setId: selectedSetId || null,
          mode,
          settings,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi tạo phòng');
      }

      onCreated(data);
    } catch (err: any) {
      alert(err.message || 'Không thể tạo phòng lúc này');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Questions Selection */}
      <div className="space-y-4">
        {/* Set selection */}
        {sets.length > 0 && (
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
              <span>📁</span> Chọn theo Bộ câu hỏi:
            </label>
            <select
              value={selectedSetId}
              onChange={(e) => handleSelectSet(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 font-semibold text-slate-800 focus:border-brand-blue focus:outline-none text-sm"
            >
              <option value="">-- Tất cả câu hỏi ({questions.length} câu) --</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.questionCount ?? 0} câu)
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
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-brand-blue focus:outline-none"
          />
        </div>

        {/* Individual Questions List Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-700">
            Danh sách câu hỏi ({selectedIds.length}/{filteredQuestions.length} đã chọn):
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-bold text-brand-blue hover:underline cursor-pointer"
          >
            {selectedIds.length === filteredQuestions.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
          </button>
        </div>

        {/* Question Items scroll area */}
        <div className="border-2 border-slate-200 rounded-2xl p-2 max-h-72 overflow-y-auto space-y-2 bg-slate-50">
          {fetching ? (
            <div className="text-center py-12 text-slate-400 font-bold text-xs">
              Đang tải danh sách câu hỏi...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-bold">
              Không có câu hỏi nào phù hợp
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const qId = getQId(q);
              const isChecked = selectedIds.includes(qId);
              return (
                <div
                  key={qId}
                  onClick={(e) => toggleQuestion(qId, e)}
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
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full font-bold">
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
          <label className="block text-xs font-black uppercase text-slate-700 mb-3">
            Chế độ chơi:
          </label>
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
              <label
                key={m.id}
                className={`
                  block p-4 rounded-2xl border-2 cursor-pointer transition-all
                  ${
                    mode === m.id
                      ? 'border-brand-red bg-red-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="roomMode"
                    value={m.id}
                    checked={mode === m.id}
                    onChange={(e) => setMode(e.target.value as RoomMode)}
                    className="accent-brand-red w-4 h-4"
                  />
                  <div>
                    <span className="font-black text-slate-900 text-sm">{m.title}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Time limit option */}
          <div className="mt-4 flex items-center justify-between p-3 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <span className="text-xs font-bold text-slate-700">⏱️ Thời gian mỗi câu:</span>
            <select
              value={settings.timeLimit}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, timeLimit: parseInt(e.target.value) }))
              }
              className="bg-white border-2 border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value={10}>10 giây</option>
              <option value={20}>20 giây</option>
              <option value={30}>30 giây</option>
              <option value={60}>60 giây</option>
              <option value={90}>90 giây</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-2xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-100 text-sm transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || selectedIds.length === 0}
            className="btn-liquid bg-brand-red hover:bg-red-600 disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-2xl shadow-button-3d text-sm transition-all flex items-center gap-2"
          >
            {loading ? (
              'Đang tạo...'
            ) : (
              <>
                <span>🚀</span> Tạo phòng ({selectedIds.length} câu)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
