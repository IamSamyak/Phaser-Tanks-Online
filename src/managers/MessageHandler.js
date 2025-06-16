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

      case 'spawn_new_player': {
        const { playerId, x, y, direction } = data;
        if (playerId !== scene.playerId && !scene.players[playerId]) {
          const newTank = scene.spawnManager.spawnTank(x, y, direction);
          scene.players[playerId] = newTank;
          console.log(`New player ${playerId} spawned at (${x},${y})`);
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
          playerEvents = [] // ✅ Updated key
        } = data;
        console.log('player evensts ',data);
        
        // ✅ Unified player handling
        playerEvents.forEach(({ action, playerId, x, y, direction }) => {
          let tank = scene.players[playerId];

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

        enemyEvents.forEach(({ action, enemyId, x, y, direction }) => {
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
