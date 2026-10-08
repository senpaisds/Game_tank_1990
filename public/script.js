/**
 * BATTLE CITY 1990 - PURE JAVASCRIPT EDITION
 * All game logic, retro sound effects, detailed pixel art renderer, and controls in pure vanilla JS.
 * Fully compatible with GitHub Pages, local file execution, and modern browsers without any bundlers.
 */

// ==========================================
// CONSTANTS & ENUMS
// ==========================================
const MAP_SIZE = 26; // 26x26 tiles grid

const TileType = {
  EMPTY: 0,
  BRICK: 1,
  STEEL: 2,
  WATER: 3,
  BUSH: 4,
  ICE: 5,
  EAGLE_INTACT: 8,
  EAGLE_DESTROYED: 9,
};

// ==========================================
// 8-BIT AUDIO SYNTHESIZER (WEB AUDIO API)
// ==========================================
class SoundController {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  playShoot(isPlayer = true) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isPlayer ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(isPlayer ? 480 : 340, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  playBrickHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.08);
    } catch {}
  }

  playSteelHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.07);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  playExplosion(isBig = true) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const duration = isBig ? 0.35 : 0.2;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.linearRampToValueAtTime(60, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isBig ? 0.4 : 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + duration);
    } catch {}
  }

  playPowerUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [392, 523, 659, 784, 1046];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.06 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.13);
      });
    } catch {}
  }

  playStageIntro() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const notes = [
        { f: 392.0, d: 0.12 },
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.24 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.35 },
      ];
      let time = this.ctx.currentTime;
      notes.forEach((item) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(item.f, time);

        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + item.d - 0.02);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + item.d);
        time += item.d;
      });
    } catch {}
  }

  playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const notes = [
        { f: 440, d: 0.18 },
        { f: 415, d: 0.18 },
        { f: 392, d: 0.18 },
        { f: 349, d: 0.4 },
      ];
      let time = this.ctx.currentTime;
      notes.forEach((item) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(item.f, time);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + item.d - 0.02);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + item.d);
        time += item.d;
      });
    } catch {}
  }
}

const sounds = new SoundController();

// ==========================================
// MAP GENERATION & STAGE DEFINITIONS
// ==========================================
function setEagleFortress(map, tileType) {
  map[23][11] = tileType;
  map[23][12] = tileType;
  map[23][13] = tileType;
  map[23][14] = tileType;
  map[24][11] = tileType;
  map[25][11] = tileType;
  map[24][14] = tileType;
  map[25][14] = tileType;
}

function createEmptyMap() {
  const map = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(TileType.EMPTY));
  map[24][12] = TileType.EAGLE_INTACT;
  map[24][13] = TileType.EAGLE_INTACT;
  map[25][12] = TileType.EAGLE_INTACT;
  map[25][13] = TileType.EAGLE_INTACT;
  setEagleFortress(map, TileType.BRICK);
  return map;
}

function fillBlock(map, rStart, rEnd, cStart, cEnd, type) {
  for (let r = rStart; r <= rEnd; r++) {
    for (let c = cStart; c <= cEnd; c++) {
      if (r >= 0 && r < MAP_SIZE && c >= 0 && c < MAP_SIZE) {
        if (map[r][c] !== TileType.EAGLE_INTACT && map[r][c] !== TileType.EAGLE_DESTROYED) {
          map[r][c] = type;
        }
      }
    }
  }
}

function getStage1Map() {
  const map = createEmptyMap();
  const cols = [2, 6, 10, 14, 18, 22];
  cols.forEach(c => {
    fillBlock(map, 2, 7, c, c + 1, TileType.BRICK);
    fillBlock(map, 9, 14, c, c + 1, TileType.BRICK);
    fillBlock(map, 16, 20, c, c + 1, TileType.BRICK);
  });
  fillBlock(map, 11, 12, 12, 13, TileType.STEEL);
  fillBlock(map, 11, 12, 0, 1, TileType.STEEL);
  fillBlock(map, 11, 12, 24, 25, TileType.STEEL);
  fillBlock(map, 22, 23, 6, 7, TileType.BRICK);
  fillBlock(map, 22, 23, 18, 19, TileType.BRICK);
  return map;
}

function getStage2Map() {
  const map = createEmptyMap();
  fillBlock(map, 12, 13, 0, 7, TileType.WATER);
  fillBlock(map, 12, 13, 10, 15, TileType.WATER);
  fillBlock(map, 12, 13, 18, 25, TileType.WATER);
  fillBlock(map, 12, 13, 8, 9, TileType.BRICK);
  fillBlock(map, 12, 13, 16, 17, TileType.BRICK);
  fillBlock(map, 2, 5, 2, 5, TileType.BRICK);
  fillBlock(map, 2, 5, 20, 23, TileType.BRICK);
  fillBlock(map, 2, 5, 11, 14, TileType.STEEL);
  fillBlock(map, 7, 10, 6, 9, TileType.BUSH);
  fillBlock(map, 7, 10, 16, 19, TileType.BUSH);
  fillBlock(map, 16, 19, 10, 15, TileType.BUSH);
  fillBlock(map, 16, 19, 2, 3, TileType.STEEL);
  fillBlock(map, 16, 19, 22, 23, TileType.STEEL);
  fillBlock(map, 18, 21, 6, 7, TileType.BRICK);
  fillBlock(map, 18, 21, 18, 19, TileType.BRICK);
  return map;
}

function getStage3Map() {
  const map = createEmptyMap();
  fillBlock(map, 2, 3, 2, 23, TileType.BRICK);
  fillBlock(map, 5, 18, 2, 3, TileType.BRICK);
  fillBlock(map, 5, 18, 22, 23, TileType.BRICK);
  fillBlock(map, 7, 8, 7, 8, TileType.STEEL);
  fillBlock(map, 7, 8, 17, 18, TileType.STEEL);
  fillBlock(map, 15, 16, 7, 8, TileType.STEEL);
  fillBlock(map, 15, 16, 17, 18, TileType.STEEL);
  fillBlock(map, 6, 10, 11, 14, TileType.BRICK);
  fillBlock(map, 13, 17, 11, 14, TileType.BRICK);
  fillBlock(map, 9, 14, 5, 6, TileType.BRICK);
  fillBlock(map, 9, 14, 19, 20, TileType.BRICK);
  fillBlock(map, 20, 23, 2, 4, TileType.BUSH);
  fillBlock(map, 20, 23, 21, 23, TileType.BUSH);
  return map;
}

function getStageMap(stage) {
  const normalized = ((stage - 1) % 3) + 1;
  if (normalized === 1) return getStage1Map();
  if (normalized === 2) return getStage2Map();
  return getStage3Map();
}

// ==========================================
// DETAILED PIXEL ART GAME RENDERER
// ==========================================
class GameRenderer {
  constructor(tileSize = 20) {
    this.tileSize = tileSize;
  }

  setTileSize(size) {
    this.tileSize = size;
  }

  render(ctx, map, player, enemies, bullets, explosions, powerUps, floatingTexts, waterFrame, isEagleDestroyed, spawnEffects = []) {
    const S = this.tileSize;
    const canvasWidth = MAP_SIZE * S;
    const canvasHeight = MAP_SIZE * S;

    // 1. Dark arena background
    ctx.fillStyle = '#06080c';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Subtle arena inner frame border
    ctx.strokeStyle = '#1e2430';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvasWidth - 1, canvasHeight - 1);

    // 2. Ground tiles
    for (let r = 0; r < MAP_SIZE; r++) {
      for (let c = 0; c < MAP_SIZE; c++) {
        const tile = map[r][c];
        const x = c * S;
        const y = r * S;

        if (tile === TileType.BRICK) {
          this.drawBrick(ctx, x, y, S);
        } else if (tile === TileType.STEEL) {
          this.drawSteel(ctx, x, y, S);
        } else if (tile === TileType.WATER) {
          this.drawWater(ctx, x, y, S, waterFrame);
        } else if (tile === TileType.ICE) {
          this.drawIce(ctx, x, y, S);
        }
      }
    }

    // 3. Eagle Base (2x2 tiles at row 24, col 12)
    const eagleX = 12 * S;
    const eagleY = 24 * S;
    const eagleSize = 2 * S;
    this.drawEagle(ctx, eagleX, eagleY, eagleSize, isEagleDestroyed);

    // 4. Power-Up badges
    powerUps.forEach(p => this.drawPowerUp(ctx, p, S));

    // 5. Spawn Star Warning Indicators
    spawnEffects.forEach(sp => {
      this.drawSpawnStar(ctx, sp.x + S, sp.y + S, S * 1.5, sp.framesLeft);
    });

    // 6. Tanks (Enemies first, then Player)
    enemies.forEach(enemy => {
      this.drawTank(ctx, enemy, S);
    });

    if (player) {
      this.drawTank(ctx, player, S);
    }

    // 7. Bullets
    bullets.forEach(b => this.drawBullet(ctx, b, S));

    // 8. Forest Bushes layer (tanks drive underneath)
    for (let r = 0; r < MAP_SIZE; r++) {
      for (let c = 0; c < MAP_SIZE; c++) {
        if (map[r][c] === TileType.BUSH) {
          this.drawBush(ctx, c * S, r * S, S);
        }
      }
    }

    // 9. Explosions (Orange-yellow circular explosions)
    explosions.forEach(exp => this.drawExplosion(ctx, exp));

    // 10. Floating texts
    floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.opacity));
      ctx.font = 'bold 12px "Press Start 2P", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  drawSpawnStar(ctx, cx, cy, maxSize, framesLeft) {
    const cycle = Math.floor(framesLeft / 5) % 4;
    let scale = 0.35;
    if (cycle === 1 || cycle === 3) scale = 0.7;
    else if (cycle === 2) scale = 1.0;

    const r = (maxSize / 2) * scale;
    ctx.save();
    ctx.fillStyle = cycle % 2 === 0 ? '#facc15' : '#ffffff';

    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.28, cy - r * 0.28);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx + r * 0.28, cy + r * 0.28);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r * 0.28, cy + r * 0.28);
    ctx.lineTo(cx - r, cy);
    ctx.lineTo(cx - r * 0.28, cy - r * 0.28);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 2, cy - 2, 4, 4);
    ctx.restore();
  }

  drawBrick(ctx, x, y, s) {
    const px = Math.round(x);
    const py = Math.round(y);
    const ps = Math.round(s);

    ctx.fillStyle = '#160502';
    ctx.fillRect(px, py, ps, ps);

    this.renderBrickCourse(ctx, px, py, ps, 4, false);
    this.renderBrickCourse(ctx, px, py + 5, ps, 4, true);
    this.renderBrickCourse(ctx, px, py + 10, ps, 4, false);
    this.renderBrickCourse(ctx, px, py + 15, ps, 4, true);
  }

  renderBrickCourse(ctx, bx, by, width, courseH, staggered) {
    if (!staggered) {
      this.drawSingleBrick(ctx, bx, by, 9, courseH);
      this.drawSingleBrick(ctx, bx + 10, by, 9, courseH);
    } else {
      this.drawSingleBrick(ctx, bx, by, 4, courseH);
      this.drawSingleBrick(ctx, bx + 5, by, 9, courseH);
      this.drawSingleBrick(ctx, bx + 15, by, 4, courseH);
    }
  }

  drawSingleBrick(ctx, bx, by, w, h) {
    ctx.fillStyle = '#b93816';
    ctx.fillRect(bx, by, w, h);
    ctx.fillStyle = '#f0643b';
    ctx.fillRect(bx, by, w, 1);
    ctx.fillStyle = '#d94f28';
    ctx.fillRect(bx, by, 1, h);
    ctx.fillStyle = '#5c1403';
    ctx.fillRect(bx, by + h - 1, w, 1);
    ctx.fillRect(bx + w - 1, by, 1, h);
  }

  drawSteel(ctx, x, y, s) {
    const px = Math.round(x);
    const py = Math.round(y);
    const ps = Math.round(s);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px, py, ps, ps);

    const quadSize = 9;
    const offsets = [
      [0, 0],
      [10, 0],
      [0, 10],
      [10, 10],
    ];

    offsets.forEach(([ox, oy]) => {
      const qx = px + ox;
      const qy = py + oy;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(qx, qy, quadSize, quadSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qx, qy, quadSize, 1.5);
      ctx.fillRect(qx, qy, 1.5, quadSize);
      ctx.fillStyle = '#475569';
      ctx.fillRect(qx, qy + quadSize - 1.5, quadSize, 1.5);
      ctx.fillRect(qx + quadSize - 1.5, qy, 1.5, quadSize);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(qx + 2, qy + 2, quadSize - 4, quadSize - 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(qx + quadSize / 2 - 1, qy + quadSize / 2 - 1, 2, 2);
    });
  }

  drawWater(ctx, x, y, s, frame) {
    const px = Math.round(x);
    const py = Math.round(y);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(px, py, s, s);

    const waveShift = (frame % 2) * 3;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(px + waveShift, py + 3, 6, 2);
    ctx.fillRect(px + 10 - waveShift, py + 8, 7, 2);
    ctx.fillRect(px + waveShift + 2, py + 14, 6, 2);

    ctx.fillStyle = '#0369a1';
    ctx.fillRect(px + waveShift, py + 5, 6, 1);
    ctx.fillRect(px + 10 - waveShift, py + 10, 7, 1);
  }

  drawIce(ctx, x, y, s) {
    const px = Math.round(x);
    const py = Math.round(y);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(px, py, s, s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 2, py + 2, 6, 2);
    ctx.fillRect(px + 11, py + 9, 7, 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(px + 4, py + 13, 8, 1);
  }

  drawBush(ctx, x, y, s) {
    const px = Math.round(x);
    const py = Math.round(y);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(px, py, s, s);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(px + 1, py + 1, 5, 4);
    ctx.fillRect(px + 11, py + 2, 6, 4);
    ctx.fillRect(px + 5, py + 9, 7, 5);
    ctx.fillRect(px + 2, py + 14, 5, 4);
    ctx.fillRect(px + 12, py + 13, 6, 5);

    ctx.fillStyle = '#14532d';
    ctx.fillRect(px + 6, py + 4, 3, 3);
    ctx.fillRect(px + 2, py + 8, 3, 3);
    ctx.fillRect(px + 14, py + 9, 3, 3);
  }

  drawEagle(ctx, x, y, size, isDestroyed) {
    const px = Math.round(x);
    const py = Math.round(y);

    if (isDestroyed) {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(px, py, size, size);
      ctx.fillStyle = '#78716c';
      ctx.fillRect(px + 4, py + size - 8, size - 8, 6);
      ctx.fillRect(px + 8, py + size - 14, size - 16, 6);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(px + 10, py + size - 18, 8, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px + 16, py + size - 10, 4, 2);
      ctx.fillRect(px + 24, py + size - 12, 3, 3);
      return;
    }

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px, py, size, size);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);

    ctx.fillStyle = '#b45309';
    ctx.fillRect(px + 3, py + size - 10, size - 6, 8);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(px + 5, py + size - 9, size - 10, 3);

    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(px + 3, py + 6, 9, 14);
    ctx.fillRect(px + 5, py + 4, 7, 5);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(px + 2, py + 6, 2, 12);

    ctx.fillStyle = '#eab308';
    ctx.fillRect(px + size - 11, py + 6, 9, 14);
    ctx.fillRect(px + size - 11, py + 4, 7, 5);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(px + size - 4, py + 6, 2, 12);

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + size / 2 - 6, py + 6, 12, 18);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + size / 2 - 5, py + 3, 10, 8);
    ctx.fillRect(px + size / 2 - 3, py + 1.5, 6, 3);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px + size / 2 - 2, py + 2, 4, 5);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px + size / 2 - 1, py + 5, 2, 2);

    ctx.fillStyle = '#000000';
    ctx.fillRect(px + size / 2 - 4, py + 5, 2, 2);
    ctx.fillRect(px + size / 2 + 2, py + 5, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + size / 2 - 4, py + 5, 1, 1);
    ctx.fillRect(px + size / 2 + 3, py + 5, 1, 1);

    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(px + size / 2 - 4, py + 14, 8, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(px + size / 2 - 3, py + 15, 6, 6);

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + size / 2 - 1, py + 16, 2, 4);
    ctx.fillRect(px + size / 2 - 2, py + 17, 4, 2);
  }

  /**
   * Pixel Art Detailed Tank Renderer
   */
  drawTank(ctx, tank, s) {
    const tankSize = s * 2 - 2; // 38px
    const half = tankSize / 2;

    const cx = Math.round(tank.x + half);
    const cy = Math.round(tank.y + half);

    ctx.save();
    ctx.translate(cx, cy);

    let angle = 0;
    if (tank.direction === 'RIGHT') angle = Math.PI / 2;
    else if (tank.direction === 'DOWN') angle = Math.PI;
    else if (tank.direction === 'LEFT') angle = -Math.PI / 2;
    ctx.rotate(angle);

    let hullBase = '#2e6334';
    let hullHighlight = '#42884a';
    let hullShadow = '#143819';
    let secondaryAccent = '#d4af37';
    let secondaryLight = '#fde047';
    let turretBase = '#a8731d';
    let turretTop = '#c68d2b';
    let barrelBase = '#8a5c18';
    let trackBase = '#131920';
    let trackLink = '#e5c07b';

    if (tank.isPlayer) {
      hullBase = '#2e6334';
      hullHighlight = '#42884a';
      hullShadow = '#143819';
      secondaryAccent = '#d4af37';
      secondaryLight = '#fde047';
      turretBase = '#a8731d';
      turretTop = '#c68d2b';
      barrelBase = '#8a5c18';
      trackBase = '#131920';
      trackLink = '#e5c07b';
    } else {
      if (tank.type === 'BASIC') {
        hullBase = '#475569';
        hullHighlight = '#64748b';
        hullShadow = '#334155';
        secondaryAccent = '#dc2626';
        secondaryLight = '#ef4444';
        turretBase = '#1e293b';
        turretTop = '#334155';
        barrelBase = '#1e293b';
        trackBase = '#0f172a';
        trackLink = '#94a3b8';
      } else if (tank.type === 'FAST') {
        hullBase = '#334155';
        hullHighlight = '#475569';
        hullShadow = '#1e293b';
        secondaryAccent = '#f87171';
        secondaryLight = '#fca5a5';
        turretBase = '#0f172a';
        turretTop = '#1e293b';
        barrelBase = '#0f172a';
        trackBase = '#020617';
        trackLink = '#e2e8f0';
      } else if (tank.type === 'POWER') {
        hullBase = '#52525b';
        hullHighlight = '#71717a';
        hullShadow = '#27272a';
        secondaryAccent = '#ef4444';
        secondaryLight = '#f87171';
        turretBase = '#27272a';
        turretTop = '#3f3f46';
        barrelBase = '#18181b';
        trackBase = '#09090b';
        trackLink = '#fca5a5';
      } else if (tank.type === 'ARMOR') {
        const hpPalettes = [
          { hull: '#dc2626', turret: '#991b1b', accent: '#ffffff' },
          { hull: '#ea580c', turret: '#9a3412', accent: '#fef08a' },
          { hull: '#ca8a04', turret: '#854d0e', accent: '#ffffff' },
          { hull: '#15803d', turret: '#14532d', accent: '#86efac' },
        ];
        const p = hpPalettes[Math.max(0, Math.min(hpPalettes.length - 1, (tank.health || 1) - 1))];
        hullBase = p.hull;
        hullHighlight = '#f8fafc';
        hullShadow = '#0f172a';
        secondaryAccent = p.accent;
        secondaryLight = '#ffffff';
        turretBase = p.turret;
        turretTop = '#334155';
        barrelBase = '#0f172a';
        trackBase = '#0f172a';
        trackLink = '#f87171';
      }

      // Blinking item carrier tank
      if (tank.hasItem) {
        const blink = Math.floor(Date.now() / 110) % 2 === 0;
        if (blink) {
          hullBase = '#dc2626';
          hullHighlight = '#f87171';
          secondaryAccent = '#ffffff';
          secondaryLight = '#fef08a';
          turretBase = '#991b1b';
          turretTop = '#b91c1c';
          barrelBase = '#7f1d1d';
        } else {
          hullBase = '#ffffff';
          hullHighlight = '#f1f5f9';
          secondaryAccent = '#dc2626';
          secondaryLight = '#ef4444';
          turretBase = '#cbd5e1';
          turretTop = '#e2e8f0';
          barrelBase = '#475569';
        }
      }
    }

    // 1. TRACKS
    const trackW = 7;
    const trackH = tankSize;
    const leftTrackX = -half;
    const rightTrackX = half - trackW;

    ctx.fillStyle = trackBase;
    ctx.fillRect(leftTrackX, -half, trackW, trackH);
    ctx.fillRect(rightTrackX, -half, trackW, trackH);

    ctx.strokeStyle = '#090d12';
    ctx.lineWidth = 1;
    ctx.strokeRect(leftTrackX + 0.5, -half + 0.5, trackW - 1, trackH - 1);
    ctx.strokeRect(rightTrackX + 0.5, -half + 0.5, trackW - 1, trackH - 1);

    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(leftTrackX + 1, -half + 1, trackW - 2, 3);
    ctx.fillRect(leftTrackX + 1, half - 4, trackW - 2, 3);
    ctx.fillRect(rightTrackX + 1, -half + 1, trackW - 2, 3);
    ctx.fillRect(rightTrackX + 1, half - 4, trackW - 2, 3);

    const animOffset = (tank.trackFrame || 0) * 3;
    const numLinks = 6;
    for (let i = 0; i < numLinks; i++) {
      const yLink = -half + 2 + ((i * 6 + animOffset) % (trackH - 4));
      ctx.fillStyle = trackLink;
      ctx.fillRect(leftTrackX + 1.5, yLink, 3, 2);
      ctx.fillRect(leftTrackX + 5, yLink, 1, 2);
      ctx.fillRect(rightTrackX + 1, yLink, 1, 2);
      ctx.fillRect(rightTrackX + 2.5, yLink, 3, 2);

      ctx.fillStyle = '#05070a';
      ctx.fillRect(leftTrackX + 1.5, yLink + 2, 4.5, 1);
      ctx.fillRect(rightTrackX + 1, yLink + 2, 4.5, 1);
    }

    // 2. HULL
    const hullL = -11;
    const hullR = 11;
    const hullT = -16;
    const hullB = 16;
    const bevel = 4;

    ctx.beginPath();
    ctx.moveTo(hullL + bevel, hullT);
    ctx.lineTo(hullR - bevel, hullT);
    ctx.lineTo(hullR, hullT + bevel);
    ctx.lineTo(hullR, hullB - bevel);
    ctx.lineTo(hullR - bevel, hullB);
    ctx.lineTo(hullL + bevel, hullB);
    ctx.lineTo(hullL, hullB - bevel);
    ctx.lineTo(hullL, hullT + bevel);
    ctx.closePath();

    ctx.fillStyle = hullBase;
    ctx.fill();

    ctx.strokeStyle = hullShadow;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.moveTo(hullR, hullT + bevel);
    ctx.lineTo(hullR, hullB - bevel);
    ctx.lineTo(hullR - bevel, hullB);
    ctx.lineTo(hullL + bevel, hullB);
    ctx.lineTo(hullL + bevel, hullB - 2.5);
    ctx.lineTo(hullR - 2.5, hullB - 2.5);
    ctx.lineTo(hullR - 2.5, hullT + bevel);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(hullL + bevel, hullT, (hullR - hullL) - bevel * 2, 1.5);

    ctx.fillStyle = secondaryAccent;
    ctx.fillRect(-7, -13, 14, 3);
    ctx.fillStyle = secondaryLight;
    ctx.fillRect(-6, -13, 12, 1);

    ctx.fillStyle = secondaryAccent;
    ctx.fillRect(-7, 9, 14, 4);
    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(-5, 10, 10, 1);
    ctx.fillRect(-5, 12, 10, 1);

    // 3. BARREL
    const isUpgraded = tank.isPlayer && (tank.tier || 1) > 1;
    const barrelW = isUpgraded ? 5 : 4;
    const barrelLen = isUpgraded ? 19 : 17;
    const barrelStartY = -6;
    const muzzleY = barrelStartY - barrelLen;

    ctx.fillStyle = hullShadow;
    ctx.fillRect(-5, barrelStartY - 3, 10, 4);
    ctx.fillStyle = secondaryAccent;
    ctx.fillRect(-3, barrelStartY - 2, 6, 2);

    ctx.fillStyle = barrelBase;
    ctx.fillRect(-barrelW / 2, muzzleY, barrelW, barrelLen);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(-barrelW / 2, muzzleY, 1, barrelLen);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barrelW / 2 - 1, muzzleY, 1, barrelLen);

    const muzzleW = isUpgraded ? 7 : 6;
    const muzzleH = 3.5;
    ctx.fillStyle = barrelBase;
    ctx.fillRect(-muzzleW / 2, muzzleY - 1, muzzleW, muzzleH);
    ctx.strokeStyle = '#0a0e14';
    ctx.lineWidth = 1;
    ctx.strokeRect(-muzzleW / 2, muzzleY - 1, muzzleW, muzzleH);

    ctx.fillStyle = '#000000';
    ctx.fillRect(-1.5, muzzleY - 1, 3, 1.5);

    // 4. TURRET
    const turretR = 8.5;
    const turretY = 0;
    const tBevel = 3;

    ctx.beginPath();
    ctx.moveTo(-turretR + tBevel, turretY - turretR);
    ctx.lineTo(turretR - tBevel, turretY - turretR);
    ctx.lineTo(turretR, turretY - turretR + tBevel);
    ctx.lineTo(turretR, turretY + turretR - tBevel);
    ctx.lineTo(turretR - tBevel, turretY + turretR);
    ctx.lineTo(-turretR + tBevel, turretY + turretR);
    ctx.lineTo(-turretR, turretY + turretR - tBevel);
    ctx.lineTo(-turretR, turretY - turretR + tBevel);
    ctx.closePath();

    ctx.fillStyle = turretBase;
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = turretTop;
    ctx.fillRect(-5, -5, 10, 10);

    ctx.fillStyle = '#11171d';
    ctx.beginPath();
    ctx.arc(1.5, 1.5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = secondaryAccent;
    ctx.beginPath();
    ctx.arc(1.5, 1.5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-4, -4, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -4, 1, 1);

    if (isUpgraded) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, 3, 2, 2);
    }

    // 5. SPECULAR HIGHLIGHTS
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -14, 2.5, 2.5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(-9, -15, 1.5, 1.5);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -7, 1.5, 1.5);

    ctx.restore();

    // 6. SHIELD AURA
    if (tank.shieldTime > 0) {
      const now = Date.now() / 70;
      ctx.save();
      ctx.strokeStyle = Math.floor(now) % 2 === 0 ? '#38bdf8' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, half + 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(cx, cy, half + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawBullet(ctx, bullet, _s) {
    const bx = Math.round(bullet.x);
    const by = Math.round(bullet.y);

    ctx.save();
    ctx.translate(bx, by);

    let angle = 0;
    if (bullet.direction === 'RIGHT') angle = Math.PI / 2;
    else if (bullet.direction === 'DOWN') angle = Math.PI;
    else if (bullet.direction === 'LEFT') angle = -Math.PI / 2;
    ctx.rotate(angle);

    const isPlayer = bullet.owner === 'PLAYER';
    const mainColor = isPlayer ? '#f59e0b' : '#ef4444';
    const glowColor = isPlayer ? '#fbbf24' : '#f87171';

    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 1.2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = glowColor;
    ctx.fillRect(-1, 3, 2, 2);

    ctx.restore();
  }

  drawExplosion(ctx, exp) {
    const progress = Math.min(1, exp.currentFrame / exp.maxFrames);
    const currentRadius = exp.maxRadius * (0.2 + 0.8 * Math.pow(progress, 0.65));
    const alpha = Math.max(0, 1 - Math.pow(progress, 1.3));

    if (alpha <= 0 || currentRadius <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    const grad = ctx.createRadialGradient(
      exp.x, exp.y, 0,
      exp.x, exp.y, currentRadius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#fef08a');
    grad.addColorStop(0.5, '#facc15');
    grad.addColorStop(0.75, '#f97316');
    grad.addColorStop(0.92, '#ea580c');
    grad.addColorStop(1, 'rgba(220, 38, 38, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    const ringRadius = currentRadius * 1.04;
    ctx.strokeStyle = progress < 0.6 ? '#fde047' : '#fb923c';
    ctx.lineWidth = Math.max(1, (exp.isBig ? 3.5 : 2) * (1 - progress));
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    if (progress < 0.7) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, 1.5 * (1 - progress));
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, currentRadius * 0.45, 0, Math.PI * 2);
      ctx.stroke();
    }

    const sparkCount = exp.isBig ? 10 : 5;
    ctx.fillStyle = progress < 0.5 ? '#fef08a' : '#f97316';
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i * Math.PI * 2) / sparkCount + progress * 1.8;
      const sparkDist = currentRadius * (1.1 + 0.25 * Math.sin(i * 1.5));
      const sx = exp.x + Math.cos(angle) * sparkDist;
      const sy = exp.y + Math.sin(angle) * sparkDist;
      const sparkSize = Math.max(1.5, (exp.isBig ? 3.5 : 2) * (1 - progress));
      ctx.fillRect(sx - sparkSize / 2, sy - sparkSize / 2, sparkSize, sparkSize);
    }

    ctx.restore();
  }

  drawPowerUp(ctx, p, s) {
    if (!p.flashState) return;

    const size = Math.round(s * 1.8);
    const half = Math.floor(size / 2);
    const px = Math.round(p.x - half);
    const py = Math.round(p.y - half);
    const cx = Math.round(p.x);
    const cy = Math.round(p.y);

    ctx.save();

    let borderColor = '#f59e0b';
    let bgColor = '#18181b';
    if (p.type === 'STAR') {
      borderColor = '#eab308';
      bgColor = '#3b1f08';
    } else if (p.type === 'BOMB') {
      borderColor = '#ef4444';
      bgColor = '#3b0d0d';
    } else if (p.type === 'HELMET') {
      borderColor = '#0ea5e9';
      bgColor = '#082f49';
    } else if (p.type === 'SHOVEL') {
      borderColor = '#94a3b8';
      bgColor = '#1e293b';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(px, py, size, size);

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 2, py + 2, 3, 1);
    ctx.fillRect(px + 2, py + 2, 1, 3);

    if (p.type === 'STAR') {
      this.drawPixelStar(ctx, cx, cy, 10);
    } else if (p.type === 'BOMB') {
      this.drawPixelGrenade(ctx, cx, cy);
    } else if (p.type === 'HELMET') {
      this.drawPixelShield(ctx, cx, cy);
    } else if (p.type === 'SHOVEL') {
      this.drawPixelShovel(ctx, cx, cy);
    }

    ctx.restore();
  }

  drawPixelStar(ctx, cx, cy, r) {
    ctx.save();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = cx + Math.cos(outerAngle) * r;
      const y = cy + Math.sin(outerAngle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 2, cy - 2, 4, 4);
    ctx.restore();
  }

  drawPixelGrenade(ctx, cx, cy) {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(cx - 6, cy - 4, 12, 12);
    ctx.fillRect(cx - 5, cy - 6, 10, 2);
    ctx.fillRect(cx - 5, cy + 8, 10, 2);

    ctx.fillStyle = '#052e16';
    ctx.fillRect(cx - 6, cy - 1, 12, 1.5);
    ctx.fillRect(cx - 6, cy + 3, 12, 1.5);
    ctx.fillRect(cx - 2, cy - 4, 1.5, 12);
    ctx.fillRect(cx + 2, cy - 4, 1.5, 12);

    ctx.fillStyle = '#d97706';
    ctx.fillRect(cx - 2, cy - 9, 4, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx + 2, cy - 8, 3, 6);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 6, cy - 10, 4, 4);

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(cx - 4, cy - 4, 8, 2);
  }

  drawPixelShield(ctx, cx, cy) {
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 8);
    ctx.lineTo(cx + 7, cy - 8);
    ctx.lineTo(cx + 7, cy + 1);
    ctx.lineTo(cx, cy + 9);
    ctx.lineTo(cx - 7, cy + 1);
    ctx.closePath();

    ctx.fillStyle = '#0284c7';
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 1.5, cy - 5, 3, 9);
    ctx.fillRect(cx - 5, cy - 2, 10, 3);
  }

  drawPixelShovel(ctx, cx, cy) {
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 5, cy - 8, 10, 6);
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 2);
    ctx.lineTo(cx + 5, cy - 2);
    ctx.lineTo(cx, cy + 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 5, cy - 8, 10, 1.5);
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 1, cy - 7, 2, 5);

    ctx.fillStyle = '#b45309';
    ctx.fillRect(cx - 1.5, cy + 2, 3, 7);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 4, cy + 9, 8, 2);
    ctx.fillRect(cx - 4, cy + 7, 2, 3);
    ctx.fillRect(cx + 2, cy + 7, 2, 3);
  }
}

// ==========================================
// GAME ENGINE
// ==========================================
class GameEngine {
  constructor(tileSize = 20) {
    this.tileSize = tileSize;
    this.map = [];
    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.explosions = [];
    this.powerUps = [];
    this.floatingTexts = [];
    this.spawnEffects = [];

    this.stats = {
      score: 0,
      highScore: 0,
      lives: 3,
      stage: 1,
      enemiesRemaining: 20,
      enemiesDefeated: 0,
      baseDestroyed: false,
      gameWon: false,
    };

    this.isGameOver = false;
    this.isVictory = false;
    this.isPaused = false;

    this.spawnCooldown = 0;
    this.freezeTime = 0;
    this.shovelTime = 0;
    this.waterFrameCounter = 0;
    this.enemySpawnQueue = [];
    this.enemySpawnIndex = 0;
    this.lastSpawnSlot = 0;
    this.firePressedLastFrame = false;

    this.loadHighScore();
    this.initStage(1, true);
  }

  loadHighScore() {
    try {
      const saved = localStorage.getItem('battle_city_highscore');
      if (saved) {
        this.stats.highScore = parseInt(saved, 10) || 0;
      }
    } catch {}
  }

  saveHighScore() {
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      try {
        localStorage.setItem('battle_city_highscore', this.stats.highScore.toString());
      } catch {}
    }
  }

  initStage(stage, resetScoreAndLives = false) {
    this.stats.stage = stage;
    if (resetScoreAndLives) {
      this.stats.score = 0;
      this.stats.lives = 3;
    }
    this.stats.baseDestroyed = false;
    this.stats.gameWon = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.isPaused = false;

    this.map = getStageMap(stage);
    this.bullets = [];
    this.explosions = [];
    this.powerUps = [];
    this.floatingTexts = [];
    this.enemies = [];
    this.spawnEffects = [];
    this.freezeTime = 0;
    this.shovelTime = 0;

    const queue = [];
    for (let i = 0; i < 20; i++) {
      if (i < 10) queue.push('BASIC');
      else if (i < 15) queue.push('FAST');
      else if (i < 18) queue.push('POWER');
      else queue.push('ARMOR');
    }
    this.enemySpawnQueue = queue.sort(() => Math.random() - 0.5);
    this.stats.enemiesRemaining = this.enemySpawnQueue.length;
    this.stats.enemiesDefeated = 0;
    this.enemySpawnIndex = 0;
    this.spawnCooldown = 45;

    this.spawnPlayer();
    sounds.playStageIntro();
  }

  spawnPlayer() {
    const s = this.tileSize;
    this.player = {
      id: 'player',
      x: 8 * s,
      y: 24 * s,
      direction: 'UP',
      speed: 2.2,
      bulletSpeed: 5.5,
      type: 'PLAYER',
      color: '#eab308',
      isPlayer: true,
      health: 1,
      maxHealth: 1,
      shieldTime: 3.5,
      shootCooldown: 0,
      trackFrame: 0,
      tier: 1,
    };
  }

  update(input) {
    if (this.isPaused || this.isGameOver || this.isVictory) {
      return;
    }

    this.waterFrameCounter++;

    // 1. Shovel fortress countdown (10 seconds)
    if (this.shovelTime > 0) {
      this.shovelTime--;
      if (this.shovelTime === 0) {
        setEagleFortress(this.map, TileType.BRICK);
      } else if (this.shovelTime <= 120 && Math.floor(this.shovelTime / 15) % 2 === 0) {
        setEagleFortress(this.map, TileType.BRICK);
      } else if (this.shovelTime <= 120) {
        setEagleFortress(this.map, TileType.STEEL);
      }
    }

    // 2. Freeze time countdown
    if (this.freezeTime > 0) {
      this.freezeTime--;
    }

    // 3. Player input and movement
    if (this.player) {
      this.updatePlayer(input);
    }

    // 4. Warning spawn stars
    this.updateSpawnEffects();

    // 5. Enemy AI & spawning
    this.updateEnemies();

    // 6. Bullets
    this.updateBullets();

    // 7. Explosions
    this.updateExplosions();

    // 8. Power-ups
    this.updatePowerUps();

    // 9. Floating texts
    this.updateFloatingTexts();

    // 10. Check Victory Condition: khi tiêu diệt hết 20 xe địch
    if (
      this.stats.enemiesDefeated >= 20 &&
      this.enemies.length === 0 &&
      this.spawnEffects.length === 0 &&
      !this.stats.baseDestroyed &&
      !this.isGameOver
    ) {
      this.isVictory = true;
      this.stats.gameWon = true;
      this.saveHighScore();
      sounds.playPowerUp();
      this.addFloatingText('Cao  đã đấm Huế thành công', (MAP_SIZE * this.tileSize) / 2, (MAP_SIZE * this.tileSize) / 2, '#facc15');
    }
  }

  updatePlayer(input) {
    if (!this.player) return;

    if (this.player.shieldTime > 0) {
      this.player.shieldTime = Math.max(0, this.player.shieldTime - 1 / 60);
    }

    let dx = 0;
    let dy = 0;
    let newDir = null;

    if (input.up) {
      dy -= 1;
      newDir = 'UP';
    } else if (input.down) {
      dy += 1;
      newDir = 'DOWN';
    } else if (input.left) {
      dx -= 1;
      newDir = 'LEFT';
    } else if (input.right) {
      dx += 1;
      newDir = 'RIGHT';
    }

    if (newDir) {
      this.player.direction = newDir;
      this.moveTank(this.player, dx * this.player.speed, dy * this.player.speed);
      this.player.trackFrame = (this.player.trackFrame + 1) % 2;
    }

    // Strict limit: exactly 1 player bullet on field at a time
    const playerBulletCount = this.bullets.filter(b => b.owner === 'PLAYER').length;
    const canFire = playerBulletCount === 0 && input.fire && !this.firePressedLastFrame;

    if (canFire) {
      this.fireBullet(this.player);
      this.firePressedLastFrame = true;
    } else if (!input.fire) {
      this.firePressedLastFrame = false;
    }
  }

  updateSpawnEffects() {
    const s = this.tileSize;
    const remaining = [];

    for (const sp of this.spawnEffects) {
      sp.framesLeft--;
      if (sp.framesLeft <= 0) {
        let speed = 1.3;
        let health = 1;

        if (sp.type === 'FAST') {
          speed = 2.4;
          health = 1;
        } else if (sp.type === 'POWER') {
          speed = 1.4;
          health = 1;
        } else if (sp.type === 'ARMOR') {
          speed = 1.1;
          health = 4;
        }

        const enemy = {
          id: `enemy_${Date.now()}_${Math.random()}`,
          x: sp.x,
          y: sp.y,
          direction: 'DOWN',
          speed,
          bulletSpeed: sp.type === 'POWER' ? 6.5 : 4.0,
          type: sp.type,
          color: '#ef4444',
          isPlayer: false,
          health,
          maxHealth: health,
          shieldTime: 0,
          shootCooldown: 30 + Math.floor(Math.random() * 60),
          hasItem: sp.hasItem,
          trackFrame: 0,
        };

        this.enemies.push(enemy);
      } else {
        remaining.push(sp);
      }
    }

    this.spawnEffects = remaining;
  }

  updateEnemies() {
    const s = this.tileSize;
    const maxActive = 4; // Max 4 active enemies at once
    const totalActive = this.enemies.length + this.spawnEffects.length;

    if (this.enemySpawnIndex < this.enemySpawnQueue.length && totalActive < maxActive) {
      this.spawnCooldown--;
      if (this.spawnCooldown <= 0) {
        const spawnCols = [0, 12, 24];
        const freeCols = spawnCols.filter(col => {
          const sx = col * s;
          const sy = 0;
          if (this.player && Math.hypot(this.player.x - sx, this.player.y - sy) < s * 2.3) return false;
          if (this.enemies.some(e => Math.hypot(e.x - sx, e.y - sy) < s * 2.3)) return false;
          if (this.spawnEffects.some(sp => Math.hypot(sp.x - sx, sp.y - sy) < s * 2.3)) return false;
          return true;
        });

        if (freeCols.length > 0) {
          const preferredCol = spawnCols[this.lastSpawnSlot];
          const chosenCol = freeCols.includes(preferredCol) ? preferredCol : freeCols[0];
          this.lastSpawnSlot = (this.lastSpawnSlot + 1) % 3;

          const type = this.enemySpawnQueue[this.enemySpawnIndex];
          const hasItem = this.enemySpawnIndex % 4 === 1;

          this.spawnEffects.push({
            id: `spawn_${Date.now()}_${Math.random()}`,
            x: chosenCol * s,
            y: 0,
            type,
            hasItem,
            framesLeft: 55,
            maxFrames: 55,
          });

          this.enemySpawnIndex++;
          this.stats.enemiesRemaining = this.enemySpawnQueue.length - this.enemySpawnIndex;
          this.spawnCooldown = 80;
        } else {
          this.spawnCooldown = 20;
        }
      }
    }

    if (this.freezeTime <= 0) {
      this.enemies.forEach(enemy => {
        this.updateEnemyAI(enemy);
      });
    }
  }

  updateEnemyAI(enemy) {
    if (Math.random() < 0.015) {
      this.pickNewEnemyDirection(enemy);
    }

    let dx = 0;
    let dy = 0;
    if (enemy.direction === 'UP') dy = -enemy.speed;
    else if (enemy.direction === 'DOWN') dy = enemy.speed;
    else if (enemy.direction === 'LEFT') dx = -enemy.speed;
    else if (enemy.direction === 'RIGHT') dx = enemy.speed;

    const moved = this.moveTank(enemy, dx, dy);
    if (!moved) {
      this.pickNewEnemyDirection(enemy);
    } else {
      enemy.trackFrame = (enemy.trackFrame + 1) % 2;
    }

    if (enemy.shootCooldown > 0) {
      enemy.shootCooldown--;
    } else {
      const enemyBulletCount = this.bullets.filter(b => b.shooterId === enemy.id).length;
      if (enemyBulletCount === 0) {
        this.fireBullet(enemy);
        enemy.shootCooldown = 60 + Math.floor(Math.random() * 80);
      }
    }
  }

  pickNewEnemyDirection(enemy) {
    const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    if (Math.random() < 0.4) {
      enemy.direction = 'DOWN';
    } else {
      const remaining = directions.filter(d => d !== enemy.direction);
      enemy.direction = remaining[Math.floor(Math.random() * remaining.length)];
    }
  }

  fireBullet(tank) {
    const s = this.tileSize;
    const tankSize = s * 2;
    let bx = tank.x + tankSize / 2;
    let by = tank.y + tankSize / 2;
    const bSpeed = tank.isPlayer ? (tank.bulletSpeed || 5.5) : 4.0;

    if (tank.direction === 'UP') by = tank.y - 4;
    else if (tank.direction === 'DOWN') by = tank.y + tankSize + 4;
    else if (tank.direction === 'LEFT') bx = tank.x - 4;
    else if (tank.direction === 'RIGHT') bx = tank.x + tankSize + 4;

    this.bullets.push({
      id: `bullet_${Date.now()}_${Math.random()}`,
      x: bx,
      y: by,
      direction: tank.direction,
      speed: bSpeed,
      owner: tank.isPlayer ? 'PLAYER' : 'ENEMY',
      shooterId: tank.id,
      power: 1,
    });

    sounds.playShoot(tank.isPlayer);
  }

  canTankFitAt(tank, testX, testY) {
    const s = this.tileSize;
    const tankSize = s * 2 - 2;
    const mapPx = MAP_SIZE * s;

    if (testX < 0 || testX + tankSize > mapPx || testY < 0 || testY + tankSize > mapPx) {
      return false;
    }

    const inset = 2;
    const minCol = Math.floor((testX + inset) / s);
    const maxCol = Math.floor((testX + tankSize - 1 - inset) / s);
    const minRow = Math.floor((testY + inset) / s);
    const maxRow = Math.floor((testY + tankSize - 1 - inset) / s);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r < 0 || r >= MAP_SIZE || c < 0 || c >= MAP_SIZE) return false;
        const tile = this.map[r][c];
        if (
          tile === TileType.BRICK ||
          tile === TileType.STEEL ||
          tile === TileType.WATER ||
          tile === TileType.EAGLE_INTACT ||
          tile === TileType.EAGLE_DESTROYED
        ) {
          return false;
        }
      }
    }

    const pad = 3;
    const w = tankSize - pad * 2;
    const h = tankSize - pad * 2;

    const isBlockedBy = (other) => {
      const collides = this.checkBoundingBox(
        testX + pad, testY + pad, w, h,
        other.x + pad, other.y + pad, w, h
      );
      if (!collides) return false;

      const wasColliding = this.checkBoundingBox(
        tank.x + pad, tank.y + pad, w, h,
        other.x + pad, other.y + pad, w, h
      );
      if (wasColliding) {
        const curDistSq = (tank.x - other.x) ** 2 + (tank.y - other.y) ** 2;
        const newDistSq = (testX - other.x) ** 2 + (testY - other.y) ** 2;
        if (newDistSq >= curDistSq) {
          return false;
        }
      }
      return true;
    };

    if (tank.isPlayer) {
      for (const enemy of this.enemies) {
        if (isBlockedBy(enemy)) return false;
      }
    } else {
      if (this.player && isBlockedBy(this.player)) return false;
      for (const other of this.enemies) {
        if (other.id !== tank.id && isBlockedBy(other)) return false;
      }
    }

    return true;
  }

  moveTank(tank, dx, dy) {
    const s = this.tileSize;
    const speed = Math.max(Math.abs(dx), Math.abs(dy));
    if (speed === 0) return false;

    let moved = false;

    if (dy !== 0) {
      if (this.canTankFitAt(tank, tank.x, tank.y + dy)) {
        tank.y += dy;
        moved = true;

        const nearestSlotX = Math.round(tank.x / (s / 2)) * (s / 2);
        const diffX = nearestSlotX - tank.x;
        if (Math.abs(diffX) > 0.05 && Math.abs(diffX) <= 4) {
          const nudgeX = Math.sign(diffX) * Math.min(Math.abs(diffX), speed * 0.3);
          if (this.canTankFitAt(tank, tank.x + nudgeX, tank.y)) {
            tank.x += nudgeX;
          }
        }
      } else {
        const snapThreshold = 12;
        const baseSlot = Math.round(tank.x / (s / 2)) * (s / 2);
        const candidates = [
          baseSlot,
          baseSlot - s / 2,
          baseSlot + s / 2,
          baseSlot - s,
          baseSlot + s,
          Math.floor(tank.x / s) * s,
          Math.ceil(tank.x / s) * s,
        ];

        const uniqueCandX = Array.from(new Set(candidates))
          .filter(cand => Math.abs(cand - tank.x) <= snapThreshold)
          .sort((a, b) => Math.abs(a - tank.x) - Math.abs(b - tank.x));

        for (const candX of uniqueCandX) {
          if (this.canTankFitAt(tank, candX, tank.y + dy)) {
            const diffX = candX - tank.x;
            if (Math.abs(diffX) > 0.05) {
              const stepX = Math.sign(diffX) * Math.min(speed, Math.abs(diffX));
              if (this.canTankFitAt(tank, tank.x + stepX, tank.y)) {
                tank.x += stepX;
                moved = true;
              }
            }
            if (Math.abs(candX - tank.x) <= 5) {
              if (this.canTankFitAt(tank, tank.x, tank.y + dy * 0.6)) {
                tank.y += dy * 0.6;
                moved = true;
              }
            }
            break;
          }
        }
      }
    } else if (dx !== 0) {
      if (this.canTankFitAt(tank, tank.x + dx, tank.y)) {
        tank.x += dx;
        moved = true;

        const nearestSlotY = Math.round(tank.y / (s / 2)) * (s / 2);
        const diffY = nearestSlotY - tank.y;
        if (Math.abs(diffY) > 0.05 && Math.abs(diffY) <= 4) {
          const nudgeY = Math.sign(diffY) * Math.min(Math.abs(diffY), speed * 0.3);
          if (this.canTankFitAt(tank, tank.x, tank.y + nudgeY)) {
            tank.y += nudgeY;
          }
        }
      } else {
        const snapThreshold = 12;
        const baseSlot = Math.round(tank.y / (s / 2)) * (s / 2);
        const candidates = [
          baseSlot,
          baseSlot - s / 2,
          baseSlot + s / 2,
          baseSlot - s,
          baseSlot + s,
          Math.floor(tank.y / s) * s,
          Math.ceil(tank.y / s) * s,
        ];

        const uniqueCandY = Array.from(new Set(candidates))
          .filter(cand => Math.abs(cand - tank.y) <= snapThreshold)
          .sort((a, b) => Math.abs(a - tank.y) - Math.abs(b - tank.y));

        for (const candY of uniqueCandY) {
          if (this.canTankFitAt(tank, tank.x + dx, candY)) {
            const diffY = candY - tank.y;
            if (Math.abs(diffY) > 0.05) {
              const stepY = Math.sign(diffY) * Math.min(speed, Math.abs(diffY));
              if (this.canTankFitAt(tank, tank.x, tank.y + stepY)) {
                tank.y += stepY;
                moved = true;
              }
            }
            if (Math.abs(candY - tank.y) <= 5) {
              if (this.canTankFitAt(tank, tank.x + dx * 0.6, tank.y)) {
                tank.x += dx * 0.6;
                moved = true;
              }
            }
            break;
          }
        }
      }
    }

    return moved;
  }

  updateBullets() {
    const s = this.tileSize;
    const mapPx = MAP_SIZE * s;
    const bulletsToKeep = [];

    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      let destroyed = false;

      if (b.direction === 'UP') b.y -= b.speed;
      else if (b.direction === 'DOWN') b.y += b.speed;
      else if (b.direction === 'LEFT') b.x -= b.speed;
      else if (b.direction === 'RIGHT') b.x += b.speed;

      // 1. Boundary check
      if (b.x < 0 || b.x > mapPx || b.y < 0 || b.y > mapPx) {
        this.spawnExplosion(b.x, b.y, false);
        continue;
      }

      // 2. Bullet vs Bullet
      for (let j = i + 1; j < this.bullets.length; j++) {
        const other = this.bullets[j];
        if (b.owner !== other.owner) {
          const dist = Math.hypot(b.x - other.x, b.y - other.y);
          if (dist < 10) {
            destroyed = true;
            this.bullets.splice(j, 1);
            this.spawnExplosion((b.x + other.x) / 2, (b.y + other.y) / 2, false);
            break;
          }
        }
      }
      if (destroyed) continue;

      // 3. Bullet vs Map Grid
      const col = Math.floor(b.x / s);
      const row = Math.floor(b.y / s);

      if (row >= 0 && row < MAP_SIZE && col >= 0 && col < MAP_SIZE) {
        const tile = this.map[row][col];

        if (tile === TileType.EAGLE_INTACT) {
          this.destroyEagle();
          this.spawnExplosion(b.x, b.y, true);
          continue;
        }

        if (tile === TileType.BRICK) {
          this.map[row][col] = TileType.EMPTY;
          const brickCenterX = col * s + s / 2;
          const brickCenterY = row * s + s / 2;
          this.spawnExplosion(brickCenterX, brickCenterY, false);
          sounds.playBrickHit();
          continue;
        }

        if (tile === TileType.STEEL) {
          this.spawnExplosion(b.x, b.y, false);
          sounds.playSteelHit();
          continue;
        }
      }

      // 4. Player bullet vs Enemies
      if (b.owner === 'PLAYER') {
        const hitEnemyIndex = this.enemies.findIndex(enemy =>
          this.checkPointInRect(b.x, b.y, enemy.x, enemy.y, s * 2, s * 2)
        );

        if (hitEnemyIndex !== -1) {
          const enemy = this.enemies[hitEnemyIndex];
          enemy.health--;

          if (enemy.health <= 0) {
            this.enemies.splice(hitEnemyIndex, 1);
            this.stats.enemiesDefeated++;

            let pts = 100;
            if (enemy.type === 'FAST') pts = 200;
            else if (enemy.type === 'POWER') pts = 300;
            else if (enemy.type === 'ARMOR') pts = 400;

            this.stats.score += pts;
            this.saveHighScore();
            this.addFloatingText(`+${pts}`, enemy.x + s, enemy.y, '#facc15');
            this.spawnExplosion(enemy.x + s, enemy.y + s, true);
            sounds.playExplosion(true);

            if (enemy.hasItem) {
              this.spawnPowerUp(enemy.x + s, enemy.y + s);
            }
          } else {
            this.spawnExplosion(b.x, b.y, false);
            sounds.playSteelHit();
          }
          continue;
        }
      }

      // 5. Enemy bullet vs Player
      if (b.owner === 'ENEMY' && this.player) {
        if (this.checkPointInRect(b.x, b.y, this.player.x, this.player.y, s * 2, s * 2)) {
          if (this.player.shieldTime > 0) {
            this.spawnExplosion(b.x, b.y, false);
            sounds.playSteelHit();
          } else {
            this.spawnExplosion(this.player.x + s, this.player.y + s, true);
            sounds.playExplosion(true);
            this.stats.lives--;

            if (this.stats.lives <= 0) {
              this.player = null;
              this.triggerGameOver('Hết mạng!');
            } else {
              this.spawnPlayer();
            }
          }
          continue;
        }
      }

      bulletsToKeep.push(b);
    }

    this.bullets = bulletsToKeep;
  }

  destroyEagle() {
    this.map[24][12] = TileType.EAGLE_DESTROYED;
    this.map[24][13] = TileType.EAGLE_DESTROYED;
    this.map[25][12] = TileType.EAGLE_DESTROYED;
    this.map[25][13] = TileType.EAGLE_DESTROYED;

    const s = this.tileSize;
    this.spawnExplosion(13 * s, 25 * s, true);
    sounds.playExplosion(true);
    this.stats.baseDestroyed = true;
    this.triggerGameOver('Đại Bản Doanh Đã Bị Phá Hủy!');
  }

  triggerGameOver(_reason) {
    this.isGameOver = true;
    this.saveHighScore();
    sounds.playGameOver();
    this.addFloatingText('Bạn ngu vãi cả loz', (MAP_SIZE * this.tileSize) / 2, (MAP_SIZE * this.tileSize) / 2, '#ef4444');
  }

  spawnPowerUp(x, y) {
    const types = ['STAR', 'BOMB', 'HELMET', 'SHOVEL'];
    const selected = types[Math.floor(Math.random() * types.length)];

    this.powerUps.push({
      id: `powerup_${Date.now()}`,
      type: selected,
      x,
      y,
      duration: 600,
      flashState: true,
    });
  }

  updatePowerUps() {
    if (!this.player) return;
    const s = this.tileSize;
    const remaining = [];

    for (const p of this.powerUps) {
      p.duration--;
      p.flashState = p.duration > 120 || Math.floor(p.duration / 8) % 2 === 0;

      const dist = Math.hypot(this.player.x + s - p.x, this.player.y + s - p.y);
      if (dist < s * 1.5) {
        this.applyPowerUp(p.type);
        sounds.playPowerUp();
        this.stats.score += 500;
        continue;
      }

      if (p.duration > 0) {
        remaining.push(p);
      }
    }

    this.powerUps = remaining;
  }

  applyPowerUp(type) {
    if (type === 'STAR' && this.player) {
      this.player.bulletSpeed = Math.min(11.0, (this.player.bulletSpeed || 5.5) + 2.0);
      this.addFloatingText('★ NGÔI SAO: TĂNG TỐC ĐỘ ĐẠN!', this.player.x, this.player.y - 12, '#facc15');
    } else if (type === 'BOMB') {
      const count = this.enemies.length;
      this.enemies.forEach(e => {
        this.spawnExplosion(e.x + this.tileSize, e.y + this.tileSize, true);
        this.stats.score += 200;
        this.stats.enemiesDefeated++;
      });
      this.enemies = [];

      this.spawnEffects.forEach(sp => {
        this.spawnExplosion(sp.x + this.tileSize, sp.y + this.tileSize, true);
        this.stats.score += 100;
        this.stats.enemiesDefeated++;
      });
      this.spawnEffects = [];

      sounds.playExplosion(true);
      this.addFloatingText(`💣 LỰU ĐẠN: BÙM! DIỆT SẠCH ĐỊCH (${count})`, (MAP_SIZE * this.tileSize) / 2, 70, '#ef4444');
    } else if (type === 'HELMET' && this.player) {
      this.player.shieldTime = 5.0;
      this.addFloatingText('🛡️ KHIÊN: BẤT TỬ TRONG 5 GIÂY!', this.player.x, this.player.y - 12, '#38bdf8');
    } else if (type === 'SHOVEL') {
      setEagleFortress(this.map, TileType.STEEL);
      this.shovelTime = 600;
      this.addFloatingText('⛏️ XẺNG: THÉP BẢO VỆ ĐẠI BÀNG 10S!', (MAP_SIZE * this.tileSize) / 2, 23 * this.tileSize - 10, '#e2e8f0');
    }
  }

  spawnExplosion(x, y, isBig) {
    this.explosions.push({
      id: `exp_${Date.now()}_${Math.random()}`,
      x,
      y,
      radius: isBig ? 8 : 4,
      maxRadius: isBig ? 38 : 18,
      currentFrame: 0,
      maxFrames: isBig ? 24 : 14,
      isBig,
    });
  }

  updateExplosions() {
    this.explosions.forEach(exp => exp.currentFrame++);
    this.explosions = this.explosions.filter(exp => exp.currentFrame < exp.maxFrames);
  }

  addFloatingText(text, x, y, color) {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      opacity: 1,
      color,
    });
  }

  updateFloatingTexts() {
    this.floatingTexts.forEach(ft => {
      ft.y -= 0.6;
      ft.opacity -= 0.02;
    });
    this.floatingTexts = this.floatingTexts.filter(ft => ft.opacity > 0);
  }

  checkBoundingBox(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  checkPointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
}

// ==========================================
// DOM UI BINDINGS & MAIN LOOP CONTROLLER
// ==========================================
let engine = null;
let renderer = null;
let gameState = 'TITLE'; // TITLE, PLAYING, GAME_OVER, VICTORY
let isPaused = false;
let isMuted = false;
let crtEffect = false;
let selectedStage = 1;
let animationFrameId = null;

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
  fire: false,
};

// UI Elements references
let canvas, ctx;
let titleScreenEl, gameOverModalEl, helpModalEl, pauseOverlayEl;
let scoreValEl, hiScoreValEl, livesValEl, remainingCountEl, stageBadgeEl;
let modalTitleEl, modalDescEl, modalScoreEl, modalKillsEl, modalStageEl;
let btnToggleCrt, btnToggleMute, btnRestartTop, btnHelpOpen, btnHelpClose, btnHelpConfirm;
let btnStartGame, btnModalRestart, btnModalNext;
let stageButtons = [];

function initGameApp() {
  canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  titleScreenEl = document.getElementById('titleScreen');
  gameOverModalEl = document.getElementById('gameOverModal');
  helpModalEl = document.getElementById('helpModal');
  pauseOverlayEl = document.getElementById('pauseOverlay');

  scoreValEl = document.getElementById('scoreVal');
  hiScoreValEl = document.getElementById('hiScoreVal');
  livesValEl = document.getElementById('livesVal');
  remainingCountEl = document.getElementById('remainingCount');
  stageBadgeEl = document.getElementById('stageBadge');

  modalTitleEl = document.getElementById('modalTitle');
  modalDescEl = document.getElementById('modalDesc');
  modalScoreEl = document.getElementById('modalScore');
  modalKillsEl = document.getElementById('modalKills');
  modalStageEl = document.getElementById('modalStage');

  btnToggleCrt = document.getElementById('btnToggleCrt');
  btnToggleMute = document.getElementById('btnToggleMute');
  btnRestartTop = document.getElementById('btnRestartTop');
  btnHelpOpen = document.getElementById('btnHelpOpen');
  btnHelpClose = document.getElementById('btnHelpClose');
  btnHelpConfirm = document.getElementById('btnHelpConfirm');

  btnStartGame = document.getElementById('btnStartGame');
  btnModalRestart = document.getElementById('btnModalRestart');
  btnModalNext = document.getElementById('btnModalNext');

  stageButtons = [
    document.getElementById('btnStage1'),
    document.getElementById('btnStage2'),
    document.getElementById('btnStage3'),
  ];

  const tileSize = 20;
  engine = new GameEngine(tileSize);
  renderer = new GameRenderer(tileSize);

  setupEventListeners();
  updateUIStats();

  // Start main loop
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(gameLoop);
}

function updateUIStats() {
  if (!engine) return;
  if (scoreValEl) scoreValEl.textContent = engine.stats.score.toString().padStart(6, '0');
  if (hiScoreValEl) hiScoreValEl.textContent = engine.stats.highScore.toString().padStart(6, '0');
  const titleHiScore = document.getElementById('titleHighScore');
  if (titleHiScore) titleHiScore.textContent = engine.stats.highScore.toString();
  if (livesValEl) livesValEl.textContent = Math.max(0, engine.stats.lives).toString();
  if (remainingCountEl) remainingCountEl.textContent = Math.max(0, engine.stats.enemiesRemaining).toString();
  if (stageBadgeEl) stageBadgeEl.textContent = engine.stats.stage.toString();

  // Render Enemy Reserve Icons in HUD
  const gridEl = document.getElementById('enemySlotsGrid');
  if (gridEl) {
    gridEl.innerHTML = '';
    const totalRemaining = Math.max(0, engine.stats.enemiesRemaining);
    for (let i = 0; i < 20; i++) {
      const dot = document.createElement('div');
      dot.className = `w-4 h-4 rounded-xs border text-[9px] flex items-center justify-center font-bold ${
        i < totalRemaining
          ? 'bg-red-500/20 border-red-500/50 text-red-400'
          : 'bg-zinc-950 border-zinc-800 text-zinc-800'
      }`;
      dot.textContent = '▼';
      gridEl.appendChild(dot);
    }
  }
}

function startGame(stage) {
  selectedStage = stage;
  if (engine) {
    engine.initStage(stage, true);
  }
  gameState = 'PLAYING';
  isPaused = false;
  if (titleScreenEl) titleScreenEl.classList.add('hidden');
  if (gameOverModalEl) gameOverModalEl.classList.add('hidden');
  if (pauseOverlayEl) pauseOverlayEl.classList.add('hidden');
  updateUIStats();
}

function restartCurrentStage() {
  if (engine) {
    engine.initStage(engine.stats.stage, true);
  }
  gameState = 'PLAYING';
  isPaused = false;
  if (titleScreenEl) titleScreenEl.classList.add('hidden');
  if (gameOverModalEl) gameOverModalEl.classList.add('hidden');
  if (pauseOverlayEl) pauseOverlayEl.classList.add('hidden');
  updateUIStats();
}

function nextStage() {
  if (engine) {
    const next = engine.stats.stage + 1;
    engine.initStage(next, false);
  }
  gameState = 'PLAYING';
  isPaused = false;
  if (titleScreenEl) titleScreenEl.classList.add('hidden');
  if (gameOverModalEl) gameOverModalEl.classList.add('hidden');
  if (pauseOverlayEl) pauseOverlayEl.classList.add('hidden');
  updateUIStats();
}

function togglePause() {
  if (gameState !== 'PLAYING') return;
  isPaused = !isPaused;
  if (engine) engine.isPaused = isPaused;
  if (pauseOverlayEl) {
    if (isPaused) pauseOverlayEl.classList.remove('hidden');
    else pauseOverlayEl.classList.add('hidden');
  }
}

function showGameOverModal(isVictory) {
  if (!gameOverModalEl || !engine) return;

  const headerIcon = document.getElementById('modalIcon');
  if (headerIcon) {
    headerIcon.textContent = isVictory ? '🏆' : '💀';
    headerIcon.className = `mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 border ${
      isVictory ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'
    }`;
  }

  if (modalTitleEl) {
    modalTitleEl.className = `text-2xl font-black font-mono tracking-wide mb-1 ${isVictory ? 'text-amber-400' : 'text-red-500'}`;
    modalTitleEl.textContent = isVictory ? 'Cao  đã đấm Huế thành công' : 'Bạn ngu vãi cả loz';
  }

  if (modalDescEl) {
    modalDescEl.textContent = isVictory
      ? `Cao  đã đấm Huế thành công! Toàn bộ 20 xe tăng địch ở Màn ${engine.stats.stage} đã bị tiêu diệt hoàn toàn!`
      : engine.stats.baseDestroyed
      ? 'Đại Bản Doanh (Con Đại Bàng) đã bị phá hủy!'
      : 'Xe tăng của bạn đã hết số mạng còn lại!';
  }

  if (modalScoreEl) modalScoreEl.textContent = engine.stats.score.toString();
  if (modalKillsEl) modalKillsEl.textContent = engine.stats.enemiesDefeated.toString();
  if (modalStageEl) modalStageEl.textContent = engine.stats.stage.toString();

  if (btnModalNext) {
    btnModalNext.style.display = isVictory ? 'flex' : 'none';
  }

  gameOverModalEl.classList.remove('hidden');

  // Launch celebration confetti on victory
  if (isVictory && typeof window.confetti === 'function') {
    try {
      window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}
  }
}

let frameCount = 0;

function gameLoop() {
  if (engine && renderer && canvas && ctx) {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
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

    if (gameState === 'PLAYING') {
      engine.update(input);

      if (engine.isGameOver && gameState !== 'GAME_OVER') {
        gameState = 'GAME_OVER';
        showGameOverModal(false);
      } else if (engine.isVictory && gameState !== 'VICTORY') {
        gameState = 'VICTORY';
        showGameOverModal(true);
      }

      frameCount++;
      if (frameCount % 6 === 0) {
        updateUIStats();
      }
    }

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

  animationFrameId = requestAnimationFrame(gameLoop);
}

// Keyboard and Touch setup
function setupEventListeners() {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW') input.up = true;
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') input.down = true;
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true;
    else if (e.code === 'Space') input.fire = true;
    else if (e.code === 'KeyP') togglePause();
    else if (e.code === 'KeyM') toggleMuteUI();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') input.up = false;
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') input.down = false;
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
    else if (e.code === 'Space') input.fire = false;
  });

  // Touch Virtual Controls
  const setupTouchBtn = (id, onStart, onEnd) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onStart();
    });
    el.addEventListener('pointerup', (e) => {
      e.preventDefault();
      onEnd();
    });
    el.addEventListener('pointerleave', (e) => {
      e.preventDefault();
      onEnd();
    });
    el.addEventListener('pointercancel', (e) => {
      e.preventDefault();
      onEnd();
    });
  };

  setupTouchBtn('btnTouchUp', () => { input.up = true; input.down = false; }, () => { input.up = false; });
  setupTouchBtn('btnTouchDown', () => { input.down = true; input.up = false; }, () => { input.down = false; });
  setupTouchBtn('btnTouchLeft', () => { input.left = true; input.right = false; }, () => { input.left = false; });
  setupTouchBtn('btnTouchRight', () => { input.right = true; input.left = false; }, () => { input.right = false; });
  setupTouchBtn('btnTouchFire', () => { input.fire = true; }, () => { input.fire = false; });

  // Top header button listeners
  if (btnToggleCrt) {
    btnToggleCrt.addEventListener('click', () => {
      crtEffect = !crtEffect;
      const overlay = document.getElementById('crtOverlay');
      if (overlay) {
        if (crtEffect) overlay.classList.remove('hidden');
        else overlay.classList.add('hidden');
      }
      btnToggleCrt.classList.toggle('bg-amber-500/10', crtEffect);
      btnToggleCrt.classList.toggle('text-amber-400', crtEffect);
      btnToggleCrt.classList.toggle('border-amber-500/30', crtEffect);
    });
  }

  function toggleMuteUI() {
    isMuted = sounds.toggleMute();
    if (btnToggleMute) {
      btnToggleMute.innerHTML = isMuted ? '🔇' : '🔊';
      btnToggleMute.title = isMuted ? 'Bật âm thanh' : 'Tắt âm thanh';
    }
  }

  if (btnToggleMute) {
    btnToggleMute.addEventListener('click', toggleMuteUI);
  }

  if (btnRestartTop) {
    btnRestartTop.addEventListener('click', restartCurrentStage);
  }

  // Help Modal
  if (btnHelpOpen) btnHelpOpen.addEventListener('click', () => helpModalEl && helpModalEl.classList.remove('hidden'));
  if (btnHelpClose) btnHelpClose.addEventListener('click', () => helpModalEl && helpModalEl.classList.add('hidden'));
  if (btnHelpConfirm) btnHelpConfirm.addEventListener('click', () => helpModalEl && helpModalEl.classList.add('hidden'));

  // Stage select buttons on title
  stageButtons.forEach((btn, idx) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      selectedStage = idx + 1;
      stageButtons.forEach((b, i) => {
        if (i === idx) {
          b.className = 'py-2 px-4 rounded-xl text-xs font-mono font-bold bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 scale-105 cursor-pointer';
        } else {
          b.className = 'py-2 px-4 rounded-xl text-xs font-mono font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer';
        }
      });
    });
  });

  // Start game from title
  if (btnStartGame) {
    btnStartGame.addEventListener('click', () => startGame(selectedStage));
  }

  // Game over modal buttons
  if (btnModalRestart) {
    btnModalRestart.addEventListener('click', restartCurrentStage);
  }
  if (btnModalNext) {
    btnModalNext.addEventListener('click', nextStage);
  }

  // Nav shortcuts
  const navArena = document.getElementById('navArena');
  if (navArena) navArena.addEventListener('click', () => helpModalEl && helpModalEl.classList.add('hidden'));
  const navHelp = document.getElementById('navHelp');
  if (navHelp) navHelp.addEventListener('click', () => helpModalEl && helpModalEl.classList.remove('hidden'));
  const navChangeStage = document.getElementById('navChangeStage');
  if (navChangeStage) {
    navChangeStage.addEventListener('click', () => {
      if (engine) {
        const next = (engine.stats.stage % 3) + 1;
        engine.initStage(next, false);
        updateUIStats();
      }
    });
  }
}

// Auto-run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGameApp);
} else {
  initGameApp();
}
