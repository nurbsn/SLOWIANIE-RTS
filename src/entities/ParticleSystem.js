/**
 * ParticleSystem - Efekty wizualne (krew, iskry, dym, wióry drewna, unoszący się tekst walki).
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
  }

  spawnBlood(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 40 + 10;
      this.particles.push({
        x: x + (Math.random() * 8 - 4),
        y: y + (Math.random() * 8 - 4),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.3 ? '#a81313' : '#6b0a0a',
        size: Math.random() * 3 + 2,
        life: 0.4,
        maxLife: 0.4
      });
    }
  }

  spawnWoodSplinters(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 30 + 10;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#cfa265',
        size: Math.random() * 2 + 1,
        life: 0.35,
        maxLife: 0.35
      });
    }
  }

  spawnDust(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 15 + 5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#a39886',
        size: Math.random() * 4 + 2,
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  spawnMagicRing(x, y, color = '#42cbf5') {
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const speed = 40;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        size: 3,
        life: 0.6,
        maxLife: 0.6
      });
    }
  }

  spawnFloatingText(x, y, text, color = '#ffffff') {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      vy: -25, // Unoszenie się w górę
      life: 1.0,
      maxLife: 1.0
    });
  }

  update(deltaTime) {
    // Aktualizacja cząstek
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Aktualizacja unoszącego się tekstu
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * deltaTime;
      ft.life -= deltaTime;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    // Rysowanie cząstek
    for (const p of this.particles) {
      const screen = camera.worldToScreen(p.x, p.y);
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;
      ctx.fillRect(screen.x - p.size / 2, screen.y - p.size / 2, p.size * camera.zoom, p.size * camera.zoom);
    }

    // Rysowanie unoszącego się tekstu
    ctx.font = `bold ${Math.floor(13 * camera.zoom)}px 'Segoe UI', Tahoma, sans-serif`;
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      const screen = camera.worldToScreen(ft.x, ft.y);
      const alpha = ft.life / ft.maxLife;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, screen.x, screen.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, screen.x, screen.y);
    }

    ctx.globalAlpha = 1.0;
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}
