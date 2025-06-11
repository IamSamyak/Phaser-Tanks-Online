import { TILE_SIZE, tileMapping } from '../utils/tileMapping.js';
import { getAngleFromDirection } from '../utils/directionHelper.js';

export default class MessageHandler {
  constructor(scene, socket) {
    this.scene = scene;
    this.socket = socket;
  }

  handle(data) {
    const scene = this.scene;

    switch (data.type) {
      case 'start': {
        scene.playerNumber = data.playerNumber;
        scene.roomId = data.roomId;
        console.log(`Connected to room ID: ${data.roomId} as Player ${data.playerNumber}`);

        scene.levelMap = data.levelMap.map(line => [...line]);
        scene.renderLevel(scene.levelMap);

        scene.tank = scene.spawnManager.spawnTank(data.x, data.y, data.direction);
        scene.asset = scene.spawnManager.spawnAsset(13, 25, 'base', data.direction);

        scene.initializeGameplay();
        break;
      }

      case 'spawn_other':
        if (scene.playerNumber !== data.playerNumber) {
          if (!scene.otherTank) {
            scene.otherTank = scene.spawnManager.spawnTank(data.x, data.y, data.direction);
          }
        }
        break;

      case 'enemy_spawn': {
        const { enemyId, x, y, direction } = data;
        if (scene.enemies.has(enemyId)) return;

        const enemyTank = scene.spawnManager.spawnTank(x, y, direction);
        enemyTank.setDepth(1);
        scene.enemies.set(enemyId, enemyTank);
        break;
      }

      case 'enemy_destroyed': {
        const { enemyId } = data;
        const enemy = scene.enemies.get(enemyId);
        if (enemy) {
          scene.spawnCollisionEffect(enemy.x, enemy.y);
          enemy.destroy();
          scene.enemies.delete(enemyId);
        }
        break;
      }

      case 'player_move':
      case 'move': {
        const tank = data.playerNumber === scene.playerNumber ? scene.tank : scene.otherTank;
        if (tank) {
          tank.setPosition(data.x * TILE_SIZE, data.y * TILE_SIZE);
          tank.setAngle(getAngleFromDirection(data.direction));
        }
        break;
      }

      case 'enemy_move_batch':
        data.enemies.forEach(({ enemyId, x, y, direction }) => {
          const enemy = scene.enemies.get(enemyId);
          if (enemy) {
            enemy.setPosition(x * TILE_SIZE, y * TILE_SIZE);
            enemy.setAngle(getAngleFromDirection(direction));
          }
        });
        break;

      case 'bullet_move_batch':
        data.bullets.forEach(({ bulletId, x, y, direction }) => {
          scene.bulletManager?.createOrUpdateBullet(bulletId, x, y, direction);
        });
        break;

      case 'bullet_destroy_batch':
        data.bulletIds.forEach((bulletId) => {
          scene.bulletManager?.destroyBullet(bulletId);
        });
        break;

      case 'tile_update_batch':
        data.tiles.forEach(({ x: tx, y: ty, tile: tileChar }) => {
          scene.levelMap[ty][tx] = tileChar;

          const oldTile = scene.tileSprites[ty][tx];
          oldTile?.destroy();

          const tileName = tileMapping[tileChar];
          if (tileName && tileName !== 'empty') {
            const tile = scene.add.image(tx * TILE_SIZE, ty * TILE_SIZE, tileName);
            tile.setOrigin(0, 0).setScale(TILE_SIZE / 16);
            scene.tileSprites[ty][tx] = tile;
          } else {
            scene.tileSprites[ty][tx] = null;
          }
        });
        break;

      case 'explosion_batch':
        data.explosions.forEach(({ x, y }) => {
          scene.spawnManager.spawnExplosion(x, y);
        });
        break;

      case 'fire_bullet':
        scene.bulletManager?.createOrUpdateBullet(data.bulletId, data.x, data.y, data.direction ?? 0);
        break;

      case 'player_destroyed': {
        const tank = data.playerNumber === scene.playerNumber ? scene.tank : scene.otherTank;
        if (tank) {
          tank.destroy();
          tank.base?.destroy();
          if (data.playerNumber === scene.playerNumber) scene.tank = null;
          else scene.otherTank = null;
        }
        break;
      }

      case 'bullet_destroy':
        scene.bulletManager?.destroyBullet(data.bulletId);
        break;

      case 'bonus_spawn':
        scene.spawnManager.spawnBonus(data.bonusId, data.x, data.y, data.bonusType);
        break;

      case 'bonus_remove':
        scene.spawnManager.removeBonus(data.bonusId);
        break;

      case 'explosion':
        scene.spawnManager.spawnExplosion(data.x, data.y);
        break;

      case 'tile_update': {
        const tx = data.x, ty = data.y, tileChar = data.tile;
        scene.levelMap[ty][tx] = tileChar;

        scene.tileSprites[ty][tx]?.destroy();

        const tileName = tileMapping[tileChar];
        if (tileName && tileName !== 'empty') {
          const tile = scene.add.image(tx * TILE_SIZE, ty * TILE_SIZE, tileName);
          tile.setOrigin(0, 0).setScale(TILE_SIZE / 16);
          scene.tileSprites[ty][tx] = tile;
        } else {
          scene.tileSprites[ty][tx] = null;
        }
        break;
      }

      case 'error':
        console.error('Server error:', data.message);
        alert(data.message);
        break;

      default:
        console.warn('Unknown message type:', data.type);
    }
  }
}
