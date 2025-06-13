import Phaser from 'phaser';
import TankGame from './scenes/TankGame.js';

function getLandscapeSize() {
  const isLandscape = window.innerWidth > window.innerHeight;
  const width = isLandscape ? window.innerWidth : window.innerHeight;
  const height = isLandscape ? window.innerHeight : window.innerWidth;
  return { width, height };
}

function isPortraitMode() {
  return window.innerHeight > window.innerWidth;
}

function removeRotateOverlayFromDOM() {
  const rotateDiv = document.getElementById('rotate-device');
  if (rotateDiv && rotateDiv.parentNode) {
    rotateDiv.parentNode.removeChild(rotateDiv); // ✅ Completely removes the element
  }
}

window.addEventListener('resize', () => {
  location.reload();
});

window.addEventListener('orientationchange', () => {
  location.reload();
});

window.addEventListener('load', () => {
  if (isPortraitMode()) {
    // Don't initialize game in portrait
    return;
  }

  const { width, height } = getLandscapeSize();

  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width,
    height,
    backgroundColor: '#fff',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [TankGame],
  };

  new Phaser.Game(config);

  // ✅ Remove the overlay once game loads in landscape
  removeRotateOverlayFromDOM();
});  