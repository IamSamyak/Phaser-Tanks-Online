import { bonusTypes } from '../utils/bonusTypes.js';
import { getAngleFromDirection } from '../utils/directionHelper.js';

export default class SpawnManager {
  constructor(scene) {
    this.scene = scene;
    this.bonuses = new Map();
  }

  spawnTank(x, y, direction) {
    const { x: px, y: py } = this.scene.coordHelper.toPixel(x, y);
    const size = this.scene.dynamicTileSize;
    const tank = this.scene.add.image(px, py, 'tank');
    tank.setOrigin(0.5, 0.5);
    tank.setDisplaySize(size * 2, size * 2);
    tank.angle = getAngleFromDirection(direction);
    return tank;
  }

  spawnAsset(x, y, assetKey, direction) {
    const { x: px, y: py } = this.scene.coordHelper.toPixel(x, y);
    const size = this.scene.dynamicTileSize;
    const asset = this.scene.add.image(px, py, assetKey);
    asset.setOrigin(0.5, 0.5);
    asset.setDisplaySize(size * 2, size * 2);
    asset.angle = getAngleFromDirection(direction);
    return asset;
  }

  // spawnExplosion(x, y) {
  //   const { x: px, y: py } = this.scene.coordHelper.toPixel(x, y);
  //   const explosion = this.scene.add.sprite(px, py, 'explosion');
  //   explosion.setOrigin(0.5);
  //   explosion.setScale(1);
  //   this.scene.time.delayedCall(500, () => explosion.destroy());
  // }

  spawnExplosion(x, y) {
    const { x: px, y: py } = this.scene.coordHelper.toPixel(x, y);
    const explosion = this.scene.add.sprite(px, py, 'explosion');
    explosion.setOrigin(0.5);

    // Dynamically calculate scale relative to tile size
    const baseExplosionSize = 70; // from explosion sprite frame size
    const scale = (this.scene.dynamicTileSize * 2) / baseExplosionSize;
    explosion.setScale(scale);

    this.scene.time.delayedCall(500, () => explosion.destroy());
  }

  spawnBonus(bonusId, x, y, bonusEffect) {
    if (this.bonuses.has(bonusId)) return;

    const bonusTypeObj = bonusTypes.find(b => b.effect === bonusEffect);
    if (!bonusTypeObj) {
      console.warn(`Bonus effect "${bonusEffect}" not found in bonusTypes.`);
      return;
    }

    const { x: px, y: py } = this.scene.coordHelper.toPixel(x, y);
    const size = this.scene.dynamicTileSize;
    const bonus = this.scene.add.image(px, py, bonusTypeObj.key);
    bonus.setOrigin(0.5);
    bonus.setDisplaySize(size, size);
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
