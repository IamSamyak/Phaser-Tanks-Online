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
  }

  create() {
    this.tankSpeed = 100;

    fetch('/levels/1.txt')
      .then(res => res.text())
      .then(levelText => {
        this.renderLevel(levelText.trim());
        this.spawnTank(24, 9);
        this.setupControls();
      })
      .catch(err => console.error('Failed to load level:', err));
  }

  renderLevel(levelData) {
    const lines = levelData.split('\n').map(line => line.replace(/\r/g, ''));
    this.levelMap = lines.map(line => [...line]);

    const graphics = this.add.graphics();

    for (let y = 0; y < lines.length; y++) {
      const row = lines[y];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        const tileName = tileMapping[char];
        const xPos = x * TILE_SIZE;
        const yPos = y * TILE_SIZE;

        if (!tileName) continue;

        if (tileName === 'empty') {
          graphics.fillStyle(0x000000, 1);
          graphics.fillRect(xPos, yPos, TILE_SIZE, TILE_SIZE);
        } else {
          const tile = this.add.image(xPos, yPos, tileName);
          tile.setOrigin(0, 0);
          tile.setScale(TILE_SIZE / 16);
        }
      }
    }

    // Draw row/column numbers for reference
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

  setupControls() {
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  update(time, delta) {
    if (!this.tank) return;

    const speed = this.tankSpeed * (delta / 1000);
    const tank = this.tank;

    let dx = 0, dy = 0, angle = tank.angle;

    if (this.cursors.up.isDown) {
      angle = 0;
      dy = -speed;
    } else if (this.cursors.down.isDown) {
      angle = 180;
      dy = speed;
    } else if (this.cursors.left.isDown) {
      angle = 270;
      dx = -speed;
    } else if (this.cursors.right.isDown) {
      angle = 90;
      dx = speed;
    }

    tank.setAngle(angle);

    if (dx !== 0 || dy !== 0) {
      const nextX = tank.x + dx;
      const nextY = tank.y + dy;

      const corners = this.getTankCorners(nextX, nextY);

      const canMove = corners.every(({ row, col }) => this.isWalkable(row, col));

      if (canMove) {
        tank.x = nextX;
        tank.y = nextY;
      }
    }
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
  width: 800,
  height: 832,
  backgroundColor: '#222222',
  parent: 'game-container',
  scene: [TankGame],
};

new Phaser.Game(config);
