'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-2">Đã xảy ra lỗi</h2>
        <p className="text-gray-400 mb-6">{error.message || 'Lỗi không xác định'}</p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-electric-blue hover:bg-blue-400 text-white font-bold rounded-xl transition-colors"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
