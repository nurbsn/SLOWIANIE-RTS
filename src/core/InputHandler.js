import { SpellSystem } from '../gameplay/SpellSystem.js';
import { TechTree } from '../gameplay/TechTree.js';
import { UNIT_TYPES } from '../entities/Unit.js';

/**
 * InputHandler - Obsługa zdarzeń myszy, dotyku, klawiatury i skrótów RTS.
 */
export class InputHandler {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.canvas = null;

    this.mousePos = { screenX: 0, screenY: 0, worldX: 0, worldY: 0 };
    this.isLeftMouseDown = false;
    this.isRightMouseDown = false;
    this.dragStartPos = { x: 0, y: 0 };
    this.dragWorldStart = { x: 0, y: 0 };

    this.keysDown = new Set();
  }

  init(canvas) {
    this.canvas = canvas;
    this._attachMouseEvents();
    this._attachKeyboardEvents();
  }

  _attachMouseEvents() {
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('mousedown', (e) => {
      this._updateMousePos(e);

      if (e.button === 0) { // Lewy przycisk myszy
        this.isLeftMouseDown = true;
        this.dragStartPos = { x: this.mousePos.screenX, y: this.mousePos.screenY };
        this.dragWorldStart = { x: this.mousePos.worldX, y: this.mousePos.worldY };

        // Jeśli jesteśmy w trybie celowania czaru
        if (this.gameEngine.ui.spellMode) {
          const caster = this.gameEngine.selection.selectedUnits.find(u => u.unitType === UNIT_TYPES.KAPLAN && u.ownerId === this.gameEngine.localPlayerId);
          if (caster) {
            SpellSystem.castSpell(this.gameEngine.ui.spellMode, caster, this.mousePos.worldX, this.mousePos.worldY, this.gameEngine);
          }
          this.gameEngine.ui.cancelModes();
          return;
        }

        // Jeśli jesteśmy w trybie stawiania budynku
        if (this.gameEngine.ui.buildMode) {
          const bldType = this.gameEngine.ui.buildMode;
          const tx = Math.floor(this.mousePos.worldX / 32);
          const ty = Math.floor(this.mousePos.worldY / 32);

          if (this.gameEngine.map.isBuildable(tx, ty, 2, 2)) {
            const cost = TechTree.getBuildingCost(bldType);
            if (this.gameEngine.localPlayer.payCost(cost)) {
              const bld = this.gameEngine.spawnBuilding(this.gameEngine.localPlayerId, bldType, tx, ty, false);
              // Wyślij zaznaczonego kmiecia do budowy
              const kmiec = this.gameEngine.selection.selectedUnits.find(u => u.unitType === UNIT_TYPES.KMIEC);
              if (kmiec) {
                kmiec.targetEntity = bld;
                kmiec.state = 'building';
                kmiec.moveToPoint(bld.x, bld.y, this.gameEngine);
              }
              this.gameEngine.sounds.playBuildingPlaced();
            }
          }
          this.gameEngine.ui.cancelModes();
          return;
        }

        // Obsługa w edytorze map
        if (this.gameEngine.mapEditor.isActive) {
          this.gameEngine.mapEditor.handleMouseDown(this.mousePos.worldX, this.mousePos.worldY, 0);
        }
      } else if (e.button === 2) { // Prawy przycisk myszy
        this.isRightMouseDown = true;
        this.gameEngine.ui.cancelModes();

        if (this.gameEngine.mapEditor.isActive) {
          this.gameEngine.mapEditor.handleMouseDown(this.mousePos.worldX, this.mousePos.worldY, 2);
        } else {
          this.gameEngine.selection.handleRightClick(this.mousePos.worldX, this.mousePos.worldY, this.gameEngine.localPlayerId);
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      this._updateMousePos(e);

      if (this.gameEngine.mapEditor.isActive && this.isLeftMouseDown) {
        this.gameEngine.mapEditor.handleMouseMove(this.mousePos.worldX, this.mousePos.worldY);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0 && this.isLeftMouseDown) {
        this.isLeftMouseDown = false;
        if (this.gameEngine.mapEditor.isActive) {
          this.gameEngine.mapEditor.handleMouseUp();
        } else {
          this.gameEngine.selection.handleBoxSelect(
            this.dragWorldStart.x,
            this.dragWorldStart.y,
            this.mousePos.worldX,
            this.mousePos.worldY,
            this.gameEngine.localPlayerId
          );
        }
      } else if (e.button === 2) {
        this.isRightMouseDown = false;
      }
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.gameEngine.camera.handleZoom(e.deltaY, this.mousePos.screenX, this.mousePos.screenY);
    }, { passive: false });
  }

  _attachKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.key);

      // Klawisze numeryczne 1-9 (grupy kontrolne)
      if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key, 10);
        if (e.ctrlKey) {
          this.gameEngine.selection.setControlGroup(num);
          this.gameEngine.particles.spawnFloatingText(this.gameEngine.camera.x + 300, this.gameEngine.camera.y + 200, `Grupa ${num} przypisana`, '#ffffff');
        } else {
          this.gameEngine.selection.selectControlGroup(num);
        }
      }

      // Spacja - wycentruj na głównym grodzie
      if (e.code === 'Space') {
        const grod = this.gameEngine.buildings.find(b => b.ownerId === this.gameEngine.localPlayerId && b.buildingType === 'grod' && b.isAlive);
        if (grod) {
          this.gameEngine.camera.centerOn(grod.x, grod.y);
        }
      }

      // Klawisz Escape / F10 - Menu / Pauza
      if (e.key === 'Escape' || e.key === 'F10') {
        if (this.gameEngine.ui.buildMode || this.gameEngine.ui.spellMode) {
          this.gameEngine.ui.cancelModes();
        } else if (this.gameEngine.isRunning) {
          this.gameEngine.togglePause();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.key);
    });
  }

  _updateMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePos.screenX = e.clientX - rect.left;
    this.mousePos.screenY = e.clientY - rect.top;

    const world = this.gameEngine.camera.screenToWorld(this.mousePos.screenX, this.mousePos.screenY);
    this.mousePos.worldX = world.x;
    this.mousePos.worldY = world.y;
  }

  update(deltaTime) {
    // Przesuwanie kamery klawiszami strzałek lub WASD
    let dx = 0;
    let dy = 0;
    const speed = 18;

    if (this.keysDown.has('ArrowLeft') || this.keysDown.has('a') || this.keysDown.has('A')) dx -= speed;
    if (this.keysDown.has('ArrowRight') || this.keysDown.has('d') || this.keysDown.has('D')) dx += speed;
    if (this.keysDown.has('ArrowUp') || this.keysDown.has('w') || this.keysDown.has('W')) dy -= speed;
    if (this.keysDown.has('ArrowDown') || this.keysDown.has('s') || this.keysDown.has('S')) dy += speed;

    if (dx !== 0 || dy !== 0) {
      this.gameEngine.camera.move(dx, dy);
    } else {
      // Przewijanie przy krawędziach ekranu
      this.gameEngine.camera.updateEdgePan(this.mousePos.screenX, this.mousePos.screenY);
    }
  }

  renderSelectionBox(ctx) {
    if (this.isLeftMouseDown && !this.gameEngine.mapEditor.isActive && !this.gameEngine.ui.buildMode && !this.gameEngine.ui.spellMode) {
      const startScreen = this.gameEngine.camera.worldToScreen(this.dragWorldStart.x, this.dragWorldStart.y);
      const endScreen = { x: this.mousePos.screenX, y: this.mousePos.screenY };

      const minX = Math.min(startScreen.x, endScreen.x);
      const maxX = Math.max(startScreen.x, endScreen.x);
      const minY = Math.min(startScreen.y, endScreen.y);
      const maxY = Math.max(startScreen.y, endScreen.y);

      ctx.fillStyle = 'rgba(66, 245, 126, 0.15)';
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      ctx.strokeStyle = '#42f57e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }
  }
}
