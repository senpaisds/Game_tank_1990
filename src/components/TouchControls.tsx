import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Crosshair } from 'lucide-react';
import { InputState } from '../game/GameEngine';

interface TouchControlsProps {
  onInputChange: (fn: (prev: InputState) => InputState) => void;
  onFirePress: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInputChange, onFirePress }) => {
  const handleDirectionStart = (dir: 'up' | 'down' | 'left' | 'right') => {
    onInputChange(prev => ({
      ...prev,
      up: dir === 'up',
      down: dir === 'down',
      left: dir === 'left',
      right: dir === 'right',
    }));
  };

  const handleDirectionEnd = (dir: 'up' | 'down' | 'left' | 'right') => {
    onInputChange(prev => ({
      ...prev,
      [dir]: false,
    }));
  };

  const handleFireStart = () => {
    onInputChange(prev => ({ ...prev, fire: true }));
    onFirePress();
  };

  const handleFireEnd = () => {
    onInputChange(prev => ({ ...prev, fire: false }));
  };

  return (
    <div className="w-full flex items-center justify-between px-4 py-3 select-none touch-none bg-zinc-900/90 border-t border-zinc-800">
      {/* Retro D-Pad */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Center circle */}
        <div className="absolute w-10 h-10 bg-zinc-800 rounded-full border border-zinc-700 pointer-events-none" />

        {/* UP */}
        <button
          type="button"
          aria-label="Di chuyển lên"
          onPointerDown={() => handleDirectionStart('up')}
          onPointerUp={() => handleDirectionEnd('up')}
          onPointerLeave={() => handleDirectionEnd('up')}
          className="absolute top-0 w-12 h-12 bg-zinc-800 active:bg-amber-600 rounded-t-lg border-t-2 border-x-2 border-zinc-600 active:border-amber-400 flex items-center justify-center shadow-lg transition-transform active:scale-95"
        >
          <ArrowUp className="w-6 h-6 text-zinc-200" />
        </button>

        {/* DOWN */}
        <button
          type="button"
          aria-label="Di chuyển xuống"
          onPointerDown={() => handleDirectionStart('down')}
          onPointerUp={() => handleDirectionEnd('down')}
          onPointerLeave={() => handleDirectionEnd('down')}
          className="absolute bottom-0 w-12 h-12 bg-zinc-800 active:bg-amber-600 rounded-b-lg border-b-2 border-x-2 border-zinc-600 active:border-amber-400 flex items-center justify-center shadow-lg transition-transform active:scale-95"
        >
          <ArrowDown className="w-6 h-6 text-zinc-200" />
        </button>

        {/* LEFT */}
        <button
          type="button"
          aria-label="Di chuyển trái"
          onPointerDown={() => handleDirectionStart('left')}
          onPointerUp={() => handleDirectionEnd('left')}
          onPointerLeave={() => handleDirectionEnd('left')}
          className="absolute left-0 w-12 h-12 bg-zinc-800 active:bg-amber-600 rounded-l-lg border-l-2 border-y-2 border-zinc-600 active:border-amber-400 flex items-center justify-center shadow-lg transition-transform active:scale-95"
        >
          <ArrowLeft className="w-6 h-6 text-zinc-200" />
        </button>

        {/* RIGHT */}
        <button
          type="button"
          aria-label="Di chuyển phải"
          onPointerDown={() => handleDirectionStart('right')}
          onPointerUp={() => handleDirectionEnd('right')}
          onPointerLeave={() => handleDirectionEnd('right')}
          className="absolute right-0 w-12 h-12 bg-zinc-800 active:bg-amber-600 rounded-r-lg border-r-2 border-y-2 border-zinc-600 active:border-amber-400 flex items-center justify-center shadow-lg transition-transform active:scale-95"
        >
          <ArrowRight className="w-6 h-6 text-zinc-200" />
        </button>
      </div>

      {/* Retro Arcade FIRE Button */}
      <div className="flex flex-col items-center gap-1 pr-2">
        <button
          type="button"
          aria-label="Bắn đạn (Space)"
          onPointerDown={handleFireStart}
          onPointerUp={handleFireEnd}
          onPointerLeave={handleFireEnd}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 active:from-red-600 active:to-red-800 border-4 border-red-300 shadow-[0_6px_0_#991b1b,0_10px_15px_rgba(0,0,0,0.5)] active:shadow-[0_2px_0_#991b1b] active:translate-y-1 flex flex-col items-center justify-center text-white font-bold transition-all"
        >
          <Crosshair className="w-7 h-7 mb-0.5" />
          <span className="text-[10px] tracking-wider uppercase font-mono">BẮN</span>
        </button>
        <span className="text-[10px] text-zinc-400 font-mono">SPACE / FIRE</span>
      </div>
    </div>
  );
};
