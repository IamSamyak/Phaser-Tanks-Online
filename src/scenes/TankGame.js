import Phaser from 'phaser';
import { tileMapping, TILE_SIZE } from '../utils/tileMapping.js';
import BonusManager from '../managers/BonusManager.js';
import BulletManager from '../managers/BulletManager.js';
import SpawnManager from '../managers/SpawnManager.js';
import TankController from '../managers/TankController.js';
import TankBase from '../managers/TankBase.js'; // Import TankBase

export default class TankGame extends Phaser.Scene {
  constructor() {
    super({ key: 'TankGame' });
  }

  preload() {
    // Load tile assets
    this.load.image('brick', '/assets/tiles/brick.png');
    this.load.image('stone', '/assets/tiles/stone.png');
    this.load.image('bush', '/assets/tiles/bush.png');
    this.load.image('water', '/assets/tiles/water.png');
    this.load.image('ice', '/assets/tiles/ice.png');

    // Load player, bullet, base, explosion
    this.load.image('tank', '/assets/PlayerAssets/tankv1.png');
    this.load.image('bullet', '/assets/bullet.png');
    this.load.image('base', '/assets/base.png');
    this.load.spritesheet('explosion', '/assets/explosion.png', {
      frameWidth: 70,
      frameHeight: 65,
    });

    // Bonus assets are loaded dynamically in BonusManager
  }

  create() {
    this.tankSpeed = 100;
    this.bulletSpeed = 100;

    this.bonusGroup = this.add.group();
    this.spawnManager = new SpawnManager(this);

    fetch('/levels/1.txt')
      .then((res) => res.text())
      .then((levelText) => {
        this.renderLevel(levelText.trim());

        // Spawn tank and base
        this.tank = this.spawnManager.spawnTank(24, 9);
        this.asset = this.spawnManager.spawnAsset(24, 12, 'base');

        // Attach base properties to tank
        this.tank.base = new TankBase(this.tank);

        // Create managers
        this.bonusManager = new BonusManager(this, this.levelMap, this.bonusGroup);
        this.bulletManager = new BulletManager(this, this.levelMap, this);

        // Tank Controller (input + movement)
        this.tankController = new TankController(
          this,
          this.tank,
          this.bulletManager,
          this.levelMap
        );

        this.bonusManager.scheduleBonus();
      })
      .catch((err) => console.error('Failed to load level:', err));

    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 4 }),
      frameRate: 1,
      hideOnComplete: true,
    });
  }

  renderLevel(levelData) {
    const lines = levelData.split('\n').map((line) => line.replace(/\r/g, ''));
    this.levelMap = lines.map((line) => [...line]);
    this.tileSprites = [];

    for (let y = 0; y < this.levelMap.length; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < this.levelMap[y].length; x++) {
        const char = this.levelMap[y][x];
        const tileName = tileMapping[char];
        const xPos = x * TILE_SIZE;
        const yPos = y * TILE_SIZE;

        if (!tileName || tileName === 'empty') {
          this.tileSprites[y][x] = null;
          continue;
        }

        const tile = this.add.image(xPos, yPos, tileName);
        tile.setOrigin(0, 0);
        tile.setScale(TILE_SIZE / 16);
        this.tileSprites[y][x] = tile;
      }
    }

    // Optional debug grid
    for (let x = 0; x < this.levelMap[0].length; x++) {
      this.add.text(x * TILE_SIZE + 10, 0, x.toString(), {
        fontSize: '12px',
        color: '#00ff00',
      });
    }
    for (let y = 0; y < this.levelMap.length; y++) {
      this.add.text(0, y * TILE_SIZE + 8, y.toString(), {
        fontSize: '12px',
        color: '#00ff00',
      });
    }
  }

  spawnCollisionEffect(x, y) {
    this.spawnManager.spawnExplosion(x, y);
  }

  fireBullet() {
    this.bulletManager.fireBullet(
      this.tank,
      this.asset,
      this.spawnCollisionEffect.bind(this),
      this.bulletSpeed
    );
  }

  update(time) {
    if (!this.tank || !this.tankController) return;

    this.tankController.update(time);

    if (this.bonusManager) {
      this.bonusManager.checkBonusCollection(this.tank);
    }
  }
}
