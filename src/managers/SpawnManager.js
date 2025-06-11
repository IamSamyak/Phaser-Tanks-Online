import { TILE_SIZE } from '../utils/tileMapping.js';
import { bonusTypes } from '../utils/bonusTypes.js';
import { getAngleFromDirection } from '../utils/directionHelper.js';

export default class SpawnManager {
  constructor(scene) {
    this.scene = scene;
    this.bonuses = new Map();
  }

  toPixelCoords(x, y) {
    return [x * TILE_SIZE, y * TILE_SIZE];
  }

  spawnTank(x, y, direction) {
    const [centerX, centerY] = this.toPixelCoords(x, y);
    const tank = this.scene.add.image(centerX, centerY, 'tank');
    tank.setOrigin(0.5, 0.5);
    tank.setDisplaySize(TILE_SIZE * 2, TILE_SIZE * 2);
    tank.angle = getAngleFromDirection(direction);
    return tank;
  }

  spawnAsset(x, y, assetKey, direction) {
    const [centerX, centerY] = this.toPixelCoords(x, y);
    const asset = this.scene.add.image(centerX, centerY, assetKey);
    asset.setOrigin(0.5, 0.5);
    asset.setDisplaySize(TILE_SIZE * 2, TILE_SIZE * 2);
    asset.angle = getAngleFromDirection(direction);
    return asset;
  }

  spawnExplosion(x, y) {
    const [px, py] = this.toPixelCoords(x, y);
    const explosion = this.scene.add.sprite(px, py, 'explosion');
    explosion.setOrigin(0.5);
    explosion.setScale(1);
    this.scene.time.delayedCall(500, () => explosion.destroy());
  }

  spawnBonus(bonusId, x, y, bonusEffect) {
    if (this.bonuses.has(bonusId)) return;

    const bonusTypeObj = bonusTypes.find(b => b.effect === bonusEffect);
    if (!bonusTypeObj) {
      console.warn(`Bonus effect "${bonusEffect}" not found in bonusTypes.`);
      return;
    }

    const [px, py] = this.toPixelCoords(x, y);
    const bonus = this.scene.add.image(px, py, bonusTypeObj.key);
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
