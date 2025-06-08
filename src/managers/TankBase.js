export default class TankBase {
  constructor(sprite) {
    this.sprite = sprite;

    // Default tank properties
    this.health = 2;
    this.canMoveOnWater = false;
    this.maxBullets = 2;
    this.activeBullets = 0;

    // Track tank position explicitly
    this.x = sprite.x;
    this.y = sprite.y;
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
    if (this.sprite) {
      this.sprite.setPosition(x, y);
    }
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  applyBonus(bonusType) {
    switch (bonusType) {
      case 'helmet':
        this.health += 1;
        this.sprite.setTint(0xffff00);
        break;
      case 'boat':
        this.canMoveOnWater = true;
        this.sprite.setTint(0x3399ff);
        break;
      case 'gun':
        this.maxBullets += 1;
        break;
      case 'star':
        this.maxBullets += 1;
        this.sprite.setTint(0xff00ff);
        break;
      case 'tank':
        this.health += 1;
        this.sprite.setTint(0x00ff00);
        break;
    }
  }

  removeBonus(bonusType) {
    switch (bonusType) {
      case 'helmet':
      case 'tank':
        this.health = Math.max(2, this.health - 1);
        this.sprite.clearTint();
        break;
      case 'boat':
        this.canMoveOnWater = false;
        this.sprite.clearTint();
        break;
      case 'gun':
      case 'star':
        this.maxBullets = Math.max(2, this.maxBullets - 1);
        this.sprite.clearTint();
        break;
    }
  }

  takeDamage() {
    this.health -= 1;
    return this.health <= 0;
  }

  resetBonuses() {
    this.health = 2;
    this.canMoveOnWater = false;
    this.maxBullets = 2;
    this.activeBullets = 0;
    this.sprite.clearTint();
  }
}
