/**
 * BATTLE CITY 1990 - REALTIME MULTIPLAYER EDITION (PEERJS P2P)
 * Pure Vanilla JavaScript implementation with WebRTC P2P multiplayer via PeerJS,
 * 8-bit sound effects, detailed pixel art tank renderer, and cooperative 2-player mechanics.
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

  playShoot(playerIndex = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = playerIndex === 1 ? 520 : playerIndex === 2 ? 620 : 340;
      osc.type = playerIndex ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
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

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  playExplosion(isBig = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const duration = isBig ? 0.35 : 0.22;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isBig ? 450 : 600, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isBig ? 0.45 : 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch {}
  }

  playPowerUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const freqs = [330, 392, 494, 659];
      let time = this.ctx.currentTime;
      freqs.forEach((f) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, time);

        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.09);
        time += 0.08;
      });
    } catch {}
  }

  playPlayerJoined() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const freqs = [440, 554, 659, 880];
      let time = this.ctx.currentTime;
      freqs.forEach((f) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, time);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.1);
        time += 0.09;
      });
    } catch {}
  }

  playBaseDestroyed() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.62);
    } catch {}
  }

  playStageIntro() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const notes = [
        { f: 261.63, d: 0.12 },
        { f: 329.63, d: 0.12 },
        { f: 392.0, d: 0.12 },
        { f: 523.25, d: 0.2 },
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

  render(ctx, map, player1, player2, enemies, bullets, explosions, powerUps, floatingTexts, waterFrame, isEagleDestroyed, spawnEffects = []) {
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
    if (map) {
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
    }

    // 3. Eagle Base (2x2 tiles at row 24, col 12)
    const eagleX = 12 * S;
    const eagleY = 24 * S;
    const eagleSize = 2 * S;
    this.drawEagle(ctx, eagleX, eagleY, eagleSize, isEagleDestroyed);

    // 4. Power-Up badges
    if (powerUps) {
      powerUps.forEach(p => this.drawPowerUp(ctx, p, S));
    }

    // 5. Spawn Star Warning Indicators
    if (spawnEffects) {
      spawnEffects.forEach(sp => {
        this.drawSpawnStar(ctx, sp.x + S, sp.y + S, S * 1.5, sp.framesLeft);
      });
    }

    // 6. Tanks (Enemies first, then Players)
    if (enemies) {
      enemies.forEach(enemy => {
        this.drawTank(ctx, enemy, S);
      });
    }

    if (player1 && (player1.health === undefined || player1.health > 0)) {
      this.drawTank(ctx, player1, S);
    }

    if (player2 && (player2.health === undefined || player2.health > 0)) {
      this.drawTank(ctx, player2, S);
    }

    // 7. Bullets
    if (bullets) {
      bullets.forEach(b => this.drawBullet(ctx, b, S));
    }

    // 8. Forest Bushes layer (tanks drive underneath)
    if (map) {
      for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
          if (map[r][c] === TileType.BUSH) {
            this.drawBush(ctx, c * S, r * S, S);
          }
        }
      }
    }

    // 9. Explosions (Orange-yellow circular explosions)
    if (explosions) {
      explosions.forEach(exp => this.drawExplosion(ctx, exp));
    }

    // 10. Floating texts
    if (floatingTexts) {
      floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, ft.opacity));
        ctx.font = 'bold 11px "Press Start 2P", monospace, sans-serif';
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

  drawSingleBrick(ctx, x, y, w, h) {
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y, 1, h);

    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(x + 1, y + h - 1, w - 1, 1);
    ctx.fillRect(x + w - 1, y + 1, 1, h - 1);

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 2, y + 2, Math.max(1, w - 4), Math.max(1, h - 3));
  }

  drawSteel(ctx, x, y, s) {
    const px = Math.round(x);
    const py = Math.round(y);
    const half = Math.round(s / 2);

    this.drawSteelPlate(ctx, px, py, half);
    this.drawSteelPlate(ctx, px + half, py, half);
    this.drawSteelPlate(ctx, px, py + half, half);
    this.drawSteelPlate(ctx, px + half, py + half, half);
  }

  drawSteelPlate(ctx, x, y, size) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, size, size);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x, y, size - 1, 1);
    ctx.fillRect(x, y, 1, size - 1);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

    ctx.fillStyle = '#475569';
    ctx.fillRect(x, y + size - 1, size, 1);
    ctx.fillRect(x + size - 1, y, 1, size);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 2, y + 2, 2, 2);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x + size - 4, y + size - 4, 2, 2);
  }

  drawWater(ctx, x, y, s, frame = 0) {
    const px = Math.round(x);
    const py = Math.round(y);
    const ps = Math.round(s);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(px, py, ps, ps);

    ctx.fillStyle = '#38bdf8';
    const shift = (frame % 4) * 3;
    for (let i = 0; i < ps; i += 5) {
      const lineY = py + ((i + shift) % ps);
      ctx.fillRect(px + 2, lineY, ps - 4, 1.5);
    }

    ctx.fillStyle = '#0369a1';
    ctx.fillRect(px, py, ps, 1);
    ctx.fillRect(px, py, 1, ps);
  }

  drawIce(ctx, x, y, s) {
    const px = Math.round(x);
    const py = Math.round(y);
    const ps = Math.round(s);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(px, py, ps, ps);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(px, py, ps, 2);
    ctx.fillRect(px, py, 2, ps);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(px + 4, py + 4, 4, 4);
    ctx.fillRect(px + 12, py + 10, 5, 3);
  }

  drawBush(ctx, x, y, s) {
    const px = Math.round(x);
    const py = Math.round(y);
    const ps = Math.round(s);

    ctx.fillStyle = '#15803d';
    ctx.fillRect(px, py, ps, ps);

    ctx.fillStyle = '#22c55e';
    for (let i = 1; i < ps - 1; i += 4) {
      for (let j = 1; j < ps - 1; j += 4) {
        ctx.fillRect(px + i, py + j, 2, 2);
      }
    }

    ctx.fillStyle = '#86efac';
    ctx.fillRect(px + 3, py + 2, 2, 2);
    ctx.fillRect(px + 11, py + 6, 2, 2);
    ctx.fillRect(px + 7, py + 12, 2, 2);

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
   * Detailed Pixel Art Tank Renderer
   * P1 (Host): Yellow / Golden Sand
   * P2 (Client): Army Green / Emerald
   * Enemies: Steel / Bright Red
   */
  drawTank(ctx, tank, s) {
    if (!tank) return;
    const tankSize = s * 2 - 2; // ~38px
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

    let hullBase = '#a16207';
    let hullHighlight = '#fde047';
    let hullShadow = '#713f12';
    let secondaryAccent = '#eab308';
    let secondaryLight = '#fef08a';
    let turretBase = '#854d0e';
    let turretTop = '#ca8a04';
    let barrelBase = '#713f12';
    let trackBase = '#18181b';
    let trackLink = '#fde047';

    const pIdx = tank.playerIndex || (tank.id === 'player2' ? 2 : (tank.color === '#22c55e' ? 2 : 1));

    if (tank.isPlayer || pIdx === 1 || pIdx === 2) {
      if (pIdx === 2) {
        // Player 2: Army Green palette
        hullBase = '#166534';
        hullHighlight = '#4ade80';
        hullShadow = '#14532d';
        secondaryAccent = '#22c55e';
        secondaryLight = '#86efac';
        turretBase = '#14532d';
        turretTop = '#16a34a';
        barrelBase = '#14532d';
        trackBase = '#18181b';
        trackLink = '#86efac';
      } else {
        // Player 1: Yellow / Golden Sand palette
        hullBase = '#a16207';
        hullHighlight = '#fde047';
        hullShadow = '#713f12';
        secondaryAccent = '#eab308';
        secondaryLight = '#fef08a';
        turretBase = '#854d0e';
        turretTop = '#ca8a04';
        barrelBase = '#713f12';
        trackBase = '#18181b';
        trackLink = '#fde047';
      }
    } else {
      // Enemy Tanks
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
    }

    // Special item-carrier enemy: flashing highlight
    if (tank.hasItem && Math.floor(Date.now() / 150) % 2 === 0) {
      hullBase = '#dc2626';
      hullHighlight = '#fef08a';
      turretBase = '#ef4444';
      secondaryAccent = '#ffffff';
    }

    const trackW = 6;
    const bodyW = tankSize - trackW * 2 - 2;
    const trackH = tankSize - 2;
    const trackTop = -half + 1;

    // 1. TRACKS (LEFT & RIGHT)
    const drawTrack = (tx) => {
      ctx.fillStyle = trackBase;
      ctx.fillRect(tx, trackTop, trackW, trackH);

      ctx.fillStyle = '#000000';
      ctx.fillRect(tx, trackTop, 1, trackH);
      ctx.fillRect(tx + trackW - 1, trackTop, 1, trackH);

      // Moving track ribs
      const ribCount = 6;
      const ribSpacing = trackH / ribCount;
      const offset = (tank.trackFrame || 0) * (ribSpacing / 2);

      for (let i = 0; i < ribCount; i++) {
        const ry = trackTop + ((i * ribSpacing + offset) % trackH);
        ctx.fillStyle = trackLink;
        ctx.fillRect(tx + 1, ry, trackW - 2, 1.5);
        ctx.fillStyle = '#000000';
        ctx.fillRect(tx + 1, ry + 1.5, trackW - 2, 1);
      }
    };

    drawTrack(-half);
    drawTrack(half - trackW);

    // 2. CHASSIS / HULL
    const hullX = -bodyW / 2;
    const hullY = -half + 3;
    const hullH = tankSize - 6;

    // Chassis shadow
    ctx.fillStyle = '#000000';
    ctx.fillRect(hullX - 0.5, hullY - 0.5, bodyW + 1, hullH + 1);

    // Chassis body
    ctx.fillStyle = hullBase;
    ctx.fillRect(hullX, hullY, bodyW, hullH);

    // 3D Beveled corners
    const bevel = 4;
    ctx.fillStyle = hullShadow;
    ctx.beginPath();
    ctx.moveTo(hullX, hullY + hullH - bevel);
    ctx.lineTo(hullX + bevel, hullY + hullH);
    ctx.lineTo(hullX, hullY + hullH);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(hullX + bodyW, hullY + hullH - bevel);
    ctx.lineTo(hullX + bodyW - bevel, hullY + hullH);
    ctx.lineTo(hullX + bodyW, hullY + hullH);
    ctx.closePath();
    ctx.fill();

    // 3D Edge highlights
    ctx.fillStyle = hullHighlight;
    ctx.fillRect(hullX + 1, hullY + 1, bodyW - 2, 1.5);
    ctx.fillRect(hullX + 1, hullY + 1, 1.5, hullH - 3);

    ctx.fillStyle = hullShadow;
    ctx.fillRect(hullX + 1, hullY + hullH - 2, bodyW - 2, 1.5);
    ctx.fillRect(hullX + bodyW - 2, hullY + 1, 1.5, hullH - 3);

    // Engine vents / Hatch details
    ctx.fillStyle = hullShadow;
    ctx.fillRect(hullX + 3, hullY + hullH - 5, bodyW - 6, 2.5);
    ctx.fillStyle = secondaryAccent;
    ctx.fillRect(hullX + 4, hullY + hullH - 4.5, bodyW - 8, 1);

    // 3. BARREL
    const barrelW = 4;
    const barrelL = half + 7;
    const barrelX = -barrelW / 2;
    const barrelY = -barrelL;

    ctx.fillStyle = '#000000';
    ctx.fillRect(barrelX - 1, barrelY - 1, barrelW + 2, barrelL + 1);

    ctx.fillStyle = barrelBase;
    ctx.fillRect(barrelX, barrelY, barrelW, barrelL);

    ctx.fillStyle = secondaryLight;
    ctx.fillRect(barrelX, barrelY, 1, barrelL - 3);

    // Muzzle brake (khấc đầu nòng)
    const muzzleW = 6;
    const muzzleH = 3.5;
    const muzzleX = -muzzleW / 2;
    const muzzleY = barrelY - 1;

    ctx.fillStyle = '#000000';
    ctx.fillRect(muzzleX - 0.5, muzzleY - 0.5, muzzleW + 1, muzzleH + 1);

    ctx.fillStyle = secondaryAccent;
    ctx.fillRect(muzzleX, muzzleY, muzzleW, muzzleH);

    ctx.fillStyle = secondaryLight;
    ctx.fillRect(muzzleX, muzzleY, muzzleW, 1);

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

    // Periscope optics
    ctx.fillStyle = tank.isPlayer && pIdx === 2 ? '#4ade80' : '#38bdf8';
    ctx.fillRect(-4, -4, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -4, 1, 1);

    // 5. SPECULAR HIGHLIGHTS (top-left)
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
      const shieldColor = tank.playerIndex === 2 ? '#4ade80' : '#38bdf8';
      ctx.strokeStyle = Math.floor(now) % 2 === 0 ? shieldColor : '#ffffff';
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

    const isP1 = bullet.owner === 'PLAYER_1' || bullet.shooterId === 'player1';
    const isP2 = bullet.owner === 'PLAYER_2' || bullet.shooterId === 'player2';
    const isPlayer = isP1 || isP2 || bullet.owner === 'PLAYER';

    let mainColor = '#ef4444';
    let glowColor = '#f87171';
    if (isP2) {
      mainColor = '#22c55e';
      glowColor = '#86efac';
    } else if (isPlayer) {
      mainColor = '#f59e0b';
      glowColor = '#fbbf24';
    }

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
    ctx.fillRect(px + 2, py + 2, 2, 2);

    if (p.type === 'STAR') {
      this.drawStarBadge(ctx, cx, cy);
    } else if (p.type === 'BOMB') {
      this.drawBombBadge(ctx, cx, cy);
    } else if (p.type === 'HELMET') {
      this.drawHelmetBadge(ctx, cx, cy);
    } else if (p.type === 'SHOVEL') {
      this.drawShovelBadge(ctx, cx, cy);
    }

    ctx.restore();
  }

  drawStarBadge(ctx, cx, cy) {
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const x1 = cx + Math.cos(a) * 9;
      const y1 = cy + Math.sin(a) * 9;
      if (i === 0) ctx.moveTo(x1, y1);
      else ctx.lineTo(x1, y1);
      const a2 = a + Math.PI / 5;
      const x2 = cx + Math.cos(a2) * 4;
      const y2 = cy + Math.sin(a2) * 4;
      ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 1, cy - 2, 2, 2);
  }

  drawBombBadge(ctx, cx, cy) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - 2, cy - 7, 4, 3);

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.quadraticCurveTo(cx + 4, cy - 9, cx + 5, cy - 10);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 3, cy, 2.5, 2.5);
  }

  drawHelmetBadge(ctx, cx, cy) {
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, Math.PI, 0, false);
    ctx.lineTo(cx + 7, cy + 4);
    ctx.lineTo(cx - 7, cy + 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 5, cy - 4, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 4, cy - 3, 1.5, 1.5);
  }

  drawShovelBadge(ctx, cx, cy) {
    ctx.fillStyle = '#94a3b8';
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
// GAME ENGINE (AUTHORITATIVE MULTIPLAYER & SOLO)
// ==========================================
class GameEngine {
  constructor(tileSize = 20) {
    this.tileSize = tileSize;
    this.map = [];
    this.player1 = null; // Host or Solo (Yellow)
    this.player2 = null; // Client / 2nd player (Green)
    this.isMultiplayer = false;
    this.enemies = [];
    this.bullets = [];
    this.explosions = [];
    this.powerUps = [];
    this.floatingTexts = [];
    this.spawnEffects = [];

    this.stats = {
      score: 0,
      highScore: 0,
      lives: 3, // Shared lives for the whole room
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
    this.p1FirePressedLastFrame = false;
    this.p2FirePressedLastFrame = false;

    this.respawnTimerP1 = 0;
    this.respawnTimerP2 = 0;

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

  setMultiplayerMode(enabled) {
    this.isMultiplayer = enabled;
    if (enabled && !this.player2) {
      this.spawnPlayer(2);
    } else if (!enabled) {
      this.player2 = null;
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
    this.respawnTimerP1 = 0;
    this.respawnTimerP2 = 0;

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

    this.spawnPlayer(1);
    if (this.isMultiplayer) {
      this.spawnPlayer(2);
    } else {
      this.player2 = null;
    }

    sounds.playStageIntro();
  }

  spawnPlayer(playerIndex = 1) {
    const s = this.tileSize;
    const isP1 = playerIndex === 1;

    const tank = {
      id: isP1 ? 'player1' : 'player2',
      playerIndex,
      x: isP1 ? 8 * s : 14 * s,
      y: 24 * s,
      direction: 'UP',
      speed: 2.2,
      bulletSpeed: 5.5,
      type: 'PLAYER',
      color: isP1 ? '#eab308' : '#22c55e',
      isPlayer: true,
      health: 1,
      maxHealth: 1,
      shieldTime: 3.5,
      shootCooldown: 0,
      trackFrame: 0,
      tier: 1,
    };

    if (isP1) {
      this.player1 = tank;
      this.respawnTimerP1 = 0;
    } else {
      this.player2 = tank;
      this.respawnTimerP2 = 0;
    }
  }

  update(p1Input, p2Input = null) {
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

    // 3. Player 1 update
    if (this.player1 && this.player1.health > 0) {
      this.updatePlayerTank(this.player1, p1Input, 1);
    } else if (this.respawnTimerP1 > 0) {
      this.respawnTimerP1--;
      if (this.respawnTimerP1 <= 0 && this.stats.lives > 0) {
        this.stats.lives--;
        this.spawnPlayer(1);
      }
    }

    // 4. Player 2 update
    if (this.isMultiplayer) {
      if (this.player2 && this.player2.health > 0) {
        this.updatePlayerTank(this.player2, p2Input || {}, 2);
      } else if (this.respawnTimerP2 > 0) {
        this.respawnTimerP2--;
        if (this.respawnTimerP2 <= 0 && this.stats.lives > 0) {
          this.stats.lives--;
          this.spawnPlayer(2);
        }
      }
    }

    // 5. Warning spawn stars
    this.updateSpawnEffects();

    // 6. Enemy AI & spawning
    this.updateEnemies();

    // 7. Bullets
    this.updateBullets();

    // 8. Explosions
    this.updateExplosions();

    // 9. Power-ups
    this.updatePowerUps();

    // 10. Floating texts
    this.updateFloatingTexts();

    // 11. Check Victory Condition: khi tiêu diệt hết 20 xe địch
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

    // 12. Check Game Over Condition
    const p1Dead = !this.player1 || this.player1.health <= 0;
    const p2Dead = !this.isMultiplayer || !this.player2 || this.player2.health <= 0;
    if (this.stats.baseDestroyed || (this.stats.lives <= 0 && p1Dead && p2Dead)) {
      if (!this.isGameOver) {
        this.isGameOver = true;
        sounds.playGameOver();
      }
    }
  }

  updatePlayerTank(player, input, playerIndex) {
    if (!player || player.health <= 0) return;

    if (player.shieldTime > 0) {
      player.shieldTime = Math.max(0, player.shieldTime - 1 / 60);
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
      player.direction = newDir;
      this.moveTank(player, dx * player.speed, dy * player.speed);
      player.trackFrame = (player.trackFrame + 1) % 2;
    }

    // Strict limit: exactly 1 bullet per player on field at a time
    const shooterId = player.id;
    const bulletCount = this.bullets.filter(b => b.shooterId === shooterId).length;

    const isFireHeld = !!input.fire;
    const lastPressed = playerIndex === 1 ? this.p1FirePressedLastFrame : this.p2FirePressedLastFrame;
    const canFire = bulletCount === 0 && isFireHeld && !lastPressed;

    if (canFire) {
      this.fireBullet(player);
      if (playerIndex === 1) this.p1FirePressedLastFrame = true;
      else this.p2FirePressedLastFrame = true;
    } else if (!isFireHeld) {
      if (playerIndex === 1) this.p1FirePressedLastFrame = false;
      else this.p2FirePressedLastFrame = false;
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
          if (this.player1 && this.player1.health > 0 && Math.hypot(this.player1.x - sx, this.player1.y - sy) < s * 2.3) return false;
          if (this.player2 && this.player2.health > 0 && Math.hypot(this.player2.x - sx, this.player2.y - sy) < s * 2.3) return false;
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

    const pIdx = tank.playerIndex || (tank.id === 'player2' ? 2 : 1);
    const owner = tank.isPlayer ? (pIdx === 2 ? 'PLAYER_2' : 'PLAYER_1') : 'ENEMY';

    this.bullets.push({
      id: `bullet_${Date.now()}_${Math.random()}`,
      x: bx,
      y: by,
      direction: tank.direction,
      speed: bSpeed,
      owner,
      shooterId: tank.id,
      power: 1,
    });

    sounds.playShoot(tank.isPlayer ? pIdx : 0);
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
      if (!other || other.health <= 0) return false;
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
      // Don't clip into other players or enemies
      const otherPlayer = tank.id === 'player1' ? this.player2 : this.player1;
      if (otherPlayer && isBlockedBy(otherPlayer)) return false;

      for (const enemy of this.enemies) {
        if (isBlockedBy(enemy)) return false;
      }
    } else {
      if (this.player1 && isBlockedBy(this.player1)) return false;
      if (this.player2 && isBlockedBy(this.player2)) return false;
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
    const survivingBullets = [];

    for (const bullet of this.bullets) {
      let vx = 0;
      let vy = 0;
      if (bullet.direction === 'UP') vy = -bullet.speed;
      else if (bullet.direction === 'DOWN') vy = bullet.speed;
      else if (bullet.direction === 'LEFT') vx = -bullet.speed;
      else if (bullet.direction === 'RIGHT') vx = bullet.speed;

      bullet.x += vx;
      bullet.y += vy;

      // Check arena boundaries
      if (bullet.x < 0 || bullet.x > MAP_SIZE * s || bullet.y < 0 || bullet.y > MAP_SIZE * s) {
        this.addExplosion(bullet.x, bullet.y, false);
        sounds.playSteelHit();
        continue;
      }

      // Check Eagle base collision
      const eagleBox = { x: 12 * s, y: 24 * s, w: 2 * s, h: 2 * s };
      if (
        !this.stats.baseDestroyed &&
        this.checkPointInRect(bullet.x, bullet.y, eagleBox.x, eagleBox.y, eagleBox.w, eagleBox.h)
      ) {
        this.stats.baseDestroyed = true;
        this.map[24][12] = TileType.EAGLE_DESTROYED;
        this.map[24][13] = TileType.EAGLE_DESTROYED;
        this.map[25][12] = TileType.EAGLE_DESTROYED;
        this.map[25][13] = TileType.EAGLE_DESTROYED;
        this.addExplosion(13 * s, 25 * s, true);
        sounds.playBaseDestroyed();
        this.isGameOver = true;
        continue;
      }

      // Check tile grid collisions (Brick & Steel)
      const hitTileCol = Math.floor(bullet.x / s);
      const hitTileRow = Math.floor(bullet.y / s);

      if (hitTileRow >= 0 && hitTileRow < MAP_SIZE && hitTileCol >= 0 && hitTileCol < MAP_SIZE) {
        const tile = this.map[hitTileRow][hitTileCol];
        if (tile === TileType.BRICK) {
          this.map[hitTileRow][hitTileCol] = TileType.EMPTY;
          this.addExplosion(bullet.x, bullet.y, false);
          sounds.playBrickHit();
          continue;
        } else if (tile === TileType.STEEL) {
          this.addExplosion(bullet.x, bullet.y, false);
          sounds.playSteelHit();
          continue;
        }
      }

      // Check tank collisions
      const isPlayerBullet = bullet.owner === 'PLAYER_1' || bullet.owner === 'PLAYER_2' || bullet.owner === 'PLAYER';

      if (isPlayerBullet) {
        let hitEnemy = null;
        for (const enemy of this.enemies) {
          const tankSize = s * 2 - 2;
          if (this.checkPointInRect(bullet.x, bullet.y, enemy.x, enemy.y, tankSize, tankSize)) {
            hitEnemy = enemy;
            break;
          }
        }

        if (hitEnemy) {
          hitEnemy.health -= bullet.power || 1;
          this.addExplosion(bullet.x, bullet.y, false);

          if (hitEnemy.health <= 0) {
            this.addExplosion(hitEnemy.x + s, hitEnemy.y + s, true);
            sounds.playExplosion(true);
            this.enemies = this.enemies.filter(e => e.id !== hitEnemy.id);
            this.stats.enemiesDefeated++;

            // Shared score addition
            let killPoints = 100;
            if (hitEnemy.type === 'FAST') killPoints = 200;
            else if (hitEnemy.type === 'POWER') killPoints = 300;
            else if (hitEnemy.type === 'ARMOR') killPoints = 400;

            this.stats.score += killPoints;
            this.saveHighScore();
            this.addFloatingText(`+${killPoints}`, hitEnemy.x + s, hitEnemy.y + s, '#facc15');

            // Drop Power-up item if enemy was flashing
            if (hitEnemy.hasItem) {
              this.spawnRandomPowerUp();
            }
          } else {
            sounds.playSteelHit();
          }
          continue;
        }
      } else {
        // Enemy bullet: check collision with Player 1 or Player 2
        let hitPlayer = null;
        const targets = [];
        if (this.player1 && this.player1.health > 0) targets.push(this.player1);
        if (this.player2 && this.player2.health > 0) targets.push(this.player2);

        for (const p of targets) {
          const tankSize = s * 2 - 2;
          if (this.checkPointInRect(bullet.x, bullet.y, p.x, p.y, tankSize, tankSize)) {
            hitPlayer = p;
            break;
          }
        }

        if (hitPlayer) {
          this.addExplosion(bullet.x, bullet.y, false);

          if (hitPlayer.shieldTime <= 0) {
            hitPlayer.health -= 1;
            this.addExplosion(hitPlayer.x + s, hitPlayer.y + s, true);
            sounds.playExplosion(true);

            // Trigger respawn for that player
            if (hitPlayer.playerIndex === 1) {
              this.respawnTimerP1 = 120; // 2 seconds
            } else {
              this.respawnTimerP2 = 120;
            }
          } else {
            sounds.playSteelHit();
          }
          continue;
        }
      }

      // Check bullet-bullet collision (neutralize each other)
      let bulletCollided = false;
      for (const other of survivingBullets) {
        if (
          ((isPlayerBullet && other.owner === 'ENEMY') || (!isPlayerBullet && (other.owner === 'PLAYER_1' || other.owner === 'PLAYER_2' || other.owner === 'PLAYER'))) &&
          Math.hypot(bullet.x - other.x, bullet.y - other.y) < 8
        ) {
          this.addExplosion((bullet.x + other.x) / 2, (bullet.y + other.y) / 2, false);
          sounds.playSteelHit();
          survivingBullets.splice(survivingBullets.indexOf(other), 1);
          bulletCollided = true;
          break;
        }
      }

      if (!bulletCollided) {
        survivingBullets.push(bullet);
      }
    }

    this.bullets = survivingBullets;
  }

  updateExplosions() {
    this.explosions = this.explosions.filter(exp => {
      exp.currentFrame++;
      return exp.currentFrame <= exp.maxFrames;
    });
  }

  addExplosion(x, y, isBig = false) {
    this.explosions.push({
      x,
      y,
      isBig,
      currentFrame: 0,
      maxFrames: isBig ? 18 : 10,
      maxRadius: isBig ? 32 : 14,
    });
  }

  addFloatingText(text, x, y, color = '#ffffff') {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      opacity: 1,
      duration: 50,
    });
  }

  updateFloatingTexts() {
    this.floatingTexts = this.floatingTexts.filter(ft => {
      ft.y -= 0.6;
      ft.duration--;
      ft.opacity = ft.duration / 50;
      return ft.duration > 0;
    });
  }

  spawnRandomPowerUp() {
    const s = this.tileSize;
    const types = ['SHOVEL', 'STAR', 'BOMB', 'HELMET'];
    const type = types[Math.floor(Math.random() * types.length)];

    let px = Math.floor(2 + Math.random() * (MAP_SIZE - 4)) * s + s / 2;
    let py = Math.floor(4 + Math.random() * (MAP_SIZE - 8)) * s + s / 2;

    this.powerUps.push({
      id: `pw_${Date.now()}_${Math.random()}`,
      x: px,
      y: py,
      type,
      flashState: true,
      lifeTime: 600,
    });
    sounds.playPowerUp();
  }

  updatePowerUps() {
    const s = this.tileSize;
    const size = s * 1.8;

    this.powerUps = this.powerUps.filter(p => {
      p.lifeTime--;
      p.flashState = Math.floor(p.lifeTime / 12) % 2 === 0;

      // Check pickup by Player 1 or Player 2
      const checkCollector = (player) => {
        if (!player || player.health <= 0) return false;
        const tankSize = s * 2 - 2;
        return this.checkBoundingBox(
          player.x, player.y, tankSize, tankSize,
          p.x - size / 2, p.y - size / 2, size, size
        );
      };

      let collector = null;
      if (checkCollector(this.player1)) collector = this.player1;
      else if (checkCollector(this.player2)) collector = this.player2;

      if (collector) {
        this.applyPowerUp(collector, p.type);
        sounds.playPowerUp();
        this.stats.score += 500;
        this.saveHighScore();
        this.addFloatingText('+500', p.x, p.y, '#38bdf8');
        return false;
      }

      return p.lifeTime > 0;
    });
  }

  applyPowerUp(player, type) {
    if (type === 'HELMET') {
      player.shieldTime = 6.0;
    } else if (type === 'STAR') {
      player.bulletSpeed = Math.min(8.5, player.bulletSpeed + 1.2);
      player.tier = Math.min(3, (player.tier || 1) + 1);
    } else if (type === 'BOMB') {
      for (const enemy of this.enemies) {
        this.addExplosion(enemy.x + this.tileSize, enemy.y + this.tileSize, true);
        this.stats.enemiesDefeated++;
        this.stats.score += 200;
      }
      this.enemies = [];
      sounds.playExplosion(true);
    } else if (type === 'SHOVEL') {
      this.shovelTime = 600; // 10 seconds of steel base
      setEagleFortress(this.map, TileType.STEEL);
    }
  }

  checkBoundingBox(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  checkPointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
}

// ==========================================
// PEERJS NETWORK MANAGER (REALTIME SYNC)
// ==========================================
class NetworkManager {
  constructor(onStatusChange, onPeerConnected, onSyncReceived, onChatMessage) {
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.isConnected = false;
    this.roomCode = null;
    this.peerId = null;

    this.onStatusChange = onStatusChange || (() => {});
    this.onPeerConnected = onPeerConnected || (() => {});
    this.onSyncReceived = onSyncReceived || (() => {});
    this.onChatMessage = onChatMessage || (() => {});
  }

  createRoom(roomCode) {
    this.cleanup();
    this.isHost = true;
    this.roomCode = roomCode || Math.floor(1000 + Math.random() * 9000).toString();
    this.peerId = this.roomCode;

    this.onStatusChange('connecting', 'Đang khởi tạo mã phòng...');

    try {
      // Configuration connecting to PeerJS cloud server securely on HTTPS/GitHub Pages
      const peerConfig = {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        debug: 1,
      };

      this.peer = new Peer(this.peerId, peerConfig);

      const self = this;
      this.peer.on('open', function(id) {
        console.log('Đã nhận mã phòng thành công từ Cloud PeerJS:', id);
        const textDisplay = document.getElementById('room-id-display');
        if (textDisplay) {
          textDisplay.innerText = id; // Thay thế chuỗi '----' bằng số ID thực tế
        }
        // Tìm thẻ thông báo trạng thái "Đang khởi tạo..." và đổi chữ nó thành "🟢 Sẵn sàng!"
        const statusDisplay = document.querySelector('.status-text') || document.getElementById('status-message');
        if (statusDisplay) {
          statusDisplay.innerHTML = '🟢 Máy chủ sảnh chờ đã sẵn sàng!';
        }

        self.roomCode = id;
        self.peerId = id;
        self.onStatusChange('ready', '🟢 Máy chủ sảnh chờ đã sẵn sàng!');
      });

      this.peer.on('connection', (conn) => {
        this.conn = conn;
        this.setupConnectionEvents();
        this.isConnected = true;
        this.onStatusChange('connected', `Người chơi 2 (Xe Xanh) đã kết nối!`);
        this.onPeerConnected(true);
        sounds.playPlayerJoined();
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        const errType = err && err.type ? err.type : (err && err.message ? err.message : 'Lỗi kết nối mạng');
        if (err.type === 'unavailable-id') {
          // If code is already taken, regenerate a new 4-digit code
          const newCode = Math.floor(1000 + Math.random() * 9000).toString();
          const textDisplay = document.getElementById('room-id-display');
          if (textDisplay) {
            textDisplay.innerText = '----';
          }
          this.createRoom(newCode);
        } else {
          this.onStatusChange('error', `Lỗi kết nối: ${errType}`);
        }
      });
    } catch (e) {
      console.error('PeerJS init failed:', e);
      this.onStatusChange('error', `Không thể khởi tạo Peer: ${e.message || 'Lỗi mạng'}`);
    }
  }

  joinRoom(roomCode) {
    this.cleanup();
    this.isHost = false;
    this.roomCode = (roomCode || '').trim();
    const targetPeerId = this.roomCode;

    this.onStatusChange('connecting', `Đang kết nối tới phòng [${this.roomCode}]...`);

    try {
      const peerConfig = {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        debug: 1,
      };

      this.peer = new Peer(peerConfig);

      this.peer.on('open', (myId) => {
        console.log('Client peer opened with ID:', myId, 'Connecting to:', targetPeerId);
        this.conn = this.peer.connect(targetPeerId, {
          reliable: true,
        });

        this.setupConnectionEvents();

        // Timeout check if host does not respond
        setTimeout(() => {
          if (!this.isConnected) {
            this.onStatusChange('error', `Không tìm thấy phòng [${this.roomCode}]. Hãy kiểm tra lại mã!`);
          }
        }, 9000);
      });

      this.peer.on('error', (err) => {
        console.error('Peer join error:', err);
        const errType = err && err.type ? err.type : (err && err.message ? err.message : 'Lỗi kết nối');
        this.onStatusChange('error', `Lỗi kết nối: ${errType}`);
      });
    } catch (e) {
      console.error('Peer connect failed:', e);
      this.onStatusChange('error', `Không thể kết nối: ${e.message || 'Lỗi mạng'}`);
    }
  }

  setupConnectionEvents() {
    if (!this.conn) return;

    this.conn.on('open', () => {
      this.isConnected = true;
      if (!this.isHost) {
        this.onStatusChange('connected', `Đã vào phòng thành công! Bạn là Xe Tăng 2 (Xanh).`);
        this.onPeerConnected(false);
        sounds.playPlayerJoined();
      }
    });

    this.conn.on('data', (data) => {
      if (!data) return;
      if (data.type === 'UPDATE_GAME_STATE' || data.type === 'SYNC') {
        this.onSyncReceived(data);
      } else if (data.type === 'START_GAME') {
        if (!this.isHost) {
          startGame(data.stage || selectedStage, false);
        }
      } else if (data.type === 'MOVE') {
        if (this.isHost) {
          handleHostReceiveMove(data.direction);
        }
      } else if (data.type === 'FIRE') {
        if (this.isHost) {
          handleHostReceiveFire();
        }
      } else if (data.type === 'FIRE_RELEASE') {
        if (this.isHost) {
          if (window.p2RemoteInput) window.p2RemoteInput.fire = false;
        }
      } else if (data.type === 'STOP') {
        if (this.isHost) {
          handleHostReceiveMove('STOP');
        }
      } else if (data.type === 'P2_INPUT') {
        if (this.isHost) {
          window.p2RemoteInput = data.input;
          if (window.engine && window.engine.player2) {
            if (data.input.up) window.engine.player2.direction = 'UP';
            else if (data.input.down) window.engine.player2.direction = 'DOWN';
            else if (data.input.left) window.engine.player2.direction = 'LEFT';
            else if (data.input.right) window.engine.player2.direction = 'RIGHT';
          }
        }
      } else if (data.type === 'RESTART_STAGE') {
        if (window.engine) {
          window.engine.initStage(data.stage || window.engine.stats.stage, true);
        }
        gameState = 'PLAYING';
        isPaused = false;
        if (titleScreenEl) titleScreenEl.classList.add('hidden');
        if (gameOverModalEl) gameOverModalEl.classList.add('hidden');
        if (pauseOverlayEl) pauseOverlayEl.classList.add('hidden');
        updateUIStats();
      } else if (data.type === 'CHAT') {
        this.onChatMessage(data.text);
      }
    });

    this.conn.on('close', () => {
      this.isConnected = false;
      this.onStatusChange('disconnected', 'Đồng đội đã ngắt kết nối!');
      if (window.engine) {
        window.engine.player2 = null;
      }
    });

    this.conn.on('error', (err) => {
      this.isConnected = false;
      this.onStatusChange('error', 'Mất kết nối P2P!');
    });
  }

  send(data) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(data);
      } catch {}
    }
  }

  cleanup() {
    if (this.conn) {
      try { this.conn.close(); } catch {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch {}
      this.peer = null;
    }
    this.isConnected = false;
    this.isHost = false;
  }
}

// ==========================================
// DOM UI BINDINGS & MAIN LOOP CONTROLLER
// ==========================================
let engine = null;
let renderer = null;
let netManager = null;
let gameState = 'TITLE'; // TITLE, PLAYING, GAME_OVER, VICTORY
let isPaused = false;
let isMuted = false;
let crtEffect = false;
let selectedStage = 1;
let animationFrameId = null;

// User role: 'HOST' (P1 Yellow), 'JOIN' (P2 Green), 'SOLO'
let userRole = 'HOST';

const localInput = {
  up: false,
  down: false,
  left: false,
  right: false,
  fire: false,
};

window.p2RemoteInput = {
  up: false,
  down: false,
  left: false,
  right: false,
  fire: false,
};

function handleHostReceiveMove(direction) {
  if (!window.p2RemoteInput) {
    window.p2RemoteInput = { up: false, down: false, left: false, right: false, fire: false };
  }
  const dirUpper = (direction || '').toUpperCase();
  if (dirUpper === 'UP') {
    window.p2RemoteInput.up = true;
    window.p2RemoteInput.down = false;
    window.p2RemoteInput.left = false;
    window.p2RemoteInput.right = false;
    if (window.engine && window.engine.player2 && window.engine.player2.health > 0) {
      window.engine.player2.direction = 'UP';
      window.engine.moveTank(window.engine.player2, 0, -window.engine.player2.speed);
      window.engine.player2.trackFrame = (window.engine.player2.trackFrame + 1) % 2;
    }
  } else if (dirUpper === 'DOWN') {
    window.p2RemoteInput.up = false;
    window.p2RemoteInput.down = true;
    window.p2RemoteInput.left = false;
    window.p2RemoteInput.right = false;
    if (window.engine && window.engine.player2 && window.engine.player2.health > 0) {
      window.engine.player2.direction = 'DOWN';
      window.engine.moveTank(window.engine.player2, 0, window.engine.player2.speed);
      window.engine.player2.trackFrame = (window.engine.player2.trackFrame + 1) % 2;
    }
  } else if (dirUpper === 'LEFT') {
    window.p2RemoteInput.up = false;
    window.p2RemoteInput.down = false;
    window.p2RemoteInput.left = true;
    window.p2RemoteInput.right = false;
    if (window.engine && window.engine.player2 && window.engine.player2.health > 0) {
      window.engine.player2.direction = 'LEFT';
      window.engine.moveTank(window.engine.player2, -window.engine.player2.speed, 0);
      window.engine.player2.trackFrame = (window.engine.player2.trackFrame + 1) % 2;
    }
  } else if (dirUpper === 'RIGHT') {
    window.p2RemoteInput.up = false;
    window.p2RemoteInput.down = false;
    window.p2RemoteInput.left = false;
    window.p2RemoteInput.right = true;
    if (window.engine && window.engine.player2 && window.engine.player2.health > 0) {
      window.engine.player2.direction = 'RIGHT';
      window.engine.moveTank(window.engine.player2, window.engine.player2.speed, 0);
      window.engine.player2.trackFrame = (window.engine.player2.trackFrame + 1) % 2;
    }
  } else if (dirUpper === 'STOP' || dirUpper === 'NONE' || !dirUpper) {
    window.p2RemoteInput.up = false;
    window.p2RemoteInput.down = false;
    window.p2RemoteInput.left = false;
    window.p2RemoteInput.right = false;
  }
}

function handleHostReceiveFire() {
  if (!window.p2RemoteInput) {
    window.p2RemoteInput = { up: false, down: false, left: false, right: false, fire: false };
  }
  window.p2RemoteInput.fire = true;
  if (window.engine && window.engine.player2 && window.engine.player2.health > 0) {
    const p2Bullets = window.engine.bullets.filter(b => b.shooterId === 'player2').length;
    if (p2Bullets === 0) {
      window.engine.fireBullet(window.engine.player2);
    }
  }
}

// UI Elements references
let canvas, ctx;
let titleScreenEl, gameOverModalEl, helpModalEl, pauseOverlayEl;
let scoreValEl, hiScoreValEl, livesValEl, remainingCountEl, stageBadgeEl;
let modalTitleEl, modalDescEl, modalScoreEl, modalKillsEl, modalStageEl;
let btnToggleCrt, btnToggleMute, btnRestartTop, btnHelpClose, btnHelpConfirm;
let btnModalRestart, btnModalNext, btnModalLobby;

// Tabs & panels
let tabHost, tabJoin, tabSolo;
let panelHost, panelJoin, panelSolo;
let roomCodeDisplay, btnCopyCode, copyIcon, copyText;
let hostStatusDot, hostStatusMsg, btnHostStart;
let inputJoinCode, joinStatusBox, joinStatusDot, joinStatusMsg, btnJoinSubmit;
let btnSoloStart;
let hudModeName, hudMyRole, hudPeerStatusRow, hudP2Status;
let headerNetDot, headerNetText;

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
  btnHelpClose = document.getElementById('btnHelpClose');
  btnHelpConfirm = document.getElementById('btnHelpConfirm');

  btnModalRestart = document.getElementById('btnModalRestart');
  btnModalNext = document.getElementById('btnModalNext');
  btnModalLobby = document.getElementById('btnModalLobby');

  // Tabs & panels
  tabHost = document.getElementById('tabHost');
  tabJoin = document.getElementById('tabJoin');
  tabSolo = document.getElementById('tabSolo');
  panelHost = document.getElementById('panelHost');
  panelJoin = document.getElementById('panelJoin');
  panelSolo = document.getElementById('panelSolo');

  roomCodeDisplay = document.getElementById('room-id-display') || document.getElementById('roomCodeDisplay');
  btnCopyCode = document.getElementById('btnCopyCode');
  copyIcon = document.getElementById('copyIcon');
  copyText = document.getElementById('copyText');
  hostStatusDot = document.getElementById('hostStatusDot');
  hostStatusMsg = document.getElementById('status-message') || document.getElementById('hostStatusMsg');
  btnHostStart = document.getElementById('btnHostStart');

  inputJoinCode = document.getElementById('inputJoinCode');
  joinStatusBox = document.getElementById('joinStatusBox');
  joinStatusDot = document.getElementById('joinStatusDot');
  joinStatusMsg = document.getElementById('joinStatusMsg');
  btnJoinSubmit = document.getElementById('btnJoinSubmit');

  btnSoloStart = document.getElementById('btnSoloStart');

  hudModeName = document.getElementById('hudModeName');
  hudMyRole = document.getElementById('hudMyRole');
  hudPeerStatusRow = document.getElementById('hudPeerStatusRow');
  hudP2Status = document.getElementById('hudP2Status');
  headerNetDot = document.getElementById('headerNetDot');
  headerNetText = document.getElementById('headerNetText');

  const tileSize = 20;
  engine = new GameEngine(tileSize);
  window.engine = engine;
  renderer = new GameRenderer(tileSize);

  // Network Manager
  netManager = new NetworkManager(
    handleNetworkStatusChange,
    handlePeerConnected,
    handleSyncReceived,
    handleChatMessage
  );

  setupEventListeners();
  updateUIStats();

  // Initialize Default Host Room Code
  generateHostRoomCode();

  // Start main loop
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(gameLoop);
}

function generateHostRoomCode() {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const textDisplay = document.getElementById('room-id-display') || roomCodeDisplay;
  if (textDisplay) {
    textDisplay.innerText = '----';
  }
  const statusDisplay = document.querySelector('.status-text') || document.getElementById('status-message');
  if (statusDisplay) {
    statusDisplay.innerHTML = 'Đang khởi tạo mã phòng...';
  }
  netManager.createRoom(code);
}

function handleNetworkStatusChange(status, msg) {
  if (userRole === 'HOST') {
    if (hostStatusMsg) hostStatusMsg.textContent = msg;
    if (hostStatusDot) {
      if (status === 'connected') {
        hostStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500';
      } else if (status === 'ready') {
        hostStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse';
      } else {
        hostStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-red-500';
      }
    }
  } else if (userRole === 'JOIN') {
    if (joinStatusBox) joinStatusBox.classList.remove('hidden');
    if (joinStatusMsg) joinStatusMsg.textContent = msg;
    if (joinStatusDot) {
      if (status === 'connected') {
        joinStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500';
      } else if (status === 'connecting') {
        joinStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse';
      } else {
        joinStatusDot.className = 'w-2.5 h-2.5 rounded-full bg-red-500';
      }
    }
  }

  // Header and HUD updates
  if (headerNetText) {
    headerNetText.textContent = netManager.isConnected
      ? `Phòng #${netManager.roomCode || '---'}`
      : userRole === 'SOLO' ? 'Solo 1P' : 'Chưa kết nối';
  }
  if (headerNetDot) {
    headerNetDot.className = `w-2 h-2 rounded-full ${
      netManager.isConnected ? 'bg-emerald-400' : 'bg-zinc-600'
    }`;
  }
  if (hudP2Status) {
    hudP2Status.textContent = netManager.isConnected ? '🟢 Đã kết nối' : 'Đang chờ...';
  }
}

function handlePeerConnected(isHost) {
  if (engine) {
    engine.setMultiplayerMode(true);
  }
  if (!isHost) {
    // Client joins: auto-enter game screen
    startGame(selectedStage, false);
  }
}

function handleSyncReceived(data) {
  // Client updates its local view from Host's authoritative state
  if (!engine || !data) return;

  // Auto transition to playing screen if Host has started game
  if (gameState !== 'PLAYING' && !data.isGameOver && !data.isVictory) {
    gameState = 'PLAYING';
    if (titleScreenEl) titleScreenEl.classList.add('hidden');
    if (gameOverModalEl) gameOverModalEl.classList.add('hidden');
    if (pauseOverlayEl) pauseOverlayEl.classList.add('hidden');
  }

  if (data.map) engine.map = data.map;
  if (data.stats) {
    engine.stats = data.stats;
  }

  // Authoritative Player 1 Sync
  if (data.player1) {
    if (!engine.player1) engine.spawnPlayer(1);
    engine.player1.x = data.player1.x;
    engine.player1.y = data.player1.y;
    engine.player1.direction = data.player1.direction;
    engine.player1.health = data.player1.health !== undefined ? data.player1.health : 1;
    engine.player1.shieldTime = data.player1.shieldTime || 0;
    engine.player1.trackFrame = data.player1.trackFrame || 0;
    engine.player1.isPlayer = true;
    engine.player1.playerIndex = 1;
    engine.player1.color = data.player1.color || '#eab308';
  } else {
    engine.player1 = null;
  }

  // Authoritative Player 2 Sync
  if (data.player2) {
    if (!engine.player2) engine.spawnPlayer(2);
    engine.player2.x = data.player2.x;
    engine.player2.y = data.player2.y;
    engine.player2.direction = data.player2.direction;
    engine.player2.health = data.player2.health !== undefined ? data.player2.health : 1;
    engine.player2.shieldTime = data.player2.shieldTime || 0;
    engine.player2.trackFrame = data.player2.trackFrame || 0;
    engine.player2.isPlayer = true;
    engine.player2.playerIndex = 2;
    engine.player2.color = data.player2.color || '#22c55e';
  } else {
    engine.player2 = null;
  }

  // Authoritative Enemies Sync
  if (data.enemies) {
    engine.enemies = data.enemies.map(e => ({
      id: e.id || `enemy_${Math.random()}`,
      x: e.x,
      y: e.y,
      direction: e.direction || 'DOWN',
      type: e.type || 'BASIC',
      health: e.health !== undefined ? e.health : 1,
      maxHealth: e.maxHealth || 1,
      trackFrame: e.trackFrame || 0,
      hasItem: !!e.hasItem,
      color: e.color || '#ef4444',
      isPlayer: false
    }));
  }

  // Authoritative Bullets Sync
  if (data.bullets) {
    engine.bullets = data.bullets.map(b => ({
      id: b.id || `bullet_${Math.random()}`,
      x: b.x,
      y: b.y,
      direction: b.direction || 'UP',
      owner: b.owner || 'ENEMY',
      shooterId: b.shooterId,
      power: b.power || 1
    }));
  }

  if (data.explosions) engine.explosions = data.explosions;
  if (data.powerUps) engine.powerUps = data.powerUps;
  if (data.spawnEffects) engine.spawnEffects = data.spawnEffects;
  if (data.floatingTexts) engine.floatingTexts = data.floatingTexts;

  if (data.isGameOver !== undefined) engine.isGameOver = data.isGameOver;
  if (data.isVictory !== undefined) engine.isVictory = data.isVictory;

  if (engine.isGameOver && gameState !== 'GAME_OVER') {
    gameState = 'GAME_OVER';
    showGameOverModal(false);
  } else if (engine.isVictory && gameState !== 'VICTORY') {
    gameState = 'VICTORY';
    showGameOverModal(true);
  }
}

function handleChatMessage(text) {
  if (engine) {
    engine.addFloatingText(text, 260, 260, '#38bdf8');
  }
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

  // HUD role info
  if (hudModeName) {
    hudModeName.textContent = userRole === 'SOLO' ? 'CHƠI ĐƠN' : `CO-OP P2P (#${netManager.roomCode || '---'})`;
  }
  if (hudMyRole) {
    if (userRole === 'JOIN') {
      hudMyRole.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> P2 Xanh';
      hudMyRole.className = 'font-bold text-emerald-400 flex items-center gap-1';
    } else {
      hudMyRole.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> P1 Vàng';
      hudMyRole.className = 'font-bold text-amber-300 flex items-center gap-1';
    }
  }
  if (hudPeerStatusRow) {
    hudPeerStatusRow.classList.toggle('hidden', userRole === 'SOLO');
  }
}

function startGame(stage, resetScoreAndLives = true) {
  selectedStage = stage;
  if (engine) {
    engine.setMultiplayerMode(userRole !== 'SOLO');
    if (userRole !== 'JOIN') {
      engine.initStage(stage, resetScoreAndLives);
    }
  }
  gameState = 'PLAYING';
  isPaused = false;
  if (titleScreenEl) titleScreenEl.classList.add('hidden');
  if (gameOverModalEl) gameOverModalEl.classList.add('hidden');
  if (pauseOverlayEl) pauseOverlayEl.classList.add('hidden');
  updateUIStats();
}

function restartCurrentStage() {
  if (userRole === 'JOIN') {
    // Notify host to restart
    netManager.send({ type: 'RESTART_STAGE', stage: engine.stats.stage });
    return;
  }
  if (engine) {
    engine.initStage(engine.stats.stage, true);
    if (netManager.isConnected) {
      netManager.send({ type: 'RESTART_STAGE', stage: engine.stats.stage });
    }
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
    if (netManager.isConnected) {
      netManager.send({ type: 'RESTART_STAGE', stage: next });
    }
  }
  gameState = 'PLAYING';
  isPaused = false;
  if (titleScreenEl) titleScreenEl.classList.add('hidden');
  if (gameOverModalEl) gameOverModalEl.classList.add('hidden');
  if (pauseOverlayEl) pauseOverlayEl.classList.add('hidden');
  updateUIStats();
}

function returnToLobby() {
  gameState = 'TITLE';
  if (gameOverModalEl) gameOverModalEl.classList.add('hidden');
  if (pauseOverlayEl) pauseOverlayEl.classList.add('hidden');
  if (titleScreenEl) titleScreenEl.classList.remove('hidden');
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
      if (userRole === 'HOST' || userRole === 'SOLO') {
        // Authoritative Host Loop
        const p1Input = localInput;
        const p2Input = netManager.isConnected ? window.p2RemoteInput : null;
        engine.update(p1Input, p2Input);

        // Broadcast authoritative game state continuously to Player 2
        frameCount++;
        if (netManager.conn && netManager.conn.open) {
          netManager.conn.send({
            type: 'UPDATE_GAME_STATE',
            player1: engine.player1 ? {
              x: engine.player1.x,
              y: engine.player1.y,
              direction: engine.player1.direction,
              health: engine.player1.health !== undefined ? engine.player1.health : 1,
              shieldTime: engine.player1.shieldTime || 0,
              trackFrame: engine.player1.trackFrame || 0,
              color: engine.player1.color || '#eab308',
              isPlayer: true,
              playerIndex: 1
            } : null,
            player2: engine.player2 ? {
              x: engine.player2.x,
              y: engine.player2.y,
              direction: engine.player2.direction,
              health: engine.player2.health !== undefined ? engine.player2.health : 1,
              shieldTime: engine.player2.shieldTime || 0,
              trackFrame: engine.player2.trackFrame || 0,
              color: engine.player2.color || '#22c55e',
              isPlayer: true,
              playerIndex: 2
            } : null,
            enemies: engine.enemies.map(e => ({
              id: e.id,
              x: e.x,
              y: e.y,
              direction: e.direction,
              type: e.type,
              health: e.health !== undefined ? e.health : 1,
              maxHealth: e.maxHealth || 1,
              trackFrame: e.trackFrame || 0,
              hasItem: e.hasItem || false,
              color: e.color || '#ef4444',
              isPlayer: false
            })),
            bullets: engine.bullets.map(b => ({
              id: b.id,
              x: b.x,
              y: b.y,
              direction: b.direction,
              owner: b.owner,
              shooterId: b.shooterId,
              power: b.power || 1
            })),
            map: engine.map,
            stats: engine.stats,
            explosions: engine.explosions,
            powerUps: engine.powerUps,
            spawnEffects: engine.spawnEffects,
            floatingTexts: engine.floatingTexts,
            isGameOver: engine.isGameOver,
            isVictory: engine.isVictory,
          });
        }

        if (engine.isGameOver && gameState !== 'GAME_OVER') {
          gameState = 'GAME_OVER';
          showGameOverModal(false);
        } else if (engine.isVictory && gameState !== 'VICTORY') {
          gameState = 'VICTORY';
          showGameOverModal(true);
        }
      } else if (userRole === 'JOIN') {
        // Client Loop: continuous input stream to Host
        if (localInput.up) netManager.send({ type: 'MOVE', direction: 'UP' });
        else if (localInput.down) netManager.send({ type: 'MOVE', direction: 'DOWN' });
        else if (localInput.left) netManager.send({ type: 'MOVE', direction: 'LEFT' });
        else if (localInput.right) netManager.send({ type: 'MOVE', direction: 'RIGHT' });
        if (localInput.fire) netManager.send({ type: 'FIRE' });
        netManager.send({
          type: 'P2_INPUT',
          input: localInput,
        });
      }

      if (frameCount % 6 === 0) {
        updateUIStats();
      }
    }

    // Render Canvas
    renderer.render(
      ctx,
      engine.map,
      engine.player1,
      engine.player2,
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
  const sendClientMoveOrStop = () => {
    if (userRole === 'JOIN' && netManager && netManager.isConnected) {
      if (localInput.up) netManager.send({ type: 'MOVE', direction: 'UP' });
      else if (localInput.down) netManager.send({ type: 'MOVE', direction: 'DOWN' });
      else if (localInput.left) netManager.send({ type: 'MOVE', direction: 'LEFT' });
      else if (localInput.right) netManager.send({ type: 'MOVE', direction: 'RIGHT' });
      else netManager.send({ type: 'MOVE', direction: 'STOP' });
    }
  };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      localInput.up = true; localInput.down = false; localInput.left = false; localInput.right = false;
      if (userRole === 'JOIN') netManager.send({ type: 'MOVE', direction: 'UP' });
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      localInput.down = true; localInput.up = false; localInput.left = false; localInput.right = false;
      if (userRole === 'JOIN') netManager.send({ type: 'MOVE', direction: 'DOWN' });
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      localInput.left = true; localInput.right = false; localInput.up = false; localInput.down = false;
      if (userRole === 'JOIN') netManager.send({ type: 'MOVE', direction: 'LEFT' });
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      localInput.right = true; localInput.left = false; localInput.up = false; localInput.down = false;
      if (userRole === 'JOIN') netManager.send({ type: 'MOVE', direction: 'RIGHT' });
    } else if (e.code === 'Space') {
      if (!localInput.fire) {
        localInput.fire = true;
        if (userRole === 'JOIN') {
          netManager.send({ type: 'FIRE' });
          sounds.playShoot(2);
        }
      }
    } else if (e.code === 'KeyP') togglePause();
    else if (e.code === 'KeyM') toggleMuteUI();
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      localInput.up = false;
      sendClientMoveOrStop();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      localInput.down = false;
      sendClientMoveOrStop();
    } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      localInput.left = false;
      sendClientMoveOrStop();
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      localInput.right = false;
      sendClientMoveOrStop();
    } else if (e.code === 'Space') {
      localInput.fire = false;
      if (userRole === 'JOIN') {
        netManager.send({ type: 'FIRE_RELEASE' });
      }
    }
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

  setupTouchBtn('btnTouchUp', () => {
    localInput.up = true; localInput.down = false; localInput.left = false; localInput.right = false;
    if (userRole === 'JOIN') netManager.send({ type: 'MOVE', direction: 'UP' });
  }, () => {
    localInput.up = false;
    sendClientMoveOrStop();
  });
  setupTouchBtn('btnTouchDown', () => {
    localInput.down = true; localInput.up = false; localInput.left = false; localInput.right = false;
    if (userRole === 'JOIN') netManager.send({ type: 'MOVE', direction: 'DOWN' });
  }, () => {
    localInput.down = false;
    sendClientMoveOrStop();
  });
  setupTouchBtn('btnTouchLeft', () => {
    localInput.left = true; localInput.right = false; localInput.up = false; localInput.down = false;
    if (userRole === 'JOIN') netManager.send({ type: 'MOVE', direction: 'LEFT' });
  }, () => {
    localInput.left = false;
    sendClientMoveOrStop();
  });
  setupTouchBtn('btnTouchRight', () => {
    localInput.right = true; localInput.left = false; localInput.up = false; localInput.down = false;
    if (userRole === 'JOIN') netManager.send({ type: 'MOVE', direction: 'RIGHT' });
  }, () => {
    localInput.right = false;
    sendClientMoveOrStop();
  });
  setupTouchBtn('btnTouchFire', () => {
    localInput.fire = true;
    if (userRole === 'JOIN') {
      netManager.send({ type: 'FIRE' });
      sounds.playShoot(2);
    }
  }, () => {
    localInput.fire = false;
    if (userRole === 'JOIN') netManager.send({ type: 'FIRE_RELEASE' });
  });

  // Tab switching
  const selectTab = (role) => {
    userRole = role;
    if (tabHost) tabHost.className = role === 'HOST'
      ? 'py-2 px-2 rounded-lg font-bold transition-all bg-amber-500 text-zinc-950 shadow-sm cursor-pointer'
      : 'py-2 px-2 rounded-lg font-bold transition-all text-zinc-400 hover:text-white cursor-pointer';
    if (tabJoin) tabJoin.className = role === 'JOIN'
      ? 'py-2 px-2 rounded-lg font-bold transition-all bg-emerald-500 text-zinc-950 shadow-sm cursor-pointer'
      : 'py-2 px-2 rounded-lg font-bold transition-all text-zinc-400 hover:text-white cursor-pointer';
    if (tabSolo) tabSolo.className = role === 'SOLO'
      ? 'py-2 px-2 rounded-lg font-bold transition-all bg-zinc-700 text-white shadow-sm cursor-pointer'
      : 'py-2 px-2 rounded-lg font-bold transition-all text-zinc-400 hover:text-white cursor-pointer';

    if (panelHost) panelHost.classList.toggle('hidden', role !== 'HOST');
    if (panelJoin) panelJoin.classList.toggle('hidden', role !== 'JOIN');
    if (panelSolo) panelSolo.classList.toggle('hidden', role !== 'SOLO');

    updateUIStats();
  };

  if (tabHost) tabHost.addEventListener('click', () => {
    selectTab('HOST');
    if (!netManager.peerId) generateHostRoomCode();
  });
  if (tabJoin) tabJoin.addEventListener('click', () => selectTab('JOIN'));
  if (tabSolo) tabSolo.addEventListener('click', () => selectTab('SOLO'));

  // Copy Room Code Button
  if (btnCopyCode) {
    btnCopyCode.addEventListener('click', () => {
      const code = roomCodeDisplay ? roomCodeDisplay.textContent.trim() : '';
      if (code && code !== '----') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            if (copyText) copyText.textContent = 'Đã chép!';
            if (copyIcon) copyIcon.textContent = '✅';
            setTimeout(() => {
              if (copyText) copyText.textContent = 'Sao chép';
              if (copyIcon) copyIcon.textContent = '📋';
            }, 2000);
          }).catch(() => {});
        }
      }
    });
  }

  // Join Room Button
  if (btnJoinSubmit) {
    btnJoinSubmit.addEventListener('click', () => {
      const code = inputJoinCode ? inputJoinCode.value.trim() : '';
      if (!code) {
        if (joinStatusBox) joinStatusBox.classList.remove('hidden');
        if (joinStatusMsg) joinStatusMsg.textContent = 'Vui lòng nhập mã phòng!';
        return;
      }
      userRole = 'JOIN';
      netManager.joinRoom(code);
    });
  }

  // Host Start Button
  if (btnHostStart) {
    btnHostStart.addEventListener('click', () => {
      userRole = 'HOST';
      if (netManager.isConnected) {
        netManager.send({ type: 'START_GAME', stage: selectedStage });
      }
      startGame(selectedStage, true);
    });
  }

  // Solo Start Button
  if (btnSoloStart) {
    btnSoloStart.addEventListener('click', () => {
      userRole = 'SOLO';
      netManager.cleanup();
      startGame(selectedStage, true);
    });
  }

  // Host Stage buttons
  const setupStageSelect = (prefix) => {
    [1, 2, 3].forEach(idx => {
      const btn = document.getElementById(`${prefix}${idx}`);
      if (!btn) return;
      btn.addEventListener('click', () => {
        selectedStage = idx;
        [1, 2, 3].forEach(i => {
          const b = document.getElementById(`${prefix}${i}`);
          if (b) {
            b.className = i === idx
              ? 'py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-500 text-zinc-950 cursor-pointer'
              : 'py-1.5 px-3 rounded-lg text-xs font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer';
          }
        });
      });
    });
  };

  setupStageSelect('btnHostStage');
  setupStageSelect('btnSoloStage');

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
  const btnHelpOpen = document.getElementById('navHelp');
  const btnTitleHelp = document.getElementById('btnTitleHelp');
  if (btnHelpOpen) btnHelpOpen.addEventListener('click', () => helpModalEl && helpModalEl.classList.remove('hidden'));
  if (btnTitleHelp) btnTitleHelp.addEventListener('click', () => helpModalEl && helpModalEl.classList.remove('hidden'));
  if (btnHelpClose) btnHelpClose.addEventListener('click', () => helpModalEl && helpModalEl.classList.add('hidden'));
  if (btnHelpConfirm) btnHelpConfirm.addEventListener('click', () => helpModalEl && helpModalEl.classList.add('hidden'));

  // Game over modal buttons
  if (btnModalRestart) {
    btnModalRestart.addEventListener('click', restartCurrentStage);
  }
  if (btnModalNext) {
    btnModalNext.addEventListener('click', nextStage);
  }
  if (btnModalLobby) {
    btnModalLobby.addEventListener('click', returnToLobby);
  }

  // Nav Lobby
  const navLobby = document.getElementById('navLobby');
  if (navLobby) navLobby.addEventListener('click', returnToLobby);

  const navChangeStage = document.getElementById('navChangeStage');
  if (navChangeStage) {
    navChangeStage.addEventListener('click', () => {
      if (engine) {
        const next = (engine.stats.stage % 3) + 1;
        engine.initStage(next, false);
        if (netManager.isConnected) {
          netManager.send({ type: 'RESTART_STAGE', stage: next });
        }
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
