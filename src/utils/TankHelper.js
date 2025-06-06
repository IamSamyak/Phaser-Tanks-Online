import { tileMapping, TILE_SIZE } from '../utils/tileMapping.js';

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
  if (
    row < 0 || row >= levelMap.length ||
    col < 0 || col >= levelMap[0].length
  ) return false;

  const tileChar = levelMap[row][col];
  const type = tileMapping[tileChar];
  return type === 'empty' || type === 'bush';
}

export function isBulletObstacle(row, col, levelMap) {
  if (
    row < 0 || row >= levelMap.length ||
    col < 0 || col >= levelMap[0].length
  ) return true;

  const tileChar = levelMap[row][col];
  const type = tileMapping[tileChar];
  return type !== 'empty' && type !== 'bush';
}

export function canMove(x, y, levelMap) {
  const corners = getTankCorners(x, y);
  return corners.every(corner => isWalkable(corner.row, corner.col, levelMap));
}

