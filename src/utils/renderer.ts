import { Bullet, Direction, Explosion, FloatingText, PowerUp, SpawnEffect, Tank, TileType } from '../types/game';
import { MAP_SIZE } from './maps';

export class GameRenderer {
  private tileSize: number;

  constructor(tileSize: number) {
    this.tileSize = tileSize;
  }

  public setTileSize(size: number) {
    this.tileSize = size;
  }

  public getTileSize(): number {
    return this.tileSize;
  }

  /**
   * Main rendering pass
   */
  public render(
    ctx: CanvasRenderingContext2D,
    map: number[][],
    player: Tank | null,
    enemies: Tank[],
    bullets: Bullet[],
    explosions: Explosion[],
    powerUps: PowerUp[],
    floatingTexts: FloatingText[],
    waterFrame: number,
    isEagleDestroyed: boolean,
    spawnEffects: SpawnEffect[] = []
  ) {
    const S = this.tileSize;
    const canvasWidth = MAP_SIZE * S;
    const canvasHeight = MAP_SIZE * S;

    // 1. Dark arena background (ultra-sharp deep charcoal with subtle border)
    ctx.fillStyle = '#06080c';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Subtle arena inner frame border (1px crisp edge)
    ctx.strokeStyle = '#1e2430';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvasWidth - 1, canvasHeight - 1);

    // 2. Draw ground tiles (Water, Ice, Brick, Steel)
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

    // 3. Draw Eagle (2x2 tiles at row 24, col 12)
    const eagleX = 12 * S;
    const eagleY = 24 * S;
    const eagleSize = 2 * S;
    this.drawEagle(ctx, eagleX, eagleY, eagleSize, isEagleDestroyed);

    // 4. Draw Power-Ups (Crisp hand-crafted pixel badges)
    powerUps.forEach(p => this.drawPowerUp(ctx, p, S));

    // 5. Draw Spawn Star Animations (warning indicator for incoming tanks)
    spawnEffects.forEach(sp => {
      this.drawSpawnStar(ctx, sp.x + S, sp.y + S, S * 1.5, sp.framesLeft);
    });

    // 6. Draw Tanks (Enemies first, then Player)
    enemies.forEach(enemy => {
      this.drawTank(ctx, enemy, S);
    });

    if (player) {
      this.drawTank(ctx, player, S);
    }

    // 7. Draw Bullets (Directional glowing tracer shells)
    bullets.forEach(b => this.drawBullet(ctx, b, S));

    // 8. Draw Upper layer terrain: Bushes/Forest (Tanks drive underneath)
    for (let r = 0; r < MAP_SIZE; r++) {
      for (let c = 0; c < MAP_SIZE; c++) {
        if (map[r][c] === TileType.BUSH) {
          this.drawBush(ctx, c * S, r * S, S);
        }
      }
    }

    // 9. Draw Explosions (Expanding circular orange-yellow fireballs)
    explosions.forEach(exp => this.drawExplosion(ctx, exp));

    // 10. Floating score texts (Crisp typography with high-contrast drop shadow)
    floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.opacity));
      ctx.font = 'bold 13px "Press Start 2P", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 1px black outline shadow for 100% legibility over any background
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  /**
   * Retro 8-bit Spawn Twinkling Star (Warning for incoming enemy tank)
   */
  private drawSpawnStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    maxSize: number,
    framesLeft: number
  ) {
    const cycle = Math.floor(framesLeft / 5) % 4;
    let scale = 0.35;
    if (cycle === 1 || cycle === 3) scale = 0.7;
    else if (cycle === 2) scale = 1.0;

    const r = (maxSize / 2) * scale;
    ctx.save();

    // Alternate vivid amber and pure white
    ctx.fillStyle = cycle % 2 === 0 ? '#facc15' : '#ffffff';

    // 4-pointed diamond star
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

    // Center sparkling diamond
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 2, cy - 2, 4, 4);

    ctx.restore();
  }

  /**
   * Ultra-Sharp NES Brick Tile (Staggered 4-Course Terracotta Pixel Art)
   * Exact pixel alignment and vivid micro-groove contrast.
   */
  private drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    const px = Math.round(x);
    const py = Math.round(y);
    const ps = Math.round(s);

    // Deep mortar background (dark espresso brown / black)
    ctx.fillStyle = '#160502';
    ctx.fillRect(px, py, ps, ps);

    // 4 vertical courses of bricks inside 20x20 tile
    // Course 0: y: 0..4 (5px)
    this.renderBrickCourse(ctx, px, py, ps, 0, 4, false);
    // Course 1: y: 5..9 (5px)
    this.renderBrickCourse(ctx, px, py + 5, ps, 5, 4, true);
    // Course 2: y: 10..14 (5px)
    this.renderBrickCourse(ctx, px, py + 10, ps, 10, 4, false);
    // Course 3: y: 15..19 (5px)
    this.renderBrickCourse(ctx, px, py + 15, ps, 15, 4, true);
  }

  private renderBrickCourse(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    width: number,
    _courseY: number,
    courseH: number,
    staggered: boolean
  ) {
    // Staggered pattern: Course A splits in middle, Course B has full center bricks
    if (!staggered) {
      // Brick 1: 0..8 (9px), Brick 2: 10..18 (9px), 1px mortar gap between
      this.drawSingleBrick(ctx, bx, by, 9, courseH);
      this.drawSingleBrick(ctx, bx + 10, by, 9, courseH);
    } else {
      // Half brick left (4px), full brick center (9px), half brick right (4px)
      this.drawSingleBrick(ctx, bx, by, 4, courseH);
      this.drawSingleBrick(ctx, bx + 5, by, 9, courseH);
      this.drawSingleBrick(ctx, bx + 15, by, 4, courseH);
    }
  }

  private drawSingleBrick(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    w: number,
    h: number
  ) {
    // Main terracotta body
    ctx.fillStyle = '#b93816';
    ctx.fillRect(bx, by, w, h);

    // Top specular highlight edge (bright terracotta)
    ctx.fillStyle = '#f0643b';
    ctx.fillRect(bx, by, w, 1);

    // Left subtle highlight edge
    ctx.fillStyle = '#d94f28';
    ctx.fillRect(bx, by, 1, h);

    // Bottom shadow groove (deep umber)
    ctx.fillStyle = '#5c1403';
    ctx.fillRect(bx, by + h - 1, w, 1);

    // Right shadow groove
    ctx.fillRect(bx + w - 1, by, 1, h);
  }

  /**
   * Ultra-Sharp Steel Block (4 Quadrant Beveled Armor Plates with Rivets)
   */
  private drawSteel(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    const px = Math.round(x);
    const py = Math.round(y);
    const ps = Math.round(s);

    // Dark steel divider plate background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px, py, ps, ps);

    // 4 quadrants: Top-Left, Top-Right, Bottom-Left, Bottom-Right (each 9x9 with 1px gap)
    const qSize = Math.floor(ps / 2) - 1; // 9px

    this.drawSteelPlate(ctx, px, py, qSize);
    this.drawSteelPlate(ctx, px + qSize + 2, py, qSize);
    this.drawSteelPlate(ctx, px, py + qSize + 2, qSize);
    this.drawSteelPlate(ctx, px + qSize + 2, py + qSize + 2, qSize);
  }

  private drawSteelPlate(ctx: CanvasRenderingContext2D, qx: number, qy: number, size: number) {
    // Plate face base
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(qx, qy, size, size);

    // Top & Left pure white bevel reflection
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qx, qy, size, 1.5);
    ctx.fillRect(qx, qy, 1.5, size);

    // Bottom & Right dark gunmetal bevel shadow
    ctx.fillStyle = '#334155';
    ctx.fillRect(qx, qy + size - 1.5, size, 1.5);
    ctx.fillRect(qx + size - 1.5, qy, 1.5, size);

    // Inner bright steel sheen
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(qx + 1.5, qy + 1.5, size - 3, size - 3);

    // Center metallic hex rivet / stud with specular sparkle
    const midX = qx + Math.floor(size / 2);
    const midY = qy + Math.floor(size / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(midX - 1.5, midY - 1.5, 3, 3);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(midX - 0.5, midY - 0.5, 1.5, 1.5);
  }

  /**
   * Water Moat Tile with animated reflective ripples
   */
  private drawWater(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, frame: number) {
    const px = Math.round(x);
    const py = Math.round(y);
    const ps = Math.round(s);

    // Deep cobalt water base
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(px, py, ps, ps);

    // Animated ripple bands
    const animOffset = ((frame % 16) / 16) * ps;
    const waveH = Math.max(2, Math.round(ps * 0.18));

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(px, py + (animOffset % ps), ps, waveH);
    ctx.fillRect(px, py + ((animOffset + ps / 2) % ps), ps, waveH);

    // Crisp white foam highlights
    ctx.fillStyle = '#bfdbfe';
    ctx.fillRect(px + ((animOffset * 1.8) % ps), py + (animOffset % ps), Math.round(ps * 0.4), 1.5);
    ctx.fillRect(px + (((animOffset + ps / 2) * 1.4) % ps), py + ((animOffset + ps / 2) % ps), Math.round(ps * 0.3), 1.5);
  }

  /**
   * Bush / Forest Canopy Tile with high-contrast foliage clusters
   */
  private drawBush(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    const px = Math.round(x);
    const py = Math.round(y);
    const ps = Math.round(s);

    // Deep forest underlayer
    ctx.fillStyle = '#14532d';
    ctx.fillRect(px, py, ps, ps);

    // Mid-tone vibrant emerald leaf clusters
    ctx.fillStyle = '#16a34a';
    const sub = ps / 4;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(px + i * sub, py + j * sub, sub, sub);
        }
      }
    }

    // High-contrast sunlit canopy tips (bright lime green)
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(px + 1, py + 1, sub - 1, 1.5);
    ctx.fillRect(px + sub * 2 + 1, py + 1, sub - 1, 1.5);
    ctx.fillRect(px + sub + 1, py + sub + 1, sub - 1, 1.5);
    ctx.fillRect(px + sub * 3 + 1, py + sub + 1, sub - 1, 1.5);
    ctx.fillRect(px + 1, py + sub * 2 + 1, sub - 1, 1.5);
    ctx.fillRect(px + sub * 2 + 1, py + sub * 2 + 1, sub - 1, 1.5);

    // Deep interior shadows
    ctx.fillStyle = '#052e16';
    ctx.fillRect(px + sub - 1, py + sub - 1, 2, 2);
    ctx.fillRect(px + sub * 3 - 1, py + sub * 3 - 1, 2, 2);
  }

  /**
   * Ice Tile (Slippery surface with diamond frost glints)
   */
  private drawIce(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    const px = Math.round(x);
    const py = Math.round(y);
    const ps = Math.round(s);

    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(px, py, ps, ps);

    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(px + 1.5, py + 1.5, ps - 3, ps - 3);

    // Frost diagonal sheen stripes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 3, py + 3, 3, 3);
    ctx.fillRect(px + ps - 6, py + 4, 2, 2);
    ctx.fillRect(px + 6, py + ps - 6, 2, 2);
  }

  /**
   * Base Eagle (Con Đại Bàng) - High-Definition Pixel Masterpiece
   * Size: 40x40 (2x2 tiles at x: 12*s, y: 24*s)
   */
  private drawEagle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    isDestroyed: boolean
  ) {
    const px = Math.round(x);
    const py = Math.round(y);

    if (isDestroyed) {
      // Destroyed Eagle: Burned stone ruin with fracture lines and glowing embers
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(px, py, size, size);

      // Cracked plinth
      ctx.fillStyle = '#292524';
      ctx.fillRect(px + 3, py + 3, size - 6, size - 6);

      // Charred rubble blocks
      ctx.fillStyle = '#44403c';
      ctx.fillRect(px + 6, py + size - 14, size - 12, 10);
      ctx.fillRect(px + 8, py + 12, size - 16, 14);

      // Burning ember sparks
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(px + size / 2 - 4, py + 16, 8, 8);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px + size / 2 - 2, py + 18, 4, 4);

      // Fracture cracks
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 6, py + 6);
      ctx.lineTo(px + size / 2, py + size / 2);
      ctx.lineTo(px + size - 6, py + size - 6);
      ctx.moveTo(px + size - 8, py + 8);
      ctx.lineTo(px + size / 2 - 2, py + size / 2 + 4);
      ctx.stroke();

      // Fallen crest marker
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px + size / 2 - 5, py + size - 8, 10, 3);
      return;
    }

    // Intact Golden Imperial Eagle (Sharp 40x40 Pixel Art)
    // Dark stone plinth pedestal background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(px, py, size, size);

    // Granite foundation steps (bottom plinth)
    ctx.fillStyle = '#334155';
    ctx.fillRect(px + 2, py + size - 8, size - 4, 7);
    ctx.fillStyle = '#475569';
    ctx.fillRect(px + 3, py + size - 8, size - 6, 2);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px + 2, py + size - 2, size - 4, 2);

    // Outstretched Golden Eagle Wings
    // Base wing body shadow
    ctx.fillStyle = '#a16207';
    ctx.fillRect(px + 3, py + 10, size - 6, size - 20);

    // Main golden wing plumage
    ctx.fillStyle = '#ca8a04';
    ctx.fillRect(px + 4, py + 8, size - 8, size - 18);

    // Left Wing primary feather tips
    ctx.fillStyle = '#eab308';
    ctx.fillRect(px + 2, py + 6, 9, 14);
    ctx.fillRect(px + 4, py + 4, 7, 5);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(px + 2, py + 6, 2, 12); // Bright wing leading edge

    // Right Wing primary feather tips
    ctx.fillStyle = '#eab308';
    ctx.fillRect(px + size - 11, py + 6, 9, 14);
    ctx.fillRect(px + size - 11, py + 4, 7, 5);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(px + size - 4, py + 6, 2, 12); // Bright wing leading edge

    // Eagle Center Body & Crest
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + size / 2 - 6, py + 6, 12, 18);

    // Eagle Head Plumage (Regal Pure White Head)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + size / 2 - 5, py + 3, 10, 8);
    // Eagle Head Crown Crest
    ctx.fillRect(px + size / 2 - 3, py + 1.5, 6, 3);

    // Sharp Curved Golden Beak
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(px + size / 2 - 2, py + 2, 4, 5);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px + size / 2 - 1, py + 5, 2, 2);

    // Fierce Eagle Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(px + size / 2 - 4, py + 5, 2, 2);
    ctx.fillRect(px + size / 2 + 2, py + 5, 2, 2);
    // White eye catchlight glints
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + size / 2 - 4, py + 5, 1, 1);
    ctx.fillRect(px + size / 2 + 3, py + 5, 1, 1);

    // Chest Ruby Star Insignia Badge
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(px + size / 2 - 4, py + 14, 8, 8);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(px + size / 2 - 3, py + 15, 6, 6);

    // Golden Star on Chest Shield
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + size / 2 - 1, py + 16, 2, 4);
    ctx.fillRect(px + size / 2 - 2, py + 17, 4, 2);

    // Sharp 1px Highlight Accents on feathers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 5, py + 4, 3, 1.5);
    ctx.fillRect(px + size - 8, py + 4, 3, 1.5);
  }

  /**
   * Ultra-Sharp Detailed Pixel Art Tank Renderer
   * - Crisp integer alignment (no subpixel blur)
   * - Chamfered hull with 3D drop-shadows & bevel contours
   * - Animated caterpillar tracks with moving segmented tread links
   * - Contrast turret dome with commander cupola hatch and periscope
   * - Long cannon barrel with stepped muzzle brake (đầu nòng) and 3D shading
   * - Specular highlight glint at top-left
   * - Player: Military Olive Green & Desert Sand Yellow (upgraded badge on Tier 2)
   * - Enemy: Steel Gunmetal & Crimson Red (Blinking Red-White for item carrier)
   */
  private drawTank(ctx: CanvasRenderingContext2D, tank: Tank, s: number) {
    const tankSize = s * 2 - 2; // 38px bounding box
    const half = tankSize / 2;  // 19px

    // Round center coordinates to exact pixels for razor-sharp rendering
    const cx = Math.round(tank.x + half);
    const cy = Math.round(tank.y + half);

    ctx.save();
    ctx.translate(cx, cy);

    // Direction rotation (UP: 0 radians)
    let angle = 0;
    if (tank.direction === 'RIGHT') angle = Math.PI / 2;
    else if (tank.direction === 'DOWN') angle = Math.PI;
    else if (tank.direction === 'LEFT') angle = -Math.PI / 2;
    ctx.rotate(angle);

    // -------------------------------------------------------------
    // Palette Setup
    // -------------------------------------------------------------
    let hullBase = '#2b5c31';
    let hullHighlight = '#3f7e47';
    let hullShadow = '#16361a';
    let secondaryAccent = '#d4af37';
    let secondaryLight = '#fde047';
    let turretBase = '#996515';
    let turretTop = '#b87c24';
    let barrelBase = '#785116';
    let trackBase = '#11171d';
    let trackLink = '#e5c07b';

    if (tank.isPlayer) {
      // Player Tank: Classic Army Green & Sandy Gold
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
      // Enemy Tank Palettes
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
        // Heavy Armor multi-hit tank changes color as health drops
        const hpPalettes = [
          { hull: '#dc2626', turret: '#991b1b', accent: '#ffffff' }, // 1 HP left (Cracking Red)
          { hull: '#ea580c', turret: '#9a3412', accent: '#fef08a' }, // 2 HP left (Orange)
          { hull: '#ca8a04', turret: '#854d0e', accent: '#ffffff' }, // 3 HP left (Yellow)
          { hull: '#15803d', turret: '#14532d', accent: '#86efac' }, // 4 HP full (Heavy Green)
        ];
        const p = hpPalettes[Math.max(0, Math.min(hpPalettes.length - 1, tank.health - 1))];
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

      // Blinking Item Carrier Tank: Rapid high-contrast flash
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

    // -------------------------------------------------------------
    // 1. BÁNH XÍCH (TRACKS): Hai bên thân xe với mắt xích sắc nét
    // -------------------------------------------------------------
    const trackW = 7;
    const trackH = tankSize;
    const leftTrackX = -half;
    const rightTrackX = half - trackW;

    // Track outer housing
    ctx.fillStyle = trackBase;
    ctx.fillRect(leftTrackX, -half, trackW, trackH);
    ctx.fillRect(rightTrackX, -half, trackW, trackH);

    // Track outer housing 1px dark border
    ctx.strokeStyle = '#090d12';
    ctx.lineWidth = 1;
    ctx.strokeRect(leftTrackX + 0.5, -half + 0.5, trackW - 1, trackH - 1);
    ctx.strokeRect(rightTrackX + 0.5, -half + 0.5, trackW - 1, trackH - 1);

    // Road wheels / idlers at track extremities
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(leftTrackX + 1, -half + 1, trackW - 2, 3);
    ctx.fillRect(leftTrackX + 1, half - 4, trackW - 2, 3);
    ctx.fillRect(rightTrackX + 1, -half + 1, trackW - 2, 3);
    ctx.fillRect(rightTrackX + 1, half - 4, trackW - 2, 3);

    // Segmented animated tread links (nhấp nháy / cuộn mượt khi di chuyển)
    const animOffset = (tank.trackFrame || 0) * 3;
    const numLinks = 6;
    for (let i = 0; i < numLinks; i++) {
      const yLink = -half + 2 + ((i * 6 + animOffset) % (trackH - 4));

      // Left track: broken/segmented horizontal dashes
      ctx.fillStyle = trackLink;
      ctx.fillRect(leftTrackX + 1.5, yLink, 3, 2);
      ctx.fillRect(leftTrackX + 5, yLink, 1, 2);

      // Right track: broken/segmented horizontal dashes
      ctx.fillRect(rightTrackX + 1, yLink, 1, 2);
      ctx.fillRect(rightTrackX + 2.5, yLink, 3, 2);

      // Dark shadow recess behind link
      ctx.fillStyle = '#05070a';
      ctx.fillRect(leftTrackX + 1.5, yLink + 2, 4.5, 1);
      ctx.fillRect(rightTrackX + 1, yLink + 2, 4.5, 1);
    }

    // -------------------------------------------------------------
    // 2. THÂN XE (HULL / CHASSIS): Vát góc 3D, viền bóng và khe tản nhiệt
    // -------------------------------------------------------------
    const hullL = -11;
    const hullR = 11;
    const hullT = -16;
    const hullB = 16;
    const bevel = 4; // 4px chamfered corner

    // Chamfered hull polygon
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

    // 3D Shadow Borders (Đường viền tối màu tạo độ nổi)
    ctx.strokeStyle = hullShadow;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bottom and Right deep shadow bevel
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

    // Front glacis top bevel highlight (đón sáng)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(hullL + bevel, hullT, (hullR - hullL) - bevel * 2, 1.5);

    // Decorative Secondary Armor Plate (Vàng cát cho Player / Đỏ rực cho Enemy)
    ctx.fillStyle = secondaryAccent;
    ctx.fillRect(-7, -13, 14, 3);
    ctx.fillStyle = secondaryLight;
    ctx.fillRect(-6, -13, 12, 1);

    // Rear engine deck cooling louvers (khe tản nhiệt động cơ)
    ctx.fillStyle = secondaryAccent;
    ctx.fillRect(-7, 9, 14, 4);
    ctx.fillStyle = '#0b0f14'; // Dark vent slits
    ctx.fillRect(-5, 10, 10, 1);
    ctx.fillRect(-5, 12, 10, 1);

    // -------------------------------------------------------------
    // 3. NÒNG PHÁO (BARREL): Hình chữ nhật dài có khấc nhỏ ở đầu nòng
    // -------------------------------------------------------------
    const isUpgraded = tank.isPlayer && (tank.tier || 1) > 1;
    const barrelW = isUpgraded ? 5 : 4;
    const barrelLen = isUpgraded ? 19 : 17;
    const barrelStartY = -6;
    const muzzleY = barrelStartY - barrelLen;

    // Reinforced gun mantlet at turret junction (bệ nòng súng)
    ctx.fillStyle = hullShadow;
    ctx.fillRect(-5, barrelStartY - 3, 10, 4);
    ctx.fillStyle = secondaryAccent;
    ctx.fillRect(-3, barrelStartY - 2, 6, 2);

    // Main barrel tube
    ctx.fillStyle = barrelBase;
    ctx.fillRect(-barrelW / 2, muzzleY, barrelW, barrelLen);

    // Barrel 3D lighting: left highlight, right shadow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(-barrelW / 2, muzzleY, 1, barrelLen);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barrelW / 2 - 1, muzzleY, 1, barrelLen);

    // Stepped Muzzle Brake (Khấc nhỏ đầu nòng)
    const muzzleW = isUpgraded ? 7 : 6;
    const muzzleH = 3.5;
    ctx.fillStyle = barrelBase;
    ctx.fillRect(-muzzleW / 2, muzzleY - 1, muzzleW, muzzleH);
    ctx.strokeStyle = '#0a0e14';
    ctx.lineWidth = 1;
    ctx.strokeRect(-muzzleW / 2, muzzleY - 1, muzzleW, muzzleH);

    // Dark bore hole inside muzzle brake
    ctx.fillStyle = '#000000';
    ctx.fillRect(-1.5, muzzleY - 1, 3, 1.5);

    // -------------------------------------------------------------
    // 4. THÁP PHÁO (TURRET): Khối bo góc ở chính giữa, màu đậm hơn thân xe
    // -------------------------------------------------------------
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

    // Turret 3D edge stroke
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Turret inner dome top
    ctx.fillStyle = turretTop;
    ctx.fillRect(-5, -5, 10, 10);

    // Commander Cupola / Hatch (Cửa hầm chỉ huy)
    ctx.fillStyle = '#11171d';
    ctx.beginPath();
    ctx.arc(1.5, 1.5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = secondaryAccent;
    ctx.beginPath();
    ctx.arc(1.5, 1.5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Optical sight / periscope lens glint
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-4, -4, 2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -4, 1, 1);

    // Star icon on Player upgraded turret
    if (isUpgraded) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, 3, 2, 2);
    }

    // -------------------------------------------------------------
    // 5. ĐIỂM SÁNG (HIGHLIGHT): Chấm sáng nhỏ ở góc trên bên trái của xe
    // -------------------------------------------------------------
    // Hull top-left specular highlight dot
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -14, 2.5, 2.5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(-9, -15, 1.5, 1.5);

    // Turret top-left specular highlight dot
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -7, 1.5, 1.5);

    ctx.restore();

    // -------------------------------------------------------------
    // 6. KHIÊN BẢO VỆ (SHIELD AURA): Hiển thị khi có bất tử
    // -------------------------------------------------------------
    if (tank.shieldTime > 0) {
      const now = Date.now() / 70;
      ctx.save();
      ctx.strokeStyle = Math.floor(now) % 2 === 0 ? '#38bdf8' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, half + 5, 0, Math.PI * 2);
      ctx.stroke();

      // Inner faint glowing pulse
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(cx, cy, half + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Directional Glowing Tracer Bullet Projectile
   */
  private drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet, _s: number) {
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

    // Outer tracer shell
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Incandescent hot white core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 1.2, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle trailing tail spark
    ctx.fillStyle = glowColor;
    ctx.fillRect(-1, 3, 2, 2);

    ctx.restore();
  }

  /**
   * Expanding Circular Orange-Yellow Explosion (Vụ nổ hình tròn sắc nét)
   */
  private drawExplosion(ctx: CanvasRenderingContext2D, exp: Explosion) {
    const progress = Math.min(1, exp.currentFrame / exp.maxFrames);
    const currentRadius = exp.maxRadius * (0.2 + 0.8 * Math.pow(progress, 0.65));
    const alpha = Math.max(0, 1 - Math.pow(progress, 1.3));

    if (alpha <= 0 || currentRadius <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 1. Core expanding fireball: Vibrant multi-stop radial gradient
    const grad = ctx.createRadialGradient(
      exp.x, exp.y, 0,
      exp.x, exp.y, currentRadius
    );
    grad.addColorStop(0, '#ffffff');             // Pure white hot core
    grad.addColorStop(0.2, '#fef08a');          // Lemon Yellow
    grad.addColorStop(0.5, '#facc15');          // Vivid Yellow
    grad.addColorStop(0.75, '#f97316');         // Fiery Orange
    grad.addColorStop(0.92, '#ea580c');         // Deep Orange
    grad.addColorStop(1, 'rgba(220, 38, 38, 0)'); // Dissolves cleanly at border

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Outer glowing shockwave ring (expanding circular perimeter)
    const ringRadius = currentRadius * 1.04;
    ctx.strokeStyle = progress < 0.6 ? '#fde047' : '#fb923c';
    ctx.lineWidth = Math.max(1, (exp.isBig ? 3.5 : 2) * (1 - progress));
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Inner high-energy circular highlight ring
    if (progress < 0.7) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, 1.5 * (1 - progress));
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, currentRadius * 0.45, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4. Flying orange-yellow spark embers radiating outwards
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

  /**
   * Ultra-Sharp Hand-Crafted Pixel Art Power-Up Badges (No blurry emoji fonts!)
   * Star (Ngôi sao), Grenade (Lựu đạn), Helmet/Shield (Khiên), Shovel (Xẻng)
   */
  private drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUp, s: number) {
    if (!p.flashState) return; // Blinking visibility

    const size = Math.round(s * 1.8); // 36px badge
    const half = Math.floor(size / 2);
    const px = Math.round(p.x - half);
    const py = Math.round(p.y - half);
    const cx = Math.round(p.x);
    const cy = Math.round(p.y);

    ctx.save();

    // Badge styling per type
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

    // Outer Badge Base Plate
    ctx.fillStyle = bgColor;
    ctx.fillRect(px, py, size, size);

    // Beveled Badge Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);

    // Top-left shiny badge corner highlight
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + 2, py + 2, 3, 1);
    ctx.fillRect(px + 2, py + 2, 1, 3);

    // -----------------------------------------------------------
    // Custom Hand-Drawn Pixel Icons
    // -----------------------------------------------------------
    if (p.type === 'STAR') {
      // Golden Beveled Star
      this.drawPixelStar(ctx, cx, cy, 10);
    } else if (p.type === 'BOMB') {
      // Tactical Grenade / Bomb
      this.drawPixelGrenade(ctx, cx, cy);
    } else if (p.type === 'HELMET') {
      // Energy Shield / Combat Helmet
      this.drawPixelShield(ctx, cx, cy);
    } else if (p.type === 'SHOVEL') {
      // Military Trenching Spade
      this.drawPixelShovel(ctx, cx, cy);
    }

    ctx.restore();
  }

  /**
   * Hand-drawn 5-point Pixel Star with 3D Facets
   */
  private drawPixelStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
    ctx.save();
    ctx.fillStyle = '#facc15';

    // 5-point star path
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

    // Star core highlight & border
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center sparkling diamond glint
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 2, cy - 2, 4, 4);
    ctx.restore();
  }

  /**
   * Hand-drawn Military Pineapple Grenade
   */
  private drawPixelGrenade(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    // Body in dark olive / charcoal
    ctx.fillStyle = '#15803d';
    ctx.fillRect(cx - 6, cy - 4, 12, 12);
    ctx.fillRect(cx - 5, cy - 6, 10, 2);
    ctx.fillRect(cx - 5, cy + 8, 10, 2);

    // Segmented fragmentation grid lines
    ctx.fillStyle = '#052e16';
    ctx.fillRect(cx - 6, cy - 1, 12, 1.5);
    ctx.fillRect(cx - 6, cy + 3, 12, 1.5);
    ctx.fillRect(cx - 2, cy - 4, 1.5, 12);
    ctx.fillRect(cx + 2, cy - 4, 1.5, 12);

    // Fuse neck & lever in metallic brass
    ctx.fillStyle = '#d97706';
    ctx.fillRect(cx - 2, cy - 9, 4, 3);
    // Lever handle
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx + 2, cy - 8, 3, 6);
    // Pull ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 6, cy - 10, 4, 4);

    // Red warning band
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(cx - 4, cy - 4, 8, 2);
  }

  /**
   * Hand-drawn Combat Shield / Helmet
   */
  private drawPixelShield(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    // Azure knight shield body
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 8);
    ctx.lineTo(cx + 7, cy - 8);
    ctx.lineTo(cx + 7, cy + 1);
    ctx.lineTo(cx, cy + 9);
    ctx.lineTo(cx - 7, cy + 1);
    ctx.closePath();

    ctx.fillStyle = '#0284c7';
    ctx.fill();

    // Shield border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner bright cross / star
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 1.5, cy - 5, 3, 9);
    ctx.fillRect(cx - 5, cy - 2, 10, 3);
  }

  /**
   * Hand-drawn Military Trenching Spade / Shovel
   */
  private drawPixelShovel(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    // Steel blade at top (beveled spade head)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(cx - 5, cy - 8, 10, 6);
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 2);
    ctx.lineTo(cx + 5, cy - 2);
    ctx.lineTo(cx, cy + 2);
    ctx.closePath();
    ctx.fill();

    // Blade steel highlight & dark edge
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 5, cy - 8, 10, 1.5);
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - 1, cy - 7, 2, 5);

    // Wooden shaft
    ctx.fillStyle = '#b45309';
    ctx.fillRect(cx - 1.5, cy + 2, 3, 7);

    // Steel D-handle grip at bottom
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(cx - 4, cy + 9, 8, 2);
    ctx.fillRect(cx - 4, cy + 7, 2, 3);
    ctx.fillRect(cx + 2, cy + 7, 2, 3);
  }
}
