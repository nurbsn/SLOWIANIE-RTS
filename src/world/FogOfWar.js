/**
 * FogOfWar - Dwupoziomowa mgła wojny w stylu klasycznych RTS (nieodkryte / odkryte / w polu widzenia).
 */
export const VISIBILITY = {
  HIDDEN: 0,    // Zupełnie czarny (nieodkryty)
  EXPLORED: 1,  // Odkryty wcześniej, widoczna rzeźba terenu, brak widoczności jednostek
  VISIBLE: 2    // Aktualnie widoczny przez własne jednostki i budynki
};

export class FogOfWar {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.visibility = new Uint8Array(width * height); // Aktualny stan
    this.enabled = true;
  }

  reset(enabled = true) {
    this.enabled = enabled;
    if (!enabled) {
      this.visibility.fill(VISIBILITY.VISIBLE);
    } else {
      this.visibility.fill(VISIBILITY.HIDDEN);
    }
  }

  getIndex(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return -1;
    return ty * this.width + tx;
  }

  getVisibility(tx, ty) {
    if (!this.enabled) return VISIBILITY.VISIBLE;
    const idx = this.getIndex(tx, ty);
    return idx !== -1 ? this.visibility[idx] : VISIBILITY.HIDDEN;
  }

  // Przygotowanie nowej klatki widoczności (widoczne stają się odkryte)
  startUpdate() {
    if (!this.enabled) return;
    for (let i = 0; i < this.visibility.length; i++) {
      if (this.visibility[i] === VISIBILITY.VISIBLE) {
        this.visibility[i] = VISIBILITY.EXPLORED;
      }
    }
  }

  // Rozjaśnienie pola widzenia wokół jednostki / budynku gracza
  revealCircle(centerTx, centerTy, sightRadius) {
    if (!this.enabled) return;
    const r = Math.ceil(sightRadius);
    const rSq = sightRadius * sightRadius;

    const minX = Math.max(0, centerTx - r);
    const maxX = Math.min(this.width - 1, centerTx + r);
    const minY = Math.max(0, centerTy - r);
    const maxY = Math.min(this.height - 1, centerTy + r);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - centerTx;
        const dy = y - centerTy;
        if (dx * dx + dy * dy <= rSq) {
          const idx = y * this.width + x;
          this.visibility[idx] = VISIBILITY.VISIBLE;
        }
      }
    }
  }

  // Sprawdza czy dany punkt na świecie jest aktualnie widoczny
  isWorldPosVisible(worldX, worldY, tileSize = 32) {
    if (!this.enabled) return true;
    const tx = Math.floor(worldX / tileSize);
    const ty = Math.floor(worldY / tileSize);
    return this.getVisibility(tx, ty) === VISIBILITY.VISIBLE;
  }
}
