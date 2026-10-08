import React from 'react';
import { Shield, Volume2, VolumeX, RotateCcw, Pause, Play, Flag } from 'lucide-react';
import { GameStats } from '../types/game';

interface ScoreBoardProps {
  stats: GameStats;
  isPaused: boolean;
  isMuted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onRestart: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  stats,
  isPaused,
  isMuted,
  onTogglePause,
  onToggleMute,
  onRestart,
}) => {
  // Classic Battle City enemy reserve: 16 small tank silhouettes
  const remainingSlots = Math.max(0, stats.enemiesRemaining);

  return (
    <aside className="w-full lg:w-48 bg-zinc-900 border border-zinc-800 p-3 sm:p-4 rounded-xl flex flex-col justify-between select-none shadow-md">
      <div className="space-y-4">
        {/* Score & High Score */}
        <div className="space-y-2 pb-3 border-b border-zinc-800">
          <div>
            <div className="text-[10px] tracking-wider text-zinc-400 uppercase font-mono">ĐIỂM (SCORE)</div>
            <div className="text-xl font-bold font-mono tabular-nums text-amber-400">
              {stats.score.toString().padStart(6, '0')}
            </div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-zinc-500 uppercase font-mono">KỶ LỤC (HI-SCORE)</div>
            <div className="text-sm font-semibold font-mono tabular-nums text-zinc-300">
              {stats.highScore.toString().padStart(6, '0')}
            </div>
          </div>
        </div>

        {/* Player 1 Lives */}
        <div className="pb-3 border-b border-zinc-800">
          <div className="text-[10px] tracking-wider text-zinc-400 uppercase font-mono mb-1.5 flex items-center gap-1.5">
            <span className="text-amber-500 font-bold">I-P</span>
            <span>MẠNG CÒN LẠI</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Retro Player Tank Icon */}
            <div className="w-6 h-6 bg-amber-500 rounded-sm flex items-center justify-center text-zinc-950 font-bold text-xs shadow-inner">
              ▲
            </div>
            <span className="text-lg font-bold font-mono tabular-nums text-white">
              × {Math.max(0, stats.lives)}
            </span>
          </div>
        </div>

        {/* Stage Indicator */}
        <div className="pb-3 border-b border-zinc-800">
          <div className="text-[10px] tracking-wider text-zinc-400 uppercase font-mono mb-1 flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-red-500" />
            <span>MÀN CHƠI (STAGE)</span>
          </div>
          <div className="text-lg font-bold font-mono text-red-400">
            STAGE {stats.stage}
          </div>
        </div>

        {/* Enemies Remaining Grid (Classic Battle City side indicators) */}
        <div>
          <div className="text-[10px] tracking-wider text-zinc-400 uppercase font-mono mb-2 flex items-center justify-between">
            <span>ĐỊCH CÒN LẠI</span>
            <span className="font-mono tabular-nums text-zinc-300">{remainingSlots}</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-10 lg:grid-cols-2 gap-1.5 p-2 bg-zinc-950 rounded-lg border border-zinc-800/80">
            {Array.from({ length: 20 }).map((_, idx) => {
              const isAlive = idx < remainingSlots;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-xs flex items-center justify-center transition-opacity ${
                    isAlive ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900/40 text-zinc-700 opacity-20'
                  }`}
                  title={isAlive ? 'Địch dự bị' : 'Đã xuất hiện/tiêu diệt'}
                >
                  <span className="text-[9px] leading-none">▼</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="pt-4 border-t border-zinc-800 flex flex-wrap lg:flex-col gap-2">
        <button
          onClick={onTogglePause}
          className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isPaused ? 'Tiếp tục' : 'Tạm dừng'}</span>
        </button>

        <button
          onClick={onToggleMute}
          className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isMuted ? 'Bật tiếng' : 'Tắt tiếng'}</span>
        </button>

        <button
          onClick={onRestart}
          className="flex-1 py-2 px-3 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Chơi lại</span>
        </button>
      </div>
    </aside>
  );
};
