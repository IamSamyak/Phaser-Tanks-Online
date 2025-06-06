import { canMove } from '../utils/TankHelper.js';
import { TILE_SIZE } from '../utils/tileMapping.js';

export default class TankController {
  constructor(scene, tank, bulletManager, levelMap) {
    this.scene = scene;
    this.tank = tank;
    this.bulletManager = bulletManager;
    this.levelMap = levelMap;
    this.lastMoveTime = 0;
    this.moveInterval = 200; // ms between moves

    this.cursors = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      fire: Phaser.Input.Keyboard.KeyCodes.F,
    });
  }

  update(time) {
    if (!this.tank) return;

    if (!this.lastMoveTime || time - this.lastMoveTime > this.moveInterval) {
      if (this.cursors.up.isDown) {
        this.tank.setAngle(0);
        if (canMove(this.tank.x, this.tank.y - TILE_SIZE, this.levelMap)) {
          this.tank.y -= TILE_SIZE;
          this.lastMoveTime = time;
        }
      } else if (this.cursors.down.isDown) {
        this.tank.setAngle(180);
        if (canMove(this.tank.x, this.tank.y + TILE_SIZE, this.levelMap)) {
          this.tank.y += TILE_SIZE;
          this.lastMoveTime = time;
        }
      } else if (this.cursors.left.isDown) {
        this.tank.setAngle(270);
        if (canMove(this.tank.x - TILE_SIZE, this.tank.y, this.levelMap)) {
          this.tank.x -= TILE_SIZE;
          this.lastMoveTime = time;
        }
      } else if (this.cursors.right.isDown) {
        this.tank.setAngle(90);
        if (canMove(this.tank.x + TILE_SIZE, this.tank.y, this.levelMap)) {
          this.tank.x += TILE_SIZE;
          this.lastMoveTime = time;
        }
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.fire)) {
      this.bulletManager.fireBullet(this.tank, null, this.scene.spawnCollisionEffect.bind(this.scene));
    }
  }
}
