import Phaser from 'phaser';
import { Direction } from '../utils/directionHelper';

export default class TankController {
  constructor(scene, tank, bulletManager) {
    this.scene = scene;
    this.tank = tank;
    this.bulletManager = bulletManager;

    this.cursors = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      fire: Phaser.Input.Keyboard.KeyCodes.F,
    });

    this.lastMoveTime = 0;
    this.moveInterval = 200; // debounce movement input
  }

  update(time) {
    if (!this.tank) return;

    if (!this.lastMoveTime || time - this.lastMoveTime > this.moveInterval) {
      let newDirection = null;
      let newX = this.tank.x;
      let newY = this.tank.y;

      if (this.cursors.up.isDown) {
        newDirection = Direction.UP;
        newY -= 32;
      } else if (this.cursors.down.isDown) {
        newDirection = Direction.DOWN;
        newY += 32;
      } else if (this.cursors.left.isDown) {
        newDirection = Direction.LEFT;
        newX -= 32;
      } else if (this.cursors.right.isDown) {
        newDirection = Direction.RIGHT;
        newX += 32;
      }

      if (newDirection !== null) {
        this.lastMoveTime = time;
        console.log('direction is ',newDirection);
        
        if (this.scene.socket && this.scene.socket.readyState === WebSocket.OPEN) {
          this.scene.socket.send(
            JSON.stringify({
              type: 'player_move',
              x: newX,
              y: newY,
              direction: newDirection,
            })
          );
        }
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.fire)) {
      this.bulletManager.fireBullet(this.tank);
      // Assume fireBullet handles socket messaging for firing
    }
  }
}
