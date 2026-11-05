'use client';

import { useState } from 'react';
import { downloadQRCodeImage } from '@/lib/qrDownload';

interface QRDownloadButtonsProps {
  code: string;
  roomName?: string;
  joinUrl?: string;
  targetSvgId?: string;
  getSvgElement?: () => SVGSVGElement | null;
  className?: string;
  size?: 'sm' | 'md';
}

export function QRDownloadButtons({
  code,
  roomName,
  joinUrl,
  targetSvgId,
  getSvgElement,
  className = '',
  size = 'md',
}: QRDownloadButtonsProps) {
  const [downloading, setDownloading] = useState<'png' | 'jpeg' | null>(null);
  const [onlyQR, setOnlyQR] = useState(false);

  const handleDownload = async (format: 'png' | 'jpeg') => {
    setDownloading(format);
    try {
      let svgEl: SVGSVGElement | null = null;
      if (getSvgElement) {
        svgEl = getSvgElement();
      } else if (targetSvgId) {
        svgEl = document.getElementById(targetSvgId) as SVGSVGElement | null;
      }

      await downloadQRCodeImage({
        svgElement: svgEl,
        code,
        roomName,
        joinUrl,
        format,
        includeCard: !onlyQR,
      });
    } finally {
      setDownloading(null);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleDownload('png')}
          disabled={downloading !== null}
          className={`btn-liquid inline-flex items-center gap-1.5 font-black text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-md transition-all disabled:opacity-50 ${
            isSmall ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm'
          }`}
          title="Tải ảnh mã QR định dạng PNG sắc nét"
        >
          <span>{downloading === 'png' ? '⟳' : '📥'}</span>
          <span>Tải PNG</span>
        </button>

        <button
          type="button"
          onClick={() => handleDownload('jpeg')}
          disabled={downloading !== null}
          className={`btn-liquid inline-flex items-center gap-1.5 font-black text-white bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl shadow-md transition-all disabled:opacity-50 ${
            isSmall ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm'
          }`}
          title="Tải ảnh mã QR định dạng JPG chất lượng cao"
        >
          <span>{downloading === 'jpeg' ? '⟳' : '📥'}</span>
          <span>Tải JPG</span>
        </button>
      </div>

      <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 cursor-pointer select-none hover:text-slate-700">
        <input
          type="checkbox"
          checked={onlyQR}
          onChange={(e) => setOnlyQR(e.target.checked)}
          className="rounded border-slate-300 text-brand-blue focus:ring-brand-blue w-3.5 h-3.5 cursor-pointer"
        />
        <span>Chỉ tải mã QR (không kèm thẻ PIN)</span>
      </label>
    </div>
  );
}
