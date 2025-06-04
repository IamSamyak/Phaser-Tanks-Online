// LevelLoader.js
import { tileMapping, TILE_SIZE } from './constants.js';

export default class LevelLoader {
  constructor(scene) {
    this.scene = scene;
    this.levelMap = [];
  }

  async loadLevel(path) {
    const res = await fetch(path);
    const levelText = await res.text();
    this.levelMap = levelText.trim().split('\n').map(line => [...line.replace(/\r/g, '')]);
    this.renderLevel();
  }

  renderLevel() {
    const scene = this.scene;
    const graphics = scene.add.graphics();

    for (let y = 0; y < this.levelMap.length; y++) {
      const row = this.levelMap[y];
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
          const tile = scene.add.image(xPos, yPos, tileName);
          tile.setOrigin(0, 0);
          tile.setScale(TILE_SIZE / 16);
        }
      }
    }

    // Draw row/column numbers for reference
    for (let x = 0; x < this.levelMap[0].length; x++) {
      scene.add.text(x * TILE_SIZE + 10, 0, x.toString(), { fontSize: '12px', color: '#00ff00' });
    }
    for (let y = 0; y < this.levelMap.length; y++) {
      scene.add.text(0, y * TILE_SIZE + 8, y.toString(), { fontSize: '12px', color: '#00ff00' });
    }
  }
}
