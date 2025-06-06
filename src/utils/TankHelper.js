import { tileMapping, TILE_SIZE } from './tileMapping.js';

export function getTankCorners(x, y) {
  const half = TILE_SIZE / 2;
  return [
    { row: Math.floor((y - half) / TILE_SIZE), col: Math.floor((x - half) / TILE_SIZE) },
    { row: Math.floor((y - half) / TILE_SIZE), col: Math.floor((x + half - 1) / TILE_SIZE) },
    { row: Math.floor((y + half - 1) / TILE_SIZE), col: Math.floor((x - half) / TILE_SIZE) },
    { row: Math.floor((y + half - 1) / TILE_SIZE), col: Math.floor((x + half - 1) / TILE_SIZE) }
  ];
}

export function isWalkable(row, col, levelMap) {
  if (!isWithinMapBounds(row, col, levelMap)) return false;
  const tileChar = levelMap[row][col];
  const type = tileMapping[tileChar];
  return type === 'empty' || type === 'bush';
}

export function canMove(x, y, levelMap) {
  const corners = getTankCorners(x, y);
  return corners.every(corner => isWalkable(corner.row, corner.col, levelMap));
}

export function isWithinMapBounds(row, col, levelMap) {
  return row >= 0 && row < levelMap.length && col >= 0 && col < levelMap[0].length;
}

export function isTileBlocking(tileChar) {
  const tileType = tileMapping[tileChar];
  return tileType !== 'empty' && tileType !== 'bush';
}

export function getImpactTilesForBullet(bullet, direction) {
  const impactTiles = [];
  if (direction.y !== 0) {
    const colLeft = Math.floor((bullet.x - TILE_SIZE / 2) / TILE_SIZE);
    const colRight = Math.floor((bullet.x + TILE_SIZE / 2 - 1) / TILE_SIZE);
    const row = Math.floor((bullet.y + direction.y * TILE_SIZE) / TILE_SIZE);
    impactTiles.push({ row, col: colLeft }, { row, col: colRight });
  } else {
    const rowTop = Math.floor((bullet.y - TILE_SIZE / 2) / TILE_SIZE);
    const rowBottom = Math.floor((bullet.y + TILE_SIZE / 2 - 1) / TILE_SIZE);
    const col = Math.floor((bullet.x + direction.x * TILE_SIZE) / TILE_SIZE);
    impactTiles.push({ row: rowTop, col }, { row: rowBottom, col });
  }
  return impactTiles;
}
