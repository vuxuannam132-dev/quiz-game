'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IQuestion, QuestionType, IQuestionOption, IMatchingPair } from '@/types';
import { ImageUploader } from './ImageUploader';

interface QuestionEditorProps {
  initial?: Partial<IQuestion>;
  onSave: (data: Partial<IQuestion>) => Promise<void>;
  onCancel: () => void;
}

const defaultOptions: IQuestionOption[] = [
  { key: 'A', text: '' },
  { key: 'B', text: '' },
  { key: 'C', text: '' },
  { key: 'D', text: '' },
];

export function QuestionEditor({ initial, onSave, onCancel }: QuestionEditorProps) {
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

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const data: Partial<IQuestion> = {
        type,
        content: content.trim(),
        imageUrl: imageUrl || undefined,
        subject: subject.trim() || undefined,
        grade: grade ? parseInt(grade) : undefined,
        explanation: explanation.trim() || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      };

      if (type === 'multiple_choice') {
        data.options = options;
        data.correctAnswer = correctAnswer;
      } else if (type === 'true_false') {
        data.options = [
          { key: 'A', text: 'Đúng' },
          { key: 'B', text: 'Sai' },
        ];
        data.correctAnswer = correctAnswer;
      } else if (type === 'matching') {
        data.matchingPairs = matchingPairs;
      }

      await onSave(data);
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
    <div className="space-y-6">
      {/* Type selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Loại câu hỏi</label>
        <div className="flex gap-2 flex-wrap">
          {([
            { value: 'multiple_choice', label: '🔤 Trắc nghiệm' },
            { value: 'true_false', label: '✅ Đúng/Sai' },
            { value: 'matching', label: '🔗 Nối cột' },
          ] as const).map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setType(t.value);
                setErrors({});
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === t.value
                  ? 'bg-electric-blue text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
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
          <label className="block text-sm font-medium text-gray-300 mb-2">Môn học</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Toán, Lý, Hóa..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-electric-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Lớp</label>
          <input
            type="number"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="1-12"
            min={1}
            max={12}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-electric-blue focus:outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nội dung câu hỏi <span className="text-red-400">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Nhập câu hỏi..."
          className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none resize-none ${
            errors.content ? 'border-red-500' : 'border-white/10 focus:border-electric-blue'
          }`}
        />
        {errors.content && <p className="text-red-400 text-xs mt-1">{errors.content}</p>}
      </div>

      {/* Image */}
      <ImageUploader value={imageUrl} onChange={setImageUrl} label="Ảnh minh họa (tùy chọn)" />

      {/* Options for multiple_choice */}
      {type === 'multiple_choice' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Lựa chọn <span className="text-red-400">*</span>
          </label>
          <div className="space-y-3">
            {options.map((opt, index) => (
              <div key={opt.key} className="space-y-2">
                <div className="flex items-center gap-3">
                  {/* Select as correct answer */}
                  <button
                    onClick={() => setCorrectAnswer(opt.key)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                      correctAnswer === opt.key
                        ? 'bg-green-500 border-green-400 text-white'
                        : 'border-white/20 text-gray-400 hover:border-white/40'
                    }`}
                    title={`Đặt ${opt.key} làm đáp án đúng`}
                  >
                    {opt.key}
                  </button>
                  <input
                    value={opt.text}
                    onChange={(e) => updateOption(index, 'text', e.target.value)}
                    placeholder={`Lựa chọn ${opt.key}...`}
                    className={`flex-1 bg-white/5 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none text-sm ${
                      errors[`option_${index}`]
                        ? 'border-red-500'
                        : 'border-white/10 focus:border-electric-blue'
                    }`}
                  />
                </div>
                {/* Option image */}
                <div className="ml-11">
                  <ImageUploader
                    value={opt.imageUrl}
                    onChange={(url) => updateOption(index, 'imageUrl', url)}
                    label=""
                  />
                </div>
                {errors[`option_${index}`] && (
                  <p className="text-red-400 text-xs ml-11">{errors[`option_${index}`]}</p>
                )}
              </div>
            ))}
          </div>
          {errors.correctAnswer && (
            <p className="text-red-400 text-xs mt-2">{errors.correctAnswer}</p>
          )}
          <p className="text-gray-500 text-xs mt-2">
            Click vào ký tự (A/B/C/D) để chọn đáp án đúng (hiện tại: <span className="text-green-400 font-bold">{correctAnswer}</span>)
          </p>
        </div>
      )}

      {/* True/False */}
      {type === 'true_false' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Đáp án đúng <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-3">
            {[
              { key: 'A', label: '✅ Đúng' },
              { key: 'B', label: '❌ Sai' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setCorrectAnswer(opt.key)}
                className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-colors ${
                  correctAnswer === opt.key
                    ? 'bg-green-500/30 border-green-400 text-green-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {errors.correctAnswer && (
            <p className="text-red-400 text-xs mt-1">{errors.correctAnswer}</p>
          )}
        </div>
      )}

      {/* Matching pairs */}
      {type === 'matching' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-300">
              Các cặp nối <span className="text-red-400">*</span>
            </label>
            <button
              onClick={addPair}
              className="text-xs text-electric-blue hover:text-blue-300 font-medium"
            >
              + Thêm cặp
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 mb-1">
              <span className="text-xs text-gray-500 text-center">Vế trái</span>
              <span className="text-xs text-gray-500 text-center">Vế phải</span>
            </div>
            {matchingPairs.map((pair, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <input
                      value={pair.left}
                      onChange={(e) => updatePair(index, 'left', e.target.value)}
                      placeholder={`Vế trái ${index + 1}`}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none text-sm ${
                        errors[`pair_left_${index}`]
                          ? 'border-red-500'
                          : 'border-white/10 focus:border-electric-blue'
                      }`}
                    />
                    {errors[`pair_left_${index}`] && (
                      <p className="text-red-400 text-xs mt-0.5">{errors[`pair_left_${index}`]}</p>
                    )}
                  </div>
                  <div>
                    <input
                      value={pair.right}
                      onChange={(e) => updatePair(index, 'right', e.target.value)}
                      placeholder={`Vế phải ${index + 1}`}
                      className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none text-sm ${
                        errors[`pair_right_${index}`]
                          ? 'border-red-500'
                          : 'border-white/10 focus:border-electric-blue'
                      }`}
                    />
                    {errors[`pair_right_${index}`] && (
                      <p className="text-red-400 text-xs mt-0.5">{errors[`pair_right_${index}`]}</p>
                    )}
                  </div>
                </div>
                {matchingPairs.length > 2 && (
                  <button
                    onClick={() => removePair(index)}
                    className="text-red-400 hover:text-red-300 text-lg flex-shrink-0"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Giải thích (tùy chọn)
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          placeholder="Giải thích tại sao đây là đáp án đúng..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-electric-blue focus:outline-none resize-none text-sm"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tags (tùy chọn, phân cách bằng dấu phẩy)
        </label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="ví dụ: hình học, lớp 10, khó"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-electric-blue focus:outline-none text-sm"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2 border-t border-white/10">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-white/20 text-gray-300 hover:bg-white/5 transition-colors font-medium"
        >
          Hủy
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={loading}
          className="flex-1 py-3 rounded-xl bg-electric-blue hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⟳</span> Đang lưu...
            </span>
          ) : (
            '💾 Lưu câu hỏi'
          )}
        </motion.button>
      </div>
    </div>
  );
}
