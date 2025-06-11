import Phaser from 'phaser';
import { TILE_SIZE } from '../utils/tileMapping.js';
import { getAngleFromDirection, getDirectionFromAngle } from '../utils/directionHelper.js';

export default class BulletManager {
  constructor(scene, levelMap, tankGameScene, socket) {
    this.scene = scene;
    this.levelMap = levelMap;
    this.tankGameScene = tankGameScene;
    this.socket = socket;

    this.activeBullets = new Map(); // bulletId -> bullet sprite
  }

  fireBullet(tank) {
    if (!tank) return;

    const angle = Phaser.Math.Snap.To(Phaser.Math.Wrap(tank.angle, 0, 360), 90);
    console.log('tank is ',tank.x / TILE_SIZE,tank.y / TILE_SIZE,angle);
    
    // Send request to backend to fire bullet (backend assigns bulletId)
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'fire_bullet',
      }));
    }
  }

  createOrUpdateBullet(bulletId, x, y, direction) {
    let bullet = this.activeBullets.get(bulletId);
    x *= TILE_SIZE;
    y *= TILE_SIZE;

    if (!bullet) {
      bullet = this.scene.add.image(x, y, 'bullet');
      bullet.setDisplaySize(TILE_SIZE / 2, TILE_SIZE / 2);
      bullet.setOrigin(0.5);
      bullet.setAngle(getAngleFromDirection(direction));
      bullet.bulletId = bulletId;
      this.activeBullets.set(bulletId, bullet);
    } else {
      bullet.x = x;
      bullet.y = y;
      bullet.setAngle(getAngleFromDirection(direction));
    }
  }

  destroyBullet(bulletId) {
    const bullet = this.activeBullets.get(bulletId);
    if (!bullet) return;

    bullet.destroy();
    this.activeBullets.delete(bulletId);
  }
}
