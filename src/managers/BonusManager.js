import Phaser from 'phaser';
import { canMove } from '../utils/TankHelper.js';
import { bonusTypes } from '../utils/bonusTypes.js';
import { tileMapping, TILE_SIZE } from '../utils/tileMapping.js';

export default class BonusManager {
  constructor(scene, levelMap, bonusGroup) {
    this.scene = scene;
    this.levelMap = levelMap;
    this.bonusGroup = bonusGroup;
    this.activeBonuses = {};
  }

  scheduleBonus() {
    this.spawnBonus().then(() => {
      this.scene.time.delayedCall(6000, () => this.scheduleBonus());
    });
  }

  async spawnBonus() {
    const walkableTiles = [];

    for (let row = 0; row < this.levelMap.length; row++) {
      for (let col = 0; col < this.levelMap[row].length; col++) {
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        if (canMove(x, y, this.levelMap, tileMapping, TILE_SIZE)) {
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
      await new Promise((resolve) => {
        this.scene.load.image(bonusType.key, bonusType.path);
        this.scene.load.once('complete', resolve);
        this.scene.load.start();
      });
    }

    const bonus = this.scene.add.image(x, y, bonusType.key);
    bonus.setDisplaySize(TILE_SIZE, TILE_SIZE);
    bonus.setOrigin(0.5);
    bonus.bonusEffect = bonusType.effect;
    this.bonusGroup.add(bonus);

    this.scene.time.delayedCall(5000, () => {
      if (bonus.active) bonus.destroy();
    });
  }

  checkBonusCollection(tank) {
    this.bonusGroup.getChildren().forEach((bonus) => {
      const distance = Phaser.Math.Distance.Between(tank.x, tank.y, bonus.x, bonus.y);
      if (distance < TILE_SIZE) {
        this.collectBonus(tank, bonus);
      }
    });
  }

  collectBonus(tank, bonus) {
    const effect = bonus.bonusEffect;
    console.log(`Collected bonus: ${effect}`);
    this.activeBonuses[effect] = true;

    switch (effect) {
      case 'helmet':
        tank.setTint(0xffff00);
        break;
      case 'boat':
        tank.setTint(0x3399ff);
        break;
      case 'gun':
        this.scene.bulletSpeed = 60;
        break;
      case 'grenade':
        this.destroyEnemies();
        break;
      case 'star':
        tank.setTint(0xff00ff);
        this.scene.tankSpeed = 50;
        this.scene.bulletSpeed = 50;
        break;
      case 'shovel':
        this.reinforceBase();
        break;
      case 'clock':
        this.freezeEnemies();
        break;
      case 'tank':
        this.upgradeTank(tank);
        break;
    }

    if (['helmet', 'boat', 'gun', 'star'].includes(effect)) {
      this.scene.time.delayedCall(10000, () => this.removeBonusEffect(tank, effect));
    }

    bonus.destroy();
  }

  removeBonusEffect(tank, effect) {
    delete this.activeBonuses[effect];

    switch (effect) {
      case 'helmet':
      case 'boat':
        tank.clearTint();
        break;
      case 'gun':
        this.scene.bulletSpeed = 100;
        break;
      case 'star':
        tank.clearTint();
        this.scene.tankSpeed = 100;
        this.scene.bulletSpeed = 100;
        break;
    }

    console.log(`Bonus ${effect} expired.`);
  }

  destroyEnemies() {
    console.log('Enemies destroyed (mocked)');
  }

  reinforceBase() {
    console.log('Base reinforced (mocked)');
  }

  freezeEnemies() {
    console.log('Enemies frozen (mocked)');
  }

  upgradeTank(tank) {
    console.log('Tank upgraded!');
    tank.setTint(0x00ff00);
  }
}
