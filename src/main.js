// main.js
import Phaser from 'phaser';
import TankGame from './scenes/TankGame.js';

const config = {
  type: Phaser.AUTO,
  width: 832,
  height: 832,
  backgroundColor: '#222222',
  parent: 'game-container',
  scene: [TankGame],
};

new Phaser.Game(config);
