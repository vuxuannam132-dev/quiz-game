'use client';

import { useState, useEffect } from 'react';
import { IQuestion, RoomMode, CreateRoomResponse } from '@/types';

interface RoomCreatorProps {
  onCreated: (result: CreateRoomResponse) => void;
  onCancel: () => void;
}

export function RoomCreator({ onCreated, onCancel }: RoomCreatorProps) {
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<RoomMode>('learning');
  const [settings, setSettings] = useState({
    timeLimit: 30,
    totalTime: 600,
    soundEnabled: true,
    skipEffects: false,
    monitorTabSwitch: false,
    maxTabSwitches: 3,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingQs, setFetchingQs] = useState(true);

  useEffect(() => {
    (async () => {
      setFetchingQs(true);
      try {
        const res = await fetch('/api/questions?limit=100');
        const data = await res.json();
        setQuestions(data.questions || []);
      } finally {
        setFetchingQs(false);
      }
    })();
  }, []);

  const toggleQuestion = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleCreate = async () => {
    if (selectedIds.length === 0) { alert('Vui lòng chọn ít nhất một câu hỏi'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIds: selectedIds,
          mode,
          settings: { ...settings, monitorTabSwitch: mode === 'exam' ? true : settings.monitorTabSwitch },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const TYPE_ICONS: Record<string, string> = { multiple_choice: '🔤', true_false: '✅', matching: '🔗' };
  const filteredQs = questions.filter(
    (q) => !search || q.content.toLowerCase().includes(search.toLowerCase()) || q.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (key: keyof typeof settings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: question bank */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm câu hỏi..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-electric-blue focus:outline-none text-sm"
          />
          <span className="text-gray-400 text-sm whitespace-nowrap">{selectedIds.length} đã chọn</span>
        </div>
        <div className="overflow-y-auto space-y-1 max-h-80">
          {fetchingQs ? (
            <div className="text-center text-gray-400 py-8 text-sm">Đang tải...</div>
          ) : filteredQs.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">Không có câu hỏi</div>
          ) : filteredQs.map((q) => {
            const selected = selectedIds.includes(q._id);
            return (
              <div
                key={q._id}
                onClick={() => toggleQuestion(q._id)}
                className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                  selected ? 'bg-electric-blue/20 border-electric-blue/40' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <input type="checkbox" checked={selected} readOnly className="mt-0.5 accent-blue-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-xs">{TYPE_ICONS[q.type]}</span>
                    {q.subject && <span className="text-xs text-gray-500 bg-white/5 px-1 rounded">{q.subject}</span>}
                  </div>
                  <p className="text-sm text-white truncate">{q.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: settings */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Chế độ phòng</label>
          <div className="space-y-2">
            {([
              { value: 'learning', label: '📚 Học tập', desc: 'Không giới hạn thời gian, có thể tạm dừng' },
              { value: 'practice', label: '✏️ Luyện tập', desc: 'Tùy chọn theo dõi chuyển tab' },
              { value: 'exam', label: '📝 Thi cử', desc: 'Đếm ngược, bắt buộc theo dõi tab' },
            ] as const).map((m) => (
              <div key={m.value} onClick={() => setMode(m.value)}
                className={`p-3 rounded-lg cursor-pointer border transition-colors ${mode === m.value ? 'bg-electric-blue/20 border-electric-blue/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <div className="font-medium text-white text-sm">{m.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {mode === 'exam' && (
            <>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-400">Thời gian / câu (giây)</label>
                <input type="number" value={settings.timeLimit} min={5} max={300}
                  onChange={(e) => setSettings((s) => ({ ...s, timeLimit: +e.target.value || 30 }))}
                  className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm text-right focus:outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-400">Chuyển tab tối đa</label>
                <input type="number" value={settings.maxTabSwitches} min={1} max={10}
                  onChange={(e) => setSettings((s) => ({ ...s, maxTabSwitches: +e.target.value || 3 }))}
                  className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm text-right focus:outline-none" />
              </div>
            </>
          )}
          {mode === 'practice' && (
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Theo dõi chuyển tab</label>
              <button onClick={() => toggle('monitorTabSwitch')}
                className={`relative w-10 h-6 rounded-full transition-colors ${settings.monitorTabSwitch ? 'bg-electric-blue' : 'bg-gray-600'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.monitorTabSwitch ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">Âm thanh</label>
            <button onClick={() => toggle('soundEnabled')}
              className={`relative w-10 h-6 rounded-full transition-colors ${settings.soundEnabled ? 'bg-electric-blue' : 'bg-gray-600'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.soundEnabled ? 'translate-x-4' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">Tắt hiệu ứng</label>
            <button onClick={() => toggle('skipEffects')}
              className={`relative w-10 h-6 rounded-full transition-colors ${settings.skipEffects ? 'bg-electric-blue' : 'bg-gray-600'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.skipEffects ? 'translate-x-4' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t border-white/10">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-white/20 text-gray-400 hover:text-white transition-colors text-sm">
            Hủy
          </button>
          <button onClick={handleCreate} disabled={loading || selectedIds.length === 0}
            className="flex-1 px-4 py-2 rounded-xl bg-electric-blue hover:bg-blue-400 text-white font-bold transition-colors disabled:opacity-50 text-sm">
            {loading ? '⟳ Đang tạo...' : `🎮 Tạo phòng (${selectedIds.length} câu)`}
          </button>
        </div>
      </div>
    </div>
  );
}
