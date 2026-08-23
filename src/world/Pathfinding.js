/**
 * Pathfinding - Zoptymalizowany algorytm A* dla siatki kafelków 2D z omijaniem przeszkód.
 */
export class Pathfinding {
  constructor(gameMap) {
    this.map = gameMap;
  }

  // Wyszukuje ścieżkę od (startX, startY) do (endX, endY) w kafelkach
  findPath(startTx, startTy, endTx, endTy, maxSteps = 1500) {
    startTx = Math.floor(startTx);
    startTy = Math.floor(startTy);
    endTx = Math.floor(endTx);
    endTy = Math.floor(endTy);

    // Jeśli cel jest poza mapą lub ten sam kafelek
    if (startTx === endTx && startTy === endTy) return [{ x: endTx, y: endTy }];
    if (endTx < 0 || endTx >= this.map.width || endTy < 0 || endTy >= this.map.height) return [];

    // Jeśli cel jest nieprzechodni (np. drzewo/budynek), znajdź najbliższy wolny sąsiadujący kafelek
    if (!this.map.isWalkable(endTx, endTy)) {
      const neighbors = this.getNeighbors(endTx, endTy);
      let closest = null;
      let minD = Infinity;
      for (const n of neighbors) {
        if (this.map.isWalkable(n.x, n.y)) {
          const d = Math.hypot(n.x - startTx, n.y - startTy);
          if (d < minD) {
            minD = d;
            closest = n;
          }
        }
      }
      if (closest) {
        endTx = closest.x;
        endTy = closest.y;
      } else {
        return [];
      }
    }

    const openList = [];
    const closedSet = new Uint8Array(this.map.width * this.map.height);
    const gScores = new Float32Array(this.map.width * this.map.height).fill(Infinity);
    const cameFrom = new Int32Array(this.map.width * this.map.height).fill(-1);

    const startIdx = startTy * this.map.width + startTx;
    const endIdx = endTy * this.map.width + endTx;

    gScores[startIdx] = 0;
    const startH = this.heuristic(startTx, startTy, endTx, endTy);
    openList.push({ idx: startIdx, x: startTx, y: startTy, f: startH });

    let steps = 0;

    while (openList.length > 0 && steps < maxSteps) {
      steps++;
      // Pobierz węzeł o najmniejszym f
      let lowestIdx = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[lowestIdx].f) {
          lowestIdx = i;
        }
      }

      const current = openList.splice(lowestIdx, 1)[0];

      if (current.idx === endIdx) {
        return this.reconstructPath(cameFrom, current.idx);
      }

      closedSet[current.idx] = 1;

      const neighbors = this.getNeighbors(current.x, current.y);
      for (const n of neighbors) {
        const nIdx = n.y * this.map.width + n.x;
        if (closedSet[nIdx]) continue;
        if (!this.map.isWalkable(n.x, n.y)) continue;

        // Zapobieganie ścinaniu rogów przy ruchu po przekątnej
        if (n.x !== current.x && n.y !== current.y) {
          if (!this.map.isWalkable(current.x, n.y) || !this.map.isWalkable(n.x, current.y)) {
            continue;
          }
        }

        const moveCost = (n.x !== current.x && n.y !== current.y) ? 1.414 : 1.0;
        const tentativeG = gScores[current.idx] + moveCost;

        if (tentativeG < gScores[nIdx]) {
          cameFrom[nIdx] = current.idx;
          gScores[nIdx] = tentativeG;
          const f = tentativeG + this.heuristic(n.x, n.y, endTx, endTy);

          const existing = openList.find(item => item.idx === nIdx);
          if (existing) {
            existing.f = f;
          } else {
            openList.push({ idx: nIdx, x: n.x, y: n.y, f: f });
          }
        }
      }
    }

    return []; // Brak ścieżki
  }

  heuristic(x1, y1, x2, y2) {
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);
    return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); // Octile distance
  }

  getNeighbors(x, y) {
    const neighbors = [];
    const dirs = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    for (const d of dirs) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx >= 0 && nx < this.map.width && ny >= 0 && ny < this.map.height) {
        neighbors.push({ x: nx, y: ny });
      }
    }
    return neighbors;
  }

  reconstructPath(cameFrom, currentIdx) {
    const path = [];
    let curr = currentIdx;
    while (curr !== -1) {
      const x = curr % this.map.width;
      const y = Math.floor(curr / this.map.width);
      path.unshift({ x, y });
      curr = cameFrom[curr];
    }
    return path;
  }
}
