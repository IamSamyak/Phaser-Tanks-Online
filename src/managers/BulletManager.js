import Phaser from 'phaser';
import { getAngleFromDirection } from '../utils/directionHelper.js';

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

    // Send request to backend to fire bullet (backend assigns bulletId)
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'fire_bullet',
      }));
    }
  }

  createOrUpdateBullet(bulletId, x, y, direction) {
    const { x: px, y: py } = this.scene.coordHelper.toPixel(x, y);
    let bullet = this.activeBullets.get(bulletId);

    if (!bullet) {
      bullet = this.scene.add.image(px, py, 'bullet');
      bullet.setDisplaySize(this.scene.dynamicTileSize / 2, this.scene.dynamicTileSize / 2);
      bullet.setOrigin(0.5);
      bullet.setAngle(getAngleFromDirection(direction));
      bullet.bulletId = bulletId;
      this.activeBullets.set(bulletId, bullet);
    } else {
      bullet.x = px;
      bullet.y = py;
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
