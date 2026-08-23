/**
 * Entity - Bazowa klasa dla wszystkich obiektów w grze (jednostki, budynki, zasoby).
 */
let nextEntityId = 1;

export class Entity {
  constructor(ownerId, x, y, radius = 12) {
    this.id = nextEntityId++;
    this.ownerId = ownerId; // 0 = gracz 1, 1 = gracz 2, -1 = neutralny / dziki
    this.x = x; // Pozycja w pikselach świata
    this.y = y;
    this.radius = radius;
    this.hp = 100;
    this.maxHp = 100;
    this.armor = 0;
    this.sightRadius = 6; // Promień pola widzenia w kafelkach
    this.isAlive = true;
    this.isSelected = false;
    this.type = 'entity';
    this.name = 'Obiekt';
  }

  get tileX() {
    return Math.floor(this.x / 32);
  }

  get tileY() {
    return Math.floor(this.y / 32);
  }

  takeDamage(amount, damageType = 'physical') {
    if (!this.isAlive) return 0;
    const actualDamage = Math.max(1, amount - this.armor);
    this.hp -= actualDamage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
      this.onDeath();
    }
    return actualDamage;
  }

  heal(amount) {
    if (!this.isAlive) return 0;
    const oldHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - oldHp;
  }

  onDeath() {
    // Nadpisywane przez podklasy
  }

  distanceTo(otherEntity) {
    return Math.hypot(this.x - otherEntity.x, this.y - otherEntity.y);
  }

  distanceToPoint(px, py) {
    return Math.hypot(this.x - px, this.y - py);
  }
}
