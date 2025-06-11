import Phaser from 'phaser';
import { tileMapping, TILE_SIZE } from '../utils/tileMapping.js';
import BulletManager from '../managers/BulletManager.js';
import SpawnManager from '../managers/SpawnManager.js';
import TankController from '../managers/TankController.js';
import RoomPopup from '../ui/RoomPopup.js';
import { bonusTypes } from '../utils/bonusTypes.js';
import MessageHandler from '../managers/MessageHandler.js';

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
    this.load.image('base', '/assets/base.png');
    this.load.spritesheet('explosion', '/assets/explosion.png', {
      frameWidth: 70,
      frameHeight: 65,
    });
    bonusTypes.forEach(bonus => {
      this.load.image(bonus.key, bonus.path);
    });
  }

  connectWebSocket(roomId) {
    const wsUrl = roomId
      ? `ws://localhost:8080/ws/join/${roomId}`
      : `ws://localhost:8080/ws/create`;

    this.socket = new WebSocket(wsUrl);
    this.messageHandler = new MessageHandler(this, this.socket);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.messageHandler.handle(data);
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    this.socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  create() {
    this.spawnManager = new SpawnManager(this);

    new RoomPopup(this, (roomId) => {
      this.connectWebSocket(roomId);
    });

    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 4 }),
      frameRate: 1,
      hideOnComplete: true,
    });
  }

  initializeGameplay() {
    this.tankSpeed = 100;
    this.bulletSpeed = 100;
    this.bonusGroup = this.add.group();
    this.enemies = new Map();
    this.bulletManager = new BulletManager(this, this.levelMap, this, this.socket);
    this.tankController = new TankController(this, this.tank, this.bulletManager, this.levelMap);
  }

  renderLevel(levelMap) {
    this.tileSprites = [];

    for (let y = 0; y < levelMap.length; y++) {
      this.tileSprites[y] = [];
      for (let x = 0; x < levelMap[y].length; x++) {
        const char = levelMap[y][x];
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

    // Optional: Draw grid coordinates
    for (let x = 0; x < levelMap[0].length; x++) {
      this.add.text(x * TILE_SIZE + 10, 0, x.toString(), {
        fontSize: '12px',
        color: '#00ff00',
      });
    }
    for (let y = 0; y < levelMap.length; y++) {
      this.add.text(0, y * TILE_SIZE + 8, y.toString(), {
        fontSize: '12px',
        color: '#00ff00',
      });
    }
  }

  spawnCollisionEffect(x, y) {
    this.spawnManager.spawnExplosion(x, y);
  }

  update(time) {
    if (!this.tank || !this.tankController) return;

    this.tankController.update(time);
  }
}
