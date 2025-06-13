import Phaser from 'phaser';
import TankGame from './scenes/TankGame.js';
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';


function getLandscapeSize() {
  const isLandscape = window.innerWidth > window.innerHeight;
  const width = isLandscape ? window.innerWidth : window.innerHeight;
  const height = isLandscape ? window.innerHeight : window.innerWidth;
  return { width, height };
}

const { width, height } = getLandscapeSize();

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width,
  height,
  backgroundColor: '#000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TankGame],
  input: {
    activePointers: 3,  //  Enables up to 3 simultaneous touch points
    touch: {
      target: window
    }
  },
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