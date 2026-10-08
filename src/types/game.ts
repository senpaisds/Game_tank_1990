export type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

export enum TileType {
  EMPTY = 0,
  BRICK = 1,
  STEEL = 2,
  WATER = 3,
  BUSH = 4,
  ICE = 5,
  EAGLE_INTACT = 8,
  EAGLE_DESTROYED = 9,
}

export type EnemyType = 'BASIC' | 'FAST' | 'POWER' | 'ARMOR';

export interface Position {
  x: number; // in pixels
  y: number; // in pixels
}

export interface Size {
  width: number;
  height: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  owner: 'PLAYER' | 'ENEMY';
  shooterId: string;
  power?: number; // 1 standard, 2 can break steel
}

export interface Tank {
  id: string;
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  bulletSpeed?: number; // Speed of bullets fired by this tank
  type: 'PLAYER' | EnemyType;
  color: string;
  tier?: number; // Player upgrade tier 1-4
  isPlayer: boolean;
  health: number;
  maxHealth: number;
  shieldTime: number; // Invulnerability in seconds
  shootCooldown: number; // in frames / seconds
  hasItem?: boolean; // flashing red tank that drops power-up
  trackFrame?: number; // 0 or 1 for tread animation
}

export type PowerUpType = 'STAR' | 'BOMB' | 'HELMET' | 'SHOVEL';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  duration: number; // lifetime on field
  flashState: boolean;
}

export interface Explosion {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  currentFrame: number;
  maxFrames: number;
  isBig: boolean;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  opacity: number;
  color: string;
}

export interface SpawnEffect {
  id: string;
  x: number;
  y: number;
  type: EnemyType;
  hasItem: boolean;
  framesLeft: number;
  maxFrames: number;
}

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER';

export interface GameStats {
  score: number;
  highScore: number;
  lives: number;
  stage: number;
  enemiesRemaining: number;
  enemiesDefeated: number;
  baseDestroyed: boolean;
  gameWon: boolean;
}
