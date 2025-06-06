import Phaser from 'phaser';
import { canMove } from '../utils/TankHelper.js';
import { bonusTypes } from '../utils/bonusTypes.js';
import { tileMapping, TILE_SIZE } from '../utils/tileMapping.js';

export default class BonusManager {
  constructor(scene, levelMap, bonusGroup) {
    this.scene = scene;
    this.levelMap = levelMap;
    this.bonusGroup = bonusGroup;
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

    if (!tank.base) return;

    // Apply effect
    switch (effect) {
      case 'helmet':
        tank.base.health += 1;
        tank.setTint(0xffff00);
        break;
      case 'boat':
        tank.base.canMoveOnWater = true;
        tank.setTint(0x3399ff);
        break;
      case 'gun':
        tank.base.maxBullets += 1;
        tank.setTint(0xff9900);
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

    // Set timeout to revert temporary effects
    if (['helmet', 'boat', 'gun', 'star'].includes(effect)) {
      this.scene.time.delayedCall(10000, () => this.removeBonusEffect(tank, effect));
    }

    bonus.destroy();
  }

  removeBonusEffect(tank, effect) {
    if (!tank.base) return;

    switch (effect) {
      case 'helmet':
        tank.base.health = Math.max(2, tank.base.health - 1);
        tank.clearTint();
        break;
      case 'boat':
        tank.base.canMoveOnWater = false;
        tank.clearTint();
        break;
      case 'gun':
        tank.base.maxBullets = Math.max(2, tank.base.maxBullets - 1);
        tank.clearTint();
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
    if (!this.scene.asset || !this.scene.levelMap || !this.scene.tileSprites) return;

    const { x, y } = this.scene.asset;

    // Calculate top-left tile coordinates of base
    const baseCol = Math.floor(x / TILE_SIZE);
    const baseRow = Math.floor(y / TILE_SIZE);

    // Base covers 2x2 tiles: 
    // (baseRow, baseCol), (baseRow, baseCol+1),
    // (baseRow+1, baseCol), (baseRow+1, baseCol+1)
    const baseTiles = [
      [baseRow, baseCol],
      [baseRow, baseCol + 1],
      [baseRow + 1, baseCol],
      [baseRow + 1, baseCol + 1],
    ];

    const surroundingOffsets = [
      [-1, -1], [-1, 0], [-1, 1], [-1, 2],
      [0, -1], [0, 2],
      [1, -1], [1, 2],
      [2, -1], [2, 0], [2, 1], [2, 2],
    ];

    // To avoid reinforcing the base tiles themselves or duplicates, use a Set keyed by 'r,c'
    const reinforcedPositions = new Set();

    const originalTiles = [];

    // For each tile surrounding the 2x2 base tiles
    baseTiles.forEach(([baseR, baseC]) => {
      surroundingOffsets.forEach(([dy, dx]) => {
        const r = baseR + dy;
        const c = baseC + dx;

        // Check bounds
        if (
          r >= 0 && r < this.scene.levelMap.length &&
          c >= 0 && c < this.scene.levelMap[0].length
        ) {
          const key = `${r},${c}`;

          // Skip base tiles themselves
          if (
            (r === baseRow && c === baseCol) ||
            (r === baseRow && c === baseCol + 1) ||
            (r === baseRow + 1 && c === baseCol) ||
            (r === baseRow + 1 && c === baseCol + 1)
          ) return;

          if (!reinforcedPositions.has(key)) {
            reinforcedPositions.add(key);

            const originalChar = this.scene.levelMap[r][c];
            originalTiles.push({ row: r, col: c, originalChar });

            // Update map & visuals to stone
            this.scene.levelMap[r][c] = 'S'; // stone tile code

            const oldSprite = this.scene.tileSprites[r][c];
            if (oldSprite) oldSprite.destroy();

            const stone = this.scene.add.image(c * TILE_SIZE, r * TILE_SIZE, 'stone');
            stone.setOrigin(0, 0);
            stone.setScale(TILE_SIZE / 16);
            this.scene.tileSprites[r][c] = stone;
          }
        }
      });
    });

    // Revert back after 7 seconds
    this.scene.time.delayedCall(7000, () => {
      originalTiles.forEach(({ row, col, originalChar }) => {
        this.scene.levelMap[row][col] = originalChar;

        const oldSprite = this.scene.tileSprites[row][col];
        if (oldSprite) oldSprite.destroy();

        const tileName = tileMapping[originalChar];
        if (!tileName || tileName === 'empty') {
          this.scene.tileSprites[row][col] = null;
          return;
        }

        const tile = this.scene.add.image(col * TILE_SIZE, row * TILE_SIZE, tileName);
        tile.setOrigin(0, 0);
        tile.setScale(TILE_SIZE / 16);
        this.scene.tileSprites[row][col] = tile;
      });
      console.log('Base reinforcement expired.');
    });

    console.log('Base reinforced!');
  }

  freezeEnemies() {
    console.log('Enemies frozen (mocked)');
  }

  upgradeTank(tank) {
    console.log('Tank upgraded!');
    tank.setTint(0x00ff00);
    if (tank.base) {
      tank.base.health += 1;
      tank.base.maxBullets += 1;
    }
  }
}
