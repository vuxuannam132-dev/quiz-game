'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IQuestion, QuestionType, IQuestionOption, IMatchingPair } from '@/types';
import { ImageUploader } from './ImageUploader';

interface QuestionEditorProps {
  initial?: Partial<IQuestion>;
  setId?: string;
  onSave: (data: Partial<IQuestion>, keepOpen?: boolean) => Promise<void>;
  onCancel: () => void;
}

const defaultOptions: IQuestionOption[] = [
  { key: 'A', text: '' },
  { key: 'B', text: '' },
  { key: 'C', text: '' },
  { key: 'D', text: '' },
];

const KAHOOT_OPTION_COLORS = [
  { key: 'A', border: 'border-brand-red', bg: 'bg-red-50', badge: 'bg-brand-red text-white' },
  { key: 'B', border: 'border-brand-blue', bg: 'bg-blue-50', badge: 'bg-brand-blue text-white' },
  { key: 'C', border: 'border-brand-yellow', bg: 'bg-amber-50', badge: 'bg-brand-yellow text-slate-900' },
  { key: 'D', border: 'border-brand-green', bg: 'bg-green-50', badge: 'bg-brand-green text-white' },
];

export function QuestionEditor({ initial, setId, onSave, onCancel }: QuestionEditorProps) {
  const [type, setType] = useState<QuestionType>(initial?.type || 'multiple_choice');
  const [content, setContent] = useState(initial?.content || '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
  const [subject, setSubject] = useState(initial?.subject || '');
  const [grade, setGrade] = useState(initial?.grade?.toString() || '');
  const [options, setOptions] = useState<IQuestionOption[]>(
    initial?.options || defaultOptions
  );
  const [correctAnswer, setCorrectAnswer] = useState(initial?.correctAnswer || 'A');
  const [matchingPairs, setMatchingPairs] = useState<IMatchingPair[]>(
    initial?.matchingPairs || [{ left: '', right: '' }, { left: '', right: '' }]
  );
  const [explanation, setExplanation] = useState(initial?.explanation || '');
  const [tags, setTags] = useState(initial?.tags?.join(', ') || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);

  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!content.trim()) newErrors.content = 'Vui lòng nhập nội dung câu hỏi';
    if (type === 'multiple_choice') {
      options.forEach((opt, i) => {
        if (!opt.text.trim()) newErrors[`option_${i}`] = `Vui lòng nhập lựa chọn ${opt.key}`;
      });
      if (!correctAnswer) newErrors.correctAnswer = 'Vui lòng chọn đáp án đúng';
    }
    if (type === 'true_false') {
      if (!correctAnswer) newErrors.correctAnswer = 'Vui lòng chọn đáp án';
    }
    if (type === 'matching') {
      matchingPairs.forEach((pair, i) => {
        if (!pair.left.trim()) newErrors[`pair_left_${i}`] = `Thiếu vế trái cặp ${i + 1}`;
        if (!pair.right.trim()) newErrors[`pair_right_${i}`] = `Thiếu vế phải cặp ${i + 1}`;
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const executeSave = async (keepAdding: boolean) => {
    if (!validate()) return;
    setLoading(true);
    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const data: Partial<IQuestion> = {
        setId: setId || (initial as any)?.setId || undefined,
        type,
        content: content.trim(),
        imageUrl: imageUrl || undefined,
        subject: subject.trim() || undefined,
        grade: grade ? parseInt(grade) : undefined,
        explanation: explanation.trim() || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      };

      if (type === 'multiple_choice') {
        data.options = options.map((opt) => ({
          key: opt.key,
          text: opt.text.trim(),
        }));
        data.correctAnswer = correctAnswer;
      } else if (type === 'true_false') {
        data.options = [
          { key: 'T', text: 'Đúng' },
          { key: 'F', text: 'Sai' },
        ];
        data.correctAnswer = correctAnswer;
      } else if (type === 'matching') {
        data.matchingPairs = matchingPairs.map((p) => ({
          left: p.left.trim(),
          right: p.right.trim(),
        }));
      }

      await onSave(data, keepAdding);

      if (keepAdding) {
        // Reset inputs for next question, but keep subject/grade
        setContent('');
        setImageUrl('');
        setExplanation('');
        setOptions([
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' },
        ]);
        setCorrectAnswer('A');
        setAddedCount((c) => c + 1);
        setSuccessToast(`✅ Đã lưu câu hỏi thành công! Bạn có thể nhập tiếp câu hỏi thứ ${addedCount + 2}.`);
        setTimeout(() => setSuccessToast(null), 4000);
        contentInputRef.current?.focus();
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi lưu câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  const updateOption = (index: number, field: keyof IQuestionOption, value: string) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt))
    );
  };

  const updatePair = (index: number, field: keyof IMatchingPair, value: string) => {
    setMatchingPairs((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair))
    );
  };

  const addPair = () => setMatchingPairs((prev) => [...prev, { left: '', right: '' }]);
  const removePair = (index: number) =>
    setMatchingPairs((prev) => prev.filter((_, i) => i !== index));

  return (
    <div className="space-y-6 text-slate-800">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-green-100 border-2 border-green-300 text-green-900 rounded-2xl text-xs font-black text-center shadow-sm"
          >
            {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Type selector */}
      <div>
        <label className="block text-xs font-black uppercase text-slate-600 mb-2">
          Loại câu hỏi
        </label>
        <div className="flex gap-2 flex-wrap">
          {([
            { value: 'multiple_choice', label: '🔤 Trắc nghiệm' },
            { value: 'true_false', label: '✅ Đúng / Sai' },
            { value: 'matching', label: '🔗 Nối cột' },
          ] as const).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setType(t.value);
                setErrors({});
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                type === t.value
                  ? 'bg-brand-blue text-white shadow-button-3d'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subject & Grade */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-slate-600 mb-1">Môn học</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Toán, Lý, Hóa, Tiếng Anh..."
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 font-semibold placeholder-slate-400 focus:border-brand-blue focus:outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-600 mb-1">Lớp</label>
          <input
            type="number"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="1 - 12"
            min="1"
            max="12"
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 font-semibold placeholder-slate-400 focus:border-brand-blue focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Question Content */}
      <div>
        <label className="block text-xs font-black uppercase text-slate-700 mb-1">
          Nội dung câu hỏi <span className="text-brand-red">*</span>
        </label>
        <textarea
          ref={contentInputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung câu hỏi tại đây..."
          rows={3}
          className={`w-full bg-slate-50 border-2 rounded-2xl p-4 text-slate-900 font-semibold placeholder-slate-400 focus:border-brand-blue focus:outline-none text-sm ${
            errors.content ? 'border-brand-red' : 'border-slate-200'
          }`}
        />
        {errors.content && (
          <p className="text-brand-red text-xs mt-1 font-bold">{errors.content}</p>
        )}
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-xs font-black uppercase text-slate-600 mb-2">
          Ảnh minh họa (tùy chọn)
        </label>
        <ImageUploader value={imageUrl} onChange={setImageUrl} />
      </div>

      {/* MULTIPLE CHOICE OPTIONS */}
      {type === 'multiple_choice' && (
        <div>
          <label className="block text-xs font-black uppercase text-slate-700 mb-2">
            Các lựa chọn và đáp án đúng <span className="text-brand-red">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((opt, i) => {
              const color = KAHOOT_OPTION_COLORS[i] || KAHOOT_OPTION_COLORS[0];
              const isSelected = correctAnswer === opt.key;
              return (
                <div
                  key={opt.key}
                  className={`border-2 ${color.border} rounded-2xl p-3 bg-white transition-all shadow-sm ${
                    isSelected ? 'ring-2 ring-brand-blue ring-offset-2' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${color.badge}`}>
                      {opt.key}
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 ml-auto">
                      <input
                        type="radio"
                        name="correctAnswer"
                        value={opt.key}
                        checked={isSelected}
                        onChange={() => setCorrectAnswer(opt.key)}
                        className="accent-brand-blue w-4 h-4"
                      />
                      <span>Đáp án đúng</span>
                    </label>
                  </div>
                  <input
                    value={opt.text}
                    onChange={(e) => updateOption(i, 'text', e.target.value)}
                    placeholder={`Nội dung lựa chọn ${opt.key}...`}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-brand-blue focus:outline-none ${
                      errors[`option_${i}`] ? 'border-brand-red' : ''
                    }`}
                  />
                  {errors[`option_${i}`] && (
                    <p className="text-brand-red text-[11px] mt-1 font-bold">
                      {errors[`option_${i}`]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {errors.correctAnswer && (
            <p className="text-brand-red text-xs mt-1 font-bold">{errors.correctAnswer}</p>
          )}
        </div>
      )}

      {/* TRUE / FALSE */}
      {type === 'true_false' && (
        <div>
          <label className="block text-xs font-black uppercase text-slate-700 mb-2">
            Đáp án đúng <span className="text-brand-red">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setCorrectAnswer('T')}
              className={`p-4 rounded-2xl border-2 font-black text-base transition-all flex items-center justify-center gap-2 ${
                correctAnswer === 'T'
                  ? 'border-brand-green bg-green-50 text-green-700 shadow-md ring-2 ring-brand-green'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>✅</span> Đúng (True)
            </button>
            <button
              type="button"
              onClick={() => setCorrectAnswer('F')}
              className={`p-4 rounded-2xl border-2 font-black text-base transition-all flex items-center justify-center gap-2 ${
                correctAnswer === 'F'
                  ? 'border-brand-red bg-red-50 text-brand-red shadow-md ring-2 ring-brand-red'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>❌</span> Sai (False)
            </button>
          </div>
        </div>
      )}

      {/* MATCHING */}
      {type === 'matching' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-black uppercase text-slate-700">
              Các cặp nối cột <span className="text-brand-red">*</span>
            </label>
            <button
              type="button"
              onClick={addPair}
              className="text-xs font-black text-brand-blue hover:underline"
            >
              + Thêm cặp
            </button>
          </div>
          <div className="space-y-3">
            {matchingPairs.map((pair, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={pair.left}
                  onChange={(e) => updatePair(i, 'left', e.target.value)}
                  placeholder={`Vế trái ${i + 1}`}
                  className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-brand-blue focus:outline-none"
                />
                <span className="text-slate-400 font-black">↔</span>
                <input
                  value={pair.right}
                  onChange={(e) => updatePair(i, 'right', e.target.value)}
                  placeholder={`Vế phải ${i + 1}`}
                  className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-brand-blue focus:outline-none"
                />
                {matchingPairs.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePair(i)}
                    className="text-slate-400 hover:text-brand-red text-sm font-black p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation & Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="block text-xs font-black uppercase text-slate-600 mb-1">
            Giải thích chi tiết (tùy chọn)
          </label>
          <input
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Giải thích vì sao đáp án đúng..."
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-brand-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-slate-600 mb-1">
            Thẻ tags (phân cách bằng dấu phẩy)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="kiem-tra, chuong-1, co-ban..."
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-brand-blue focus:outline-none"
          />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-100 text-sm transition-colors"
        >
          Đóng
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Keep Adding Button */}
          <button
            type="button"
            onClick={() => executeSave(true)}
            disabled={loading}
            className="btn-liquid bg-blue-50 hover:bg-blue-100 text-brand-blue border-2 border-blue-200 font-black px-5 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 transition-all"
            title="Lưu câu hỏi này và giữ mở cửa sổ để nhập tiếp câu hỏi tiếp theo"
          >
            <span>➕</span> Lưu & Nhập tiếp
          </button>

          {/* Save & Close Button */}
          <button
            type="button"
            onClick={() => executeSave(false)}
            disabled={loading}
            className="btn-liquid bg-brand-red hover:bg-red-600 disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-2xl shadow-button-3d text-sm transition-all"
          >
            {loading ? 'Đang lưu...' : initial ? 'Cập nhật' : 'Lưu & Đóng'}
          </button>
        </div>
      </div>
    </div>
  );
}
