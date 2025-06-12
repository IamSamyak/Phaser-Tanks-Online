import Phaser from 'phaser';
import TankGame from './scenes/TankGame.js';

const squareSize = Math.min(window.innerWidth, window.innerHeight);

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: squareSize,
  height: squareSize,
  backgroundColor: '#000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TankGame],
};

const game = new Phaser.Game(config);
