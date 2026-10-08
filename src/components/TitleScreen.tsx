import React from 'react';
import { Play, Shield, Crosshair, Award } from 'lucide-react';

interface TitleScreenProps {
  onStart: (stage: number) => void;
  highScore: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, highScore }) => {
  const [selectedStage, setSelectedStage] = React.useState(1);

  return (
    <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-4 sm:p-6 z-40 text-center">
      <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative scanlines background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Title Logo */}
        <div className="relative mb-6">
          <div className="text-[10px] tracking-widest text-amber-500 uppercase font-mono mb-1">
            NES CLASSIC ARCADE 1990
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-500 to-red-600 drop-shadow-[0_4px_8px_rgba(234,179,8,0.3)]">
            BATTLE CITY
          </h1>
          <div className="text-xs sm:text-sm font-semibold text-zinc-400 mt-1 font-mono">
            XE TĂNG 4 NÚT HUYỀN THOẠI
          </div>
        </div>

        {/* High Score Banner */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 mb-6">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>KỶ LỤC HI-SCORE:</span>
          <span className="text-amber-400 font-bold tabular-nums">{highScore}</span>
        </div>

        {/* Stage Selection */}
        <div className="mb-6">
          <div className="text-xs font-medium text-zinc-400 mb-2 font-mono">CHỌN MÀN CHƠI (STAGE):</div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedStage(s)}
                className={`py-2 px-4 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedStage === s
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                STAGE {s}
              </button>
            ))}
          </div>
        </div>

        {/* Rules Briefing */}
        <div className="text-left bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 mb-6 space-y-2 text-xs text-zinc-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">1.</span>
            <span>Bảo vệ <strong className="text-amber-300">Đại Bản Doanh Đại Bàng</strong> ở phía dưới bản đồ!</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">2.</span>
            <span>Đạn phá được <span className="text-red-400">tường gạch đỏ</span>, nhưng nảy tắt khi gặp <span className="text-slate-300">thép xám</span>.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">3.</span>
            <span>Giới hạn nghiêm ngặt: <strong className="text-white">chỉ 1 viên đạn</strong> trên sân cùng lúc (đạn nổ mới bắn tiếp).</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">4.</span>
            <span>Phím mũi tên / WASD để đi, SPACE để bắn (hoặc dùng nút cảm ứng).</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">5.</span>
            <span>Hạ xe đỏ nhấp nháy nhận: ⛏️ <span className="text-slate-300">Xẻng</span> (thép bảo vệ đại bàng 10s), ★ <span className="text-amber-300">Ngôi sao</span> (tăng tốc đạn), 💣 <span className="text-red-400">Lựu đạn</span> (diệt sạch địch), 🛡️ <span className="text-cyan-400">Khiên</span> (bất tử 5s).</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={() => onStart(selectedStage)}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black font-mono tracking-wider rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer text-sm"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>VÀO TRẬN (START GAME)</span>
        </button>
      </div>
    </div>
  );
};
