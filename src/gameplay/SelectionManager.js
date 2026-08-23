import { UNIT_TYPES, UNIT_STATES } from '../entities/Unit.js';
import { TILE_TYPES } from '../world/Map.js';

/**
 * SelectionManager - Zarządzanie zaznaczeniem myszą, prostokątem selekcji, grupami (1-9) i rozkazami.
 */
export class SelectionManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.selectedEntities = [];
    this.controlGroups = new Map(); // 1-9 -> array of entity IDs

    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragEnd = { x: 0, y: 0 };

    this.activeSpellToCast = null;
    this.activeBuildingToPlace = null;
  }

  get selectedUnits() {
    return this.selectedEntities.filter(e => e.type === 'unit' && e.isAlive);
  }

  get selectedBuildings() {
    return this.selectedEntities.filter(e => e.type === 'building' && e.isAlive);
  }

  clearSelection() {
    for (const e of this.selectedEntities) {
      e.isSelected = false;
    }
    this.selectedEntities = [];
  }

  selectSingle(entity, addToSelection = false) {
    if (!addToSelection) {
      this.clearSelection();
    }
    if (entity && entity.isAlive) {
      if (!this.selectedEntities.includes(entity)) {
        entity.isSelected = true;
        this.selectedEntities.push(entity);
      }
    }
  }

  handleBoxSelect(startWorldX, startWorldY, endWorldX, endWorldY, localPlayerId) {
    this.clearSelection();

    const minX = Math.min(startWorldX, endWorldX);
    const maxX = Math.max(startWorldX, endWorldX);
    const minY = Math.min(startWorldY, endWorldY);
    const maxY = Math.max(startWorldY, endWorldY);

    const isBox = (maxX - minX > 5) || (maxY - minY > 5);

    if (isBox) {
      // Zaznacz jednostki gracza wewnątrz prostokąta
      for (const u of this.gameEngine.units) {
        if (u.isAlive && u.ownerId === localPlayerId) {
          if (u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY) {
            u.isSelected = true;
            this.selectedEntities.push(u);
          }
        }
      }
      // Jeśli brak własnych, zaznacz krowy / zwierzęta
      if (this.selectedEntities.length === 0) {
        for (const u of this.gameEngine.units) {
          if (u.isAlive && u.unitType === UNIT_TYPES.KROWA) {
            if (u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY) {
              u.isSelected = true;
              this.selectedEntities.push(u);
            }
          }
        }
      }
    } else {
      // Pojedyncze kliknięcie
      const clickedEntity = this.gameEngine.getEntityAtPoint(startWorldX, startWorldY);
      if (clickedEntity) {
        this.selectSingle(clickedEntity);
      }
    }
  }

  // Wydawanie rozkazów prawym przyciskiem myszy
  handleRightClick(worldX, worldY, localPlayerId) {
    if (this.selectedEntities.length === 0) return;

    const targetEntity = this.gameEngine.getEntityAtPoint(worldX, worldY);
    const targetTx = Math.floor(worldX / 32);
    const targetTy = Math.floor(worldY / 32);
    const tileType = this.gameEngine.map.getTile(targetTx, targetTy);

    // Dźwięk potwierdzenia
    this.gameEngine.sounds.playOrderConfirm();

    // Dla budynków - ustaw punkt zborny (Rally Point)
    const buildings = this.selectedBuildings.filter(b => b.ownerId === localPlayerId);
    if (buildings.length > 0) {
      for (const b of buildings) {
        b.rallyPoint = { x: worldX, y: worldY };
        this.gameEngine.particles.spawnMagicRing(worldX, worldY, '#e5b822');
      }
      return;
    }

    const units = this.selectedUnits.filter(u => u.ownerId === localPlayerId);
    if (units.length === 0) return;

    // 1. Kliknięcie na wrogą jednostkę lub budynek -> ATAK
    if (targetEntity && targetEntity.ownerId !== localPlayerId && targetEntity.ownerId !== -1) {
      for (const u of units) {
        u.attackTarget(targetEntity, this.gameEngine);
      }
      this.gameEngine.particles.spawnMagicRing(targetEntity.x, targetEntity.y, '#ff2222');
      return;
    }

    // 2. Kliknięcie na Krowę przez Kmiecia -> Zbiórka mleka
    if (targetEntity && targetEntity.unitType === UNIT_TYPES.KROWA) {
      for (const u of units) {
        if (u.unitType === UNIT_TYPES.KMIEC) {
          u.targetEntity = targetEntity;
          u.state = UNIT_STATES.GATHER_MILK;
          u.moveToPoint(targetEntity.x, targetEntity.y, this.gameEngine);
        } else {
          u.moveToPoint(targetEntity.x, targetEntity.y, this.gameEngine);
        }
      }
      this.gameEngine.particles.spawnMagicRing(targetEntity.x, targetEntity.y, '#ffffff');
      return;
    }

    // 3. Kliknięcie na niedokończony budynek -> Budowa / Naprawa
    if (targetEntity && targetEntity.type === 'building' && targetEntity.ownerId === localPlayerId) {
      if (!targetEntity.isConstructed) {
        for (const u of units) {
          if (u.unitType === UNIT_TYPES.KMIEC) {
            u.targetEntity = targetEntity;
            u.state = UNIT_STATES.BUILDING;
            u.moveToPoint(targetEntity.x, targetEntity.y, this.gameEngine);
          }
        }
        return;
      }
    }

    // 4. Kliknięcie na Las (Drzewo) -> Zbiórka drewna przez kmieci
    if (tileType === TILE_TYPES.FOREST) {
      for (const u of units) {
        if (u.unitType === UNIT_TYPES.KMIEC) {
          u.targetTile = { x: targetTx, y: targetTy };
          u.state = UNIT_STATES.GATHER_WOOD;
          u.moveToTile(targetTx, targetTy, this.gameEngine);
        } else {
          u.moveToTile(targetTx, targetTy, this.gameEngine);
        }
      }
      this.gameEngine.particles.spawnMagicRing(targetTx * 32 + 16, targetTy * 32 + 16, '#3a9e3a');
      return;
    }

    // 5. Kliknięcie na Złoto -> Wydobycie złota
    if (tileType === TILE_TYPES.GOLD) {
      for (const u of units) {
        if (u.unitType === UNIT_TYPES.KMIEC) {
          u.targetTile = { x: targetTx, y: targetTy };
          u.state = UNIT_STATES.GATHER_GOLD;
          u.moveToTile(targetTx, targetTy, this.gameEngine);
        }
      }
      this.gameEngine.particles.spawnMagicRing(targetTx * 32 + 16, targetTy * 32 + 16, '#ffd700');
      return;
    }

    // 6. Zwykły marsz / ruch z formacją
    const count = units.length;
    const cols = Math.ceil(Math.sqrt(count));
    const spacing = 26;

    units.forEach((u, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const offsetX = (col - cols / 2) * spacing;
      const offsetY = (row - cols / 2) * spacing;

      u.targetEntity = null;
      u.targetTile = null;
      u.moveToPoint(worldX + offsetX, worldY + offsetY, this.gameEngine);
    });

    this.gameEngine.particles.spawnMagicRing(worldX, worldY, '#2dc447');
  }

  // Grupy pod Ctrl + 1-9
  setControlGroup(number) {
    const ids = this.selectedEntities.map(e => e.id);
    this.controlGroups.set(number, ids);
  }

  selectControlGroup(number) {
    const ids = this.controlGroups.get(number);
    if (!ids || ids.length === 0) return;

    this.clearSelection();
    const all = [...this.gameEngine.units, ...this.gameEngine.buildings];
    for (const e of all) {
      if (ids.includes(e.id) && e.isAlive) {
        e.isSelected = true;
        this.selectedEntities.push(e);
      }
    }
  }
}
