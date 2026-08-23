import { TILE_TYPES, TILE_PROPERTIES } from '../world/Map.js';
import { UNIT_TYPES } from '../entities/Unit.js';
import { BUILDING_TYPES } from '../entities/Building.js';

/**
 * MapEditor - Wbudowany edytor map z pędzlami terenu, surowców, obiektów i wyzwalaczy.
 */
export class MapEditor {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.isActive = false;
    this.currentTool = 'tile'; // 'tile', 'entity', 'building', 'spawn', 'erase'
    this.selectedTileType = TILE_TYPES.GRASS;
    this.selectedEntityType = UNIT_TYPES.KROWA;
    this.selectedBuildingType = BUILDING_TYPES.GROD;
    this.selectedPlayerId = 0;
    this.brushSize = 1; // 1, 2, 3, 5 kafelków

    this.isPainting = false;
  }

  activate() {
    this.isActive = true;
    this.gameEngine.fogOfWar.reset(false); // Odkryj całą mapę dla edytora
  }

  deactivate() {
    this.isActive = false;
  }

  setBrushSize(size) {
    this.brushSize = Math.max(1, Math.min(7, size));
  }

  handleMouseDown(worldX, worldY, button = 0) {
    if (!this.isActive) return;
    if (button === 0) {
      this.isPainting = true;
      this.applyTool(worldX, worldY);
    }
  }

  handleMouseMove(worldX, worldY) {
    if (!this.isActive || !this.isPainting) return;
    this.applyTool(worldX, worldY);
  }

  handleMouseUp() {
    this.isPainting = false;
  }

  applyTool(worldX, worldY) {
    const centerTx = Math.floor(worldX / 32);
    const centerTy = Math.floor(worldY / 32);

    if (this.currentTool === 'tile') {
      const r = Math.floor(this.brushSize / 2);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = centerTx + dx;
          const ty = centerTy + dy;
          if (tx >= 0 && tx < this.gameEngine.map.width && ty >= 0 && ty < this.gameEngine.map.height) {
            this.gameEngine.map.setTile(tx, ty, this.selectedTileType);
          }
        }
      }
    } else if (this.currentTool === 'entity') {
      const existing = this.gameEngine.getEntityAtPoint(worldX, worldY);
      if (!existing) {
        this.gameEngine.spawnUnit(this.selectedPlayerId, this.selectedEntityType, worldX, worldY);
        this.gameEngine.sounds.playOrderConfirm();
      }
    } else if (this.currentTool === 'building') {
      if (this.gameEngine.map.isBuildable(centerTx, centerTy, 2, 2)) {
        this.gameEngine.spawnBuilding(this.selectedPlayerId, this.selectedBuildingType, centerTx, centerTy, true);
        this.gameEngine.sounds.playBuildingPlaced();
      }
    } else if (this.currentTool === 'spawn') {
      // Ustawienie punktu startowego gracza
      this.gameEngine.map.startingPositions = this.gameEngine.map.startingPositions.filter(p => p.playerId !== this.selectedPlayerId);
      this.gameEngine.map.startingPositions.push({
        playerId: this.selectedPlayerId,
        x: centerTx,
        y: centerTy,
        name: `Start Gracz ${this.selectedPlayerId + 1}`
      });
      this.gameEngine.particles.spawnMagicRing(centerTx * 32 + 16, centerTy * 32 + 16, '#00e1ff');
    } else if (this.currentTool === 'erase') {
      const e = this.gameEngine.getEntityAtPoint(worldX, worldY);
      if (e) {
        e.isAlive = false;
        this.gameEngine.units = this.gameEngine.units.filter(u => u !== e);
        this.gameEngine.buildings = this.gameEngine.buildings.filter(b => b !== e);
        this.gameEngine.sounds.playDeath();
      }
    }
  }

  exportMap() {
    const mapData = {
      name: this.gameEngine.map.name,
      description: this.gameEngine.map.description,
      width: this.gameEngine.map.width,
      height: this.gameEngine.map.height,
      tiles: Array.from(this.gameEngine.map.tiles),
      resources: Array.from(this.gameEngine.map.resourceAmounts),
      startingPositions: this.gameEngine.map.startingPositions,
      units: this.gameEngine.units.map(u => ({ ownerId: u.ownerId, type: u.unitType, x: u.x, y: u.y })),
      buildings: this.gameEngine.buildings.map(b => ({ ownerId: b.ownerId, type: b.buildingType, tx: b.originTileX, ty: b.originTileY }))
    };

    const json = JSON.stringify(mapData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.gameEngine.map.name.replace(/\s+/g, '_')}.slowianie.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importMap(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this.gameEngine.map.deserialize(data);
      this.gameEngine.units = [];
      this.gameEngine.buildings = [];

      if (data.units) {
        for (const u of data.units) {
          this.gameEngine.spawnUnit(u.ownerId, u.type, u.x, u.y);
        }
      }
      if (data.buildings) {
        for (const b of data.buildings) {
          this.gameEngine.spawnBuilding(b.ownerId, b.type, b.tx, b.ty, true);
        }
      }
      return true;
    } catch (e) {
      console.error("Błąd podczas importu mapy:", e);
      return false;
    }
  }
}
