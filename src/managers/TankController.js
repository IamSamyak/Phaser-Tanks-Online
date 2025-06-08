import Phaser from 'phaser';

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
      let newAngle = null;
      let newX = this.tank.x;
      let newY = this.tank.y;

      if (this.cursors.up.isDown) {
        newAngle = 0;
        newY -= 32;
      } else if (this.cursors.down.isDown) {
        newAngle = 180;
        newY += 32;
      } else if (this.cursors.left.isDown) {
        newAngle = 270;
        newX -= 32;
      } else if (this.cursors.right.isDown) {
        newAngle = 90;
        newX += 32;
      }

      if (newAngle !== null) {
        this.lastMoveTime = time;

        if (this.scene.socket && this.scene.socket.readyState === WebSocket.OPEN) {
          this.scene.socket.send(
            JSON.stringify({
              type: 'player_move',
              x: newX,
              y: newY,
              direction: newAngle,
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
