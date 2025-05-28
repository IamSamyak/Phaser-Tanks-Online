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
const ORIGINAL_TILE_SIZE = 16;
const SCALE = TILE_SIZE / ORIGINAL_TILE_SIZE; // = 2

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
  }

  create() {
    fetch('/levels/1.txt')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
      })
      .then(levelText => {
        this.renderLevel(levelText.trim());
      })
      .catch(err => {
        console.error('Failed to load level:', err);
      });
  }

 renderLevel(levelData) {
  const lines = levelData.split('\n').map(line => line.replace(/\r/g, ''));

  for (let y = 0; y < lines.length; y++) {
    const row = lines[y];

    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      const tileName = tileMapping[char];
      const xPos = x * TILE_SIZE;
      const yPos = y * TILE_SIZE;

      // If tile is not defined in mapping, continue
      if (!tileName) continue;

      if (tileName === 'empty') {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(xPos, yPos, TILE_SIZE, TILE_SIZE);
      } else {
        const tile = this.add.image(xPos, yPos, tileName);
        tile.setOrigin(0, 0);
        tile.setScale(SCALE);
      }

      // 🔢 Draw row and column numbers
      this.add.text(
        xPos + TILE_SIZE / 2,
        yPos + TILE_SIZE / 2,
        `${y},${x}`, // row, col as per lines array
        {
          fontSize: '10px',
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: { left: 2, right: 2, top: 1, bottom: 1 },
        }
      ).setOrigin(0.5);
    }
  }
}


}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 832, // or any number >= 832
  backgroundColor: '#222222',
  parent: 'game-container',
  scene: [TankGame],
};

const game = new Phaser.Game(config);
