import { TILE_SIZE } from '../utils/tileMapping.js';

export default class SpawnManager {
  constructor(scene) {
    this.scene = scene;
  }

  spawnTank(row, col) {
    const centerX = (col + 1) * TILE_SIZE;
    const centerY = (row + 1) * TILE_SIZE;

    const tank = this.scene.add.image(centerX, centerY, 'tank');
    tank.setOrigin(0.5, 0.5);
    tank.setDisplaySize(TILE_SIZE * 2, TILE_SIZE * 2);
    tank.angle = 0;

    return tank;
  }

  spawnAsset(row, col, assetKey) {
    const centerX = (col + 1) * TILE_SIZE;
    const centerY = (row + 1) * TILE_SIZE;

    const asset = this.scene.add.image(centerX, centerY, assetKey);
    asset.setOrigin(0.5, 0.5);
    asset.setDisplaySize(TILE_SIZE * 2, TILE_SIZE * 2);
    asset.angle = 0;

    return asset;
  }

  spawnExplosion(x, y) {
    const explosion = this.scene.add.sprite(x, y, 'explosion');
    explosion.setOrigin(0.5);
    explosion.setScale(1);
    this.scene.time.delayedCall(500, () => explosion.destroy());
  }
}
