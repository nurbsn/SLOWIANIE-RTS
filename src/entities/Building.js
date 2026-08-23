import { Entity } from './Entity.js';
import { UNIT_TYPES } from './Unit.js';

export const BUILDING_TYPES = {
  GROD: 'grod',
  DRWAL: 'drwal',
  OBORA: 'obora',
  KOSZARY: 'koszary',
  SWIATYNIA: 'swiatynia',
  WIEZA: 'wieza',
  PALISADA: 'palisada'
};

export const BUILDING_CONFIGS = {
  [BUILDING_TYPES.GROD]: {
    name: 'Gród (Ratusz)',
    hp: 1200,
    armor: 5,
    widthTiles: 2,
    heightTiles: 2,
    sight: 9,
    providesPop: 10,
    cost: { milk: 0, wood: 200, gold: 0 },
    trainableUnits: [UNIT_TYPES.KMIEC],
    spriteKey: 'bld_grod',
    isDropoff: ['wood', 'gold', 'milk']
  },
  [BUILDING_TYPES.DRWAL]: {
    name: 'Chata Drwala',
    hp: 400,
    armor: 2,
    widthTiles: 2,
    heightTiles: 2,
    sight: 6,
    cost: { milk: 0, wood: 80, gold: 0 },
    trainableUnits: [],
    spriteKey: 'bld_drwal',
    isDropoff: ['wood']
  },
  [BUILDING_TYPES.OBORA]: {
    name: 'Obora dla Krów',
    hp: 500,
    armor: 2,
    widthTiles: 2,
    heightTiles: 2,
    sight: 6,
    providesPop: 5,
    cost: { milk: 30, wood: 100, gold: 0 },
    trainableUnits: [UNIT_TYPES.KROWA],
    spriteKey: 'bld_obora',
    isDropoff: ['milk']
  },
  [BUILDING_TYPES.KOSZARY]: {
    name: 'Chata Wojów (Koszary)',
    hp: 700,
    armor: 4,
    widthTiles: 2,
    heightTiles: 2,
    sight: 7,
    cost: { milk: 50, wood: 140, gold: 30 },
    trainableUnits: [UNIT_TYPES.WOJ, UNIT_TYPES.LUCZNIK, UNIT_TYPES.KONNY],
    spriteKey: 'bld_koszary'
  },
  [BUILDING_TYPES.SWIATYNIA]: {
    name: 'Świątynia Światowida',
    hp: 600,
    armor: 3,
    widthTiles: 2,
    heightTiles: 2,
    sight: 8,
    faithGenRate: 1.5, // 1.5 punktu wiary na sekundę
    cost: { milk: 60, wood: 160, gold: 60 },
    trainableUnits: [UNIT_TYPES.KAPLAN],
    spriteKey: 'bld_swiatynia'
  },
  [BUILDING_TYPES.WIEZA]: {
    name: 'Wieża Strażnicza',
    hp: 450,
    armor: 4,
    widthTiles: 1,
    heightTiles: 1,
    sight: 10,
    damage: 10,
    attackRange: 200,
    attackCooldown: 1.2,
    cost: { milk: 0, wood: 90, gold: 20 },
    trainableUnits: [],
    spriteKey: 'bld_wieza'
  },
  [BUILDING_TYPES.PALISADA]: {
    name: 'Palisada Drewniana',
    hp: 300,
    armor: 5,
    widthTiles: 1,
    heightTiles: 1,
    sight: 3,
    cost: { milk: 0, wood: 15, gold: 0 },
    trainableUnits: [],
    spriteKey: 'bld_palisada'
  }
};

export class Building extends Entity {
  constructor(ownerId, buildingType, tileX, tileY, isCompleted = true) {
    const config = BUILDING_CONFIGS[buildingType] || BUILDING_CONFIGS[BUILDING_TYPES.GROD];
    const widthPx = config.widthTiles * 32;
    const heightPx = config.heightTiles * 32;
    const centerX = tileX * 32 + widthPx / 2;
    const centerY = tileY * 32 + heightPx / 2;

    super(ownerId, centerX, centerY, Math.max(widthPx, heightPx) / 2);

    this.buildingType = buildingType;
    this.name = config.name;
    this.widthTiles = config.widthTiles;
    this.heightTiles = config.heightTiles;
    this.originTileX = tileX;
    this.originTileY = tileY;
    this.maxHp = config.hp;
    this.hp = isCompleted ? config.hp : Math.floor(config.hp * 0.1);
    this.armor = config.armor;
    this.sightRadius = config.sight;

    this.isConstructed = isCompleted;
    this.constructionProgress = isCompleted ? 100 : 10; // 0-100%

    // Produkcja jednostek
    this.trainableUnits = config.trainableUnits || [];
    this.productionQueue = []; // [{unitType, progress, totalTime}]
    this.rallyPoint = { x: centerX, y: centerY + heightPx / 2 + 20 };

    // Atak wieży
    this.damage = config.damage || 0;
    this.attackRange = config.attackRange || 0;
    this.attackCooldown = config.attackCooldown || 1.0;
    this.currentCooldown = 0;

    // Punkty zrzutu surowców
    this.isDropoff = config.isDropoff || [];
    this.faithGenRate = config.faithGenRate || 0;
  }

  advanceConstruction(amount) {
    if (this.isConstructed) return;
    this.constructionProgress = Math.min(100, this.constructionProgress + amount);
    this.hp = Math.floor((this.constructionProgress / 100) * this.maxHp);
    if (this.constructionProgress >= 100) {
      this.isConstructed = true;
      this.hp = this.maxHp;
    }
  }

  queueUnit(unitType) {
    if (!this.isConstructed) return false;
    if (!this.trainableUnits.includes(unitType)) return false;
    if (this.productionQueue.length >= 5) return false; // Max 5 w kolejce

    const trainTimes = {
      [UNIT_TYPES.KMIEC]: 8,
      [UNIT_TYPES.KROWA]: 10,
      [UNIT_TYPES.WOJ]: 14,
      [UNIT_TYPES.LUCZNIK]: 12,
      [UNIT_TYPES.KONNY]: 18,
      [UNIT_TYPES.KAPLAN]: 22
    };

    const totalTime = trainTimes[unitType] || 10;
    this.productionQueue.push({ unitType, progress: 0, totalTime });
    return true;
  }

  cancelQueueIndex(index) {
    if (index >= 0 && index < this.productionQueue.length) {
      return this.productionQueue.splice(index, 1)[0];
    }
    return null;
  }

  update(deltaTime, gameEngine) {
    if (!this.isAlive) return;

    // Generowanie wiary (Świątynia)
    if (this.isConstructed && this.faithGenRate > 0 && this.ownerId >= 0) {
      const player = gameEngine.players[this.ownerId];
      if (player) {
        player.addFaith(this.faithGenRate * deltaTime);
      }
    }

    // Obsługa kolejki produkcji
    if (this.isConstructed && this.productionQueue.length > 0) {
      const currentItem = this.productionQueue[0];
      currentItem.progress += deltaTime;

      if (currentItem.progress >= currentItem.totalTime) {
        // Jednostka gotowa!
        this.productionQueue.shift();
        const spawnX = this.rallyPoint.x;
        const spawnY = this.rallyPoint.y;
        gameEngine.spawnUnit(this.ownerId, currentItem.unitType, spawnX, spawnY);
        gameEngine.sounds.playOrderConfirm();
      }
    }

    // Automatyczny ostrzał wieży obronnej
    if (this.isConstructed && this.damage > 0 && this.ownerId >= 0) {
      if (this.currentCooldown > 0) {
        this.currentCooldown -= deltaTime;
      } else {
        const enemy = gameEngine.findNearestEnemy(this.ownerId, this.x, this.y, this.attackRange);
        if (enemy) {
          this.currentCooldown = this.attackCooldown;
          gameEngine.projectiles.spawnArrow(this.x, this.y - 14, enemy, this.damage, this.ownerId);
          gameEngine.sounds.playBowShoot();
        }
      }
    }
  }
}
