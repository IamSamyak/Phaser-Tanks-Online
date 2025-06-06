import Phaser from 'phaser';
import { tileMapping, TILE_SIZE } from '../utils/tileMapping.js';

export default class BulletManager {
  constructor(scene, levelMap, tankGameScene) {
    this.scene = scene;
    this.levelMap = levelMap;
    this.tankGameScene = tankGameScene;
  }

  fireBullet(tank, base, spawnCollisionEffect, bulletSpeed = 100) {
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

      if (base) {
        const distToBase = Phaser.Math.Distance.Between(bullet.x, bullet.y, base.x, base.y);
        if (distToBase < TILE_SIZE) {
          alert('💥 Game Over! Your base was destroyed.');
          this.scene.scene.restart();
          return;
        }
      }

      let impactTiles = [];

      if (direction.y !== 0) {
        const colLeft = Math.floor((bullet.x - TILE_SIZE / 2) / TILE_SIZE);
        const colRight = Math.floor((bullet.x + TILE_SIZE / 2 - 1) / TILE_SIZE);
        const row = Math.floor(nextY / TILE_SIZE);
        impactTiles.push({ row, col: colLeft }, { row, col: colRight });
      } else {
        const rowTop = Math.floor((bullet.y - TILE_SIZE / 2) / TILE_SIZE);
        const rowBottom = Math.floor((bullet.y + TILE_SIZE / 2 - 1) / TILE_SIZE);
        const col = Math.floor(nextX / TILE_SIZE);
        impactTiles.push({ row: rowTop, col }, { row: rowBottom, col });
      }

      let hitObstacle = false;

      for (const { row, col } of impactTiles) {
        if (
          row < 0 ||
          row >= this.levelMap.length ||
          col < 0 ||
          col >= this.levelMap[0].length
        ) {
          hitObstacle = true;
          break;
        }

        const tileChar = this.levelMap[row][col];
        const tileType = tileMapping[tileChar];

        if (tileType !== 'empty' && tileType !== 'bush') {
          hitObstacle = true;

          if (tileType === 'brick') {
            const tileSprite = this.tankGameScene.tileSprites[row][col];
            if (tileSprite) tileSprite.destroy();
            this.levelMap[row][col] = '.';
            this.tankGameScene.tileSprites[row][col] = null;
          }
        }
      }

      if (hitObstacle) {
        spawnCollisionEffect(nextX, nextY);
        bullet.destroy();
        return;
      }

      this.scene.tweens.add({
        targets: bullet,
        x: nextX,
        y: nextY,
        duration: bulletSpeed,
        onComplete: () => moveBullet(),
      });
    };

    moveBullet();
  }
}
