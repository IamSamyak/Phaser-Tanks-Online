import Phaser from 'phaser';
import { Direction } from '../utils/directionHelper';

function vibrate(duration = 30) {
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
}
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

  handleJoystickInput(forceX, forceY, time) {
    // if (Math.abs(forceX) > 0.5 || Math.abs(forceY) > 0.5) {
    //   vibrate(1);  // Short feedback on movement
    // }

    if (!this.lastMoveTime || time - this.lastMoveTime > this.moveInterval) {
      if (Math.abs(forceX) < 0.5 && Math.abs(forceY) < 0.5) {
        return; // ignore weak input
      }

      //haptic feedback when player moves
      vibrate(5);

      console.log('Joystick being used:', { forceX, forceY });

      let newDirection = this.tank.direction;

      if (Math.abs(forceX) > Math.abs(forceY)) {
        if (forceX > 0.5) {
          newDirection = Direction.RIGHT;
        } else if (forceX < -0.5) {
          newDirection = Direction.LEFT;
        }
      } else {
        if (forceY > 0.5) {
          newDirection = Direction.DOWN;
        } else if (forceY < -0.5) {
          newDirection = Direction.UP;
        }
      }

      this.lastMoveTime = time;

      this.scene.socket.send(
        JSON.stringify({
          type: 'player_move',
          direction: newDirection,
        })
      );
    }
  }


  update(time) {
    if (!this.tank) return;

    if (!this.lastMoveTime || time - this.lastMoveTime > this.moveInterval) {
      let newDirection = null;

      if (this.cursors.up.isDown) {
        newDirection = Direction.UP;
      } else if (this.cursors.down.isDown) {
        newDirection = Direction.DOWN;
      } else if (this.cursors.left.isDown) {
        newDirection = Direction.LEFT;
      } else if (this.cursors.right.isDown) {
        newDirection = Direction.RIGHT;
      }

      if (newDirection !== null) {
        this.lastMoveTime = time;
        console.log('direction is ', newDirection);

        if (this.scene.socket && this.scene.socket.readyState === WebSocket.OPEN) {
          this.scene.socket.send(
            JSON.stringify({
              type: 'player_move',
              direction: newDirection,
            })
          );
        }
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.fire)) {
      this.bulletManager.fireBullet(this.tank);
    }
  }
}
