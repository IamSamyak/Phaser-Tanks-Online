export const Direction = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

export function getAngleFromDirection(direction) {
  switch (direction) {
    case Direction.UP:
      return 0;
    case Direction.RIGHT:
      return 90;
    case Direction.DOWN:
      return 180;
    case Direction.LEFT:
      return 270;
    default:
      throw new Error(`Unknown direction: ${direction}`);
  }
}

export function getDirectionFromAngle(angle) {
  
  switch (angle) {
    case 0:
      return Direction.UP;
    case 90:
      return Direction.RIGHT;
    case 180:
      return Direction.DOWN;
    case 270:
      return Direction.LEFT;
    default:
      throw new Error(`Unknown angle: ${angle}`);
  }
}

