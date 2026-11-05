'use client';

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';

export interface DownloadQROptions {
  code: string;
  roomName?: string;
  joinUrl?: string;
  svgElement?: SVGSVGElement | null;
  format: 'png' | 'jpeg';
  includeCard?: boolean;
}

export function downloadQRCodeImage({
  code,
  roomName,
  joinUrl,
  svgElement,
  format,
  includeCard = true,
}: DownloadQROptions): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      let svgStr = '';
      if (svgElement) {
        const serializer = new XMLSerializer();
        svgStr = serializer.serializeToString(svgElement);
      } else {
        const url =
          joinUrl ||
          (typeof window !== 'undefined'
            ? `${window.location.origin}/room/${code.toUpperCase()}/student`
            : '');
        svgStr = renderToStaticMarkup(
          React.createElement(QRCodeSVG, {
            value: url,
            size: 520,
            level: 'H',
            includeMargin: true,
          })
        );
      }

      if (!svgStr.includes('xmlns=')) {
        svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(false);
            return;
          }

          if (includeCard) {
            // High resolution branded card (800 x 980)
            const width = 800;
            const height = 980;
            canvas.width = width;
            canvas.height = height;

            // 1. Solid white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // 2. Subtle outer border
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 4;
            ctx.strokeRect(16, 16, width - 32, height - 32);

            // 3. Header title
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🎮 QUIZ GAME', width / 2, 75);

            if (roomName && roomName.trim()) {
              ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
              ctx.fillStyle = '#475569';
              const cleanName = roomName.length > 40 ? roomName.substring(0, 37) + '...' : roomName;
              ctx.fillText(cleanName, width / 2, 115);
            }

            // 4. Center QR Code
            const qrSize = 520;
            const qrX = (width - qrSize) / 2;
            const qrY = roomName && roomName.trim() ? 145 : 120;
            ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

            // 5. PIN Box container
            const pinBoxY = qrY + qrSize + 25;
            const boxW = 500;
            const boxH = 95;
            const boxX = (width - boxW) / 2;

            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(boxX, pinBoxY, boxW, boxH, 20);
              ctx.fill();
              ctx.stroke();
            } else {
              ctx.fillRect(boxX, pinBoxY, boxW, boxH);
              ctx.strokeRect(boxX, pinBoxY, boxW, boxH);
            }

            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('MÃ PIN THAM GIA', width / 2, pinBoxY + 30);

            ctx.fillStyle = '#0f172a';
            ctx.font = '900 44px monospace';
            ctx.fillText(code.toUpperCase(), width / 2, pinBoxY + 76);

            // 6. Footer instructions
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText('Mở camera điện thoại quét mã QR hoặc nhập mã PIN để vào phòng', width / 2, pinBoxY + boxH + 42);
          } else {
            // Pure QR code with margin (600 x 600)
            const size = 600;
            canvas.width = size;
            canvas.height = size;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);

            const qrSize = 520;
            const offset = (size - qrSize) / 2;
            ctx.drawImage(img, offset, offset, qrSize, qrSize);
          }

          // Generate file
          const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
          const ext = format === 'jpeg' ? 'jpg' : 'png';
          const dataUrl = canvas.toDataURL(mime, 0.95);

          const link = document.createElement('a');
          link.download = `QR_${code.toUpperCase()}.${ext}`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          resolve(true);
        } catch (err) {
          console.error('Canvas export error:', err);
          resolve(false);
        }
      };

      img.onerror = () => {
        console.error('Failed to load SVG into Image');
        resolve(false);
      };

      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    } catch (e) {
      console.error('Error generating QR download:', e);
      resolve(false);
    }
  });
}
