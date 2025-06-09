import Phaser from 'phaser';
import { tileMapping, TILE_SIZE } from '../utils/tileMapping.js';
import BulletManager from '../managers/BulletManager.js';
import SpawnManager from '../managers/SpawnManager.js';
import TankController from '../managers/TankController.js';
import TankBase from '../managers/TankBase.js';
import RoomPopup from '../ui/RoomPopup.js';
import { bonusTypes } from '../utils/bonusTypes.js';

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
          this.asset = this.spawnManager.spawnAsset(12, 24, 'base');

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

        case 'enemy_spawn': {
          const { enemyId, x, y, angle } = data;

          if (this.enemies.has(enemyId)) return;

          // Reuse existing spawnTank method (takes tile coords, so divide)
          const enemyTank = this.spawnManager.spawnTank(x / TILE_SIZE, y / TILE_SIZE);
          enemyTank.setAngle(angle);
          enemyTank.setDepth(1); // Optional: ensure enemies render behind player

          this.enemies.set(enemyId, enemyTank);
          break;
        }

        case 'enemy_destroyed': {
          const { enemyId } = data;
          const enemy = this.enemies.get(enemyId);
          if (enemy) {
            this.spawnCollisionEffect(enemy.x, enemy.y);
            enemy.destroy();
            this.enemies.delete(enemyId);
          }
          break;
        }

        case 'player_move':
        case 'move':
          // Backend may send 'player_move' or 'move' for tank moves; handle both just in case
          if (data.playerNumber === this.playerNumber) {
            // Update own tank position only if backend confirms (to stay in sync)
            if (this.tank) {
              this.tank.setPosition(data.x, data.y);
              this.tank.setAngle(data.direction ?? data.angle);
              if (this.tank.base) {
                this.tank.base.updatePosition(data.x, data.y);
              }
            }
          } else {
            if (this.otherTank) {
              this.otherTank.setPosition(data.x, data.y);
              this.otherTank.setAngle(data.direction ?? data.angle);
              if (this.otherTank.base) {
                this.otherTank.base.updatePosition(data.x, data.y);
              }
            }
          }
          break;

        case 'enemy_move_batch': {
          const { enemies: enemyUpdates } = data;
          console.log('Received enemies through socket message:', enemyUpdates);

          enemyUpdates.forEach(({ enemyId, x, y, angle }) => {
            const enemy = this.enemies.get(enemyId);
            if (enemy) {
              enemy.setPosition(x, y);
              enemy.setAngle(angle);
              // Optional: maintain depth or other metadata
              if (enemy.base) {
                enemy.base.updatePosition(x, y);
              }
            }
          });

          break;
        }

        case 'bullet_move_batch': {
          const { bullets } = data;
          if (this.bulletManager) {
            bullets.forEach(({ bulletId, x, y }) => {
              this.bulletManager.createOrUpdateBullet(bulletId, x, y);
            });
          }
          break;
        }

        case 'bullet_destroy_batch': {
          const { bulletIds } = data;
          if (this.bulletManager) {
            bulletIds.forEach((bulletId) => {
              this.bulletManager.destroyBullet(bulletId);
            });
          }
          break;
        }

        case 'tile_update_batch': {
          const { tiles } = data;
          tiles.forEach(({ x: tx, y: ty, tile: tileChar }) => {
            if (this.levelMap && this.tileSprites) {
              // Update levelMap (internal 2D char array)
              this.levelMap[ty][tx] = tileChar;

              // Remove old tile sprite if exists
              const oldTile = this.tileSprites[ty][tx];
              if (oldTile) {
                oldTile.destroy();
              }

              // Update tileSprites array
              const tileName = tileMapping[tileChar];
              if (tileName && tileName !== 'empty') {
                const tile = this.add.image(tx * TILE_SIZE, ty * TILE_SIZE, tileName);
                tile.setOrigin(0, 0);
                tile.setScale(TILE_SIZE / 16);
                this.tileSprites[ty][tx] = tile;
              } else {
                this.tileSprites[ty][tx] = null;
              }
            }
          });
          break;
        }

        case 'explosion_batch': {
          const { explosions } = data;
          explosions.forEach(({ x, y }) => {
            if (this.bulletManager) {
              this.spawnManager.spawnExplosion(x, y);
            }
          });
          break;
        }

        case 'fire_bullet':
          if (this.bulletManager) {
            this.bulletManager.createOrUpdateBullet(
              data.bulletId,
              data.x,
              data.y,
              data.angle ?? 0
            );
          }
          break;

        case 'bullet_destroy':
          if (this.bulletManager) {
            this.bulletManager.destroyBullet(data.bulletId);
          }
          break;
        case 'bonus_spawn': {
          const { bonusId, x, y, bonusType } = data;
          this.spawnManager.spawnBonus(bonusId, x, y, bonusType);
          break;
        }
        case 'bonus_remove': {
          const { bonusId } = data;
          this.spawnManager.removeBonus(bonusId);
          break;
        }

        case 'explosion':
          if (this.bulletManager) {
            this.spawnManager.spawnExplosion(data.x, data.y);
          }
          break;

        case 'tile_update':
          console.log('tile_update received:', data);
          if (this.levelMap && this.tileSprites) {
            const tx = data.x;
            const ty = data.y;
            const tileChar = data.tile;

            // Update levelMap (internal 2D char array)
            this.levelMap[ty][tx] = tileChar;

            // Remove old tile sprite if exists
            const oldTile = this.tileSprites[ty][tx];
            if (oldTile) {
              oldTile.destroy();
            }

            // Update tileSprites array
            const tileName = tileMapping[tileChar];
            if (tileName && tileName !== 'empty') {
              const tile = this.add.image(tx * TILE_SIZE, ty * TILE_SIZE, tileName);
              tile.setOrigin(0, 0);
              tile.setScale(TILE_SIZE / 16);
              this.tileSprites[ty][tx] = tile;
            } else {
              this.tileSprites[ty][tx] = null;
            }
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

    // Optional: Update base position continuously (if you want it 100% in sync)
    if (this.tank.base) {
      this.tank.base.updatePosition(this.tank.x, this.tank.y);
    }
  }
}
