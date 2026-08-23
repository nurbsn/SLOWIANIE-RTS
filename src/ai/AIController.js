import { UNIT_TYPES, UNIT_STATES } from '../entities/Unit.js';
import { BUILDING_TYPES } from '../entities/Building.js';
import { AI_PRESETS } from './AIPresets.js';
import { AIScriptEngine } from './AIScriptEngine.js';
import { TechTree } from '../gameplay/TechTree.js';
import { SpellSystem } from '../gameplay/SpellSystem.js';

/**
 * AIController - Mózg bota AI zarządzający ekonomią, bazą, armią i taktyką w czasie rzeczywistym.
 */
export class AIController {
  constructor(playerId, gameEngine, preset = AI_PRESETS.BALANCED) {
    this.playerId = playerId;
    this.gameEngine = gameEngine;
    this.preset = preset;
    this.scriptEngine = new AIScriptEngine();
    this.scriptEngine.parseAndLoad(this.scriptEngine.getDefaultScript());

    this.thinkInterval = 1.0; // Myślenie co 1 sekundę
    this.thinkTimer = Math.random() * 0.5; // Rozproszenie czasu klatek

    this.baseX = 0;
    this.baseY = 0;
    this.hasBase = false;

    this.isAttacking = false;
  }

  get player() {
    return this.gameEngine.players[this.playerId];
  }

  update(deltaTime) {
    if (!this.player || this.player.isDefeated) return;

    this.thinkTimer += deltaTime;
    if (this.thinkTimer >= this.thinkInterval) {
      this.thinkTimer = 0;
      this._think();
    }
  }

  _think() {
    this._locateBase();
    if (!this.hasBase) return;

    // 1. Wykonaj skrypty użytkownika / domyślne
    this.scriptEngine.execute(this, this.player, this.gameEngine);

    // 2. Zarządzanie robotnikami (Kmieciami)
    this._manageWorkers();

    // 3. Rozbudowa bazy
    this._manageBaseBuilding();

    // 4. Rekrutacja wojska
    this._manageMilitaryProduction();

    // 5. Taktyka armii i czary kapłanów
    this._manageCombatUnits();
  }

  _locateBase() {
    const mainGrod = this.gameEngine.buildings.find(b => b.ownerId === this.playerId && b.buildingType === BUILDING_TYPES.GROD && b.isAlive);
    if (mainGrod) {
      this.baseX = mainGrod.x;
      this.baseY = mainGrod.y;
      this.hasBase = true;
    } else {
      const anyBld = this.gameEngine.buildings.find(b => b.ownerId === this.playerId && b.isAlive);
      if (anyBld) {
        this.baseX = anyBld.x;
        this.baseY = anyBld.y;
        this.hasBase = true;
      }
    }
  }

  _manageWorkers() {
    const workers = this.gameEngine.units.filter(u => u.ownerId === this.playerId && u.unitType === UNIT_TYPES.KMIEC && u.isAlive);
    const targetWorkers = Math.min(18, Math.floor(this.player.maxPop * this.preset.workerRatio + 3));

    // Szkolenie kmieci w grodzie
    if (workers.length < targetWorkers && this.player.milk >= 50 && this.player.currentPop < this.player.maxPop) {
      const grod = this.gameEngine.buildings.find(b => b.ownerId === this.playerId && b.buildingType === BUILDING_TYPES.GROD && b.isConstructed);
      if (grod && grod.productionQueue.length === 0) {
        if (this.player.payCost({ milk: 50 })) {
          grod.queueUnit(UNIT_TYPES.KMIEC);
        }
      }
    }

    // Przydział bezczynnych kmieci do drewna lub krów
    const idleWorkers = workers.filter(u => u.state === UNIT_STATES.IDLE);
    for (const w of idleWorkers) {
      if (this.player.milk < 100) {
        // Idź doić krowę
        const cow = this.gameEngine.findNearestEntity(w.x, w.y, e => e.unitType === UNIT_TYPES.KROWA && e.isAlive);
        if (cow) {
          w.targetEntity = cow;
          w.state = UNIT_STATES.GATHER_MILK;
          w.moveToPoint(cow.x, cow.y, this.gameEngine);
          continue;
        }
      }

      // Idź rąbać drewno
      const forest = this.gameEngine.findNearestForest(w.tileX, w.tileY);
      if (forest) {
        w.targetTile = forest;
        w.state = UNIT_STATES.GATHER_WOOD;
        w.moveToTile(forest.x, forest.y, this.gameEngine);
      }
    }
  }

  _manageBaseBuilding() {
    // Sprawdź czy mamy kmiecia wolnego do budowania
    const workers = this.gameEngine.units.filter(u => u.ownerId === this.playerId && u.unitType === UNIT_TYPES.KMIEC && u.isAlive);
    if (workers.length === 0) return;

    // Najpierw dokończ budynki w trakcie budowy
    const unbuilt = this.gameEngine.buildings.find(b => b.ownerId === this.playerId && !b.isConstructed && b.isAlive);
    if (unbuilt) {
      const w = workers[0];
      if (w.state !== UNIT_STATES.BUILDING) {
        w.targetEntity = unbuilt;
        w.state = UNIT_STATES.BUILDING;
        w.moveToPoint(unbuilt.x, unbuilt.y, this.gameEngine);
      }
      return;
    }

    // Sprawdź kolejność budowania z profilu bota
    for (const bldType of this.preset.buildOrder) {
      const hasCount = this.gameEngine.buildings.filter(b => b.ownerId === this.playerId && b.buildingType === bldType && b.isAlive).length;
      const maxWanted = bldType === 'wieza' ? 3 : (bldType === 'obora' ? 2 : 1);

      if (hasCount < maxWanted) {
        const canBuild = TechTree.canBuildBuilding(this.player, bldType, this.gameEngine.buildings);
        if (canBuild.allowed) {
          this.tryBuildNearBase(bldType);
          break;
        }
      }
    }
  }

  tryBuildNearBase(buildingType) {
    const cost = TechTree.getBuildingCost(buildingType);
    if (!this.player.payCost(cost)) return false;

    // Szukanie wolnego miejsca na siatce w promieniu bazy
    const baseTx = Math.floor(this.baseX / 32);
    const baseTy = Math.floor(this.baseY / 32);

    for (let r = 3; r <= 8; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const tx = baseTx + dx;
          const ty = baseTy + dy;
          if (this.gameEngine.map.isBuildable(tx, ty, 2, 2)) {
            // Sprawdź czy brak innych jednostek/budynków w tym miejscu
            const px = tx * 32 + 32;
            const py = ty * 32 + 32;
            if (!this.gameEngine.getEntityAtPoint(px, py)) {
              // Postaw fundament
              const bld = this.gameEngine.spawnBuilding(this.playerId, buildingType, tx, ty, false);
              // Wyślij kmiecia do budowy
              const worker = this.gameEngine.units.find(u => u.ownerId === this.playerId && u.unitType === UNIT_TYPES.KMIEC && u.isAlive);
              if (worker) {
                worker.targetEntity = bld;
                worker.state = UNIT_STATES.BUILDING;
                worker.moveToPoint(bld.x, bld.y, this.gameEngine);
              }
              return true;
            }
          }
        }
      }
    }

    // Jeśli brak miejsca, zwróć surowce
    this.player.refundCost(cost);
    return false;
  }

  _manageMilitaryProduction() {
    if (this.player.currentPop >= this.player.maxPop) return;

    // Koszary
    const koszary = this.gameEngine.buildings.find(b => b.ownerId === this.playerId && b.buildingType === BUILDING_TYPES.KOSZARY && b.isConstructed);
    if (koszary && koszary.productionQueue.length < 2) {
      const preferred = this.preset.preferredUnits;
      const unitType = preferred[Math.floor(Math.random() * preferred.length)];

      if (unitType !== 'kaplan' && TechTree.canTrainUnit(this.player, unitType).allowed) {
        const cost = TechTree.getUnitCost(unitType);
        if (this.player.payCost(cost)) {
          koszary.queueUnit(unitType);
        }
      }
    }

    // Świątynia
    const swiatynia = this.gameEngine.buildings.find(b => b.ownerId === this.playerId && b.buildingType === BUILDING_TYPES.SWIATYNIA && b.isConstructed);
    if (swiatynia && swiatynia.productionQueue.length === 0) {
      if (TechTree.canTrainUnit(this.player, UNIT_TYPES.KAPLAN).allowed) {
        const cost = TechTree.getUnitCost(UNIT_TYPES.KAPLAN);
        if (this.player.payCost(cost)) {
          swiatynia.queueUnit(UNIT_TYPES.KAPLAN);
        }
      }
    }
  }

  _manageCombatUnits() {
    const army = this.getCombatUnits();

    // Rzucanie czarów przez kapłanów w bitwie
    const priests = army.filter(u => u.unitType === UNIT_TYPES.KAPLAN && u.mana >= 40);
    for (const p of priests) {
      const enemy = this.gameEngine.findNearestEnemy(this.playerId, p.x, p.y, 180);
      if (enemy) {
        if (p.mana >= 50 && Math.random() > 0.5) {
          SpellSystem.castSpell('przyzwanie_wilkow', p, enemy.x, enemy.y, this.gameEngine);
        } else {
          SpellSystem.castSpell('grom_peruna', p, enemy.x, enemy.y, this.gameEngine);
        }
      }
    }

    // Koordynacja ataku grupy
    if (!this.isAttacking && army.length >= this.preset.attackThreshold) {
      this.isAttacking = true;
      const enemyBase = this.findEnemyBase();
      if (enemyBase) {
        this.orderAttack(army, enemyBase.x, enemyBase.y);
      }
    } else if (this.isAttacking) {
      if (army.length < Math.floor(this.preset.attackThreshold * 0.4)) {
        // Za duże straty - odwrót do bazy
        this.isAttacking = false;
        for (const u of army) {
          u.moveToPoint(this.baseX, this.baseY, this.gameEngine);
        }
      }
    }
  }

  getCombatUnits() {
    return this.gameEngine.units.filter(u => u.ownerId === this.playerId && u.isAlive && u.unitType !== UNIT_TYPES.KMIEC && u.unitType !== UNIT_TYPES.KROWA);
  }

  getIdleWorkers() {
    return this.gameEngine.units.filter(u => u.ownerId === this.playerId && u.isAlive && u.unitType === UNIT_TYPES.KMIEC && u.state === UNIT_STATES.IDLE);
  }

  hasBuilding(bldType) {
    return this.gameEngine.buildings.some(b => b.ownerId === this.playerId && b.buildingType === bldType && b.isAlive);
  }

  findEnemyBase() {
    const enemyGrod = this.gameEngine.buildings.find(b => b.ownerId !== this.playerId && b.ownerId >= 0 && b.isAlive);
    if (enemyGrod) return { x: enemyGrod.x, y: enemyGrod.y };

    const enemyUnit = this.gameEngine.units.find(u => u.ownerId !== this.playerId && u.ownerId >= 0 && u.isAlive);
    if (enemyUnit) return { x: enemyUnit.x, y: enemyUnit.y };

    return null;
  }

  orderAttack(units, targetX, targetY) {
    for (const u of units) {
      u.state = UNIT_STATES.ATTACK_MOVE;
      u.moveToPoint(targetX, targetY, this.gameEngine);
    }
  }

  trainUnitFrom(buildingType, unitType) {
    const bld = this.gameEngine.buildings.find(b => b.ownerId === this.playerId && b.buildingType === buildingType && b.isConstructed);
    if (bld && bld.productionQueue.length < 3) {
      const cost = TechTree.getUnitCost(unitType);
      if (this.player.payCost(cost)) {
        bld.queueUnit(unitType);
      }
    }
  }
}
