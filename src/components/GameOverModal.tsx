import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RotateCcw, Play, Award } from 'lucide-react';
import { GameStats } from '../types/game';

interface GameOverModalProps {
  stats: GameStats;
  isVictory: boolean;
  onRestart: () => void;
  onNextStage: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isVictory,
  onRestart,
  onNextStage,
}) => {
  useEffect(() => {
    if (isVictory) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  }, [isVictory]);

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border shadow-inner">
          {isVictory ? (
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-9 h-9 text-amber-400 animate-bounce" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <Skull className="w-9 h-9 text-red-500" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-black font-mono tracking-wide mb-1 ${isVictory ? 'text-amber-400' : 'text-red-500'}`}>
          {isVictory ? 'Cao  đã đấm Huế thành công' : 'Bạn ngu vãi cả loz'}
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          {isVictory
            ? `Cao  đã đấm Huế thành công! Toàn bộ 20 xe tăng địch ở Màn ${stats.stage} đã bị tiêu diệt hoàn toàn!`
            : stats.baseDestroyed
            ? 'Đại Bản Doanh (Con Đại Bàng) đã bị phá hủy!'
            : 'Xe tăng của bạn đã hết số mạng còn lại!'}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-left">
          <div>
            <span className="text-[11px] uppercase font-mono text-zinc-500">Tổng điểm</span>
            <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
              {stats.score}
            </div>
          </div>
          <div>
            <span className="text-[11px] uppercase font-mono text-zinc-500">Địch đã hạ</span>
            <div className="text-xl font-bold font-mono text-zinc-200 tabular-nums">
              {stats.enemiesDefeated} xe
            </div>
          </div>
          <div>
            <span className="text-[11px] uppercase font-mono text-zinc-500">Màn hiện tại</span>
            <div className="text-lg font-bold font-mono text-zinc-300">
              Stage {stats.stage}
            </div>
          </div>
          <div>
            <span className="text-[11px] uppercase font-mono text-zinc-500">Kỷ lục đạt được</span>
            <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
              {stats.highScore}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isVictory ? (
            <>
              <button
                onClick={onNextStage}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Màn Kế Tiếp (Stage {stats.stage + 1})</span>
              </button>
              <button
                onClick={onRestart}
                className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chơi lại màn này</span>
              </button>
            </>
          ) : (
            <button
              onClick={onRestart}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-lg shadow-red-600/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại Từ Đầu (Play Again)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
