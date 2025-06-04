// constants.js

export const tileMapping = {
    '.': 'empty',
    '#': 'brick',
    '@': 'stone',
    '%': 'bush',
    '~': 'water',
    '-': 'ice',
  };
  
  export const TILE_SIZE = 32;
  
  export const bonusTypes = [
    { key: 'bonus_boat', effect: 'boat', path: '/assets/bonuses/bonus_boat.png' },
    { key: 'bonus_clock', effect: 'clock', path: '/assets/bonuses/bonus_clock.png' },
    { key: 'bonus_grenade', effect: 'grenade', path: '/assets/bonuses/bonus_grenade.png' },
    { key: 'bonus_gun', effect: 'gun', path: '/assets/bonuses/bonus_gun.png' },
    { key: 'bonus_helmet', effect: 'helmet', path: '/assets/bonuses/bonus_helmet.png' },
    { key: 'bonus_shovel', effect: 'shovel', path: '/assets/bonuses/bonus_shovel.png' },
    { key: 'bonus_star', effect: 'star', path: '/assets/bonuses/bonus_star.png' },
    { key: 'bonus_tank', effect: 'tank', path: '/assets/bonuses/bonus_tank.png' },
  ];
  