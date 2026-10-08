import { Bullet, Direction, EnemyType, Explosion, FloatingText, GameStats, PowerUp, PowerUpType, SpawnEffect, Tank, TileType } from '../types/game';
import { sounds } from '../utils/audio';
import { getStageMap, MAP_SIZE, setEagleFortress } from '../utils/maps';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
}

export class GameEngine {
  public tileSize: number = 20; // Default 20px per tile -> 520x520 arena
  public map: number[][] = [];
  public player: Tank | null = null;
  public enemies: Tank[] = [];
  public bullets: Bullet[] = [];
  public explosions: Explosion[] = [];
  public powerUps: PowerUp[] = [];
  public floatingTexts: FloatingText[] = [];
  public spawnEffects: SpawnEffect[] = [];

  public stats: GameStats = {
    score: 0,
    highScore: 0,
    lives: 3,
    stage: 1,
    enemiesRemaining: 20,
    enemiesDefeated: 0,
    baseDestroyed: false,
    gameWon: false,
  };

  // State timers
  public isGameOver: boolean = false;
  public isVictory: boolean = false;
  public isPaused: boolean = false;

  private spawnCooldown: number = 0;
  private freezeTime: number = 0; // Clock power-up freeze
  private shovelTime: number = 0; // Shovel steel fortress timer
  private waterFrameCounter: number = 0;
  private enemySpawnQueue: EnemyType[] = [];
  private enemySpawnIndex: number = 0;
  private lastSpawnSlot: number = 0;

  // Key tracking to prevent auto-repeat issues with space
  private firePressedLastFrame: boolean = false;

  constructor(tileSize: number = 20) {
    this.tileSize = tileSize;
    this.loadHighScore();
    this.initStage(1, true);
  }

  private loadHighScore() {
    try {
      const saved = localStorage.getItem('battle_city_highscore');
      if (saved) {
        this.stats.highScore = parseInt(saved, 10) || 0;
      }
    } catch {}
  }

  private saveHighScore() {
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      try {
        localStorage.setItem('battle_city_highscore', this.stats.highScore.toString());
      } catch {}
    }
  }

  public initStage(stage: number, resetScoreAndLives = false) {
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

    // Queue 20 enemies per stage
    const queue: EnemyType[] = [];
    for (let i = 0; i < 20; i++) {
      if (i < 10) queue.push('BASIC');       // 10 Basic tanks
      else if (i < 15) queue.push('FAST');   // 5 Fast tanks
      else if (i < 18) queue.push('POWER');  // 3 Power tanks
      else queue.push('ARMOR');             // 2 Armor tanks
    }
    // Shuffle queue slightly
    this.enemySpawnQueue = queue.sort(() => Math.random() - 0.5);
    this.stats.enemiesRemaining = this.enemySpawnQueue.length;
    this.stats.enemiesDefeated = 0;
    this.enemySpawnIndex = 0;
    this.spawnCooldown = 45; // Short delay before first enemy warning star

    // Spawn player near eagle
    this.spawnPlayer();

    // Play stage intro fanfare
    sounds.playStageIntro();
  }

  public spawnPlayer() {
    const s = this.tileSize;
    // Row 24, Col 8 (left side of eagle base)
    this.player = {
      id: 'player',
      x: 8 * s,
      y: 24 * s,
      direction: 'UP',
      speed: 2.2,
      bulletSpeed: 5.5, // Standard bullet speed
      type: 'PLAYER',
      color: '#eab308',
      isPlayer: true,
      health: 1,
      maxHealth: 1,
      shieldTime: 3.5, // 3.5s shield on spawn
      shootCooldown: 0,
      trackFrame: 0,
      tier: 1,
    };
  }

  /**
   * Main game loop update (called ~60fps)
   */
  public update(input: InputState) {
    if (this.isPaused || this.isGameOver || this.isVictory) {
      return;
    }

    this.waterFrameCounter++;

    // 1. Shovel fortress countdown (10 seconds total)
    if (this.shovelTime > 0) {
      this.shovelTime--;
      if (this.shovelTime === 0) {
        // Revert base fortress back to BRICK
        setEagleFortress(this.map, TileType.BRICK);
      } else if (this.shovelTime <= 120 && Math.floor(this.shovelTime / 15) % 2 === 0) {
        // Flickering warning between brick and steel in the last 2 seconds
        setEagleFortress(this.map, TileType.BRICK);
      } else if (this.shovelTime <= 120) {
        setEagleFortress(this.map, TileType.STEEL);
      }
    }

    // 2. Freeze time countdown
    if (this.freezeTime > 0) {
      this.freezeTime--;
    }

    // 3. Handle Player Input and Movement
    if (this.player) {
      this.updatePlayer(input);
    }

    // 4. Update Spawn Warning Stars
    this.updateSpawnEffects();

    // 5. Enemy Spawning & AI
    this.updateEnemies();

    // 6. Update Bullets & Collisions
    this.updateBullets();

    // 7. Update Explosions
    this.updateExplosions();

    // 8. Update Power-ups
    this.updatePowerUps();

    // 9. Update Floating Texts
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

  /**
   * Player movement and fire mechanics
   */
  private updatePlayer(input: InputState) {
    if (!this.player) return;

    if (this.player.shieldTime > 0) {
      this.player.shieldTime = Math.max(0, this.player.shieldTime - 1 / 60);
    }

    let dx = 0;
    let dy = 0;
    let newDir: Direction | null = null;

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
      this.player.trackFrame = (this.player.trackFrame! + 1) % 2;
    }

    // Fire bullet: Strict limit: exactly 1 player bullet on field at a time!
    const playerBulletCount = this.bullets.filter(b => b.owner === 'PLAYER').length;
    const canFire = playerBulletCount === 0 && input.fire && !this.firePressedLastFrame;

    if (canFire) {
      this.fireBullet(this.player);
      this.firePressedLastFrame = true;
    } else if (!input.fire) {
      this.firePressedLastFrame = false;
    }
  }

  /**
   * Updates warning spawn stars and spawns enemies when complete
   */
  private updateSpawnEffects() {
    const s = this.tileSize;
    const remaining: SpawnEffect[] = [];

    for (const sp of this.spawnEffects) {
      sp.framesLeft--;
      if (sp.framesLeft <= 0) {
        // Warning star finished, materialize the tank!
        // If the player is currently on top of this spawn point, push player safely aside
        if (this.player) {
          const dist = Math.hypot(this.player.x - sp.x, this.player.y - sp.y);
          if (dist < s * 1.8) {
            // Nudge player downwards or sideways so they never get trapped
            this.player.y = Math.min(MAP_SIZE * s - s * 2, this.player.y + s * 2);
          }
        }

        let speed = 1.3;
        let health = 1;
        let color = '#94a3b8';

        if (sp.type === 'FAST') {
          speed = 2.2;
          color = '#38bdf8';
        } else if (sp.type === 'POWER') {
          speed = 1.6;
          color = '#f97316';
        } else if (sp.type === 'ARMOR') {
          speed = 1.1;
          health = 4;
          color = '#15803d';
        }

        const enemy: Tank = {
          id: `enemy_${Date.now()}_${Math.random()}`,
          x: sp.x,
          y: sp.y,
          direction: 'DOWN',
          speed,
          type: sp.type,
          color,
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

  /**
   * Spawns enemies from the 3 classic top positions without blocking player
   */
  private updateEnemies() {
    const s = this.tileSize;
    const maxActive = 4; // Max 4 enemies active at once

    const totalActive = this.enemies.length + this.spawnEffects.length;

    // Spawn new enemy if quota left and below max active
    if (
      this.enemySpawnIndex < this.enemySpawnQueue.length &&
      totalActive < maxActive
    ) {
      this.spawnCooldown--;
      if (this.spawnCooldown <= 0) {
        const spawnCols = [0, 12, 24];

        // Find which spawn points are currently free
        const freeCols = spawnCols.filter(col => {
          const sx = col * s;
          const sy = 0;

          // Check if player is near this spawn point
          if (this.player) {
            const distToPlayer = Math.hypot(this.player.x - sx, this.player.y - sy);
            if (distToPlayer < s * 2.3) return false;
          }

          // Check if active enemy is near this spawn point
          const enemyNear = this.enemies.some(e => Math.hypot(e.x - sx, e.y - sy) < s * 2.3);
          if (enemyNear) return false;

          // Check if another spawn star is already at this spawn point
          const starNear = this.spawnEffects.some(sp => Math.hypot(sp.x - sx, sp.y - sy) < s * 2.3);
          if (starNear) return false;

          return true;
        });

        if (freeCols.length > 0) {
          // Select preferred column based on rotation
          const preferredCol = spawnCols[this.lastSpawnSlot];
          const chosenCol = freeCols.includes(preferredCol) ? preferredCol : freeCols[0];
          this.lastSpawnSlot = (this.lastSpawnSlot + 1) % 3;

          const type = this.enemySpawnQueue[this.enemySpawnIndex];
          const hasItem = this.enemySpawnIndex % 4 === 1; // Every 4th enemy carries a power-up item

          // Spawn star warning effect (1 second) before tank materializes
          this.spawnEffects.push({
            id: `spawn_${Date.now()}_${Math.random()}`,
            x: chosenCol * s,
            y: 0,
            type,
            hasItem,
            framesLeft: 55, // ~0.9 second flashing star
            maxFrames: 55,
          });

          this.enemySpawnIndex++;
          this.stats.enemiesRemaining = this.enemySpawnQueue.length - this.enemySpawnIndex;
          this.spawnCooldown = 80; // Delay before scheduling next spawn
        } else {
          // If all 3 slots are temporarily occupied, retry soon
          this.spawnCooldown = 20;
        }
      }
    }

    // Update existing enemies AI
    if (this.freezeTime <= 0) {
      this.enemies.forEach(enemy => {
        this.updateEnemyAI(enemy);
      });
    }
  }

  /**
   * Enemy AI behavior: Wandering, corner turning, target bias, auto firing
   */
  private updateEnemyAI(enemy: Tank) {
    // Periodic direction change or turning when blocked
    const changeDirRoll = Math.random();
    if (changeDirRoll < 0.015) {
      // 1.5% chance per frame to randomly change direction
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
      // Hit an obstacle, pick a new direction immediately
      this.pickNewEnemyDirection(enemy);
    } else {
      enemy.trackFrame = (enemy.trackFrame! + 1) % 2;
    }

    // Shoot cooldown
    if (enemy.shootCooldown > 0) {
      enemy.shootCooldown--;
    } else {
      // Limit enemy bullets: max 1 per enemy
      const enemyBulletCount = this.bullets.filter(b => b.shooterId === enemy.id).length;
      if (enemyBulletCount === 0) {
        this.fireBullet(enemy);
        enemy.shootCooldown = 60 + Math.floor(Math.random() * 80);
      }
    }
  }

  private pickNewEnemyDirection(enemy: Tank) {
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    // Bias towards DOWN (towards Player/Eagle) 40% of the time
    if (Math.random() < 0.4) {
      enemy.direction = 'DOWN';
    } else {
      const remaining = directions.filter(d => d !== enemy.direction);
      enemy.direction = remaining[Math.floor(Math.random() * remaining.length)];
    }
  }

  /**
   * Fires a bullet from given tank
   */
  private fireBullet(tank: Tank) {
    const s = this.tileSize;
    const tankSize = s * 2;
    let bx = tank.x + tankSize / 2;
    let by = tank.y + tankSize / 2;

    const bSpeed = tank.isPlayer ? (tank.bulletSpeed || 5.5) : 4.0;

    // Offset bullet to start right at the cannon muzzle
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

  /**
   * Checks if a tank can fit at the given coordinates without colliding.
   */
  private canTankFitAt(tank: Tank, testX: number, testY: number): boolean {
    const s = this.tileSize;
    const tankSize = s * 2 - 2; // Tank size
    const mapPx = MAP_SIZE * s;

    // 1. Boundary bounds
    if (testX < 0 || testX + tankSize > mapPx || testY < 0 || testY + tankSize > mapPx) {
      return false;
    }

    // 2. Map tiles collision (Bricks, Steel, Water, Eagle)
    // 2px inset gives a 34x34px collision box inside 38px sprite, allowing smooth corridor passage
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

    // 3. Tank-to-Tank collision with anti-stuck separation support
    const pad = 3;
    const w = tankSize - pad * 2;
    const h = tankSize - pad * 2;

    const isBlockedBy = (other: Tank): boolean => {
      const collides = this.checkBoundingBox(
        testX + pad, testY + pad, w, h,
        other.x + pad, other.y + pad, w, h
      );
      if (!collides) return false;

      // If already overlapping, allow moving if distance increases
      const wasColliding = this.checkBoundingBox(
        tank.x + pad, tank.y + pad, w, h,
        other.x + pad, other.y + pad, w, h
      );
      if (wasColliding) {
        const curDistSq = (tank.x - other.x) ** 2 + (tank.y - other.y) ** 2;
        const newDistSq = (testX - other.x) ** 2 + (testY - other.y) ** 2;
        if (newDistSq >= curDistSq) {
          return false; // Allowed! Separate cleanly
        }
      }

      return true; // Blocked
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

  /**
   * Moves a tank with smart corner rounding and grid slot alignment.
   * When changing direction near a wall corner or corridor opening, automatically aligns
   * to the grid slot so the tank glides smoothly without getting stuck on corners.
   */
  private moveTank(tank: Tank, dx: number, dy: number): boolean {
    const s = this.tileSize;
    const speed = Math.max(Math.abs(dx), Math.abs(dy));
    if (speed === 0) return false;

    let moved = false;

    // A. Vertical movement (UP or DOWN)
    if (dy !== 0) {
      // 1. Direct forward movement test
      if (this.canTankFitAt(tank, tank.x, tank.y + dy)) {
        tank.y += dy;
        moved = true;

        // Subtle lane-centering: gently slide towards nearest grid slot if slightly off
        const nearestSlotX = Math.round(tank.x / (s / 2)) * (s / 2);
        const diffX = nearestSlotX - tank.x;
        if (Math.abs(diffX) > 0.05 && Math.abs(diffX) <= 4) {
          const nudgeX = Math.sign(diffX) * Math.min(Math.abs(diffX), speed * 0.3);
          if (this.canTankFitAt(tank, tank.x + nudgeX, tank.y)) {
            tank.x += nudgeX;
          }
        }
      } else {
        // 2. Corner Assist: Blocked on corner. Check nearby grid slots on X
        const snapThreshold = 12; // Assist rounding corners within 12 pixels
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

        // Unique candidates within threshold, sorted by closest to tank.x
        const uniqueCandX = Array.from(new Set(candidates))
          .filter(cand => Math.abs(cand - tank.x) <= snapThreshold)
          .sort((a, b) => Math.abs(a - tank.x) - Math.abs(b - tank.x));

        for (const candX of uniqueCandX) {
          if (this.canTankFitAt(tank, candX, tank.y + dy)) {
            // Open corridor found! Slide along X towards candX
            const diffX = candX - tank.x;
            if (Math.abs(diffX) > 0.05) {
              const stepX = Math.sign(diffX) * Math.min(speed, Math.abs(diffX));
              if (this.canTankFitAt(tank, tank.x + stepX, tank.y)) {
                tank.x += stepX;
                moved = true;
              }
            }
            // If closely aligned to the corridor entrance, also start advancing forward
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
    }

    // B. Horizontal movement (LEFT or RIGHT)
    else if (dx !== 0) {
      // 1. Direct forward movement test
      if (this.canTankFitAt(tank, tank.x + dx, tank.y)) {
        tank.x += dx;
        moved = true;

        // Subtle lane-centering: gently slide towards nearest grid slot if slightly off
        const nearestSlotY = Math.round(tank.y / (s / 2)) * (s / 2);
        const diffY = nearestSlotY - tank.y;
        if (Math.abs(diffY) > 0.05 && Math.abs(diffY) <= 4) {
          const nudgeY = Math.sign(diffY) * Math.min(Math.abs(diffY), speed * 0.3);
          if (this.canTankFitAt(tank, tank.x, tank.y + nudgeY)) {
            tank.y += nudgeY;
          }
        }
      } else {
        // 2. Corner Assist: Blocked on corner. Check nearby grid slots on Y
        const snapThreshold = 12; // Assist rounding corners within 12 pixels
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
            // Open corridor found! Slide along Y towards candY
            const diffY = candY - tank.y;
            if (Math.abs(diffY) > 0.05) {
              const stepY = Math.sign(diffY) * Math.min(speed, Math.abs(diffY));
              if (this.canTankFitAt(tank, tank.x, tank.y + stepY)) {
                tank.y += stepY;
                moved = true;
              }
            }
            // If closely aligned to the corridor entrance, also start advancing forward
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

  /**
   * Bullets update and collision processing
   */
  private updateBullets() {
    const s = this.tileSize;
    const mapPx = MAP_SIZE * s;
    const bulletsToKeep: Bullet[] = [];

    for (let i = 0; i < this.bullets.length; i++) {
      const b = this.bullets[i];
      let destroyed = false;

      // Move bullet
      if (b.direction === 'UP') b.y -= b.speed;
      else if (b.direction === 'DOWN') b.y += b.speed;
      else if (b.direction === 'LEFT') b.x -= b.speed;
      else if (b.direction === 'RIGHT') b.x += b.speed;

      // 1. Boundary check
      if (b.x < 0 || b.x > mapPx || b.y < 0 || b.y > mapPx) {
        this.spawnExplosion(b.x, b.y, false);
        continue;
      }

      // 2. Bullet vs Bullet collision (bullets neutralize each other)
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

      // 3. Bullet vs Map Grid (Bricks, Steel, Eagle)
      const col = Math.floor(b.x / s);
      const row = Math.floor(b.y / s);

      if (row >= 0 && row < MAP_SIZE && col >= 0 && col < MAP_SIZE) {
        const tile = this.map[row][col];

        // Eagle check (rows 24..25, cols 12..13)
        if (tile === TileType.EAGLE_INTACT) {
          this.destroyEagle();
          this.spawnExplosion(b.x, b.y, true);
          continue;
        }

        // Brick collision (destroy brick, bullet disappears)
        if (tile === TileType.BRICK) {
          this.map[row][col] = TileType.EMPTY;
          const brickCenterX = col * s + s / 2;
          const brickCenterY = row * s + s / 2;
          this.spawnExplosion(brickCenterX, brickCenterY, false);
          sounds.playBrickHit();
          continue;
        }

        // Steel collision (steel survives, bullet disappears)
        if (tile === TileType.STEEL) {
          this.spawnExplosion(b.x, b.y, false);
          sounds.playSteelHit();
          continue;
        }
      }

      // 4. Player Bullet vs Enemies
      if (b.owner === 'PLAYER') {
        const hitEnemyIndex = this.enemies.findIndex(enemy =>
          this.checkPointInRect(b.x, b.y, enemy.x, enemy.y, s * 2, s * 2)
        );

        if (hitEnemyIndex !== -1) {
          const enemy = this.enemies[hitEnemyIndex];
          enemy.health--;

          if (enemy.health <= 0) {
            // Kill enemy
            this.enemies.splice(hitEnemyIndex, 1);
            this.stats.enemiesDefeated++;

            // Points reward
            let pts = 100;
            if (enemy.type === 'FAST') pts = 200;
            else if (enemy.type === 'POWER') pts = 300;
            else if (enemy.type === 'ARMOR') pts = 400;

            this.stats.score += pts;
            this.saveHighScore();
            this.addFloatingText(`+${pts}`, enemy.x + s, enemy.y, '#facc15');
            this.spawnExplosion(enemy.x + s, enemy.y + s, true);
            sounds.playExplosion(true);

            // Drop power-up if hasItem
            if (enemy.hasItem) {
              this.spawnPowerUp(enemy.x + s, enemy.y + s);
            }
          } else {
            // Armor tank took damage but still alive
            this.spawnExplosion(b.x, b.y, false);
            sounds.playSteelHit();
          }
          continue;
        }
      }

      // 5. Enemy Bullet vs Player
      if (b.owner === 'ENEMY' && this.player) {
        if (this.checkPointInRect(b.x, b.y, this.player.x, this.player.y, s * 2, s * 2)) {
          if (this.player.shieldTime > 0) {
            // Protected by shield!
            this.spawnExplosion(b.x, b.y, false);
            sounds.playSteelHit();
          } else {
            // Player hit! Lose 1 life
            this.spawnExplosion(this.player.x + s, this.player.y + s, true);
            sounds.playExplosion(true);
            this.stats.lives--;

            if (this.stats.lives <= 0) {
              this.player = null;
              this.triggerGameOver('Hết mạng! (Out of Lives)');
            } else {
              // Respawn player
              this.spawnPlayer();
            }
          }
          continue;
        }
      }

      // If survived all collision checks, keep bullet
      bulletsToKeep.push(b);
    }

    this.bullets = bulletsToKeep;
  }

  /**
   * Destroys Eagle and triggers Game Over
   */
  private destroyEagle() {
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

  private triggerGameOver(reason: string) {
    this.isGameOver = true;
    this.saveHighScore();
    sounds.playGameOver();
    this.addFloatingText('Bạn ngu vãi cả loz', MAP_SIZE * this.tileSize / 2, MAP_SIZE * this.tileSize / 2, '#ef4444');
  }

  /**
   * Power-up spawning and pickup processing
   */
  private spawnPowerUp(x: number, y: number) {
    // Random 1 of 4 items: Star (bullet speed up), Bomb (wipe enemies), Helmet (5s shield), Shovel (10s steel base)
    const types: PowerUpType[] = ['STAR', 'BOMB', 'HELMET', 'SHOVEL'];
    const selected = types[Math.floor(Math.random() * types.length)];

    this.powerUps.push({
      id: `powerup_${Date.now()}`,
      type: selected,
      x,
      y,
      duration: 600, // 10 seconds before disappearing
      flashState: true,
    });
  }

  private updatePowerUps() {
    if (!this.player) return;
    const s = this.tileSize;
    const remaining: PowerUp[] = [];

    for (const p of this.powerUps) {
      p.duration--;
      p.flashState = p.duration > 120 || Math.floor(p.duration / 8) % 2 === 0;

      // Check pickup by player
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

  private applyPowerUp(type: PowerUpType) {
    if (type === 'STAR' && this.player) {
      // 1. Ngôi sao: Tăng tốc độ đạn
      this.player.bulletSpeed = Math.min(11.0, (this.player.bulletSpeed || 5.5) + 2.0);
      this.addFloatingText('★ NGÔI SAO: TĂNG TỐC ĐỘ ĐẠN!', this.player.x, this.player.y - 12, '#facc15');
    } else if (type === 'BOMB') {
      // 2. Lựu đạn: Bùm diệt sạch địch trên màn hình
      const count = this.enemies.length;
      this.enemies.forEach(e => {
        this.spawnExplosion(e.x + this.tileSize, e.y + this.tileSize, true);
        this.stats.score += 200;
        this.stats.enemiesDefeated++;
      });
      this.enemies = [];

      // Also wipe any pending spawn warning stars
      this.spawnEffects.forEach(sp => {
        this.spawnExplosion(sp.x + this.tileSize, sp.y + this.tileSize, true);
        this.stats.score += 100;
        this.stats.enemiesDefeated++;
      });
      this.spawnEffects = [];

      sounds.playExplosion(true);
      this.addFloatingText(`💣 LỰU ĐẠN: BÙM! DIỆT SẠCH ĐỊCH (${count})`, MAP_SIZE * this.tileSize / 2, 70, '#ef4444');
    } else if (type === 'HELMET' && this.player) {
      // 3. Cái khiên: Bất tử trong 5 giây
      this.player.shieldTime = 5.0; // Exact 5 seconds
      this.addFloatingText('🛡️ KHIÊN: BẤT TỬ TRONG 5 GIÂY!', this.player.x, this.player.y - 12, '#38bdf8');
    } else if (type === 'SHOVEL') {
      // 4. Xẻng: Toàn bộ tường bao quanh nhà Đại Bàng biến thành tường thép xám trong vòng 10 giây
      setEagleFortress(this.map, TileType.STEEL);
      this.shovelTime = 600; // 10 seconds (600 frames at 60fps)
      this.addFloatingText('⛏️ XẺNG: THÉP BẢO VỆ ĐẠI BÀNG 10S!', MAP_SIZE * this.tileSize / 2, 23 * this.tileSize - 10, '#e2e8f0');
    }
  }

  /**
   * Explosions animation progress
   */
  private spawnExplosion(x: number, y: number, isBig: boolean) {
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

  private updateExplosions() {
    this.explosions.forEach(exp => exp.currentFrame++);
    this.explosions = this.explosions.filter(exp => exp.currentFrame < exp.maxFrames);
  }

  /**
   * Floating texts drift upwards and fade out
   */
  private addFloatingText(text: string, x: number, y: number, color: string) {
    this.floatingTexts.push({
      id: `ft_${Date.now()}_${Math.random()}`,
      text,
      x,
      y,
      opacity: 1,
      color,
    });
  }

  private updateFloatingTexts() {
    this.floatingTexts.forEach(ft => {
      ft.y -= 0.6;
      ft.opacity -= 0.02;
    });
    this.floatingTexts = this.floatingTexts.filter(ft => ft.opacity > 0);
  }

  // Helper geometry
  private checkBoundingBox(
    x1: number,
    y1: number,
    w1: number,
    h1: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number
  ): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  private checkPointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }
}
