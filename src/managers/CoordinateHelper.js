export default class CoordinateHelper {
  constructor(offsetX, offsetY, tileSize) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.tileSize = tileSize;
  }

  // Convert tile (x, y) to pixel (x, y)
  toPixel(x, y) {
    return {
      x: this.offsetX + x * this.tileSize,
      y: this.offsetY + y * this.tileSize
    };
  }

  // Convert pixel (x, y) to tile (x, y)
  toTile(x, y) {
    return {
      x: Math.floor((x - this.offsetX) / this.tileSize),
      y: Math.floor((y - this.offsetY) / this.tileSize)
    };
  }

  // Align any pixel to top-left of the tile
  snapToTile(x, y) {
    const { x: tileX, y: tileY } = this.toTile(x, y);
    return this.toPixel(tileX, tileY);
  }
}
