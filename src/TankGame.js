// TankGame.js
import Phaser from 'phaser';
import { TILE_SIZE } from './constants.js';
import LevelLoader from './LevelLoader.js';
import Tank from './Tank.js';
import BonusManager from './BonusManager.js';
import BulletManager from './BulletManager.js';

export default class TankGame extends Phaser.Scene {
  constructor() {
    super({ key: 'TankGame' });
  }

  preload() {
    this.load.image('brick', '/assets/tiles/brick.png');
    this.load.image('stone', '/assets/tiles/stone.png');
    this.load.image('bush', '/assets/tiles/bush.png');
    this.load.image('water', '/assets/tiles/water.png');
    this.load.image('ice', '/assets/tiles/ice.png');
    this.load.image('tank', '/assets/PlayerAssets/tankv1.png');
    this.load.image('bullet', '/assets/bullet.png');
    this.load.spritesheet('explosion', '/assets/explosion.png', {
      frameWidth: 70,
      frameHeight: 65
    });
  }

  async create() {
    this.levelLoader = new LevelLoader(this);
    await this.levelLoader.loadLevel('/levels/1.txt');
    this.levelMap = this.levelLoader.levelMap;

    this.tankManager = new Tank(this, this.levelMap);
    this.tankManager.spawn(24, 9);

    this.bonusManager = new BonusManager(this, this.levelMap);
    this.bonusManager.startScheduling();

    this.bulletManager = new BulletManager(this, this.levelMap);

    this.setupControls();

    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 4 }),
      frameRate: 1,
      hideOnComplete: true,
    });
  }

  setupControls() {
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      fire: Phaser.Input.Keyboard.KeyCodes.F,
    });
  }

  update(time) {
    if (!this.tankManager.tank) return;

    if (!this.lastMoveTime || time - this.lastMoveTime > 200) {
      if (this.cursors.up.isDown) {
        this.tankManager.move('up');
        this.lastMoveTime = time;
      } else if (this.cursors.down.isDown) {
        this.tankManager.move('down');
        this.lastMoveTime = time;
      } else if (this.cursors.left.isDown) {
        this.tankManager.move('left');
        this.lastMoveTime = time;
      } else if (this.cursors.right.isDown) {
        this.tankManager.move('right');
        this.lastMoveTime = time;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.fire)) {
      this.bulletManager.fireBullet(this.tankManager.tank);
    }

    this.bonusManager.checkBonusCollection(this.tankManager.tank);
  }
}
