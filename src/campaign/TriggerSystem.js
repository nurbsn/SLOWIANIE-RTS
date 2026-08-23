/**
 * TriggerSystem - System wyzwalaczy dla kampanii i misji (dialogi, posiłki, warunki zwycięstwa/porażki).
 */
export class TriggerSystem {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.triggers = [];
    this.activeDialog = null;
    this.onVictory = null;
    this.onDefeat = null;
  }

  loadTriggers(triggerDefinitions = []) {
    this.triggers = triggerDefinitions.map(t => ({
      ...t,
      fired: false
    }));
  }

  update(deltaTime) {
    if (!this.gameEngine.isRunning) return;

    for (const trig of this.triggers) {
      if (trig.fired && !trig.repeating) continue;

      if (this._checkCondition(trig)) {
        trig.fired = true;
        this._executeAction(trig);
      }
    }
  }

  _checkCondition(trig) {
    const p0 = this.gameEngine.players[0]; // Gracz

    switch (trig.type) {
      case 'time_elapsed':
        return this.gameEngine.gameTime >= trig.time;

      case 'collect_milk':
        return p0 && p0.milk >= trig.amount;

      case 'destroy_all_enemies': {
        const enemies = this.gameEngine.units.filter(u => u.ownerId !== 0 && u.ownerId !== -1 && u.isAlive);
        const enemyBlds = this.gameEngine.buildings.filter(b => b.ownerId !== 0 && b.ownerId !== -1 && b.isAlive);
        return enemies.length === 0 && enemyBlds.length === 0;
      }

      case 'destroy_target_building': {
        const target = this.gameEngine.buildings.find(b => b.id === trig.targetId || (b.ownerId === trig.targetOwner && b.buildingType === trig.buildingType));
        return !target || !target.isAlive;
      }

      case 'protect_entity': {
        const protectedE = this.gameEngine.units.find(u => u.id === trig.targetId) || this.gameEngine.buildings.find(b => b.id === trig.targetId);
        return !protectedE || !protectedE.isAlive; // Porażka jeśli zginie
      }

      case 'enter_zone': {
        for (const u of this.gameEngine.units) {
          if (u.ownerId === 0 && u.isAlive) {
            const dist = Math.hypot(u.x - trig.zoneX, u.y - trig.zoneY);
            if (dist <= trig.zoneRadius) return true;
          }
        }
        return false;
      }

      default:
        return false;
    }
  }

  _executeAction(trig) {
    switch (trig.action) {
      case 'dialog':
        this.showDialog(trig.speaker, trig.text, trig.portrait);
        break;

      case 'spawn_reinforcements':
        for (const unit of trig.units) {
          this.gameEngine.spawnUnit(trig.ownerId || 0, unit.type, trig.spawnX + (Math.random() * 40 - 20), trig.spawnY + (Math.random() * 40 - 20));
        }
        this.gameEngine.sounds.playOrderConfirm();
        this.gameEngine.particles.spawnMagicRing(trig.spawnX, trig.spawnY, '#00ffcc');
        break;

      case 'victory':
        if (this.onVictory) this.onVictory(trig.message || 'Zwycięstwo! Misja zakończona sukcesem.');
        break;

      case 'defeat':
        if (this.onDefeat) this.onDefeat(trig.message || 'Porażka! Twój gród upadł.');
        break;
    }
  }

  showDialog(speaker, text, portrait = 'woj') {
    this.activeDialog = { speaker, text, portrait, timer: 6.0 };
    this.gameEngine.sounds.playOrderConfirm();
  }

  dismissDialog() {
    this.activeDialog = null;
  }
}
