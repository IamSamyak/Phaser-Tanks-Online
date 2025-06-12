import { tileMapping } from '../utils/tileMapping.js';
import { getAngleFromDirection } from '../utils/directionHelper.js';

export default class MessageHandler {
  constructor(scene, socket) {
    this.scene = scene;
    this.socket = socket;
  }

  handle(data) {
    const scene = this.scene;

    switch (data.type) {

      case 'base_destroyed': {
        alert('Game Over! Your base has been destroyed.');
        // Optionally: stop the game or redirect to lobby/menu
        scene.scene.pause(); // Pause the game scene
        // You could also add custom game over screen logic here
        break;
      }

      case 'spawn_other': {
        const { playerId, x, y, direction } = data;

        // Add to scene.players if not already present
        if (!scene.players.includes(playerId)) {
          scene.players.push(playerId);
        }
        // Spawn the other player's tank if it doesn't exist yet
        if (!scene.playersMap) scene.playersMap = {};
        if (!scene.playersMap[playerId]) {
          const otherTank = scene.spawnManager.spawnTank(x, y, direction);
          scene.playersMap[playerId] = otherTank;
        }

        break;
      }


      case 'player_move':
      case 'move': {
        const tank = data.playerNumber === scene.playerNumber ? scene.tank : scene.otherTank;
        if (tank) {
          tank.setPosition(data.x * this.scene.dynamicTileSize, data.y * this.scene.dynamicTileSize);
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
              tank.setPosition(x * this.scene.dynamicTileSize, y * this.scene.dynamicTileSize);
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

        // Update bullets
        bullets.forEach(({ bulletId, x, y, direction, action }) => {
          if (action === 'destroy') {
            scene.bulletManager?.destroyBullet(bulletId);
          } else {
            scene.bulletManager?.createOrUpdateBullet(bulletId, x, y, direction);
          }
        });

        // Update bonuses
        bonuses.forEach(({ type, bonusId, x, y }) => {
          if (type === 'spawn') {
            scene.spawnManager.spawnBonus(bonusId, x, y);
          } else if (type === 'remove') {
            scene.spawnManager.removeBonus(bonusId);
          }
        });

        // Tile updates
        tiles.forEach(({ x: tx, y: ty, tile: tileChar }) => {
          scene.levelMap[ty][tx] = tileChar;
          const oldTile = scene.tileSprites[ty][tx];
          oldTile?.destroy();

          const tileName = tileMapping[tileChar];
          if (tileName && tileName !== 'empty') {
            const tile = scene.add.image(tx * this.scene.dynamicTileSize, ty * this.scene.dynamicTileSize, tileName);
            tile.setOrigin(0, 0).setScale(2);
            scene.tileSprites[ty][tx] = tile;
          } else {
            scene.tileSprites[ty][tx] = null;
          }
        });

        // Explosions
        explosions.forEach(({ x, y }) => {
          scene.spawnManager.spawnExplosion(x, y);
        });

        // ✅ Unified enemy event handling
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
              enemy.setPosition(x * this.scene.dynamicTileSize, y * this.scene.dynamicTileSize);
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
