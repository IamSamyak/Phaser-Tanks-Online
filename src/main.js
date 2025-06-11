// main.js
import Phaser from 'phaser';
import TankGame from './scenes/TankGame.js';
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';


const config = {
  type: Phaser.AUTO,
  width: 832,
  height: 832,
  backgroundColor: '#222222',
  parent: 'game-container',
  scene: [TankGame],
  plugins: {
    global: [
      {
        key: 'rexVirtualJoystick',
        plugin: VirtualJoystickPlugin,
        start: true
      }
    ]
  }
};

new Phaser.Game(config);
