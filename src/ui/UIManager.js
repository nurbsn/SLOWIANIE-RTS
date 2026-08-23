import { BUILDING_TYPES, BUILDING_CONFIGS } from '../entities/Building.js';
import { UNIT_TYPES, UNIT_CONFIGS } from '../entities/Unit.js';
import { SPELLS } from '../gameplay/SpellSystem.js';
import { TechTree } from '../gameplay/TechTree.js';
import { VISIBILITY } from '../world/FogOfWar.js';

/**
 * UIManager - Obsługa interfejsu w grze (HUD), surowców, panelu akcji/budowy, minimapy i dialogów.
 */
export class UIManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.minimapCanvas = null;
    this.minimapCtx = null;
    this.minimapSize = 160;

    this.buildMode = null; // buildingType if placing a building
    this.spellMode = null; // spellId if aiming a spell
  }

  init() {
    this.minimapCanvas = document.getElementById('minimap-canvas');
    if (this.minimapCanvas) {
      this.minimapCanvas.width = this.minimapSize;
      this.minimapCanvas.height = this.minimapSize;
      this.minimapCtx = this.minimapCanvas.getContext('2d');
      this._setupMinimapEvents();
    }
  }

  updateHUD() {
    const localPlayer = this.gameEngine.localPlayer;
    if (!localPlayer) return;

    // Surowce
    const elMilk = document.getElementById('res-milk');
    const elWood = document.getElementById('res-wood');
    const elGold = document.getElementById('res-gold');
    const elFaith = document.getElementById('res-faith');
    const elPop = document.getElementById('res-pop');

    if (elMilk) elMilk.textContent = localPlayer.milk;
    if (elWood) elWood.textContent = localPlayer.wood;
    if (elGold) elGold.textContent = localPlayer.gold;
    if (elFaith) elFaith.textContent = localPlayer.faith;
    if (elPop) elPop.textContent = `${localPlayer.currentPop}/${localPlayer.maxPop}`;

    // Czas gry
    const elTime = document.getElementById('hud-game-time');
    if (elTime) {
      const mins = Math.floor(this.gameEngine.gameTime / 60);
      const secs = Math.floor(this.gameEngine.gameTime % 60);
      elTime.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Panel selekcji i komend
    this.renderSelectionPanel();
    this.renderCommandCard();
    this.renderMinimap();
    this.renderDialogOverlay();
  }

  renderSelectionPanel() {
    const panel = document.getElementById('selection-info');
    if (!panel) return;

    const selection = this.gameEngine.selection.selectedEntities;

    if (selection.length === 0) {
      panel.innerHTML = '<div class="empty-sel">Wybierz jednostkę lub budynek</div>';
      return;
    }

    if (selection.length === 1) {
      const e = selection[0];
      const hpPercent = Math.max(0, Math.min(100, Math.floor((e.hp / e.maxHp) * 100)));
      const hpColor = hpPercent > 50 ? '#42f57e' : (hpPercent > 25 ? '#f5a442' : '#f54242');

      let detailsHtml = `
        <div class="sel-card">
          <div class="sel-header">
            <span class="sel-name">${e.name}</span>
            <span class="sel-type">${e.type === 'unit' ? 'Jednostka' : 'Budynek'}</span>
          </div>
          <div class="hp-bar-bg">
            <div class="hp-bar-fill" style="width: ${hpPercent}%; background: ${hpColor};"></div>
          </div>
          <div class="hp-text">Życie: ${e.hp} / ${e.maxHp} | Pancerz: ${e.armor}</div>
      `;

      if (e.type === 'unit') {
        if (e.damage) detailsHtml += `<div class="sel-stat">🗡️ Obrażenia: ${e.damage}</div>`;
        if (e.maxMana) detailsHtml += `<div class="sel-stat">✨ Mana: ${Math.floor(e.mana)} / ${e.maxMana}</div>`;
        if (e.carriedAmount > 0) detailsHtml += `<div class="sel-stat">📦 Niesie: ${e.carriedAmount} (${e.carriedResourceType})</div>`;
        if (e.milkStored !== undefined) detailsHtml += `<div class="sel-stat">🥛 Mleko w krowie: ${e.milkStored} / ${e.maxMilkStored}</div>`;
      } else if (e.type === 'building') {
        if (!e.isConstructed) {
          detailsHtml += `<div class="sel-stat">🔨 Postęp budowy: ${Math.floor(e.constructionProgress)}%</div>`;
        }
        if (e.productionQueue.length > 0) {
          const cur = e.productionQueue[0];
          const prog = Math.floor((cur.progress / cur.totalTime) * 100);
          detailsHtml += `<div class="sel-stat">⚙️ Szkolenie: ${UNIT_CONFIGS[cur.unitType]?.name || cur.unitType} (${prog}%)</div>`;
        }
      }

      detailsHtml += '</div>';
      panel.innerHTML = detailsHtml;
    } else {
      // Wielokrotne zaznaczenie
      let listHtml = `<div class="multi-sel-header">Zaznaczono (${selection.length})</div><div class="multi-sel-grid">`;
      selection.slice(0, 12).forEach(e => {
        const hpPercent = Math.max(0, Math.min(100, Math.floor((e.hp / e.maxHp) * 100)));
        listHtml += `
          <div class="multi-item">
            <div class="multi-item-name">${e.name}</div>
            <div class="multi-hp-bar" style="width: ${hpPercent}%;"></div>
          </div>
        `;
      });
      listHtml += '</div>';
      panel.innerHTML = listHtml;
    }
  }

  renderCommandCard() {
    const card = document.getElementById('command-card');
    if (!card) return;

    const selection = this.gameEngine.selection.selectedEntities;
    const localPlayer = this.gameEngine.localPlayer;
    if (!localPlayer) return;

    let buttonsHtml = '';

    if (selection.length === 1 && selection[0].ownerId === localPlayer.id) {
      const e = selection[0];

      // KMIEC - Menu budowania
      if (e.type === 'unit' && e.unitType === UNIT_TYPES.KMIEC) {
        buttonsHtml += `<div class="cmd-section-title">Buduj osadę:</div><div class="cmd-buttons-grid">`;
        const buildableTypes = [
          BUILDING_TYPES.GROD,
          BUILDING_TYPES.DRWAL,
          BUILDING_TYPES.OBORA,
          BUILDING_TYPES.KOSZARY,
          BUILDING_TYPES.SWIATYNIA,
          BUILDING_TYPES.WIEZA,
          BUILDING_TYPES.PALISADA
        ];

        buildableTypes.forEach(bldType => {
          const cfg = BUILDING_CONFIGS[bldType];
          const can = TechTree.canBuildBuilding(localPlayer, bldType, this.gameEngine.buildings);
          const costStr = `🥛${cfg.cost.milk || 0} 🪵${cfg.cost.wood || 0} 🪙${cfg.cost.gold || 0}`;
          buttonsHtml += `
            <button class="cmd-btn ${can.allowed ? '' : 'disabled'}" data-action="build" data-bld="${bldType}" title="${cfg.name} (${costStr})">
              <span class="cmd-btn-name">${cfg.name}</span>
              <span class="cmd-btn-cost">${costStr}</span>
            </button>
          `;
        });
        buttonsHtml += `</div>`;
      }

      // BUDYNKI - Szkolenie jednostek
      if (e.type === 'building' && e.isConstructed && e.trainableUnits.length > 0) {
        buttonsHtml += `<div class="cmd-section-title">Szkolenie wojowników:</div><div class="cmd-buttons-grid">`;
        e.trainableUnits.forEach(uType => {
          const cfg = UNIT_CONFIGS[uType];
          const can = TechTree.canTrainUnit(localPlayer, uType);
          const costStr = `🥛${cfg.cost.milk || 0} 🪵${cfg.cost.wood || 0} 🪙${cfg.cost.gold || 0}`;
          buttonsHtml += `
            <button class="cmd-btn ${can.allowed ? '' : 'disabled'}" data-action="train" data-unit="${uType}" title="Wyszkol ${cfg.name} (${costStr})">
              <span class="cmd-btn-name">${cfg.name}</span>
              <span class="cmd-btn-cost">${costStr}</span>
            </button>
          `;
        });
        buttonsHtml += `</div>`;
      }

      // KAPŁAN - Rzucanie czarów
      if (e.type === 'unit' && e.unitType === UNIT_TYPES.KAPLAN) {
        buttonsHtml += `<div class="cmd-section-title">Czary Żercy:</div><div class="cmd-buttons-grid">`;
        Object.values(SPELLS).forEach(spell => {
          const hasMana = e.mana >= spell.manaCost;
          buttonsHtml += `
            <button class="cmd-btn spell-btn ${hasMana ? '' : 'disabled'}" data-action="spell" data-spell="${spell.id}" title="${spell.name} (Koszt: ${spell.manaCost} Many)">
              <span class="cmd-btn-icon">${spell.icon}</span>
              <span class="cmd-btn-name">${spell.name}</span>
              <span class="cmd-btn-cost">✨ ${spell.manaCost} Many</span>
            </button>
          `;
        });
        buttonsHtml += `</div>`;
      }
    }

    card.innerHTML = buttonsHtml;
    this._attachCommandCardEvents(card);
  }

  _attachCommandCardEvents(container) {
    const buttons = container.querySelectorAll('.cmd-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const action = btn.getAttribute('data-action');
        if (btn.classList.contains('disabled')) return;

        if (action === 'build') {
          const bldType = btn.getAttribute('data-bld');
          this.startBuildingPlacement(bldType);
        } else if (action === 'train') {
          const unitType = btn.getAttribute('data-unit');
          const selection = this.gameEngine.selection.selectedBuildings;
          if (selection.length > 0) {
            const bld = selection[0];
            const cost = TechTree.getUnitCost(unitType);
            if (this.gameEngine.localPlayer.payCost(cost)) {
              bld.queueUnit(unitType);
              this.gameEngine.sounds.playOrderConfirm();
            }
          }
        } else if (action === 'spell') {
          const spellId = btn.getAttribute('data-spell');
          this.startSpellAim(spellId);
        }
      });
    });
  }

  startBuildingPlacement(buildingType) {
    this.buildMode = buildingType;
    this.spellMode = null;
    this.gameEngine.sounds.playClick();
  }

  startSpellAim(spellId) {
    this.spellMode = spellId;
    this.buildMode = null;
    this.gameEngine.sounds.playClick();
  }

  cancelModes() {
    this.buildMode = null;
    this.spellMode = null;
  }

  renderMinimap() {
    if (!this.minimapCtx || !this.gameEngine.map) return;
    const ctx = this.minimapCtx;
    const map = this.gameEngine.map;
    const fog = this.gameEngine.fogOfWar;

    ctx.clearRect(0, 0, this.minimapSize, this.minimapSize);

    const scaleX = this.minimapSize / map.width;
    const scaleY = this.minimapSize / map.height;

    // 1. Rysowanie terenu i mgły
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const vis = fog.getVisibility(x, y);
        if (vis === VISIBILITY.HIDDEN) {
          ctx.fillStyle = '#0a0a0a';
        } else {
          const tile = map.getTile(x, y);
          if (tile === 2 || tile === 3) ctx.fillStyle = '#2b6294'; // Woda
          else if (tile === 4) ctx.fillStyle = '#1e471b'; // Las
          else if (tile === 5) ctx.fillStyle = '#545454'; // Góra
          else if (tile === 6) ctx.fillStyle = '#ffd700'; // Złoto
          else ctx.fillStyle = '#4b752b'; // Trawa

          if (vis === VISIBILITY.EXPLORED) {
            ctx.fillStyle = '#222d1f'; // Przyciemnione
          }
        }
        ctx.fillRect(x * scaleX, y * scaleY, Math.ceil(scaleX), Math.ceil(scaleY));
      }
    }

    // 2. Budynki na minimapie
    for (const b of this.gameEngine.buildings) {
      if (!b.isAlive) continue;
      if (!fog.isWorldPosVisible(b.x, b.y)) continue;

      ctx.fillStyle = b.ownerId === 0 ? '#00e1ff' : (b.ownerId === -1 ? '#ffffff' : '#ff3b30');
      const mx = (b.x / map.widthPx) * this.minimapSize;
      const my = (b.y / map.heightPx) * this.minimapSize;
      ctx.fillRect(mx - 2, my - 2, 4, 4);
    }

    // 3. Jednostki na minimapie
    for (const u of this.gameEngine.units) {
      if (!u.isAlive) continue;
      if (!fog.isWorldPosVisible(u.x, u.y)) continue;

      if (u.unitType === 'krowa') {
        ctx.fillStyle = '#ffffff'; // Krowy kropki
      } else {
        ctx.fillStyle = u.ownerId === 0 ? '#42f57e' : (u.ownerId === -1 ? '#aaaaaa' : '#ff3b30');
      }

      const mx = (u.x / map.widthPx) * this.minimapSize;
      const my = (u.y / map.heightPx) * this.minimapSize;
      ctx.fillRect(mx - 1, my - 1, 2, 2);
    }

    // 4. Ramka kamery
    const cam = this.gameEngine.camera;
    const camX = (cam.x / map.widthPx) * this.minimapSize;
    const camY = (cam.y / map.heightPx) * this.minimapSize;
    const camW = ((cam.viewportWidth / cam.zoom) / map.widthPx) * this.minimapSize;
    const camH = ((cam.viewportHeight / cam.zoom) / map.heightPx) * this.minimapSize;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(camX, camY, camW, camH);
  }

  _setupMinimapEvents() {
    let isDraggingMinimap = false;

    const navigate = (e) => {
      const rect = this.minimapCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const normX = Math.max(0, Math.min(1, clickX / this.minimapSize));
      const normY = Math.max(0, Math.min(1, clickY / this.minimapSize));

      const targetWorldX = normX * this.gameEngine.map.widthPx;
      const targetWorldY = normY * this.gameEngine.map.heightPx;

      this.gameEngine.camera.centerOn(targetWorldX, targetWorldY);
    };

    this.minimapCanvas.addEventListener('mousedown', (e) => {
      isDraggingMinimap = true;
      navigate(e);
    });

    window.addEventListener('mousemove', (e) => {
      if (isDraggingMinimap) navigate(e);
    });

    window.addEventListener('mouseup', () => {
      isDraggingMinimap = false;
    });
  }

  renderDialogOverlay() {
    const dialogBox = document.getElementById('campaign-dialog-box');
    if (!dialogBox) return;

    const dialog = this.gameEngine.triggers.activeDialog;
    if (dialog) {
      dialogBox.style.display = 'flex';
      dialogBox.innerHTML = `
        <div class="dialog-avatar">🧓</div>
        <div class="dialog-content">
          <div class="dialog-speaker">${dialog.speaker}</div>
          <div class="dialog-text">${dialog.text}</div>
        </div>
      `;
    } else {
      dialogBox.style.display = 'none';
    }
  }
}
