'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ParsedQuestion {
  content: string;
  type: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  isValid: boolean;
  error?: string;
}

interface QuestionFileImporterProps {
  setId?: string;
  setName?: string;
  onImportSuccess: (count: number) => void;
  onClose: () => void;
}

const SAMPLE_TXT_CONTENT = `# BẢNG MẪU NHẬP CÂU HỎI TRẮC NGHIỆM (HỖ TRỢ QUIZ GAME & WAYGROUND)
# Quy tắc:
# 1. Mỗi câu hỏi bắt đầu bằng "Câu [số]:" hoặc "Q:"
# 2. Các dòng tiếp theo là các đáp án: A. [Nội dung], B. [Nội dung], C. [Nội dung], D. [Nội dung]
# 3. Dòng "Đáp án:" ghi chữ cái đáp án đúng (A, B, C hoặc D)
# 4. Dòng "Giải thích:" (không bắt buộc)
# 5. Ngăn cách các câu bằng 1 dòng trống.

Câu 1: Thủ đô của Việt Nam là gì?
A. Hà Nội
B. TP. Hồ Chí Minh
C. Đà Nẵng
D. Hải Phòng
Đáp án: A
Giải thích: Hà Nội là thủ đô của nước CHXHCN Việt Nam.

Câu 2: 15 + 27 bằng bao nhiêu?
A. 40
B. 42
C. 45
D. 38
Đáp án: B

Câu 3: Hành tinh nào lớn nhất trong Hệ Mặt Trời?
A. Trái Đất
B. Sao Hỏa
C. Sao Thổ
D. Sao Mộc
Đáp án: D
Giải thích: Sao Mộc (Jupiter) có khối lượng lớn nhất trong Hệ Mặt Trời.
`;

export function QuestionFileImporter({ setId, setName, onImportSuccess, onClose }: QuestionFileImporterProps) {
  const [rawText, setRawText] = useState('');
  const [parsedList, setParsedList] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Download Sample Template .txt
  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_TXT_CONTENT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mau-nhap-cau-hoi-quiz.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse Text or CSV/TSV
  const parseContent = (text: string) => {
    const lines = text.split(/\r?\n/);
    const questions: ParsedQuestion[] = [];

    // Check if it's TSV/CSV format (like Wayground Excel copy-paste)
    const firstNonEmpty = lines.find((l) => l.trim().length > 0) || '';
    if (firstNonEmpty.includes('\t') || (firstNonEmpty.includes(',') && firstNonEmpty.toLowerCase().includes('option'))) {
      // TSV / CSV parsing
      const separator = firstNonEmpty.includes('\t') ? '\t' : ',';
      for (const line of lines) {
        if (!line.trim() || line.startsWith('#') || line.toLowerCase().startsWith('question text')) continue;
        const cols = line.split(separator).map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
        if (cols.length >= 3) {
          const qText = cols[0];
          // Determine if cols[1] is question type or option
          let optStartIndex = 1;
          if (['multiple choice', 'checkbox', 'trắc nghiệm', 'multiple_choice'].includes(cols[1]?.toLowerCase())) {
            optStartIndex = 2;
          }
          const opts: { key: string; text: string }[] = [];
          const keys = ['A', 'B', 'C', 'D', 'E'];
          for (let i = 0; i < 4; i++) {
            const val = cols[optStartIndex + i] || '';
            if (val) opts.push({ key: keys[i], text: val });
          }

          // Look for correct answer (often last or second to last column)
          let correct = 'A';
          const ansCol = cols[optStartIndex + 4] || cols[cols.length - 2] || cols[cols.length - 1];
          if (ansCol) {
            const trimmedAns = ansCol.trim().toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(trimmedAns)) {
              correct = trimmedAns;
            } else if (['1', '2', '3', '4'].includes(trimmedAns)) {
              correct = keys[parseInt(trimmedAns) - 1] || 'A';
            }
          }

          questions.push({
            content: qText,
            type: 'multiple_choice',
            options: opts.length >= 2 ? opts : [
              { key: 'A', text: 'Đáp án A' },
              { key: 'B', text: 'Đáp án B' },
            ],
            correctAnswer: correct,
            isValid: Boolean(qText && opts.length >= 2),
          });
        }
      }
    } else {
      // Standard Question block format (Câu 1: ... A. ... B. ... Đáp án: ...)
      const blocks = text.split(/\n\s*\n+/);
      for (const block of blocks) {
        const bLines = block.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
        if (bLines.length === 0) continue;

        let content = '';
        const options: { key: string; text: string }[] = [];
        let correctAnswer = 'A';
        let explanation = '';

        for (const line of bLines) {
          // Detect question line
          const qMatch = line.match(/^(?:Câu\s*\d+|Question\s*\d+|Q\d*)\s*[:.]\s*(.*)$/i);
          if (qMatch) {
            content = qMatch[1].trim();
            continue;
          }

          // Detect answer key line
          const ansMatch = line.match(/^(?:Đáp\s*án|Answer|Correct|ĐA)\s*[:.]\s*([A-D1-4])/i);
          if (ansMatch) {
            const rawAns = ansMatch[1].toUpperCase();
            if (['1', '2', '3', '4'].includes(rawAns)) {
              correctAnswer = ['A', 'B', 'C', 'D'][parseInt(rawAns) - 1];
            } else {
              correctAnswer = rawAns;
            }
            continue;
          }

          // Detect explanation
          const expMatch = line.match(/^(?:Giải\s*thích|Explanation|Ghi\s*chú)\s*[:.]\s*(.*)$/i);
          if (expMatch) {
            explanation = expMatch[1].trim();
            continue;
          }

          // Detect option lines: A. ... or [A] ... or A) ...
          const optMatch = line.match(/^([A-D])[.)\]:\-]\s*(.*)$/i);
          if (optMatch) {
            options.push({
              key: optMatch[1].toUpperCase(),
              text: optMatch[2].trim(),
            });
            continue;
          }

          // If content not set yet, first line is content
          if (!content) {
            content = line;
          }
        }

        if (content) {
          // Ensure at least 4 options or pad if needed
          const keys = ['A', 'B', 'C', 'D'];
          const finalOpts = options.length >= 2 ? options : keys.map((k) => ({ key: k, text: `Lựa chọn ${k}` }));
          questions.push({
            content,
            type: 'multiple_choice',
            options: finalOpts,
            correctAnswer,
            explanation,
            isValid: finalOpts.length >= 2,
          });
        }
      }
    }

    setParsedList(questions);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawText(val);
    parseContent(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        parseContent(content);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = async () => {
    const validQuestions = parsedList.filter((q) => q.isValid);
    if (validQuestions.length === 0) {
      alert('Không có câu hỏi hợp lệ nào để nhập!');
      return;
    }

    setLoading(true);
    setStatusMessage('Đang tải câu hỏi lên hệ thống...');

    try {
      const res = await fetch('/api/questions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setId: setId || null,
          questions: validQuestions,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`🎉 ${data.message}`);
        setTimeout(() => {
          onImportSuccess(data.count);
        }, 1200);
      } else {
        alert(data.error || 'Lỗi khi nhập câu hỏi');
      }
    } catch {
      alert('Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>📥</span> Nhập câu hỏi từ file
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {setName ? (
                <span>Đang nhập vào bộ câu hỏi: <strong className="text-brand-blue">{setName}</strong></span>
              ) : (
                'Nhập hàng loạt câu hỏi trắc nghiệm nhanh chóng'
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadSample}
              className="btn-liquid bg-blue-50 hover:bg-blue-100 text-brand-blue font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <span>📄</span> Tải file TXT mẫu
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* File Picker or Paste Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-slate-300 hover:border-brand-blue rounded-2xl p-6 text-center bg-slate-50 flex flex-col items-center justify-center transition-colors">
              <span className="text-3xl mb-2">📁</span>
              <p className="font-bold text-slate-800 text-sm mb-1">Tải file từ máy tính</p>
              <p className="text-xs text-slate-500 mb-4">Hỗ trợ định dạng .TXT hoặc file Excel / CSV</p>
              <label className="btn-liquid bg-brand-blue hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow-button-3d">
                <span>Chọn file .txt / .csv</span>
                <input
                  type="file"
                  accept=".txt,.csv,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-700 uppercase mb-1">
                Hoặc dán nội dung câu hỏi vào đây:
              </label>
              <textarea
                value={rawText}
                onChange={handleTextChange}
                placeholder={`Dán nội dung câu hỏi theo mẫu:\n\nCâu 1: Câu hỏi là gì?\nA. Đáp án 1\nB. Đáp án 2\nC. Đáp án 3\nD. Đáp án 4\nĐáp án: A`}
                rows={6}
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-brand-blue rounded-2xl p-3 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none resize-none flex-1"
              />
            </div>
          </div>

          {/* Preview Section */}
          {parsedList.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span>📋</span> Danh sách câu hỏi nhận diện ({parsedList.length} câu)
                </h3>
                <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  {parsedList.filter((q) => q.isValid).length} câu hợp lệ
                </span>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 p-3 bg-slate-50">
                {parsedList.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-sm flex flex-col gap-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        {idx + 1}. {q.content}
                      </span>
                      <span className="shrink-0 font-bold px-2 py-0.5 rounded bg-brand-red text-white text-[10px]">
                        Đáp án: {q.correctAnswer}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      {q.options.map((opt) => (
                        <div
                          key={opt.key}
                          className={`px-2 py-1 rounded border ${
                            opt.key === q.correctAnswer
                              ? 'bg-green-50 border-green-300 font-bold text-green-800'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <strong>{opt.key}:</strong> {opt.text}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">
                        💡 Giải thích: {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 bg-green-100 border border-green-300 rounded-xl text-green-800 text-xs font-bold text-center">
              {statusMessage}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-100 text-sm transition-colors"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={loading || parsedList.length === 0}
            className="btn-liquid bg-brand-red hover:bg-red-600 disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-xl shadow-button-3d text-sm flex items-center gap-2"
          >
            {loading ? 'Đang nhập...' : `🚀 Nhập ${parsedList.filter((q) => q.isValid).length} câu hỏi vào bộ`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
