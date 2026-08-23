/**
 * Map - Siatka świata gry, kafelki terenu, surowce (las, złoto, trawa) i zarządzanie kolizjami.
 */
export const TILE_TYPES = {
  GRASS: 0,
  GRAZED: 1,
  WATER: 2,
  DEEP_WATER: 3,
  FOREST: 4,
  ROCK: 5,
  GOLD: 6,
  MUD: 7,
  ROAD: 8
};

export const TILE_PROPERTIES = {
  [TILE_TYPES.GRASS]: { name: 'Trawa', walkable: true, buildable: true, sprite: 'tile_grass', speed: 1.0 },
  [TILE_TYPES.GRAZED]: { name: 'Zjedzona trawa', walkable: true, buildable: true, sprite: 'tile_grazed', speed: 1.0 },
  [TILE_TYPES.WATER]: { name: 'Płytka woda', walkable: false, buildable: false, sprite: 'tile_water', speed: 0 },
  [TILE_TYPES.DEEP_WATER]: { name: 'Głęboka woda', walkable: false, buildable: false, sprite: 'tile_deep_water', speed: 0 },
  [TILE_TYPES.FOREST]: { name: 'Las (Drewno)', walkable: false, buildable: false, sprite: 'tile_forest', speed: 0, resource: 'wood', defaultAmount: 150 },
  [TILE_TYPES.ROCK]: { name: 'Skała', walkable: false, buildable: false, sprite: 'tile_rock', speed: 0 },
  [TILE_TYPES.GOLD]: { name: 'Złoże złota', walkable: false, buildable: false, sprite: 'tile_gold', speed: 0, resource: 'gold', defaultAmount: 800 },
  [TILE_TYPES.MUD]: { name: 'Błoto / Bagno', walkable: true, buildable: false, sprite: 'tile_mud', speed: 0.6 },
  [TILE_TYPES.ROAD]: { name: 'Trakt / Droga', walkable: true, buildable: true, sprite: 'tile_road', speed: 1.25 }
};

export class GameMap {
  constructor(width = 64, height = 64, tileSize = 32) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.tiles = new Uint8Array(width * height);
    this.resourceAmounts = new Int16Array(width * height);
    this.regrowTimers = new Float32Array(width * height); // Czas odrastania trawy po wypasie krowy
    this.startingPositions = []; // [{x, y, playerId}]
    this.name = 'Nowa Kraina';
    this.description = 'Dzika słowiańska puszcza pełna rzek i bujnych łąk.';
    this.triggers = []; // Strefy wyzwalaczy dla kampanii / edytora
  }

  get widthPx() {
    return this.width * this.tileSize;
  }

  get heightPx() {
    return this.height * this.tileSize;
  }

  getIndex(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return -1;
    return ty * this.width + tx;
  }

  getTile(tx, ty) {
    const idx = this.getIndex(tx, ty);
    return idx !== -1 ? this.tiles[idx] : TILE_TYPES.ROCK;
  }

  setTile(tx, ty, type) {
    const idx = this.getIndex(tx, ty);
    if (idx !== -1) {
      this.tiles[idx] = type;
      const prop = TILE_PROPERTIES[type];
      if (prop && prop.defaultAmount) {
        this.resourceAmounts[idx] = prop.defaultAmount;
      } else {
        this.resourceAmounts[idx] = 0;
      }
    }
  }

  isWalkable(tx, ty) {
    const type = this.getTile(tx, ty);
    const prop = TILE_PROPERTIES[type];
    return prop ? prop.walkable : false;
  }

  isBuildable(tx, ty, widthInTiles = 1, heightInTiles = 1) {
    for (let dy = 0; dy < heightInTiles; dy++) {
      for (let dx = 0; dx < widthInTiles; dx++) {
        const type = this.getTile(tx + dx, ty + dy);
        const prop = TILE_PROPERTIES[type];
        if (!prop || !prop.buildable) return false;
      }
    }
    return true;
  }

  harvestWood(tx, ty, amount) {
    const idx = this.getIndex(tx, ty);
    if (idx === -1 || this.tiles[idx] !== TILE_TYPES.FOREST) return 0;

    const current = this.resourceAmounts[idx];
    const harvested = Math.min(current, amount);
    this.resourceAmounts[idx] -= harvested;

    // Gdy drzewo zostanie całkowicie ścięte, pole staje się wolną trawą!
    if (this.resourceAmounts[idx] <= 0) {
      this.tiles[idx] = TILE_TYPES.GRASS;
      this.resourceAmounts[idx] = 0;
    }
    return harvested;
  }

  harvestGold(tx, ty, amount) {
    const idx = this.getIndex(tx, ty);
    if (idx === -1 || this.tiles[idx] !== TILE_TYPES.GOLD) return 0;

    const current = this.resourceAmounts[idx];
    const harvested = Math.min(current, amount);
    this.resourceAmounts[idx] -= harvested;

    if (this.resourceAmounts[idx] <= 0) {
      this.tiles[idx] = TILE_TYPES.ROCK;
      this.resourceAmounts[idx] = 0;
    }
    return harvested;
  }

  grazeTile(tx, ty) {
    const idx = this.getIndex(tx, ty);
    if (idx === -1) return false;

    if (this.tiles[idx] === TILE_TYPES.GRASS) {
      this.tiles[idx] = TILE_TYPES.GRAZED;
      this.regrowTimers[idx] = 45.0; // 45 sekund na odrośnięcie soczystej trawy
      return true;
    }
    return false;
  }

  update(deltaTime) {
    // Aktualizacja odrastania trawy
    for (let i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i] === TILE_TYPES.GRAZED) {
        this.regrowTimers[i] -= deltaTime;
        if (this.regrowTimers[i] <= 0) {
          this.tiles[i] = TILE_TYPES.GRASS;
        }
      }
    }
  }

  // Proceduralny generator mapy w słowiańskim klimacie (lasy, rzeki, polany)
  generateDefault(seed = 12345) {
    this.tiles.fill(TILE_TYPES.GRASS);
    this.resourceAmounts.fill(0);

    // Krawędzie mapy otoczone nieprzebytymi górami/skałami
    for (let x = 0; x < this.width; x++) {
      this.setTile(x, 0, TILE_TYPES.ROCK);
      this.setTile(x, this.height - 1, TILE_TYPES.ROCK);
    }
    for (let y = 0; y < this.height; y++) {
      this.setTile(0, y, TILE_TYPES.ROCK);
      this.setTile(this.width - 1, y, TILE_TYPES.ROCK);
    }

    // Dodanie rzeki meandrującej przez środek
    const riverY = Math.floor(this.height / 2);
    for (let x = 2; x < this.width - 2; x++) {
      const offset = Math.floor(Math.sin(x * 0.3) * 3);
      const ry = riverY + offset;
      this.setTile(x, ry, TILE_TYPES.WATER);
      this.setTile(x, ry + 1, TILE_TYPES.WATER);
      // Płytki bród (możliwość przejścia)
      if (x === 16 || x === 32 || x === 48) {
        this.setTile(x, ry, TILE_TYPES.ROAD);
        this.setTile(x, ry + 1, TILE_TYPES.ROAD);
      }
    }

    // Kępy lasów (Puszcza)
    const forestSpots = [
      { x: 8, y: 8, r: 5 },
      { x: 50, y: 10, r: 6 },
      { x: 10, y: 48, r: 6 },
      { x: 52, y: 50, r: 5 },
      { x: 30, y: 15, r: 4 },
      { x: 34, y: 45, r: 4 }
    ];

    forestSpots.forEach(spot => {
      for (let dy = -spot.r; dy <= spot.r; dy++) {
        for (let dx = -spot.r; dx <= spot.r; dx++) {
          if (dx * dx + dy * dy <= spot.r * spot.r) {
            const tx = spot.x + dx;
            const ty = spot.y + dy;
            if (tx > 1 && tx < this.width - 2 && ty > 1 && ty < this.height - 2) {
              if (this.getTile(tx, ty) === TILE_TYPES.GRASS) {
                this.setTile(tx, ty, TILE_TYPES.FOREST);
              }
            }
          }
        }
      }
    });

    // Złoża złota
    const goldSpots = [
      { x: 14, y: 12 }, { x: 15, y: 12 }, { x: 14, y: 13 },
      { x: 46, y: 14 }, { x: 47, y: 14 },
      { x: 16, y: 46 }, { x: 17, y: 46 },
      { x: 48, y: 48 }, { x: 49, y: 48 }
    ];
    goldSpots.forEach(g => {
      if (g.x > 0 && g.x < this.width && g.y > 0 && g.y < this.height) {
        this.setTile(g.x, g.y, TILE_TYPES.GOLD);
      }
    });

    // Pozycje startowe graczy
    this.startingPositions = [
      { playerId: 0, x: 10, y: 18, name: 'Gród Południowy (Gracz)' },
      { playerId: 1, x: 50, y: 40, name: 'Gród Północny (Wróg)' }
    ];
  }

  // Serializacja do JSON dla edytora map i zapisu
  serialize() {
    return JSON.stringify({
      name: this.name,
      description: this.description,
      width: this.width,
      height: this.height,
      tiles: Array.from(this.tiles),
      resources: Array.from(this.resourceAmounts),
      startingPositions: this.startingPositions,
      triggers: this.triggers
    });
  }

  deserialize(jsonString) {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      this.name = data.name || 'Wczytana Mapa';
      this.description = data.description || '';
      this.width = data.width;
      this.height = data.height;
      this.tiles = new Uint8Array(data.tiles);
      this.resourceAmounts = new Int16Array(data.resources || (this.width * this.height));
      this.regrowTimers = new Float32Array(this.width * this.height);
      this.startingPositions = data.startingPositions || [];
      this.triggers = data.triggers || [];
      return true;
    } catch (e) {
      console.error("Błąd podczas deserializacji mapy:", e);
      return false;
    }
  }
}
