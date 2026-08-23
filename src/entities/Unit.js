import { Entity } from './Entity.js';
import { TILE_TYPES } from '../world/Map.js';

export const UNIT_TYPES = {
  KROWA: 'krowa',
  KMIEC: 'kmiec',
  WOJ: 'woj',
  LUCZNIK: 'lucznik',
  KONNY: 'konny',
  KAPLAN: 'kaplan',
  WILK: 'wilk'
};

export const UNIT_CONFIGS = {
  [UNIT_TYPES.KROWA]: {
    name: 'Krowa',
    hp: 120,
    armor: 0,
    speed: 0.8,
    radius: 12,
    sight: 4,
    cost: { milk: 40, wood: 0, gold: 0 },
    isNeutralAnimal: true
  },
  [UNIT_TYPES.KMIEC]: {
    name: 'Kmieć',
    hp: 80,
    armor: 0,
    damage: 6,
    attackRange: 24,
    attackCooldown: 1.2,
    speed: 1.8,
    radius: 10,
    sight: 6,
    cost: { milk: 50, wood: 0, gold: 0 }
  },
  [UNIT_TYPES.WOJ]: {
    name: 'Woj Tarczownik',
    hp: 180,
    armor: 3,
    damage: 16,
    attackRange: 26,
    attackCooldown: 1.0,
    speed: 1.6,
    radius: 11,
    sight: 7,
    cost: { milk: 80, wood: 20, gold: 10 }
  },
  [UNIT_TYPES.LUCZNIK]: {
    name: 'Łucznik',
    hp: 90,
    armor: 1,
    damage: 12,
    attackRange: 160,
    attackCooldown: 1.4,
    speed: 1.7,
    radius: 10,
    sight: 8,
    cost: { milk: 70, wood: 50, gold: 0 }
  },
  [UNIT_TYPES.KONNY]: {
    name: 'Konny Wojownik',
    hp: 240,
    armor: 4,
    damage: 22,
    attackRange: 30,
    attackCooldown: 1.1,
    speed: 2.7,
    radius: 14,
    sight: 8,
    cost: { milk: 120, wood: 40, gold: 35 }
  },
  [UNIT_TYPES.KAPLAN]: {
    name: 'Żerca / Kapłan',
    hp: 110,
    armor: 0,
    damage: 8,
    attackRange: 130,
    attackCooldown: 1.5,
    mana: 100,
    maxMana: 100,
    manaRegen: 3.0,
    speed: 1.5,
    radius: 10,
    sight: 8,
    cost: { milk: 100, wood: 50, gold: 60, faith: 20 }
  },
  [UNIT_TYPES.WILK]: {
    name: 'Dzikie Wilczysko',
    hp: 75,
    armor: 1,
    damage: 14,
    attackRange: 22,
    attackCooldown: 0.9,
    speed: 2.6,
    radius: 9,
    sight: 6,
    cost: { faith: 30 }
  }
};

export const UNIT_STATES = {
  IDLE: 'idle',
  MOVING: 'moving',
  ATTACKING: 'attacking',
  ATTACK_MOVE: 'attack_move',
  GATHER_WOOD: 'gather_wood',
  GATHER_GOLD: 'gather_gold',
  GATHER_MILK: 'gather_milk',
  RETURNING_RESOURCE: 'returning_resource',
  BUILDING: 'building',
  REPAIRING: 'repairing',
  GRAZING: 'grazing',
  CASTING: 'casting'
};

export class Unit extends Entity {
  constructor(ownerId, unitType, x, y) {
    const config = UNIT_CONFIGS[unitType] || UNIT_CONFIGS[UNIT_TYPES.KMIEC];
    super(ownerId, x, y, config.radius);

    this.unitType = unitType;
    this.name = config.name;
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.armor = config.armor || 0;
    this.speed = config.speed;
    this.damage = config.damage || 0;
    this.attackRange = config.attackRange || 24;
    this.attackCooldown = config.attackCooldown || 1.0;
    this.currentCooldown = 0;
    this.sightRadius = config.sight;

    // Magia
    this.mana = config.mana || 0;
    this.maxMana = config.maxMana || 0;
    this.manaRegen = config.manaRegen || 0;

    // Stan i zachowanie
    this.state = UNIT_STATES.IDLE;
    this.path = [];
    this.targetEntity = null;
    this.targetTile = null;
    this.destination = null;

    // Surowce niesione przez jednostkę (Kmieć)
    this.carriedResourceType = null;
    this.carriedAmount = 0;
    this.maxCarriedAmount = 20;

    // Mechanika Krowy (Polanie)
    this.milkStored = 25; // Zapas mleka w krowie
    this.maxMilkStored = 60;
    this.grazeTimer = 0;
    this.grazeDuration = 4.0; // Sekund żucia trawy
    this.wanderTimer = Math.random() * 5 + 3;

    // Animacja
    this.facingAngle = 0;
    this.walkAnimTimer = 0;
  }

  update(deltaTime, gameEngine) {
    if (!this.isAlive) return;

    // Regeneracja many dla kapłana
    if (this.maxMana > 0 && this.mana < this.maxMana) {
      this.mana = Math.min(this.maxMana, this.mana + this.manaRegen * deltaTime);
    }

    // Cooldown ataku
    if (this.currentCooldown > 0) {
      this.currentCooldown -= deltaTime;
    }

    // Zachowanie krowy
    if (this.unitType === UNIT_TYPES.KROWA) {
      this._updateCowBehavior(deltaTime, gameEngine);
      return;
    }

    // Maszyna stanów dla pozostałych jednostek
    switch (this.state) {
      case UNIT_STATES.IDLE:
        this._handleIdle(gameEngine);
        break;
      case UNIT_STATES.MOVING:
        this._handleMoving(deltaTime, gameEngine);
        break;
      case UNIT_STATES.ATTACK_MOVE:
        this._handleAttackMove(deltaTime, gameEngine);
        break;
      case UNIT_STATES.ATTACKING:
        this._handleAttacking(deltaTime, gameEngine);
        break;
      case UNIT_STATES.GATHER_WOOD:
        this._handleGatherWood(deltaTime, gameEngine);
        break;
      case UNIT_STATES.GATHER_GOLD:
        this._handleGatherGold(deltaTime, gameEngine);
        break;
      case UNIT_STATES.GATHER_MILK:
        this._handleGatherMilk(deltaTime, gameEngine);
        break;
      case UNIT_STATES.RETURNING_RESOURCE:
        this._handleReturningResource(deltaTime, gameEngine);
        break;
      case UNIT_STATES.BUILDING:
        this._handleBuilding(deltaTime, gameEngine);
        break;
    }
  }

  // --- LOGIKA KRÓW (POLANIE VIBES) ---
  _updateCowBehavior(deltaTime, gameEngine) {
    this.grazeTimer += deltaTime;
    this.wanderTimer -= deltaTime;

    // Jeśli krowa stoi na soczystej trawie, zjada ją i produkuje mleko
    const currentTile = gameEngine.map.getTile(this.tileX, this.tileY);
    if (currentTile === TILE_TYPES.GRASS) {
      if (this.grazeTimer >= this.grazeDuration) {
        this.grazeTimer = 0;
        const grazed = gameEngine.map.grazeTile(this.tileX, this.tileY);
        if (grazed) {
          this.milkStored = Math.min(this.maxMilkStored, this.milkStored + 15);
          gameEngine.particles.spawnFloatingText(this.x, this.y - 12, '+15 Mleko', '#ffffff');
          // Jeśli krowa należy do gracza i jest blisko obory, automatycznie przekazuje mleko!
          const nearbyObora = gameEngine.findNearestBuilding(this.ownerId, this.x, this.y, 'obora', 160);
          if (nearbyObora && this.ownerId >= 0) {
            const player = gameEngine.players[this.ownerId];
            if (player) {
              player.addMilk(this.milkStored);
              this.milkStored = 0;
              gameEngine.sounds.playMoo();
            }
          }
        }
      }
    }

    // Powolne pasterskie wędrowanie
    if (this.wanderTimer <= 0) {
      this.wanderTimer = Math.random() * 8 + 4;
      const rx = this.tileX + Math.floor(Math.random() * 7 - 3);
      const ry = this.tileY + Math.floor(Math.random() * 7 - 3);
      if (gameEngine.map.isWalkable(rx, ry)) {
        this.moveToTile(rx, ry, gameEngine);
      }
    }

    if (this.path.length > 0) {
      this._moveAlongPath(deltaTime, gameEngine);
    }
  }

  _handleIdle(gameEngine) {
    // Automatyczne wykrywanie wrogów w zasięgu wzroku dla jednostek bojowych
    if (this.damage > 0 && this.ownerId >= 0) {
      const enemy = gameEngine.findNearestEnemy(this.ownerId, this.x, this.y, this.sightRadius * 32);
      if (enemy) {
        this.attackTarget(enemy, gameEngine);
      }
    }
  }

  _handleMoving(deltaTime, gameEngine) {
    if (this.path.length === 0) {
      this.state = UNIT_STATES.IDLE;
      return;
    }
    this._moveAlongPath(deltaTime, gameEngine);
  }

  _handleAttackMove(deltaTime, gameEngine) {
    const enemy = gameEngine.findNearestEnemy(this.ownerId, this.x, this.y, this.sightRadius * 32);
    if (enemy) {
      this.attackTarget(enemy, gameEngine);
      return;
    }
    if (this.path.length === 0) {
      this.state = UNIT_STATES.IDLE;
      return;
    }
    this._moveAlongPath(deltaTime, gameEngine);
  }

  _handleAttacking(deltaTime, gameEngine) {
    if (!this.targetEntity || !this.targetEntity.isAlive) {
      this.targetEntity = null;
      this.state = UNIT_STATES.IDLE;
      return;
    }

    const dist = this.distanceTo(this.targetEntity);

    if (dist > this.attackRange) {
      // Podejdź do celu
      this.moveToPoint(this.targetEntity.x, this.targetEntity.y, gameEngine);
      this._moveAlongPath(deltaTime, gameEngine);
    } else {
      // W zasięgu ataku - atakuj
      this.path = [];
      this.facingAngle = Math.atan2(this.targetEntity.y - this.y, this.targetEntity.x - this.x);

      if (this.currentCooldown <= 0) {
        this.currentCooldown = this.attackCooldown;
        this._performAttack(this.targetEntity, gameEngine);
      }
    }
  }

  _performAttack(target, gameEngine) {
    if (this.unitType === UNIT_TYPES.LUCZNIK) {
      // Wystrzelenie strzały
      gameEngine.projectiles.spawnArrow(this.x, this.y, target, this.damage, this.ownerId);
      gameEngine.sounds.playBowShoot();
    } else if (this.unitType === UNIT_TYPES.KAPLAN) {
      // Magiczny pocisk
      gameEngine.projectiles.spawnSpellBolt(this.x, this.y, target, this.damage, this.ownerId);
      gameEngine.sounds.playThunderSpell();
    } else {
      // Atak wręcz
      const dmgDealt = target.takeDamage(this.damage);
      gameEngine.particles.spawnBlood(target.x, target.y);
      gameEngine.particles.spawnFloatingText(target.x, target.y - 10, `-${dmgDealt}`, '#ff3333');
      gameEngine.sounds.playSwordHit();
    }
  }

  _handleGatherWood(deltaTime, gameEngine) {
    if (!this.targetTile) {
      this.state = UNIT_STATES.IDLE;
      return;
    }

    const tileX = this.targetTile.x;
    const tileY = this.targetTile.y;
    const targetPx = tileX * 32 + 16;
    const targetPy = tileY * 32 + 16;
    const dist = Math.hypot(this.x - targetPx, this.y - targetPy);

    if (dist > 36) {
      this.moveToPoint(targetPx, targetPy, gameEngine);
      this._moveAlongPath(deltaTime, gameEngine);
    } else {
      // W zasięgu drzewa - rąb drewno
      if (this.currentCooldown <= 0) {
        this.currentCooldown = 1.0;
        const woodGained = gameEngine.map.harvestWood(tileX, tileY, 5);
        if (woodGained > 0) {
          this.carriedResourceType = 'wood';
          this.carriedAmount += woodGained;
          gameEngine.sounds.playChopWood();
          gameEngine.particles.spawnWoodSplinters(targetPx, targetPy);

          if (this.carriedAmount >= this.maxCarriedAmount) {
            this._returnToDepot(gameEngine);
          }
        } else {
          // Drzewo wycięte - szukaj kolejnego w pobliżu
          const nearbyForest = gameEngine.findNearestForest(tileX, tileY);
          if (nearbyForest) {
            this.targetTile = nearbyForest;
          } else {
            this._returnToDepot(gameEngine);
          }
        }
      }
    }
  }

  _handleGatherGold(deltaTime, gameEngine) {
    if (!this.targetTile) {
      this.state = UNIT_STATES.IDLE;
      return;
    }
    const tileX = this.targetTile.x;
    const tileY = this.targetTile.y;
    const targetPx = tileX * 32 + 16;
    const targetPy = tileY * 32 + 16;
    const dist = Math.hypot(this.x - targetPx, this.y - targetPy);

    if (dist > 36) {
      this.moveToPoint(targetPx, targetPy, gameEngine);
      this._moveAlongPath(deltaTime, gameEngine);
    } else {
      if (this.currentCooldown <= 0) {
        this.currentCooldown = 1.2;
        const goldGained = gameEngine.map.harvestGold(tileX, tileY, 4);
        if (goldGained > 0) {
          this.carriedResourceType = 'gold';
          this.carriedAmount += goldGained;
          gameEngine.sounds.playSwordHit();

          if (this.carriedAmount >= this.maxCarriedAmount) {
            this._returnToDepot(gameEngine);
          }
        } else {
          this._returnToDepot(gameEngine);
        }
      }
    }
  }

  _handleGatherMilk(deltaTime, gameEngine) {
    if (!this.targetEntity || !this.targetEntity.isAlive || this.targetEntity.unitType !== UNIT_TYPES.KROWA) {
      this._returnToDepot(gameEngine);
      return;
    }

    const cow = this.targetEntity;
    const dist = this.distanceTo(cow);

    if (dist > 30) {
      this.moveToPoint(cow.x, cow.y, gameEngine);
      this._moveAlongPath(deltaTime, gameEngine);
    } else {
      // Dojenie krowy
      if (this.currentCooldown <= 0) {
        this.currentCooldown = 1.0;
        const milkMilk = Math.min(cow.milkStored, 15);
        if (milkMilk > 0) {
          cow.milkStored -= milkMilk;
          this.carriedResourceType = 'milk';
          this.carriedAmount += milkMilk;
          gameEngine.sounds.playMoo();
          gameEngine.particles.spawnFloatingText(this.x, this.y - 10, `+${milkMilk} Mleko`, '#ffffff');
          if (this.carriedAmount >= this.maxCarriedAmount) {
            this._returnToDepot(gameEngine);
          }
        } else {
          this._returnToDepot(gameEngine);
        }
      }
    }
  }

  _returnToDepot(gameEngine) {
    const depot = gameEngine.findNearestDropoff(this.ownerId, this.x, this.y, this.carriedResourceType);
    if (depot) {
      this.targetEntity = depot;
      this.state = UNIT_STATES.RETURNING_RESOURCE;
      this.moveToPoint(depot.x, depot.y, gameEngine);
    } else {
      this.state = UNIT_STATES.IDLE;
    }
  }

  _handleReturningResource(deltaTime, gameEngine) {
    if (!this.targetEntity || !this.targetEntity.isAlive) {
      this.state = UNIT_STATES.IDLE;
      return;
    }

    const dist = this.distanceTo(this.targetEntity);
    if (dist > 45) {
      this.moveToPoint(this.targetEntity.x, this.targetEntity.y, gameEngine);
      this._moveAlongPath(deltaTime, gameEngine);
    } else {
      // Oddanie surowca
      const player = gameEngine.players[this.ownerId];
      if (player && this.carriedAmount > 0) {
        if (this.carriedResourceType === 'wood') player.addWood(this.carriedAmount);
        if (this.carriedResourceType === 'gold') player.addGold(this.carriedAmount);
        if (this.carriedResourceType === 'milk') player.addMilk(this.carriedAmount);
        gameEngine.particles.spawnFloatingText(this.x, this.y - 12, `+${this.carriedAmount}`, '#ffff55');
      }
      this.carriedAmount = 0;
      this.carriedResourceType = null;

      // Powrót do poprzedniej pracy
      if (this.targetTile) {
        const tile = gameEngine.map.getTile(this.targetTile.x, this.targetTile.y);
        if (tile === TILE_TYPES.FOREST) {
          this.state = UNIT_STATES.GATHER_WOOD;
        } else if (tile === TILE_TYPES.GOLD) {
          this.state = UNIT_STATES.GATHER_GOLD;
        } else {
          this.state = UNIT_STATES.IDLE;
        }
      } else {
        this.state = UNIT_STATES.IDLE;
      }
    }
  }

  _handleBuilding(deltaTime, gameEngine) {
    if (!this.targetEntity || !this.targetEntity.isAlive || this.targetEntity.isConstructed) {
      this.targetEntity = null;
      this.state = UNIT_STATES.IDLE;
      return;
    }

    const bld = this.targetEntity;
    const dist = this.distanceTo(bld);

    if (dist > 48) {
      this.moveToPoint(bld.x, bld.y, gameEngine);
      this._moveAlongPath(deltaTime, gameEngine);
    } else {
      // Budowanie
      bld.advanceConstruction(deltaTime * 25);
      gameEngine.sounds.playChopWood();
      gameEngine.particles.spawnDust(this.x, this.y);
      if (bld.isConstructed) {
        this.state = UNIT_STATES.IDLE;
      }
    }
  }

  // --- RUCH I NAWIGACJA ---
  moveToTile(tx, ty, gameEngine) {
    this.targetTile = { x: tx, y: ty };
    this.targetEntity = null;
    this.path = gameEngine.pathfinding.findPath(this.tileX, this.tileY, tx, ty);
    if (this.path.length > 0) {
      // Usuń aktualny kafelek z początku ścieżki
      if (this.path[0].x === this.tileX && this.path[0].y === this.tileY) {
        this.path.shift();
      }
      this.state = UNIT_STATES.MOVING;
    }
  }

  moveToPoint(worldX, worldY, gameEngine) {
    const tx = Math.floor(worldX / 32);
    const ty = Math.floor(worldY / 32);
    this.moveToTile(tx, ty, gameEngine);
  }

  attackTarget(target, gameEngine) {
    this.targetEntity = target;
    this.state = UNIT_STATES.ATTACKING;
  }

  _moveAlongPath(deltaTime, gameEngine) {
    if (this.path.length === 0) return;

    const nextNode = this.path[0];
    const targetPx = nextNode.x * 32 + 16;
    const targetPy = nextNode.y * 32 + 16;

    const dx = targetPx - this.x;
    const dy = targetPy - this.y;
    const dist = Math.hypot(dx, dy);

    this.facingAngle = Math.atan2(dy, dx);
    this.walkAnimTimer += deltaTime * 8;

    const step = this.speed * 32 * deltaTime;

    if (dist <= step) {
      this.x = targetPx;
      this.y = targetPy;
      this.path.shift();
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }
}
