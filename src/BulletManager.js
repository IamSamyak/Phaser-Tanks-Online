// BulletManager.js
import { TILE_SIZE } from './constants.js';

export default class BulletManager {
  constructor(scene, levelMap) {
    this.scene = scene;
    this.levelMap = levelMap;
  }

  fireBullet(tank) {
    if (!tank) return;

    const angle = Phaser.Math.Wrap(tank.angle, 0, 360);
    const snappedAngle = Phaser.Math.Snap.To(angle, 90);

    const bullet = this.scene.add.image(tank.x, tank.y, 'bullet');
    bullet.setDisplaySize(TILE_SIZE / 2, TILE_SIZE / 2);
    bullet.setOrigin(0.5);

    const direction = new Phaser.Math.Vector2(0, 0);
    switch (snappedAngle) {
      case 0:
        direction.y = -1;
        break;
      case 90:
        direction.x = 1;
        break;
      case 180:
        direction.y = 1;
        break;
      case 270:
        direction.x = -1;
        break;
      default:
        direction.y = -1;
    }

    const moveBullet = () => {
      const nextX = bullet.x + direction.x * TILE_SIZE;
      const nextY = bullet.y + direction.y * TILE_SIZE;

      const row = Math.floor(nextY / TILE_SIZE);
      const col = Math.floor(nextX / TILE_SIZE);

      if (
        row < 0 || row >= this.levelMap.length ||
        col < 0 || col >= this.levelMap[0].length ||
        !this.isWalkable(row, col)
      ) {
        this.spawnCollisionEffect(bullet.x, bullet.y);
        bullet.destroy();
        return;
      }

      this.scene.tweens.add({
        targets: bullet,
        x: nextX,
        y: nextY,
        duration: 100,
        onComplete: () => {
          moveBullet();
        }
      });
    };

    moveBullet();
  }

  spawnCollisionEffect(x, y) {
    const explosion = this.scene.add.sprite(x, y, 'explosion');
    explosion.setOrigin(0.5);
    explosion.setScale(1);

    this.scene.time.delayedCall(500, () => {
      explosion.destroy();
    });
  }

  isWalkable(row, col) {
    if (
      row < 0 || row >= this.levelMap.length ||
      col < 0 || col >= this.levelMap[0].length
    ) return false;

    const tileChar = this.levelMap[row][col];
    const type = tileChar === '.' || tileChar === '%' ? true : false; // empty or bush walkable
    return type;
  }
}
