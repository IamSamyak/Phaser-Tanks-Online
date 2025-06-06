import Phaser from 'phaser';
import { tileMapping, TILE_SIZE } from '../utils/tileMapping.js';
import {
  getImpactTilesForBullet,
  isTileBlocking,
  isWithinMapBounds
} from '../utils/TankHelper.js';

export default class BulletManager {
  constructor(scene, levelMap, tankGameScene) {
    this.scene = scene;
    this.levelMap = levelMap;
    this.tankGameScene = tankGameScene;
  }

  fireBullet(tank, base, spawnCollisionEffect, bulletSpeed = 100) {
    if (!tank || !tank.base) return;
    if (tank.base.activeBullets >= tank.base.maxBullets) return;

    const angle = Phaser.Math.Wrap(tank.angle, 0, 360);
    const snappedAngle = Phaser.Math.Snap.To(angle, 90);

    const bullet = this.scene.add.image(tank.x, tank.y, 'bullet');
    bullet.setDisplaySize(TILE_SIZE / 2, TILE_SIZE / 2);
    bullet.setOrigin(0.5);

    tank.base.activeBullets++;

    const direction = new Phaser.Math.Vector2(0, 0);
    switch (snappedAngle) {
      case 0: direction.y = -1; break;
      case 90: direction.x = 1; break;
      case 180: direction.y = 1; break;
      case 270: direction.x = -1; break;
      default: direction.y = -1;
    }

    const moveBullet = () => {
      const nextX = bullet.x + direction.x * TILE_SIZE;
      const nextY = bullet.y + direction.y * TILE_SIZE;

      // 💥 Check collision with base
      if (base) {
        const distToBase = Phaser.Math.Distance.Between(bullet.x, bullet.y, base.x, base.y);
        if (distToBase < TILE_SIZE) {
          tank.base.activeBullets--;
          alert('💥 Game Over! Your base was destroyed.');
          this.scene.scene.restart();
          return;
        }
      }

      const impactTiles = getImpactTilesForBullet(bullet, direction);

      let hitObstacle = false;

      for (const { row, col } of impactTiles) {
        if (!isWithinMapBounds(row, col, this.levelMap)) {
          hitObstacle = true;
          break;
        }

        const tileChar = this.levelMap[row][col];

        if (isTileBlocking(tileChar)) {
          hitObstacle = true;

          if (tileMapping[tileChar] === 'brick') {
            const tileSprite = this.tankGameScene.tileSprites[row][col];
            if (tileSprite) tileSprite.destroy();
            this.levelMap[row][col] = '.';
            this.tankGameScene.tileSprites[row][col] = null;
          }
        }
      }

      if (hitObstacle) {
        bullet.destroy();
        tank.base.activeBullets--;
        spawnCollisionEffect(nextX, nextY);
        return;
      }

      this.scene.tweens.add({
        targets: bullet,
        x: nextX,
        y: nextY,
        duration: bulletSpeed,
        onComplete: () => moveBullet()
      });
    };

    moveBullet();
  }
}
