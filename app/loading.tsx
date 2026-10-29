export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-5xl animate-spin">⟳</div>
        <p className="text-gray-400 animate-pulse">Đang tải...</p>
      </div>
    </div>
  );
}
