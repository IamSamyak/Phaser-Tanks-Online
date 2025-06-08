import Phaser from 'phaser';
import { tileMapping, TILE_SIZE } from '../utils/tileMapping.js';
import BonusManager from '../managers/BonusManager.js';
import BulletManager from '../managers/BulletManager.js';
import SpawnManager from '../managers/SpawnManager.js';
import TankController from '../managers/TankController.js';
import TankBase from '../managers/TankBase.js';
import RoomPopup from '../ui/RoomPopup.js';

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
  }

  connectWebSocket(roomId) {
    const wsUrl = roomId
      ? `ws://localhost:8080/ws/join/${roomId}`
      : `ws://localhost:8080/ws/create`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'start':
          this.playerNumber = data.playerNumber;
          this.roomId = data.roomId;

          console.log(`Connected to room ID: ${this.roomId} as Player ${this.playerNumber}`);

          // Convert each string line of levelMap to array of chars for easy access
          this.levelMap = data.levelMap.map(line => [...line]);
          this.renderLevel(this.levelMap);

          // Positions from backend are in tile units, convert to pixels
          const startX = data.x * TILE_SIZE;
          const startY = data.y * TILE_SIZE;

          // Spawn own tank at start position
          this.tank = this.spawnManager.spawnTank(startX / TILE_SIZE, startY / TILE_SIZE);
          this.asset = this.spawnManager.spawnAsset(24, 12, 'base');

          // Create tank base and set position
          this.tank.base = new TankBase(this.tank);
          this.tank.base.updatePosition(startX, startY);

          this.initializeGameplay();
          break;

        case 'spawn_other':
          // Spawn or update the other player's tank only if it's not self
          if (this.playerNumber !== data.playerNumber) {
            if (!this.otherTank) {
              const ox = data.x * TILE_SIZE;
              const oy = data.y * TILE_SIZE;
              this.otherTank = this.spawnManager.spawnTank(ox / TILE_SIZE, oy / TILE_SIZE);
              this.otherTank.base = new TankBase(this.otherTank);
              this.otherTank.base.updatePosition(ox, oy);
            }
          }
          break;

        case 'player_move':
        case 'move':
          // Backend may send 'player_move' or 'move' for tank moves; handle both just in case
          if (data.playerNumber === this.playerNumber) {
            console.log('same data is ',data);
            // Update own tank position only if backend confirms (to stay in sync)
            if (this.tank) {
              this.tank.setPosition(data.x, data.y);
              this.tank.setAngle(data.direction ?? data.angle);
              if (this.tank.base) {
                this.tank.base.updatePosition(data.x, data.y);
              }
            }
          } else {
            // Update other player's tank
            console.log('data is ',data);
            
            if (this.otherTank) {
              this.otherTank.setPosition(data.x, data.y);
              this.otherTank.setAngle(data.direction ?? data.angle);
              if (this.otherTank.base) {
                this.otherTank.base.updatePosition(data.x, data.y);
              }
            }
          }
          break;

        case 'fire_bullet':
          if (this.bulletManager) {
            this.bulletManager.createOrUpdateBullet(
              data.bulletId,
              data.x * TILE_SIZE,
              data.y * TILE_SIZE,
              data.angle ?? 0
            );
          }
          break;

        case 'bullet_move':
          if (this.bulletManager) {
            this.bulletManager.createOrUpdateBullet(
              data.bulletId,
              data.x * TILE_SIZE,
              data.y * TILE_SIZE,
              data.angle ?? 0
            );
          }
          break;

        case 'bullet_destroy':
          if (this.bulletManager) {
            this.bulletManager.destroyBullet(data.bulletId);
          }
          break;

        case 'error':
          console.error('Server error:', data.message);
          alert(data.message);
          break;

        default:
          console.warn('Unknown message type:', data.type);
      }
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

    this.bonusManager = new BonusManager(this, this.levelMap, this.bonusGroup);
    this.bulletManager = new BulletManager(this, this.levelMap, this, this.socket);
    this.tankController = new TankController(this, this.tank, this.bulletManager, this.levelMap);

    this.bonusManager.scheduleBonus();
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

    if (this.bonusManager) {
      this.bonusManager.checkBonusCollection(this.tank);
    }

    // Optional: Update base position continuously (if you want it 100% in sync)
    if (this.tank.base) {
      this.tank.base.updatePosition(this.tank.x, this.tank.y);
    }
  }
}
