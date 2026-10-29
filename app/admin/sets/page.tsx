'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionFileImporter } from '@/components/admin/QuestionFileImporter';

interface QuestionSet {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  grade?: number;
  questionCount?: number;
  createdAt: string;
}

export default function QuestionSetsPage() {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // File import for a specific set
  const [importingSet, setImportingSet] = useState<QuestionSet | null>(null);

  const fetchSets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sets');
      if (res.ok) {
        const data = await res.json();
        setSets(data.sets || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          subject: subject.trim(),
          grade: grade ? Number(grade) : undefined,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle('');
        setDescription('');
        setSubject('');
        setGrade('');
        fetchSets();
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi tạo bộ câu hỏi');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSet = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bộ "${name}" không? Các câu hỏi trong bộ này sẽ được giữ lại trong ngân hàng câu hỏi chung.`)) return;

    try {
      const res = await fetch(`/api/sets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSets();
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi xóa bộ câu hỏi');
      }
    } catch {
      alert('Không thể kết nối máy chủ');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>📚</span> Bộ câu hỏi của bạn
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tổ chức câu hỏi theo từng bài học hoặc chủ đề thi đấu
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-liquid bg-brand-red hover:bg-red-600 text-white font-black px-6 py-3 rounded-2xl shadow-button-3d flex items-center gap-2 self-start sm:self-auto transition-all"
        >
          <span>＋</span> Tạo bộ mới
        </button>
      </div>

      {/* Grid of Sets */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold">
          Đang tải danh sách bộ câu hỏi...
        </div>
      ) : sets.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-16 text-center shadow-sm">
          <span className="text-6xl block mb-3">📁</span>
          <h3 className="text-xl font-bold text-slate-800">Chưa có bộ câu hỏi nào</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">
            Hãy tạo bộ câu hỏi đầu tiên để dễ dàng phân loại và quản lý phòng thi!
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-liquid bg-brand-red text-white font-black px-6 py-2.5 rounded-2xl shadow-button-3d text-sm"
          >
            + Tạo bộ ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map((s) => (
            <div
              key={s.id}
              className="bg-white border-2 border-slate-200 hover:border-brand-blue rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-brand-blue px-3 py-1 rounded-full">
                    {s.subject || 'Chung'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-brand-red bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                      {s.questionCount ?? 0} câu
                    </span>
                    <button
                      onClick={() => handleDeleteSet(s.id, s.title)}
                      className="p-1 text-slate-400 hover:text-brand-red text-xs transition-colors"
                      title="Xóa bộ câu hỏi"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">
                  {s.title}
                </h3>

                {s.description ? (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {s.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mb-4">
                    Không có mô tả
                  </p>
                )}
              </div>

              {/* Action buttons inside card */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`/admin/questions?setId=${s.id}&action=add`}
                    className="btn-liquid bg-blue-50 hover:bg-blue-100 text-brand-blue font-bold px-3 py-2 rounded-xl text-xs text-center flex items-center justify-center gap-1 transition-all"
                  >
                    <span>➕</span> Thêm câu
                  </a>
                  <button
                    type="button"
                    onClick={() => setImportingSet(s)}
                    className="btn-liquid bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1 border border-slate-200 transition-all"
                  >
                    <span>📥</span> Nhập file
                  </button>
                </div>

                <a
                  href={`/admin/questions?setId=${s.id}`}
                  className="w-full py-2 text-center text-xs font-black text-brand-blue hover:bg-blue-50/50 rounded-xl transition-colors block"
                >
                  Xem danh sách câu hỏi ({s.questionCount ?? 0}) →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal create set */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-slate-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-slate-900">➕ Tạo bộ câu hỏi mới</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên bộ câu hỏi <span className="text-brand-red">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Kiểm tra Toán 10 - Chương 1"
                    required
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-brand-blue rounded-2xl px-4 py-3 font-semibold text-slate-800 focus:outline-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Môn học
                    </label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Toán, Lý, Sinh..."
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-brand-blue rounded-2xl px-4 py-2.5 font-semibold text-slate-800 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Khối lớp
                    </label>
                    <input
                      type="number"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      placeholder="Lớp 1 - 12"
                      min="1"
                      max="12"
                      className="w-full bg-slate-50 border-2 border-slate-200 focus:border-brand-blue rounded-2xl px-4 py-2.5 font-semibold text-slate-800 focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mô tả bộ câu hỏi
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ghi chú nội dung trọng tâm bài học..."
                    rows={3}
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-brand-blue rounded-2xl p-3 font-semibold text-slate-800 focus:outline-none text-sm resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-2xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-100 text-sm transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-liquid bg-brand-red hover:bg-red-600 text-white font-black px-6 py-2.5 rounded-2xl shadow-button-3d text-sm transition-all"
                  >
                    {submitting ? 'Đang tạo...' : 'Tạo bộ câu hỏi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Importer Modal */}
      <AnimatePresence>
        {importingSet && (
          <QuestionFileImporter
            setId={importingSet.id}
            setName={importingSet.title}
            onImportSuccess={() => {
              setImportingSet(null);
              fetchSets();
            }}
            onClose={() => setImportingSet(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
