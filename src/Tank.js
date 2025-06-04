// Tank.js
import { TILE_SIZE, tileMapping } from './constants.js';

export default class Tank {
  constructor(scene, levelMap) {
    this.scene = scene;
    this.levelMap = levelMap;
    this.tankSpeed = 100;
    this.tank = null;
  }

  spawn(row, col) {
    const centerX = (col + 1) * TILE_SIZE;
    const centerY = (row + 1) * TILE_SIZE;

    this.tank = this.scene.add.image(centerX, centerY, 'tank');
    this.tank.setOrigin(0.5, 0.5);
    this.tank.setDisplaySize(TILE_SIZE * 2, TILE_SIZE * 2);
    this.tank.angle = 0;
  }

  move(direction) {
    if (!this.tank) return;

    const tankRow = Math.floor(this.tank.y / TILE_SIZE);
    const tankCol = Math.floor(this.tank.x / TILE_SIZE);

    switch (direction) {
      case 'up':
        if (this.isWalkable(tankRow - 1, tankCol)) {
          this.tank.y -= TILE_SIZE;
          this.tank.setAngle(0);
        }
        break;
      case 'down':
        if (this.isWalkable(tankRow + 1, tankCol)) {
          this.tank.y += TILE_SIZE;
          this.tank.setAngle(180);
        }
        break;
      case 'left':
        if (this.isWalkable(tankRow, tankCol - 1)) {
          this.tank.x -= TILE_SIZE;
          this.tank.setAngle(270);
        }
        break;
      case 'right':
        if (this.isWalkable(tankRow, tankCol + 1)) {
          this.tank.x += TILE_SIZE;
          this.tank.setAngle(90);
        }
        break;
    }
  }

  isWalkable(row, col) {
    if (
      row < 0 || row >= this.levelMap.length ||
      col < 0 || col >= this.levelMap[0].length
    ) return false;

    const tileChar = this.levelMap[row][col];
    const type = tileMapping[tileChar];
    return type === 'empty' || type === 'bush';
  }
}
