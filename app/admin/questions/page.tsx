'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IQuestion } from '@/types';
import { QuestionEditor } from '@/components/admin/QuestionEditor';

const TYPE_ICONS: Record<string, string> = {
  multiple_choice: '🔤',
  true_false: '✅',
  matching: '🔗',
};
const TYPE_LABELS: Record<string, string> = {
  multiple_choice: 'Trắc nghiệm',
  true_false: 'Đúng/Sai',
  matching: 'Nối cột',
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', subject: '', search: '' });
  const [showEditor, setShowEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<IQuestion | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    if (filters.type) params.set('type', filters.type);
    if (filters.subject) params.set('subject', filters.subject);
    if (filters.search) params.set('search', filters.search);

    try {
      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleSave = async (data: Partial<IQuestion>) => {
    const url = editingQuestion ? `/api/questions/${editingQuestion._id}` : '/api/questions';
    const method = editingQuestion ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    setShowEditor(false);
    setEditingQuestion(null);
    fetchQuestions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa câu hỏi này?')) return;
    await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    fetchQuestions();
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white">📚 Ngân hàng câu hỏi</h1>
          <button
            onClick={() => { setEditingQuestion(null); setShowEditor(true); }}
            className="px-4 py-2 bg-electric-blue hover:bg-blue-400 text-white font-bold rounded-xl transition-colors"
          >
            + Thêm câu hỏi
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <input
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Tìm kiếm..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-electric-blue focus:outline-none text-sm"
          />
          <select
            value={filters.type}
            onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none text-sm"
          >
            <option value="">Tất cả loại</option>
            <option value="multiple_choice">Trắc nghiệm</option>
            <option value="true_false">Đúng/Sai</option>
            <option value="matching">Nối cột</option>
          </select>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Đang tải...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Chưa có câu hỏi nào</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Loại</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Nội dung</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Môn</th>
                  <th className="text-left px-4 py-3 text-gray-400 text-sm font-medium">Tags</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded bg-white/10 text-gray-300">
                        {TYPE_ICONS[q.type]} {TYPE_LABELS[q.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white text-sm max-w-xs truncate">{q.content}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{q.subject || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {q.tags?.slice(0, 2).map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setEditingQuestion(q); setShowEditor(true); }}
                          className="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/40"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(q._id)}
                          className="text-xs px-2 py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600/40"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-gray-400 text-sm">
          <span>Tổng: {total} câu hỏi</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40"
            >
              ← Trước
            </button>
            <span className="px-3 py-1">Trang {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40"
            >
              Sau →
            </button>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-white font-bold text-lg mb-4">
                {editingQuestion ? '✏️ Sửa câu hỏi' : '➕ Thêm câu hỏi'}
              </h2>
              <QuestionEditor
                initial={editingQuestion || undefined}
                onSave={handleSave}
                onCancel={() => { setShowEditor(false); setEditingQuestion(null); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
