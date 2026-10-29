'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUploader({ value, onChange, label = 'Thêm ảnh' }: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải ảnh');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>

      {value ? (
        <div className="relative">
          <img src={value} alt="Preview" className="max-h-40 rounded-lg object-contain border border-white/10" />
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500"
          >
            ✕
          </button>
        </div>
      ) : (
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          animate={{ borderColor: dragging ? '#00d4ff' : 'rgba(255,255,255,0.1)' }}
          className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-white/30 transition-colors"
        >
          {loading ? (
            <div className="animate-spin text-3xl">⟳</div>
          ) : (
            <>
              <div className="text-4xl">🖼️</div>
              <p className="text-gray-400 text-sm text-center">
                Kéo thả ảnh vào đây hoặc click để chọn
              </p>
            </>
          )}
        </motion.div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );
}
