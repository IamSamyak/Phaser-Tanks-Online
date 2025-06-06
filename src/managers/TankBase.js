export default class TankBase {
  constructor(sprite) {
    this.sprite = sprite;

    // Default properties shared by all tanks
    this.health = 2;              // Number of bullets the tank can survive
    this.canMoveOnWater = false;  // Whether the tank can move on water tiles
    this.maxBullets = 2;          // Maximum bullets that can be fired at a time
    this.activeBullets = 0;       // Current number of bullets in play
  }

  applyBonus(bonusType) {
    switch (bonusType) {
      case 'helmet':
        this.health += 1;
        this.sprite.setTint(0xffff00); // Yellow glow
        break;

      case 'boat':
        this.canMoveOnWater = true;
        this.sprite.setTint(0x3399ff); // Blue glow
        break;

      case 'gun':
        this.maxBullets += 1;
        break;

      case 'star':
        this.maxBullets += 1;
        this.sprite.setTint(0xff00ff); // Purple glow
        break;

      case 'tank':
        this.health += 1;
        this.sprite.setTint(0x00ff00); // Green glow
        break;

      // Add other bonuses here
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

      // Add expiration logic for other bonuses if needed
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
