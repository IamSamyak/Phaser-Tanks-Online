import Phaser from 'phaser';


const tileMapping = {
  '.': 'empty',
  '#': 'brick',
  '@': 'stone',
  '%': 'bush',
  '~': 'water',
  '-': 'ice',
};

const TILE_SIZE = 32;

const bonusTypes = [
  { key: 'bonus_boat', effect: 'boat', path: '/assets/bonuses/bonus_boat.png' },
  { key: 'bonus_clock', effect: 'clock', path: '/assets/bonuses/bonus_clock.png' },
  { key: 'bonus_grenade', effect: 'grenade', path: '/assets/bonuses/bonus_grenade.png' },
  { key: 'bonus_gun', effect: 'gun', path: '/assets/bonuses/bonus_gun.png' },
  { key: 'bonus_helmet', effect: 'helmet', path: '/assets/bonuses/bonus_helmet.png' },
  { key: 'bonus_shovel', effect: 'shovel', path: '/assets/bonuses/bonus_shovel.png' },
  { key: 'bonus_star', effect: 'star', path: '/assets/bonuses/bonus_star.png' },
  { key: 'bonus_tank', effect: 'tank', path: '/assets/bonuses/bonus_tank.png' },
];


class TankGame extends Phaser.Scene {
  constructor() {
    super({ key: 'TankGame' });
  }
  

  preload() {
    this.load.image('brick', '/assets/tiles/brick.png');
    this.load.image('stone', '/assets/tiles/stone.png');
    this.load.image('bush', '/assets/tiles/bush.png');
    this.load.image('water', '/assets/tiles/water.png');
    this.load.image('ice', '/assets/tiles/ice.png');
    this.load.image('tank', '/assets/PlayerAssets/tankv1.png');
    this.load.image('bullet', '/assets/bullet.png'); 
    this.load.image('base', '/assets/base.png' );
    this.load.spritesheet('explosion', '/assets/explosion.png', {
      frameWidth: 70,
      frameHeight: 65
    });

  }

  create() {
    this.activeBonuses = {};

    this.tankSpeed = 100;

    fetch('/levels/1.txt')
      .then(res => res.text())
      .then(levelText => {
        this.renderLevel(levelText.trim());
        this.spawnTank(24, 9);
        this.spawnAsset(24,12, 'base');
        this.setupControls();
      })
      .catch(err => console.error('Failed to load level:', err));

    this.bonusGroup = this.add.group();
    this.time.delayedCall(8000, () => {
      this.scheduleBonus();
    });

    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 4 }),
      frameRate: 1,        // adjust speed as you like
      hideOnComplete: true, // hides the sprite when done
    });
    

  }

  renderLevel(levelData) {
    const lines = levelData.split('\n').map(line => line.replace(/\r/g, ''));
    this.levelMap = lines.map(line => [...line]);
    this.tileSprites = [];
  
    for (let y = 0; y < this.levelMap.length; y++) {
      this.tileSprites[y] = [];
  
      for (let x = 0; x < this.levelMap[y].length; x++) {
        const char = this.levelMap[y][x];
        const tileName = tileMapping[char];
        const xPos = x * TILE_SIZE;
        const yPos = y * TILE_SIZE;
  
        if (!tileName || tileName === 'empty') {
          this.tileSprites[y][x] = null;
          continue;
        }
  
        const tile = this.add.image(xPos, yPos, tileName);
        tile.setOrigin(0, 0);
        tile.setScale(TILE_SIZE / 16);
        this.tileSprites[y][x] = tile;
      }
    }
  
     // Optional: draw row/column numbers
    
    for (let x = 0; x < this.levelMap[0].length; x++) {
      this.add.text(x * TILE_SIZE + 10, 0, x.toString(), { fontSize: '12px', color: '#00ff00' });
    }
    for (let y = 0; y < this.levelMap.length; y++) {
      this.add.text(0, y * TILE_SIZE + 8, y.toString(), { fontSize: '12px', color: '#00ff00' });
    }
    
  }
  

  spawnTank(row, col) {
    const centerX = (col + 1) * TILE_SIZE;
    const centerY = (row + 1) * TILE_SIZE;

    this.tank = this.add.image(centerX, centerY, 'tank');
    this.tank.setOrigin(0.5, 0.5);
    this.tank.setDisplaySize(TILE_SIZE * 2, TILE_SIZE * 2);
    this.tank.angle = 0;
  }

  spawnAsset(row, col, asset){
    const centerX = (col + 1) * TILE_SIZE;
    const centerY = (row + 1) * TILE_SIZE;

    this.asset = this.add.image(centerX, centerY, asset);
    this.asset.setOrigin(0.5, 0.5);
    this.asset.setDisplaySize(TILE_SIZE * 2, TILE_SIZE * 2);
    this.asset.angle = 0;
  }

  setupControls() {
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      fire: Phaser.Input.Keyboard.KeyCodes.F,

    });
  }

  scheduleBonus() {
    this.spawnBonus().then(() => {
      this.time.delayedCall(6000, () => {
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
  
    // Load the bonus image if not already in cache
    if (!this.textures.exists(bonusType.key)) {
      await new Promise(resolve => {
        this.load.image(bonusType.key, bonusType.path);
        this.load.once('complete', resolve);
        this.load.start();
      });
    }
  
    const bonus = this.add.image(x, y, bonusType.key);
    bonus.setDisplaySize(TILE_SIZE, TILE_SIZE);
    bonus.setOrigin(0.5, 0.5);
    bonus.bonusEffect = bonusType.effect;
    this.bonusGroup.add(bonus);
  
    // Remove after 5 seconds
    this.time.delayedCall(5000, () => {
      if (bonus.active) bonus.destroy();
    });
  }
  
  checkBonusCollection() {
    this.bonusGroup.getChildren().forEach(bonus => {
      const distance = Phaser.Math.Distance.Between(this.tank.x, this.tank.y, bonus.x, bonus.y);
      if (distance < TILE_SIZE) { // Close enough to collect
        this.collectBonus(bonus);
      }
    });
  }
  
  collectBonus(bonus) {
    const effect = bonus.bonusEffect;
    console.log(`Collected bonus: ${effect}`);
  
    this.activeBonuses[effect] = true;
  
    switch (effect) {
      case 'helmet':
        this.tank.setTint(0xffff00); // Yellow tint
        break;
  
      case 'boat':
        this.tank.setTint(0x3399ff); // Blue tint for water access
        break;
  
      case 'gun':
        this.bulletSpeed = 60; // Faster bullet tween
        break;
  
      case 'grenade':
        this.destroyEnemies();
        break;
  
      case 'star':
        this.tank.setTint(0xff00ff); // Purple tint
        this.tankSpeed = 50; // Faster movement
        this.bulletSpeed = 50;
        break;
  
      case 'shovel':
        this.reinforceBase();
        break;
  
      case 'clock':
        this.freezeEnemies();
        break;
  
      case 'tank':
        this.upgradeTank();
        break;
    }
  
    // Remove bonus after 10s if it's time-based
    if (['helmet', 'boat', 'gun', 'star'].includes(effect)) {
      this.time.delayedCall(10000, () => this.removeBonusEffect(effect));
    }
  
    bonus.destroy();
  }
  

  removeBonusEffect(effect) {
    delete this.activeBonuses[effect];
  
    switch (effect) {
      case 'helmet':
      case 'boat':
      case 'star':
        this.tank.clearTint();
        break;
  
      case 'gun':
        this.bulletSpeed = 100;
        break;
  
      case 'star':
        this.tankSpeed = 100;
        this.bulletSpeed = 100;
        break;
    }
  
    console.log(`Bonus ${effect} expired.`);
  }

  
  
  destroyEnemies() {
    console.log("Enemies Destroyed (mocked)");

    // const row = Math.floor(this.tank.y / TILE_SIZE);
    // const col = Math.floor(this.tank.x / TILE_SIZE);
  
    // for (let dy = -1; dy <= 1; dy++) {
    //   for (let dx = -1; dx <= 1; dx++) {
    //     const r = row + dy;
    //     const c = col + dx;
  
    //     if (
    //       r >= 0 && r < this.levelMap.length &&
    //       c >= 0 && c < this.levelMap[0].length &&
    //       this.levelMap[r][c] === '#'
    //     ) {
    //       // Update level map
    //       this.levelMap[r][c] = '.';
  
    //       // Remove visual tile if exists
    //       const tile = this.tileSprites?.[r]?.[c];
    //       if (tile) {
    //         tile.destroy();
    //         this.tileSprites[r][c] = null;
    //       }
    //     }
    //   }
    // }
  }
  
  
  reinforceBase() {
    console.log("Base reinforced (mocked)");
    // Optional: draw some flashing tiles or reinforce base with stones visually
  }
  
  upgradeTank() {
    console.log("Tank upgraded!");
    this.tank.setTint(0x00ff00); // Green to show level up
    // Add features like double shot, health, etc. later
  }

  freezeEnemies() {
    console.log("Enemies frozen (mocked)");
    // You can implement enemy AI pause later
  }
  
  spawnCollisionEffect(x, y) {
    // Add your collision sprite, e.g., explosion
    const explosion = this.add.sprite(x, y, 'explosion');
    explosion.setOrigin(0.5);
    explosion.setScale(1);
  
    // Play animation if you have one, or just destroy after delay
    this.time.delayedCall(500, () => {
      explosion.destroy();
    });
  }
  
  
  fireBullet() {
    if (!this.tank) return;
  
    const angle = Phaser.Math.Wrap(this.tank.angle, 0, 360);
    const snappedAngle = Phaser.Math.Snap.To(angle, 90);
  
    const bullet = this.add.image(this.tank.x, this.tank.y, 'bullet');
    bullet.setDisplaySize(TILE_SIZE / 2, TILE_SIZE / 2);
    bullet.setOrigin(0.5);
  
    const direction = new Phaser.Math.Vector2(0, 0);
    switch (snappedAngle) {
      case 0:
        direction.y = -1;
        break;
      case 90:
        direction.x = 1;
        break;
      case 180:
        direction.y = 1;
        break;
      case 270:
        direction.x = -1;
        break;
      default:
        direction.y = -1;
    }
  
    const moveBullet = () => {
      const nextX = bullet.x + direction.x * TILE_SIZE;
      const nextY = bullet.y + direction.y * TILE_SIZE;
  
      const row = Math.floor(nextY / TILE_SIZE);
      const col = Math.floor(nextX / TILE_SIZE);
  
      if (
        row < 0 || row >= this.levelMap.length ||
        col < 0 || col >= this.levelMap[0].length ||
        !this.isWalkable(row, col)
      ) {

        // Spawn collision sprite at bullet position
        this.spawnCollisionEffect(bullet.x, bullet.y);  
        
        bullet.destroy(); // Hit wall or out of bounds

        return;
      }
  
      this.tweens.add({
        targets: bullet,
        x: nextX,
        y: nextY,
        duration: this.bulletSpeed || 100,
        onComplete: () => {
          moveBullet(); // Continue moving
        }
      });
    };
  
    moveBullet();
  }

  update(time) {
    if (!this.tank) return;

    if (!this.lastMoveTime || time - this.lastMoveTime > 200) { // Adjust 200ms delay as needed
      const tankRow = Math.floor(this.tank.y / TILE_SIZE);
      const tankCol = Math.floor(this.tank.x / TILE_SIZE);

      if (this.cursors.up.isDown && this.isWalkable(tankRow - 1, tankCol)) {
        this.tank.y -= TILE_SIZE;
        this.tank.setAngle(0); // Facing up
        this.lastMoveTime = time;
      } else if (this.cursors.down.isDown && this.isWalkable(tankRow + 1, tankCol)) {
        this.tank.y += TILE_SIZE;
        this.tank.setAngle(180); // Facing down
        this.lastMoveTime = time;
      } else if (this.cursors.left.isDown && this.isWalkable(tankRow, tankCol - 1)) {
        this.tank.x -= TILE_SIZE;
        this.tank.setAngle(270); // Facing left
        this.lastMoveTime = time;
      } else if (this.cursors.right.isDown && this.isWalkable(tankRow, tankCol + 1)) {
        this.tank.x += TILE_SIZE;
        this.tank.setAngle(90); // Facing right
        this.lastMoveTime = time;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.fire)) {
      this.fireBullet();
    }


    this.checkBonusCollection();
  }


  getTankCorners(x, y) {
    const half = TILE_SIZE;
    return [
      { row: Math.floor((y - half) / TILE_SIZE), col: Math.floor((x - half) / TILE_SIZE) }, // top-left
      { row: Math.floor((y - half) / TILE_SIZE), col: Math.floor((x + half - 1) / TILE_SIZE) }, // top-right
      { row: Math.floor((y + half - 1) / TILE_SIZE), col: Math.floor((x - half) / TILE_SIZE) }, // bottom-left
      { row: Math.floor((y + half - 1) / TILE_SIZE), col: Math.floor((x + half - 1) / TILE_SIZE) }, // bottom-right
    ];
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

const config = {
  type: Phaser.AUTO,
  width: 832,
  height: 832,
  backgroundColor: '#222222',
  parent: 'game-container',
  scene: [TankGame],
};

new Phaser.Game(config);
