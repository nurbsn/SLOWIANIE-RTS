import { GameMap, TILE_TYPES } from '../world/Map.js';
import { Camera } from './Camera.js';
import { AssetManager } from './AssetManager.js';
import { SoundSystem } from './SoundSystem.js';
import { FogOfWar, VISIBILITY } from '../world/FogOfWar.js';
import { Pathfinding } from '../world/Pathfinding.js';
import { Unit, UNIT_TYPES } from '../entities/Unit.js';
import { Building, BUILDING_TYPES, BUILDING_CONFIGS } from '../entities/Building.js';
import { ProjectileManager } from '../entities/Projectile.js';
import { ParticleSystem } from '../entities/ParticleSystem.js';
import { Player } from '../gameplay/Player.js';
import { SelectionManager } from '../gameplay/SelectionManager.js';
import { AIController } from '../ai/AIController.js';
import { AI_PRESETS } from '../ai/AIPresets.js';
import { CampaignManager } from '../campaign/CampaignManager.js';
import { TriggerSystem } from '../campaign/TriggerSystem.js';
import { NetworkManager } from '../net/NetworkManager.js';
import { MapEditor } from '../editor/MapEditor.js';
import { CampaignEditor } from '../editor/CampaignEditor.js';
import { AIScriptEditor } from '../editor/AIScriptEditor.js';
import { UIManager } from '../ui/UIManager.js';
import { MenuManager } from '../ui/MenuManager.js';
import { InputHandler } from './InputHandler.js';

/**
 * GameEngine - Główny silnik gry SŁOWIANIE (Polanie Tribute RTS).
 */
export class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;

    this.map = new GameMap(64, 64);
    this.camera = null;
    this.assets = new AssetManager();
    this.sounds = new SoundSystem();
    this.fogOfWar = new FogOfWar(64, 64);
    this.pathfinding = new Pathfinding(this.map);

    this.units = [];
    this.buildings = [];
    this.projectiles = new ProjectileManager();
    this.particles = new ParticleSystem();

    this.players = [];
    this.localPlayerId = 0;
    this.aiControllers = [];

    this.selection = new SelectionManager(this);
    this.triggers = new TriggerSystem(this);
    this.campaign = new CampaignManager(this);
    this.network = new NetworkManager(this);

    this.mapEditor = new MapEditor(this);
    this.campaignEditor = new CampaignEditor(this);
    this.aiScriptEditor = new AIScriptEditor(this);

    this.ui = new UIManager(this);
    this.menus = new MenuManager(this);
    this.input = new InputHandler(this);

    this.isRunning = false;
    this.isPaused = false;
    this.gameSpeed = 1.0;
    this.gameTime = 0;

    this.lastTimestamp = 0;
    this.tickRate = 20; // 20 Ticks per second
    this.tickInterval = 1000 / this.tickRate;
    this.accumulator = 0;
  }

  async init(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');

    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());

    this.camera = new Camera(this.canvas.width, this.canvas.height, this.map.widthPx, this.map.heightPx);

    // Załaduj assety pixel art
    await this.assets.loadAll();

    // Inicjalizacja podsystemów
    this.input.init(this.canvas);
    this.ui.init();
    this.menus.init();

    // Uruchomienie pętli renderowania
    this.lastTimestamp = performance.now();
    requestAnimationFrame((t) => this._mainLoop(t));
  }

  _resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.camera) {
      this.camera.resize(this.canvas.width, this.canvas.height);
    }
  }

  get localPlayer() {
    return this.players[this.localPlayerId] || null;
  }

  // --- URUCHAMIANIE TRYBÓW GRY ---

  startSkirmish(mapSize = 64, aiPresetKey = 'BALANCED') {
    this.resetGameState(mapSize);
    this.map.generateDefault();

    // Gracz 1 (Człowiek)
    const p1 = new Player(0, 'Mściwój (Ty)', '#2d68c4', false, 0);
    // Gracz 2 (Bot AI)
    const p2 = new Player(1, 'Zbójcy Wieletów', '#c42d2d', true, 1);
    this.players = [p1, p2];

    const preset = AI_PRESETS[aiPresetKey] || AI_PRESETS.BALANCED;
    this.aiControllers = [new AIController(1, this, preset)];

    // Bazy startowe
    this._setupStartingBase(0, 10, 18);
    this._setupStartingBase(1, 50, 42);

    // Stada dzikich krów na łąkach (Polanie!)
    this._spawnWildCows(8);

    this.camera.centerOn(10 * 32, 18 * 32);
    this.fogOfWar.reset(true);
    this.isRunning = true;
    this.sounds.startMusic();
  }

  setupMission(mission) {
    this.resetGameState(mission.mapSize || 48);
    this.map.generateDefault();

    const p1 = new Player(0, 'Wódz Słowian', '#2d68c4', false, 0);
    p1.milk = mission.initialResources.milk;
    p1.wood = mission.initialResources.wood;
    p1.gold = mission.initialResources.gold;
    p1.faith = mission.initialResources.faith;

    const p2 = new Player(1, 'Najeźdźcy', '#c42d2d', true, 1);
    this.players = [p1, p2];

    this.aiControllers = [new AIController(1, this, AI_PRESETS.AGGRESSIVE)];

    const sx = mission.playerStart.x;
    const sy = mission.playerStart.y;
    this._setupStartingBase(0, sx, sy);
    this._setupStartingBase(1, mission.mapSize - 12, mission.mapSize - 12);
    this._spawnWildCows(6);

    this.triggers.loadTriggers(mission.triggers);
    this.triggers.onVictory = (msg) => this._onGameWon(msg);
    this.triggers.onDefeat = (msg) => this._onGameLost(msg);

    this.camera.centerOn(sx * 32, sy * 32);
    this.fogOfWar.reset(true);
    this.isRunning = true;
    this.sounds.startMusic();
  }

  setupMultiplayerGame(lobbyPlayers, localPlayerId) {
    this.resetGameState(64);
    this.map.generateDefault();

    this.localPlayerId = localPlayerId;
    this.players = lobbyPlayers.map(lp => new Player(lp.id, lp.name, lp.color, false, lp.team));

    this.players.forEach((p, idx) => {
      const pos = this.map.startingPositions[idx] || { x: 10 + idx * 25, y: 15 + idx * 20 };
      this._setupStartingBase(p.id, pos.x, pos.y);
    });

    this._spawnWildCows(10);

    const myPos = this.map.startingPositions[this.localPlayerId] || { x: 10, y: 18 };
    this.camera.centerOn(myPos.x * 32, myPos.y * 32);
    this.fogOfWar.reset(true);
    this.isRunning = true;
    this.sounds.startMusic();
  }

  startMapEditor() {
    this.resetGameState(64);
    this.map.generateDefault();
    this.players = [
      new Player(0, 'Gracz 1', '#2d68c4', false, 0),
      new Player(1, 'Gracz 2', '#c42d2d', true, 1)
    ];
    this._spawnWildCows(4);
    this.mapEditor.activate();
    this.camera.centerOn(32 * 32, 32 * 32);
    this.isRunning = true;
  }

  startPlaytest() {
    this.isRunning = true;
    this.fogOfWar.reset(true);
    this.sounds.startMusic();
  }

  resetGameState(mapSize = 64) {
    this.map = new GameMap(mapSize, mapSize);
    this.fogOfWar = new FogOfWar(mapSize, mapSize);
    this.pathfinding = new Pathfinding(this.map);
    this.camera.setMapSize(this.map.widthPx, this.map.heightPx);

    this.units = [];
    this.buildings = [];
    this.projectiles.clear();
    this.particles.clear();
    this.selection.clearSelection();

    this.players = [];
    this.aiControllers = [];
    this.gameTime = 0;
    this.isPaused = false;
  }

  stopGame() {
    this.isRunning = false;
    this.sounds.stopMusic();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) {
      pauseModal.style.display = this.isPaused ? 'flex' : 'none';
    }
  }

  _setupStartingBase(playerId, tx, ty) {
    // Główny gród
    this.spawnBuilding(playerId, BUILDING_TYPES.GROD, tx, ty, true);
    // Chata drwala
    this.spawnBuilding(playerId, BUILDING_TYPES.DRWAL, tx + 4, ty, true);
    // Obora
    this.spawnBuilding(playerId, BUILDING_TYPES.OBORA, tx, ty + 4, true);

    // Kmiecie startowi
    this.spawnUnit(playerId, UNIT_TYPES.KMIEC, (tx + 1) * 32, (ty + 3) * 32);
    this.spawnUnit(playerId, UNIT_TYPES.KMIEC, (tx + 3) * 32, (ty + 3) * 32);
    this.spawnUnit(playerId, UNIT_TYPES.KMIEC, (tx + 2) * 32, (ty + 4) * 32);

    // Wojownik na straży
    this.spawnUnit(playerId, UNIT_TYPES.WOJ, (tx + 2) * 32, (ty - 1) * 32);

    // Krowa przy oborze
    this.spawnUnit(playerId, UNIT_TYPES.KROWA, (tx + 1) * 32, (ty + 5) * 32);
  }

  _spawnWildCows(count) {
    for (let i = 0; i < count; i++) {
      const rx = Math.floor(Math.random() * (this.map.width - 8)) + 4;
      const ry = Math.floor(Math.random() * (this.map.height - 8)) + 4;
      if (this.map.isWalkable(rx, ry)) {
        this.spawnUnit(-1, UNIT_TYPES.KROWA, rx * 32 + 16, ry * 32 + 16);
      }
    }
  }

  // --- FABRYKA JEDNOSTEK I BUDYNKÓW ---

  spawnUnit(ownerId, unitType, x, y) {
    const unit = new Unit(ownerId, unitType, x, y);
    unit.type = 'unit';
    this.units.push(unit);
    return unit;
  }

  spawnBuilding(ownerId, buildingType, tileX, tileY, isCompleted = true) {
    const bld = new Building(ownerId, buildingType, tileX, tileY, isCompleted);
    bld.type = 'building';
    this.buildings.push(bld);
    return bld;
  }

  getEntityAtPoint(worldX, worldY) {
    // Najpierw jednostki (mniejsze, na wierzchu)
    for (const u of this.units) {
      if (u.isAlive && u.distanceToPoint(worldX, worldY) <= u.radius + 6) {
        return u;
      }
    }
    // Następnie budynki
    for (const b of this.buildings) {
      if (b.isAlive && uInBuildingBounds(worldX, worldY, b)) {
        return b;
      }
    }
    return null;

    function uInBuildingBounds(wx, wy, b) {
      const minX = b.originTileX * 32;
      const minY = b.originTileY * 32;
      const maxX = minX + b.widthTiles * 32;
      const maxY = minY + b.heightTiles * 32;
      return wx >= minX && wx <= maxX && wy >= minY && wy <= maxY;
    }
  }

  findNearestEnemy(ownerId, worldX, worldY, maxRange = 300) {
    let nearest = null;
    let minDist = maxRange;

    for (const u of this.units) {
      if (u.isAlive && u.ownerId !== ownerId && u.ownerId !== -1) {
        const d = Math.hypot(u.x - worldX, u.y - worldY);
        if (d < minDist) {
          minDist = d;
          nearest = u;
        }
      }
    }
    for (const b of this.buildings) {
      if (b.isAlive && b.ownerId !== ownerId && b.ownerId !== -1) {
        const d = Math.hypot(b.x - worldX, b.y - worldY);
        if (d < minDist) {
          minDist = d;
          nearest = b;
        }
      }
    }
    return nearest;
  }

  findNearestForest(centerTx, centerTy) {
    for (let r = 1; r < 20; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const tx = centerTx + dx;
          const ty = centerTy + dy;
          if (this.map.getTile(tx, ty) === TILE_TYPES.FOREST) {
            return { x: tx, y: ty };
          }
        }
      }
    }
    return null;
  }

  findNearestDropoff(ownerId, worldX, worldY, resourceType) {
    let nearest = null;
    let minDist = Infinity;

    for (const b of this.buildings) {
      if (b.isAlive && b.ownerId === ownerId && b.isConstructed && b.isDropoff.includes(resourceType)) {
        const d = Math.hypot(b.x - worldX, b.y - worldY);
        if (d < minDist) {
          minDist = d;
          nearest = b;
        }
      }
    }
    return nearest;
  }

  findNearestBuilding(ownerId, worldX, worldY, buildingType, maxRange = 400) {
    let nearest = null;
    let minDist = maxRange;
    for (const b of this.buildings) {
      if (b.isAlive && b.ownerId === ownerId && b.buildingType === buildingType && b.isConstructed) {
        const d = Math.hypot(b.x - worldX, b.y - worldY);
        if (d < minDist) {
          minDist = d;
          nearest = b;
        }
      }
    }
    return nearest;
  }

  findNearestEntity(worldX, worldY, predicate) {
    let nearest = null;
    let minDist = Infinity;
    for (const u of this.units) {
      if (predicate(u)) {
        const d = Math.hypot(u.x - worldX, u.y - worldY);
        if (d < minDist) {
          minDist = d;
          nearest = u;
        }
      }
    }
    return nearest;
  }

  // --- GŁÓWNA PĘTLA GRY ---

  _mainLoop(timestamp) {
    const elapsed = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    if (this.isRunning && !this.isPaused) {
      this.accumulator += elapsed * this.gameSpeed;
      while (this.accumulator >= this.tickInterval) {
        this._updateTick(this.tickInterval / 1000);
        this.accumulator -= this.tickInterval;
      }
    }

    this._render();
    requestAnimationFrame((t) => this._mainLoop(t));
  }

  _updateTick(deltaTime) {
    this.gameTime += deltaTime;

    // Aktualizacja wejścia kamery
    this.input.update(deltaTime);

    // Aktualizacja mapy (odrastanie trawy)
    this.map.update(deltaTime);

    // Aktualizacja jednostek
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      u.update(deltaTime, this);
      if (!u.isAlive) {
        this.units.splice(i, 1);
        this.sounds.playDeath();
      }
    }

    // Aktualizacja budynków
    for (let i = this.buildings.length - 1; i >= 0; i--) {
      const b = this.buildings[i];
      b.update(deltaTime, this);
      if (!b.isAlive) {
        this.buildings.splice(i, 1);
        this.sounds.playDeath();
      }
    }

    // Aktualizacja pocisków i cząsteczek
    this.projectiles.update(deltaTime, this);
    this.particles.update(deltaTime);

    // Aktualizacja AI botów
    for (const ai of this.aiControllers) {
      ai.update(deltaTime);
    }

    // Aktualizacja populacji i zasobów graczy
    for (const p of this.players) {
      p.recalculatePopulation(this.units, this.buildings);
    }

    // Aktualizacja mgły wojny
    this._updateFogOfWar();

    // Sprawdzenie triggerów kampanii
    this.triggers.update(deltaTime);

    // Sprawdzenie warunków końca gry w potyczce
    this._checkSkirmishEndConditions();

    // Aktualizacja interfejsu HUD
    this.ui.updateHUD();
  }

  _updateFogOfWar() {
    if (!this.fogOfWar.enabled) return;
    this.fogOfWar.startUpdate();

    // Odkrywaj pole widzenia z jednostek lokalnego gracza
    for (const u of this.units) {
      if (u.ownerId === this.localPlayerId && u.isAlive) {
        this.fogOfWar.revealCircle(u.tileX, u.tileY, u.sightRadius);
      }
    }

    // Odkrywaj z budynków lokalnego gracza
    for (const b of this.buildings) {
      if (b.ownerId === this.localPlayerId && b.isAlive) {
        this.fogOfWar.revealCircle(b.originTileX + 1, b.originTileY + 1, b.sightRadius);
      }
    }
  }

  _checkSkirmishEndConditions() {
    if (this.campaign.getCurrentMission()) return; // W kampanii decydują triggery

    const p0 = this.players[0];
    const p1 = this.players[1];
    if (!p0 || !p1) return;

    const p0Blds = this.buildings.filter(b => b.ownerId === 0 && b.isAlive);
    const p0Units = this.units.filter(u => u.ownerId === 0 && u.isAlive);

    if (p0Blds.length === 0 && p0Units.length === 0) {
      this._onGameLost('Wszystkie twoje jednostki i budynki zostały zniszczone!');
    }

    const p1Blds = this.buildings.filter(b => b.ownerId === 1 && b.isAlive);
    const p1Units = this.units.filter(u => u.ownerId === 1 && u.isAlive);

    if (p1Blds.length === 0 && p1Units.length === 0) {
      this._onGameWon('Zniszczyłeś wszystkie siły wrogiego plemienia!');
    }
  }

  _onGameWon(msg) {
    this.isRunning = false;
    this.campaign.onMissionComplete();
    const modal = document.getElementById('game-over-modal');
    if (modal) {
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-box victory-box">
          <h2>🏆 SŁOWIAŃSKIE ZWYCIĘSTWO! 🏆</h2>
          <p>${msg}</p>
          <button class="btn-wood btn-back-main">Powrót do Menu</button>
        </div>
      `;
      modal.querySelector('.btn-back-main').onclick = () => {
        modal.style.display = 'none';
        this.menus.showScreen('main-menu');
      };
    }
  }

  _onGameLost(msg) {
    this.isRunning = false;
    const modal = document.getElementById('game-over-modal');
    if (modal) {
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-box defeat-box">
          <h2>☠️ PORAŻKA ☠️</h2>
          <p>${msg}</p>
          <button class="btn-wood btn-back-main">Powrót do Menu</button>
        </div>
      `;
      modal.querySelector('.btn-back-main').onclick = () => {
        modal.style.display = 'none';
        this.menus.showScreen('main-menu');
      };
    }
  }

  // --- RENDEROWANIE ŚWIATA ---

  _render() {
    const ctx = this.ctx;
    const cam = this.camera;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    // 1. Rysowanie kafelków terenu
    this._renderTerrain(ctx);

    // 2. Rysowanie budynków
    this._renderBuildings(ctx);

    // 3. Rysowanie jednostek
    this._renderUnits(ctx);

    // 4. Rysowanie pocisków
    this._renderProjectiles(ctx);

    // 5. Cząsteczki
    this.particles.render(ctx, cam);

    // 6. Mgła wojny (warstwa cienia)
    this._renderFogOfWar(ctx);

    // 7. Podgląd stawiania budynku (Ghost preview)
    this._renderPlacementPreview(ctx);

    ctx.restore();

    // 8. Zaznaczanie prostokątem (w przestrzeni ekranu)
    this.input.renderSelectionBox(ctx);
  }

  _renderTerrain(ctx) {
    const cam = this.camera;
    const tileSize = this.map.tileSize;

    const minTx = Math.max(0, Math.floor(cam.x / tileSize));
    const maxTx = Math.min(this.map.width - 1, Math.ceil((cam.x + cam.viewportWidth / cam.zoom) / tileSize));
    const minTy = Math.max(0, Math.floor(cam.y / tileSize));
    const maxTy = Math.min(this.map.height - 1, Math.ceil((cam.y + cam.viewportHeight / cam.zoom) / tileSize));

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const vis = this.fogOfWar.getVisibility(tx, ty);
        if (vis === VISIBILITY.HIDDEN) continue;

        const tileType = this.map.getTile(tx, ty);
        let spriteKey = 'tile_grass';

        if (tileType === TILE_TYPES.GRAZED) spriteKey = 'tile_grazed';
        else if (tileType === TILE_TYPES.WATER) spriteKey = 'tile_water';
        else if (tileType === TILE_TYPES.DEEP_WATER) spriteKey = 'tile_deep_water';
        else if (tileType === TILE_TYPES.FOREST) spriteKey = 'tile_forest';
        else if (tileType === TILE_TYPES.ROCK) spriteKey = 'tile_rock';
        else if (tileType === TILE_TYPES.GOLD) spriteKey = 'tile_gold';
        else if (tileType === TILE_TYPES.MUD) spriteKey = 'tile_mud';
        else if (tileType === TILE_TYPES.ROAD) spriteKey = 'tile_road';

        const sprite = this.assets.get(spriteKey);
        if (sprite) {
          ctx.drawImage(sprite, tx * tileSize, ty * tileSize, tileSize, tileSize);
        }
      }
    }
  }

  _renderBuildings(ctx) {
    for (const b of this.buildings) {
      if (!b.isAlive) continue;
      if (!this.fogOfWar.isWorldPosVisible(b.x, b.y)) continue;

      const pId = Math.max(0, b.ownerId);
      const spriteKey = `bld_${b.buildingType}_${pId}`;
      const sprite = this.assets.get(spriteKey);

      const px = b.originTileX * 32;
      const py = b.originTileY * 32;
      const w = b.widthTiles * 32;
      const h = b.heightTiles * 32;

      // Cień budynku
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y + h / 2 - 4, w / 2, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rysunek budynku
      if (sprite) {
        if (!b.isConstructed) {
          ctx.globalAlpha = 0.5 + 0.5 * (b.constructionProgress / 100);
        }
        ctx.drawImage(sprite, px, py, w, h);
        ctx.globalAlpha = 1.0;
      }

      // Selekcja i paski życia
      if (b.isSelected) {
        ctx.strokeStyle = '#42f57e';
        ctx.lineWidth = 2;
        ctx.strokeRect(px - 2, py - 2, w + 4, h + 4);

        // Pasek HP
        this._renderHealthBar(ctx, px, py - 8, w, b.hp, b.maxHp);
      }
    }
  }

  _renderUnits(ctx) {
    // Sortowanie jednostek po osi Y dla prawidłowej perspektywy głębi
    const sorted = [...this.units].sort((a, b) => a.y - b.y);

    for (const u of sorted) {
      if (!u.isAlive) continue;
      if (!this.fogOfWar.isWorldPosVisible(u.x, u.y)) continue;

      // Cień pod jednostką
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(u.x, u.y + u.radius - 2, u.radius, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wybór sprita
      let spriteKey = '';
      if (u.unitType === UNIT_TYPES.KROWA) spriteKey = 'unit_krowa';
      else if (u.unitType === UNIT_TYPES.WILK) spriteKey = 'unit_wilk';
      else {
        const pId = Math.max(0, u.ownerId);
        spriteKey = `unit_${u.unitType}_${pId}`;
      }

      const sprite = this.assets.get(spriteKey);
      if (sprite) {
        const size = (u.unitType === UNIT_TYPES.KONNY || u.unitType === UNIT_TYPES.KROWA) ? 32 : 24;
        ctx.drawImage(sprite, u.x - size / 2, u.y - size / 2, size, size);
      }

      // Pierścień zaznaczenia
      if (u.isSelected) {
        ctx.strokeStyle = u.ownerId === this.localPlayerId ? '#42f57e' : '#ff3b30';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(u.x, u.y + u.radius - 2, u.radius + 3, 5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Pasek HP nad jednostką
        this._renderHealthBar(ctx, u.x - 14, u.y - u.radius - 12, 28, u.hp, u.maxHp);
      }
    }
  }

  _renderHealthBar(ctx, x, y, width, hp, maxHp) {
    const percent = Math.max(0, Math.min(1, hp / maxHp));
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - 1, y - 1, width + 2, 5);
    ctx.fillStyle = percent > 0.5 ? '#42f57e' : (percent > 0.25 ? '#f5a442' : '#f54242');
    ctx.fillRect(x, y, width * percent, 3);
  }

  _renderProjectiles(ctx) {
    for (const p of this.projectiles.projectiles) {
      if (p.isDead) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      const sprite = this.assets.get(p.type === 'arrow' ? 'proj_arrow' : 'spell_thunder');
      if (sprite) {
        ctx.drawImage(sprite, -8, -8, 16, 16);
      }
      ctx.restore();
    }
  }

  _renderFogOfWar(ctx) {
    if (!this.fogOfWar.enabled) return;
    const cam = this.camera;
    const tileSize = this.map.tileSize;

    const minTx = Math.max(0, Math.floor(cam.x / tileSize));
    const maxTx = Math.min(this.map.width - 1, Math.ceil((cam.x + cam.viewportWidth / cam.zoom) / tileSize));
    const minTy = Math.max(0, Math.floor(cam.y / tileSize));
    const maxTy = Math.min(this.map.height - 1, Math.ceil((cam.y + cam.viewportHeight / cam.zoom) / tileSize));

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const vis = this.fogOfWar.getVisibility(tx, ty);
        if (vis === VISIBILITY.VISIBLE) continue;

        if (vis === VISIBILITY.HIDDEN) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(tx * tileSize, ty * tileSize, tileSize, tileSize);
        } else if (vis === VISIBILITY.EXPLORED) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.fillRect(tx * tileSize, ty * tileSize, tileSize, tileSize);
        }
      }
    }
  }

  _renderPlacementPreview(ctx) {
    if (!this.ui.buildMode) return;
    const tx = Math.floor(this.input.mousePos.worldX / 32);
    const ty = Math.floor(this.input.mousePos.worldY / 32);
    const canBuild = this.map.isBuildable(tx, ty, 2, 2);

    ctx.fillStyle = canBuild ? 'rgba(66, 245, 126, 0.4)' : 'rgba(245, 66, 66, 0.4)';
    ctx.fillRect(tx * 32, ty * 32, 64, 64);
    ctx.strokeStyle = canBuild ? '#42f57e' : '#f54242';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx * 32, ty * 32, 64, 64);
  }
}
