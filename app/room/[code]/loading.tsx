export default function RoomLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f23' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="text-6xl animate-bounce">🎮</div>
        <p className="text-electric-blue text-xl animate-pulse">Đang kết nối phòng...</p>
      </div>
    </div>
  );
}
