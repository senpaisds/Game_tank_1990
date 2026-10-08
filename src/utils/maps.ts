import { TileType } from '../types/game';

export const MAP_SIZE = 26; // 26x26 tiles grid

/**
 * Creates empty map with Eagle and standard Eagle protective brick wall
 */
export function createEmptyMap(): number[][] {
  const map: number[][] = Array.from({ length: MAP_SIZE }, () => Array(MAP_SIZE).fill(TileType.EMPTY));

  // Eagle occupies 2x2 at row 24..25, col 12..13
  map[24][12] = TileType.EAGLE_INTACT;
  map[24][13] = TileType.EAGLE_INTACT;
  map[25][12] = TileType.EAGLE_INTACT;
  map[25][13] = TileType.EAGLE_INTACT;

  // Protect Eagle with U-shaped wall
  setEagleFortress(map, TileType.BRICK);

  return map;
}

/**
 * Fortifies eagle base with given tile type (BRICK or STEEL via Shovel power-up)
 */
export function setEagleFortress(map: number[][], tileType: TileType): void {
  // Top wall
  map[23][11] = tileType;
  map[23][12] = tileType;
  map[23][13] = tileType;
  map[23][14] = tileType;

  // Left wall
  map[24][11] = tileType;
  map[25][11] = tileType;

  // Right wall
  map[24][14] = tileType;
  map[25][14] = tileType;
}

/**
 * Helper to fill a rectangle of tiles
 */
function fillBlock(
  map: number[][],
  rStart: number,
  rEnd: number,
  cStart: number,
  cEnd: number,
  type: TileType
) {
  for (let r = rStart; r <= rEnd; r++) {
    for (let c = cStart; c <= cEnd; c++) {
      if (r >= 0 && r < MAP_SIZE && c >= 0 && c < MAP_SIZE) {
        // Do not overwrite eagle
        if (map[r][c] !== TileType.EAGLE_INTACT && map[r][c] !== TileType.EAGLE_DESTROYED) {
          map[r][c] = type;
        }
      }
    }
  }
}

/**
 * Stage 1: Iconic Battle City Stage 1 layout
 */
export function getStage1Map(): number[][] {
  const map = createEmptyMap();

  // Vertical brick strips
  const cols = [2, 6, 10, 14, 18, 22];
  cols.forEach(c => {
    fillBlock(map, 2, 7, c, c + 1, TileType.BRICK);
    fillBlock(map, 9, 14, c, c + 1, TileType.BRICK);
    fillBlock(map, 16, 20, c, c + 1, TileType.BRICK);
  });

  // Steel center blocks
  fillBlock(map, 11, 12, 12, 13, TileType.STEEL);
  fillBlock(map, 11, 12, 0, 1, TileType.STEEL);
  fillBlock(map, 11, 12, 24, 25, TileType.STEEL);

  // Bottom defensive bricks
  fillBlock(map, 22, 23, 6, 7, TileType.BRICK);
  fillBlock(map, 22, 23, 18, 19, TileType.BRICK);

  return map;
}

/**
 * Stage 2: Heavy fortress with river crossing & bushes
 */
export function getStage2Map(): number[][] {
  const map = createEmptyMap();

  // Water moat in middle with 2 brick bridges
  fillBlock(map, 12, 13, 0, 7, TileType.WATER);
  fillBlock(map, 12, 13, 10, 15, TileType.WATER);
  fillBlock(map, 12, 13, 18, 25, TileType.WATER);

  // Bridges (brick)
  fillBlock(map, 12, 13, 8, 9, TileType.BRICK);
  fillBlock(map, 12, 13, 16, 17, TileType.BRICK);

  // Top corridors with bricks & steel
  fillBlock(map, 2, 5, 2, 5, TileType.BRICK);
  fillBlock(map, 2, 5, 20, 23, TileType.BRICK);
  fillBlock(map, 2, 5, 11, 14, TileType.STEEL);

  // Bushes for stealth
  fillBlock(map, 7, 10, 6, 9, TileType.BUSH);
  fillBlock(map, 7, 10, 16, 19, TileType.BUSH);
  fillBlock(map, 16, 19, 10, 15, TileType.BUSH);

  // Steel pillars protecting flanks
  fillBlock(map, 16, 19, 2, 3, TileType.STEEL);
  fillBlock(map, 16, 19, 22, 23, TileType.STEEL);

  // Brick barricades
  fillBlock(map, 18, 21, 6, 7, TileType.BRICK);
  fillBlock(map, 18, 21, 18, 19, TileType.BRICK);

  return map;
}

/**
 * Stage 3: Labyrinth of bricks with steel bunkers
 */
export function getStage3Map(): number[][] {
  const map = createEmptyMap();

  // Labyrinth corridors
  fillBlock(map, 2, 3, 2, 23, TileType.BRICK);
  fillBlock(map, 5, 18, 2, 3, TileType.BRICK);
  fillBlock(map, 5, 18, 22, 23, TileType.BRICK);

  // Steel fortresses
  fillBlock(map, 7, 8, 7, 8, TileType.STEEL);
  fillBlock(map, 7, 8, 17, 18, TileType.STEEL);
  fillBlock(map, 15, 16, 7, 8, TileType.STEEL);
  fillBlock(map, 15, 16, 17, 18, TileType.STEEL);

  // Dense central maze
  fillBlock(map, 6, 10, 11, 14, TileType.BRICK);
  fillBlock(map, 13, 17, 11, 14, TileType.BRICK);

  fillBlock(map, 9, 14, 5, 6, TileType.BRICK);
  fillBlock(map, 9, 14, 19, 20, TileType.BRICK);

  // Some camouflage bush clusters
  fillBlock(map, 20, 23, 2, 4, TileType.BUSH);
  fillBlock(map, 20, 23, 21, 23, TileType.BUSH);

  return map;
}

export function getStageMap(stage: number): number[][] {
  const normalized = ((stage - 1) % 3) + 1;
  if (normalized === 1) return getStage1Map();
  if (normalized === 2) return getStage2Map();
  return getStage3Map();
}
