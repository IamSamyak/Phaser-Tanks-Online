import { TILE_SIZE } from '../utils/tileMapping.js';
import { bonusTypes } from '../utils/bonusTypes.js';

export default class SpawnManager {
  constructor(scene) {
    this.scene = scene;
    this.bonuses = new Map();
  }

  spawnTank(row, col) {
    const centerX = (row + 1) * TILE_SIZE;
    const centerY = (col + 1) * TILE_SIZE;

    const tank = this.scene.add.image(centerX, centerY, 'tank');
    tank.setOrigin(0.5, 0.5);
    tank.setDisplaySize(TILE_SIZE * 2, TILE_SIZE * 2);
    tank.angle = 0;

    return tank;
  }

  spawnAsset(row, col, assetKey) {
    const centerX = (row + 1) * TILE_SIZE;
    const centerY = (col + 1) * TILE_SIZE;

    const asset = this.scene.add.image(centerX, centerY, assetKey);
    asset.setOrigin(0.5, 0.5);
    asset.setDisplaySize(TILE_SIZE * 2, TILE_SIZE * 2);
    asset.angle = 0;

    return asset;
  }

  spawnExplosion(x, y) {
    const explosion = this.scene.add.sprite(x, y, 'explosion');
    explosion.setOrigin(0.5);
    explosion.setScale(1);
    this.scene.time.delayedCall(500, () => explosion.destroy());
  }

  spawnBonus(bonusId, x, y, bonusEffect) {
    if (this.bonuses.has(bonusId)) return;

    // Find bonus object by effect field
    const bonusTypeObj = bonusTypes.find(b => b.effect === bonusEffect);
    if (!bonusTypeObj) {
      console.warn(`Bonus effect "${bonusEffect}" not found in bonusTypes.`);
      return;
    }

    // Add image by the texture key (not path!)
    const bonus = this.scene.add.image(x, y, bonusTypeObj.key);
    bonus.setOrigin(0.5);
    bonus.setDisplaySize(TILE_SIZE, TILE_SIZE);
    bonus.bonusId = bonusId;
    bonus.bonusEffect = bonusEffect;

    this.bonuses.set(bonusId, bonus);
  }

  removeBonus(bonusId) {
    const bonus = this.bonuses.get(bonusId);
    if (bonus) {
      bonus.destroy();
      this.bonuses.delete(bonusId);
    }
  }

  getBonuses() {
    return Array.from(this.bonuses.values());
  }
}
