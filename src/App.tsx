/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, InputState } from './game/GameEngine';
import { GameRenderer } from './utils/renderer';
import { ScoreBoard } from './components/ScoreBoard';
import { TouchControls } from './components/TouchControls';
import { GameOverModal } from './components/GameOverModal';
import { TitleScreen } from './components/TitleScreen';
import { sounds } from './utils/audio';
import { GameState, GameStats } from './types/game';
import { Volume2, VolumeX, Tv, RotateCcw, HelpCircle } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Inputs
  const inputRef = useRef<InputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
  });

  // Game UI state
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    lives: 3,
    stage: 1,
    enemiesRemaining: 20,
    enemiesDefeated: 0,
    baseDestroyed: false,
    gameWon: false,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [crtEffect, setCrtEffect] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize Game Engine on mount
  useEffect(() => {
    const tileSize = 20; // 26 * 20 = 520px standard resolution
    const engine = new GameEngine(tileSize);
    const renderer = new GameRenderer(tileSize);

    engineRef.current = engine;
    rendererRef.current = renderer;
    setStats({ ...engine.stats });

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scrolling on arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        inputRef.current.up = true;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        inputRef.current.down = true;
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = true;
      } else if (e.code === 'Space') {
        inputRef.current.fire = true;
      } else if (e.code === 'KeyP') {
        togglePause();
      } else if (e.code === 'KeyM') {
        toggleMute();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        inputRef.current.up = false;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        inputRef.current.down = false;
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = false;
      } else if (e.code === 'Space') {
        inputRef.current.fire = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  // Main Game Loop
  useEffect(() => {
    let frameCount = 0;

    const gameLoop = () => {
      const engine = engineRef.current;
      const renderer = rendererRef.current;
      const canvas = canvasRef.current;

      if (engine && renderer && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // HiDPI / Super-Sampled Anti-Aliasing (SSAA) for razor-sharp visual clarity
          const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
          // Scale buffer to at least 2x (1040px) or DPR * 520, guaranteeing pristine crispness on any display
          const renderScale = Math.max(2, Math.min(3, Math.ceil(dpr)));
          const targetW = 520 * renderScale;
          const targetH = 520 * renderScale;

          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          ctx.save();
          ctx.scale(renderScale, renderScale);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Update physics only if in active PLAYING state
          if (gameState === 'PLAYING') {
            engine.update(inputRef.current);

            // Sync state checks
            if (engine.isGameOver) {
              setGameState('GAME_OVER');
            } else if (engine.isVictory) {
              setGameState('VICTORY');
            }

            // Sync stats to React UI every few frames
            frameCount++;
            if (frameCount % 6 === 0) {
              setStats({ ...engine.stats });
            }
          }

          // Render canvas scene
          renderer.render(
            ctx,
            engine.map,
            engine.player,
            engine.enemies,
            engine.bullets,
            engine.explosions,
            engine.powerUps,
            engine.floatingTexts,
            Math.floor(Date.now() / 250),
            engine.stats.baseDestroyed,
            engine.spawnEffects
          );

          ctx.restore();
        }
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState]);

  // Actions
  const startGame = useCallback((stage: number) => {
    if (engineRef.current) {
      engineRef.current.initStage(stage, true);
      setStats({ ...engineRef.current.stats });
    }
    setGameState('PLAYING');
    setIsPaused(false);
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.initStage(stats.stage, true);
      setStats({ ...engineRef.current.stats });
    }
    setGameState('PLAYING');
    setIsPaused(false);
  }, [stats.stage]);

  const handleNextStage = useCallback(() => {
    const next = stats.stage + 1;
    if (engineRef.current) {
      engineRef.current.initStage(next, false);
      setStats({ ...engineRef.current.stats });
    }
    setGameState('PLAYING');
    setIsPaused(false);
  }, [stats.stage]);

  const togglePause = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    setIsPaused(prev => {
      const next = !prev;
      if (engineRef.current) {
        engineRef.current.isPaused = next;
      }
      return next;
    });
  }, [gameState]);

  const toggleMute = useCallback(() => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-amber-500 selection:text-zinc-950 font-sans">
      {/* Universal Top Bar Contract: Zone 1 (Wordmark) | Zone 2 (Nav links) | Zone 3 (Action) */}
      <header className="h-14 border-b border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-xs bg-amber-500 flex items-center justify-center text-zinc-950 font-black text-xs shadow-sm">
            ▲
          </div>
          <span className="font-mono font-bold tracking-tight text-white text-base">
            Battle City 1990
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-medium text-zinc-400">
          <button
            onClick={() => setShowHelp(false)}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            Đấu Trường
          </button>
          <button
            onClick={() => setShowHelp(prev => !prev)}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            Luật Chơi & Phím Tắt
          </button>
          <button
            onClick={() => {
              if (engineRef.current) {
                const next = (stats.stage % 3) + 1;
                engineRef.current.initStage(next, false);
                setStats({ ...engineRef.current.stats });
              }
            }}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            Đổi Màn (Stage {stats.stage})
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCrtEffect(prev => !prev)}
            title="Bật/Tắt hiệu ứng màn hình CRT cổ điển"
            className={`p-2 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
              crtEffect
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Tv className="w-4 h-4" />
          </button>

          <button
            onClick={toggleMute}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="p-2 rounded-lg text-xs font-mono bg-zinc-900 text-zinc-300 border border-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleRestart}
            title="Chơi lại ván này"
            className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-mono font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Chơi lại</span>
          </button>
        </div>
      </header>

      {/* Main Game Arena Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center">
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 sm:gap-6">
          {/* Arcade Canvas Frame */}
          <div className="relative flex flex-col items-center">
            {/* The Outer NES / Arcade Cabinet Frame */}
            <div className="relative p-2 sm:p-3 bg-zinc-900 rounded-2xl border-2 border-zinc-800 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.05)] overflow-hidden">
              {/* Optional Subtle CRT scanlines */}
              {crtEffect && (
                <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px]" />
              )}

              {/* Pause overlay watermark */}
              {isPaused && (
                <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center pointer-events-none">
                  <div className="py-2 px-6 bg-zinc-900 border border-amber-500/50 rounded-xl text-amber-400 font-mono font-black tracking-widest text-lg animate-pulse">
                    TẠM DỪNG (PAUSED)
                  </div>
                </div>
              )}

              {/* Title Screen Overlay */}
              {gameState === 'TITLE' && (
                <TitleScreen onStart={startGame} highScore={stats.highScore} />
              )}

              {/* Game Over / Victory Modal */}
              {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
                <GameOverModal
                  stats={stats}
                  isVictory={gameState === 'VICTORY'}
                  onRestart={handleRestart}
                  onNextStage={handleNextStage}
                />
              )}

              {/* Game HTML5 Canvas */}
              <canvas
                ref={canvasRef}
                width={520}
                height={520}
                className="w-[280px] min-[360px]:w-[320px] sm:w-[440px] md:w-[480px] lg:w-[520px] aspect-square bg-black rounded-lg block shadow-inner cursor-crosshair"
              />
            </div>

            {/* Quick Desktop Control hints */}
            <div className="mt-2.5 text-[11px] font-mono text-zinc-400 text-center hidden sm:flex items-center gap-4">
              <span>Di chuyển: <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">WASD</kbd> / <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">Mũi tên</kbd></span>
              <span>Bắn đạn: <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">SPACE</kbd></span>
              <span>Tạm dừng: <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">P</kbd></span>
            </div>
          </div>

          {/* Side HUD Panel */}
          <div className="w-full max-w-[520px] lg:w-52">
            <ScoreBoard
              stats={stats}
              isPaused={isPaused}
              isMuted={isMuted}
              onTogglePause={togglePause}
              onToggleMute={toggleMute}
              onRestart={handleRestart}
            />
          </div>
        </div>

        {/* Rules & Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="max-w-lg w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-mono font-bold text-base text-amber-400">HƯỚNG DẪN BẮN XE TĂNG</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-zinc-400 hover:text-white font-mono text-sm cursor-pointer"
                >
                  ✕ Đóng
                </button>
              </div>

              <div className="space-y-3 text-xs font-mono text-zinc-300 leading-relaxed">
                <div>
                  <strong className="text-white">1. Mục Tiêu Tối Thượng:</strong>
                  <p className="text-zinc-400 mt-0.5">
                    Bảo vệ Nhà Đại Bản Doanh mang hình tượng "Con Đại Bàng" ở trung tâm phía dưới bản đồ. Nếu đại bàng bị đạn bắn trúng, trò chơi lập tức Game Over!
                  </p>
                </div>
                <div>
                  <strong className="text-white">2. Quy Tắc Bắn Đạn:</strong>
                  <p className="text-zinc-400 mt-0.5">
                    Tại mỗi thời điểm, xe người chơi chỉ được bắn đúng 1 viên đạn trên sân. Chỉ khi đạn chạm mục tiêu phát nổ, bạn mới có thể bắn tiếp viên thứ hai!
                  </p>
                </div>
                <div>
                  <strong className="text-white">3. Tương Tác Địa Hình:</strong>
                  <p className="text-zinc-400 mt-0.5">
                    • Tường gạch đỏ: Bắn là vỡ thành đường đi.<br />
                    • Tường thép xám: Đạn nảy tắt, không thể phá hủy bằng đạn thường.<br />
                    • Bụi cây xanh: Xe tăng có thể đi xuyên và ẩn nấp phục kích.<br />
                    • Mặt nước: Đạn bay qua được, xe tăng không thể vượt qua.
                  </p>
                </div>
                <div>
                  <strong className="text-white">4. Vật Phẩm Ngẫu Nhiên (Power-ups):</strong>
                  <p className="text-zinc-400 mt-0.5">
                    Khi tiêu diệt xe tăng địch màu đỏ nhấp nháy, sẽ rơi ngẫu nhiên 1 trong 4 vật phẩm:<br />
                    • ⛏️ <strong>Xẻng</strong>: Tạm thời biến toàn bộ tường quanh nhà Đại Bàng thành tường thép trong 10 giây!<br />
                    • ★ <strong>Ngôi sao</strong>: Tăng tốc độ bay của viên đạn người chơi.<br />
                    • 💣 <strong>Lựu đạn</strong>: Bùm nổ tung diệt sạch toàn bộ xe tăng địch trên màn hình!<br />
                    • 🛡️ <strong>Cái khiên</strong>: Kích hoạt khiên bất tử hoàn toàn trong 5 giây.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold rounded-xl transition-colors cursor-pointer"
              >
                ĐÃ HIỂU, TIẾP TỤC CHƠI!
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Virtual Touch Controls (Always available on mobile / small preview frames) */}
      <footer className="w-full lg:hidden sticky bottom-0 z-30">
        <TouchControls
          onInputChange={fn => {
            inputRef.current = fn(inputRef.current);
          }}
          onFirePress={() => {
            inputRef.current.fire = true;
          }}
        />
      </footer>
    </div>
  );
}
