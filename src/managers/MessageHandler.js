import { tileMapping } from '../utils/tileMapping.js';
import { getAngleFromDirection } from '../utils/directionHelper.js';

export default class MessageHandler {
  constructor(scene, socket) {
    this.scene = scene;
    this.socket = socket;
  }

  handle(data) {
    const scene = this.scene;
    const coord = scene.coordHelper;

    switch (data.type) {

      case 'base_destroyed': {
        alert('Game Over! Your base has been destroyed.');
        scene.scene.pause();
        break;
      }

      case 'spawn_other':
        if (scene.playerNumber !== data.playerNumber) {
          if (!scene.otherTank) {
            scene.otherTank = scene.spawnManager.spawnTank(data.x, data.y, data.direction);
          }
        }
        break;

      case 'player_move':
      case 'move': {
        const tank = data.playerNumber === scene.playerNumber ? scene.tank : scene.otherTank;
        if (tank) {
          const { x: px, y: py } = coord.toPixel(data.x, data.y);
          tank.setPosition(px, py);
          tank.setAngle(getAngleFromDirection(data.direction));
        }
        break;
      }

      case 'game_tick': {
        const {
          bullets = [],
          bonuses = [],
          tiles = [],
          explosions = [],
          enemyEvents = [],
          playerEvents = [],
        } = data;

        playerEvents.forEach((event) => {
          const { action, playerId, x, y, direction } = event;
          const tank = scene.players[playerId];

          if (action === 'spawn') {
            if (!tank) {
              const newTank = scene.spawnManager.spawnTank(x, y, direction);
              newTank.setDepth(2);
              scene.players[playerId] = newTank;
            }
          } else if (action === 'move') {
            if (tank) {
              const { x: px, y: py } = coord.toPixel(x, y);
              tank.setPosition(px, py);
              tank.setAngle(getAngleFromDirection(direction));
            }
          } else if (action === 'destroy') {
            if (tank) {
              scene.spawnCollisionEffect(tank.x, tank.y);
              tank.destroy();
              delete scene.players[playerId];
            }
          }
        });

        bullets.forEach(({ bulletId, x, y, direction, action }) => {
          if (action === 'destroy') {
            scene.bulletManager?.destroyBullet(bulletId);
          } else {
            scene.bulletManager?.createOrUpdateBullet(bulletId, x, y, direction);
          }
        });

        bonuses.forEach(({ type, bonusId, x, y }) => {
          if (type === 'spawn') {
            scene.spawnManager.spawnBonus(bonusId, x, y);
          } else if (type === 'remove') {
            scene.spawnManager.removeBonus(bonusId);
          }
        });

        tiles.forEach(({ x: tx, y: ty, tile: tileChar }) => {
          scene.levelMap[ty][tx] = tileChar;

          const oldTile = scene.tileSprites[ty][tx];
          oldTile?.destroy();

          const tileName = tileMapping[tileChar];
          if (tileName && tileName !== 'empty') {
            const { x: px, y: py } = coord.toPixel(tx, ty);
            const tile = scene.add.image(px, py, tileName);
            tile.setOrigin(0, 0).setDisplaySize(scene.dynamicTileSize, scene.dynamicTileSize);
            scene.tileSprites[ty][tx] = tile;
          } else {
            scene.tileSprites[ty][tx] = null;
          }
        });

        explosions.forEach(({ x, y }) => {
          scene.spawnManager.spawnExplosion(x, y);
        });

        enemyEvents.forEach((event) => {
          const { action, enemyId, x, y, direction } = event;

          if (action === 'spawn') {
            if (!scene.enemies.has(enemyId)) {
              const tank = scene.spawnManager.spawnTank(x, y, direction);
              tank.setDepth(1);
              scene.enemies.set(enemyId, tank);
            }
          } else if (action === 'move') {
            const enemy = scene.enemies.get(enemyId);
            if (enemy) {
              const { x: px, y: py } = coord.toPixel(x, y);
              enemy.setPosition(px, py);
              enemy.setAngle(getAngleFromDirection(direction));
            }
          } else if (action === 'destroy') {
            const enemy = scene.enemies.get(enemyId);
            if (enemy) {
              scene.spawnCollisionEffect(enemy.x, enemy.y);
              enemy.destroy();
              scene.enemies.delete(enemyId);
            }
          }
        });

        break;
      }

      default:
        console.warn('Unknown message type:', data.type);
    }
  }
}
