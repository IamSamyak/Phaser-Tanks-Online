// BonusManager.js
import { TILE_SIZE, bonusTypes, tileMapping } from './constants.js';

export default class BonusManager {
  constructor(scene, levelMap) {
    this.scene = scene;
    this.levelMap = levelMap;
    this.bonusGroup = scene.add.group();
  }

  startScheduling() {
    this.scene.time.delayedCall(8000, () => {
      this.scheduleBonus();
    });
  }

  scheduleBonus() {
    this.spawnBonus().then(() => {
      this.scene.time.delayedCall(6000, () => {
        this.scheduleBonus();
      });
    });
  }

  async spawnBonus() {
    const walkableTiles = [];

    for (let row = 0; row < this.levelMap.length; row++) {
      for (let col = 0; col < this.levelMap[row].length; col++) {
        if (this.isWalkable(row, col)) {
          walkableTiles.push({ row, col });
        }
      }
    }

    if (walkableTiles.length === 0) return;

    const { row, col } = Phaser.Utils.Array.GetRandom(walkableTiles);
    const bonusType = Phaser.Utils.Array.GetRandom(bonusTypes);
    const x = (col + 0.5) * TILE_SIZE;
    const y = (row + 0.5) * TILE_SIZE;

    if (!this.scene.textures.exists(bonusType.key)) {
      await new Promise(resolve => {
        this.scene.load.image(bonusType.key, bonusType.path);
        this.scene.load.once('complete', resolve);
        this.scene.load.start();
      });
    }

    const bonus = this.scene.add.image(x, y, bonusType.key);
    bonus.setDisplaySize(TILE_SIZE, TILE_SIZE);
    bonus.setOrigin(0.5, 0.5);
    bonus.bonusEffect = bonusType.effect;
    this.bonusGroup.add(bonus);

    this.scene.time.delayedCall(5000, () => {
      if (bonus.active) bonus.destroy();
    });
  }

  checkBonusCollection(tank) {
    this.bonusGroup.getChildren().forEach(bonus => {
      const distance = Phaser.Math.Distance.Between(tank.x, tank.y, bonus.x, bonus.y);
      if (distance < TILE_SIZE) {
        this.collectBonus(bonus);
      }
    });
  }

  collectBonus(bonus) {
    console.log(`Collected bonus: ${bonus.bonusEffect}`);
    // TODO: implement effect logic here
    bonus.destroy();
  }

  isWalkable(row, col) {
    if (
      row < 0 || row >= this.levelMap.length ||
      col < 0 || col >= this.levelMap[0].length
    ) return false;

    const tileChar = this.levelMap[row][col];
    const type = tileMapping[tileChar];
    return type === 'empty' || type === 'bush';
  }
}
