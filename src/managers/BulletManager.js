import Phaser from 'phaser';
import { TILE_SIZE } from '../utils/tileMapping.js';

export default class BulletManager {
  constructor(scene, levelMap, tankGameScene, socket) {
    this.scene = scene;
    this.levelMap = levelMap;
    this.tankGameScene = tankGameScene;
    this.socket = socket;

    this.activeBullets = new Map(); // bulletId -> bullet sprite
    this.nextBulletId = 1;
  }

  fireBullet(tank) {
    if (!tank || !tank.base) return null;
    if (tank.base.activeBullets >= tank.base.maxBullets) return null;

    const bulletId = 'b' + (this.nextBulletId++);
    const angle = Phaser.Math.Snap.To(Phaser.Math.Wrap(tank.angle, 0, 360), 90);

    // Create bullet sprite locally at tank position
    const bullet = this.scene.add.image(tank.x, tank.y, 'bullet');
    bullet.setDisplaySize(TILE_SIZE / 2, TILE_SIZE / 2);
    bullet.setOrigin(0.5);
    bullet.bulletId = bulletId;

    this.activeBullets.set(bulletId, bullet);
    tank.base.activeBullets++;
    console.log('tanks is ', tank.x, tank.y);

    // Send fire bullet event to backend
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'fire_bullet',
        bulletId,
        x: Math.floor(tank.x / TILE_SIZE),   // convert pixel x to tile x
        y: Math.floor(tank.y / TILE_SIZE),   // convert pixel y to tile y
        angle
      }));
    }

    return bulletId;
  }

  createOrUpdateBullet(bulletId, x, y) {
    let bullet = this.activeBullets.get(bulletId);

    if (!bullet) {
      // Create bullet sprite if it doesn't exist
      bullet = this.scene.add.image(x, y, 'bullet');
      bullet.setDisplaySize(TILE_SIZE / 2, TILE_SIZE / 2);
      bullet.setOrigin(0.5);
      bullet.bulletId = bulletId;
      this.activeBullets.set(bulletId, bullet);
    } else {
      // Update position if it exists
      bullet.x = x;
      bullet.y = y;
    }
  }

  destroyBullet(bulletId, tankBase = null) {
    const bullet = this.activeBullets.get(bulletId);
    if (!bullet) return;

    bullet.destroy();
    this.activeBullets.delete(bulletId);

    if (tankBase) {
      tankBase.activeBullets = Math.max(0, tankBase.activeBullets - 1);
    }
  }
}
