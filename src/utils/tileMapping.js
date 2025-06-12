export const tileMapping = {
  '.': 'empty',
  '#': 'brick',
  '@': 'stone',
  '%': 'bush',
  '~': 'water',
  '-': 'ice',
};

export let TILE_SIZE = 32;
export const setTileSize = (size) => {
  TILE_SIZE = size;
};

