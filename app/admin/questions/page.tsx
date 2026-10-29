'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { IQuestion } from '@/types';
import { QuestionEditor } from '@/components/admin/QuestionEditor';
import { QuestionFileImporter } from '@/components/admin/QuestionFileImporter';

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

function QuestionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const setId = searchParams.get('setId') || '';
  const action = searchParams.get('action') || '';

  const [setName, setSetName] = useState<string>('');
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', subject: '', search: '' });

  const [showEditor, setShowEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<IQuestion | null>(null);
  const [showImporter, setShowImporter] = useState(false);

  // Auto open editor if action=add
  useEffect(() => {
    if (action === 'add') {
      setShowEditor(true);
    }
  }, [action]);

  // Fetch set info if setId is provided
  useEffect(() => {
    if (setId) {
      (async () => {
        try {
          const res = await fetch(`/api/sets/${setId}`);
          if (res.ok) {
            const data = await res.json();
            setSetName(data.title || 'Bộ câu hỏi');
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [setId]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '30');
    if (setId) params.set('setId', setId);
    if (filters.type) params.set('type', filters.type);
    if (filters.subject) params.set('subject', filters.subject);
    if (filters.search) params.set('search', filters.search);

    try {
      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('Fetch questions error:', e);
    } finally {
      setLoading(false);
    }
  }, [page, filters, setId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSave = async (data: Partial<IQuestion>, keepOpen: boolean = false) => {
    const url = editingQuestion ? `/api/questions/${editingQuestion._id}` : '/api/questions';
    const method = editingQuestion ? 'PUT' : 'POST';

    const payload = {
      ...data,
      setId: setId || (data as any).setId || null,
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Lỗi khi lưu câu hỏi');
    }

    fetchQuestions();

    if (!keepOpen) {
      setShowEditor(false);
      setEditingQuestion(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchQuestions();
      } else {
        const err = await res.json();
        alert(err.error || 'Lỗi xóa câu hỏi');
      }
    } catch {
      alert('Không thể kết nối máy chủ');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Top Banner if inside a specific Set */}
      {setId && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/sets')}
              className="w-10 h-10 rounded-2xl bg-white border border-blue-200 text-brand-blue font-bold flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm"
              title="Quay lại danh sách bộ"
            >
              ←
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-2.5 py-0.5 rounded-full">
                  Bộ câu hỏi
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {total} câu hỏi trong bộ này
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                {setName || 'Đang tải tên bộ...'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowImporter(true)}
              className="btn-liquid bg-white hover:bg-slate-50 text-brand-blue border-2 border-brand-blue font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>📥</span> Nhập từ file TXT
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingQuestion(null);
                setShowEditor(true);
              }}
              className="btn-liquid bg-brand-red hover:bg-red-600 text-white font-black px-5 py-2.5 rounded-2xl shadow-button-3d text-xs flex items-center gap-1.5 transition-all"
            >
              <span>➕</span> Thêm câu hỏi
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      {!setId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span>📚</span> Ngân hàng câu hỏi
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Quản lý toàn bộ câu hỏi trắc nghiệm của hệ thống
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowImporter(true)}
              className="btn-liquid bg-white hover:bg-slate-50 text-brand-blue border-2 border-brand-blue font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>📥</span> Nhập từ file TXT
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingQuestion(null);
                setShowEditor(true);
              }}
              className="btn-liquid bg-brand-red hover:bg-red-600 text-white font-black px-6 py-3 rounded-2xl shadow-button-3d text-sm flex items-center gap-2 transition-all"
            >
              <span>➕</span> Thêm câu hỏi
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
        <input
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="🔍 Tìm kiếm nội dung câu hỏi..."
          className="bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-brand-blue focus:outline-none"
        />

        <input
          value={filters.subject}
          onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
          placeholder="🏷️ Lọc theo môn học..."
          className="bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-brand-blue focus:outline-none"
        />

        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
          className="bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:border-brand-blue focus:outline-none"
        >
          <option value="">Tất cả loại câu hỏi</option>
          <option value="multiple_choice">🔤 Trắc nghiệm</option>
          <option value="true_false">✅ Đúng / Sai</option>
          <option value="matching">🔗 Nối cột</option>
        </select>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold">
          Đang tải danh sách câu hỏi...
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-16 text-center shadow-sm">
          <span className="text-6xl block mb-3">📝</span>
          <h3 className="text-xl font-bold text-slate-800">Chưa có câu hỏi nào</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">
            {setId ? 'Bộ câu hỏi này hiện đang trống. Hãy thêm câu hỏi đầu tiên!' : 'Hãy bắt đầu tạo câu hỏi hoặc tải file mẫu để nhập hàng loạt.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowImporter(true)}
              className="px-5 py-2.5 rounded-2xl border-2 border-brand-blue text-brand-blue font-bold text-sm hover:bg-blue-50"
            >
              📥 Nhập từ file TXT
            </button>
            <button
              onClick={() => {
                setEditingQuestion(null);
                setShowEditor(true);
              }}
              className="btn-liquid bg-brand-red text-white font-black px-6 py-2.5 rounded-2xl shadow-button-3d text-sm"
            >
              ➕ Thêm câu hỏi ngay
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q: any, index) => (
            <div
              key={q.id || q._id}
              className="bg-white border-2 border-slate-200 hover:border-brand-blue rounded-3xl p-5 shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-7 h-7 rounded-full bg-slate-100 font-black text-xs text-slate-700 flex items-center justify-center">
                    {(page - 1) * 30 + index + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-brand-blue px-3 py-1 rounded-full">
                    {TYPE_ICONS[q.type] || '❓'} {TYPE_LABELS[q.type] || q.type}
                  </span>
                  {q.subject && (
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                      {q.subject}
                    </span>
                  )}
                  {q.grade && (
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                      Lớp {q.grade}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingQuestion(q);
                      setShowEditor(true);
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-brand-blue hover:bg-blue-50 text-xs font-bold transition-colors"
                    title="Chỉnh sửa"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(q.id || q._id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-brand-red hover:bg-red-50 text-xs font-bold transition-colors"
                    title="Xóa câu hỏi"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>

              {/* Question Content */}
              <h3 className="text-base font-black text-slate-900 mb-3 leading-snug">
                {q.content}
              </h3>

              {/* Options */}
              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {q.options.map((opt: any) => {
                    const isCorrect = opt.key === q.correctAnswer;
                    return (
                      <div
                        key={opt.key}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                          isCorrect
                            ? 'bg-green-50 border-green-300 text-green-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center ${
                            isCorrect ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {isCorrect && <span className="text-green-600 font-black">✓ Đúng</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.explanation && (
                <p className="mt-3 text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  💡 <strong>Giải thích:</strong> {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-between text-slate-500 text-xs font-bold">
        <span>Tổng số: {total} câu hỏi</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            ← Trước
          </button>
          <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700">
            Trang {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 30 >= total}
            className="px-4 py-2 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            Sau →
          </button>
        </div>
      </div>

      {/* Question Editor Modal (SOLID BACKGROUND) */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-slate-200"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {editingQuestion ? '✏️ Chỉnh sửa câu hỏi' : '➕ Thêm câu hỏi mới'}
                  </h2>
                  {setName && (
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      Đang thêm vào bộ: <span className="text-brand-blue">{setName}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowEditor(false);
                    setEditingQuestion(null);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              <QuestionEditor
                initial={editingQuestion || undefined}
                setId={setId || undefined}
                onSave={handleSave}
                onCancel={() => {
                  setShowEditor(false);
                  setEditingQuestion(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Importer Modal */}
      <AnimatePresence>
        {showImporter && (
          <QuestionFileImporter
            setId={setId || undefined}
            setName={setName || undefined}
            onImportSuccess={() => {
              setShowImporter(false);
              fetchQuestions();
            }}
            onClose={() => setShowImporter(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 font-bold">Đang tải...</div>}>
      <QuestionsContent />
    </Suspense>
  );
}
