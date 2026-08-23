/**
 * Camera - Obsługa widoku kamery, skalowania, przesuwania myszą i klawiaturą oraz transformacji współrzędnych.
 */
export class Camera {
  constructor(canvasWidth, canvasHeight, mapWidthPx, mapHeightPx) {
    this.x = 0;
    this.y = 0;
    this.viewportWidth = canvasWidth;
    this.viewportHeight = canvasHeight;
    this.mapWidthPx = mapWidthPx;
    this.mapHeightPx = mapHeightPx;
    this.zoom = 1.0;
    this.minZoom = 0.75;
    this.maxZoom = 2.0;
    this.scrollSpeed = 16;
    this.edgePanMargin = 20;
    this.edgePanEnabled = true;
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
    this.clamp();
  }

  setMapSize(widthPx, heightPx) {
    this.mapWidthPx = widthPx;
    this.mapHeightPx = heightPx;
    this.clamp();
  }

  centerOn(worldX, worldY) {
    this.x = worldX - (this.viewportWidth / 2) / this.zoom;
    this.y = worldY - (this.viewportHeight / 2) / this.zoom;
    this.clamp();
  }

  move(dx, dy) {
    this.x += dx / this.zoom;
    this.y += dy / this.zoom;
    this.clamp();
  }

  clamp() {
    const visibleW = this.viewportWidth / this.zoom;
    const visibleH = this.viewportHeight / this.zoom;

    if (this.mapWidthPx > visibleW) {
      this.x = Math.max(0, Math.min(this.mapWidthPx - visibleW, this.x));
    } else {
      this.x = (this.mapWidthPx - visibleW) / 2;
    }

    if (this.mapHeightPx > visibleH) {
      this.y = Math.max(0, Math.min(this.mapHeightPx - visibleH, this.y));
    } else {
      this.y = (this.mapHeightPx - visibleH) / 2;
    }
  }

  handleZoom(delta, cursorScreenX, cursorScreenY) {
    const oldZoom = this.zoom;
    const factor = delta > 0 ? 0.9 : 1.1;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));

    // Skalowanie z zachowaniem punktu pod kursorem
    const worldX = this.x + cursorScreenX / oldZoom;
    const worldY = this.y + cursorScreenY / oldZoom;
    this.x = worldX - cursorScreenX / this.zoom;
    this.y = worldY - cursorScreenY / this.zoom;
    this.clamp();
  }

  screenToWorld(screenX, screenY) {
    return {
      x: this.x + screenX / this.zoom,
      y: this.y + screenY / this.zoom
    };
  }

  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.x) * this.zoom,
      y: (worldY - this.y) * this.zoom
    };
  }

  updateEdgePan(mouseX, mouseY) {
    if (!this.edgePanEnabled) return;
    let dx = 0;
    let dy = 0;
    if (mouseX < this.edgePanMargin) dx -= this.scrollSpeed;
    if (mouseX > this.viewportWidth - this.edgePanMargin) dx += this.scrollSpeed;
    if (mouseY < this.edgePanMargin) dy -= this.scrollSpeed;
    if (mouseY > this.viewportHeight - this.edgePanMargin) dy += this.scrollSpeed;

    if (dx !== 0 || dy !== 0) {
      this.move(dx, dy);
    }
  }
}
