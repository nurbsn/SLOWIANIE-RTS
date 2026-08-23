/**
 * Projectile - Obsługa pocisków w locie (strzały łuczników, pociski wież, pioruny kapłana).
 */
export class Projectile {
  constructor(startX, startY, targetEntity, damage, ownerId, type = 'arrow') {
    this.x = startX;
    this.y = startY;
    this.target = targetEntity;
    this.targetPos = { x: targetEntity.x, y: targetEntity.y };
    this.damage = damage;
    this.ownerId = ownerId;
    this.type = type;
    this.speed = type === 'arrow' ? 240 : 320; // Px/s
    this.isDead = false;
    this.rotation = 0;
  }

  update(deltaTime, gameEngine) {
    if (this.isDead) return;

    if (this.target && this.target.isAlive) {
      this.targetPos.x = this.target.x;
      this.targetPos.y = this.target.y;
    }

    const dx = this.targetPos.x - this.x;
    const dy = this.targetPos.y - this.y;
    const dist = Math.hypot(dx, dy);

    this.rotation = Math.atan2(dy, dx);
    const step = this.speed * deltaTime;

    if (dist <= step || dist < 8) {
      this.isDead = true;
      this._onHit(gameEngine);
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  _onHit(gameEngine) {
    if (this.target && this.target.isAlive) {
      const dmg = this.target.takeDamage(this.damage);
      gameEngine.particles.spawnBlood(this.target.x, this.target.y);
      gameEngine.particles.spawnFloatingText(this.target.x, this.target.y - 12, `-${dmg}`, '#ff4444');
    }
  }
}

export class ProjectileManager {
  constructor() {
    this.projectiles = [];
  }

  spawnArrow(startX, startY, target, damage, ownerId) {
    this.projectiles.push(new Projectile(startX, startY, target, damage, ownerId, 'arrow'));
  }

  spawnSpellBolt(startX, startY, target, damage, ownerId) {
    this.projectiles.push(new Projectile(startX, startY, target, damage, ownerId, 'spell'));
  }

  update(deltaTime, gameEngine) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(deltaTime, gameEngine);
      if (p.isDead) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  clear() {
    this.projectiles = [];
  }
}
