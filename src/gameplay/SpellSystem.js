/**
 * SpellSystem - Obsługa czarów rzucanych przez Kapłanów / Żerców.
 */
export const SPELLS = {
  GROM_PERUNA: {
    id: 'grom_peruna',
    name: 'Grom Peruna',
    description: 'Poraża wrogów potężnym piorunem z niebios, zadając 60 obrażeń.',
    manaCost: 40,
    range: 180,
    radius: 40,
    damage: 60,
    icon: '⚡'
  },
  UZDROWIENIE: {
    id: 'uzdrowienie',
    name: 'Błogosławieństwo Swaroga',
    description: 'Uzdrawia pobliskie sojusznicze jednostki o 50 punktów życia.',
    manaCost: 35,
    range: 150,
    radius: 60,
    healAmount: 50,
    icon: '🌿'
  },
  PRZYZWANIE_WILKOW: {
    id: 'przyzwanie_wilkow',
    name: 'Zew Watahy',
    description: 'Przyzywa 2 dzikie wilki do walki u boku kapłana.',
    manaCost: 50,
    range: 100,
    icon: '🐺'
  },
  DESZCZ_OGNIA: {
    id: 'deszcz_ognia',
    name: 'Gniew Światowida',
    description: 'Zsyła deszcz płonących węgli, zadając obrażenia obszarowe.',
    manaCost: 70,
    range: 200,
    radius: 70,
    damage: 85,
    icon: '🔥'
  }
};

export class SpellSystem {
  static castSpell(spellId, casterUnit, targetX, targetY, gameEngine) {
    const spell = SPELLS[spellId];
    if (!spell || !casterUnit || !casterUnit.isAlive) return false;

    if (casterUnit.mana < spell.manaCost) {
      gameEngine.particles.spawnFloatingText(casterUnit.x, casterUnit.y - 14, 'Brak many!', '#33ccff');
      return false;
    }

    const dist = Math.hypot(casterUnit.x - targetX, casterUnit.y - targetY);
    if (dist > spell.range) {
      gameEngine.particles.spawnFloatingText(casterUnit.x, casterUnit.y - 14, 'Zbyt daleko!', '#ffaa33');
      return false;
    }

    // Pobierz manę
    casterUnit.mana -= spell.manaCost;

    if (spellId === 'grom_peruna') {
      gameEngine.sounds.playThunderSpell();
      gameEngine.particles.spawnMagicRing(targetX, targetY, '#00e1ff');

      // Obrażenia obszarowe
      for (const u of gameEngine.units) {
        if (u.isAlive && u.ownerId !== casterUnit.ownerId && Math.hypot(u.x - targetX, u.y - targetY) <= spell.radius) {
          u.takeDamage(spell.damage);
          gameEngine.particles.spawnFloatingText(u.x, u.y - 12, `-${spell.damage} Grom!`, '#00e1ff');
        }
      }
      for (const b of gameEngine.buildings) {
        if (b.isAlive && b.ownerId !== casterUnit.ownerId && Math.hypot(b.x - targetX, b.y - targetY) <= spell.radius) {
          b.takeDamage(spell.damage);
        }
      }
      return true;
    }

    if (spellId === 'uzdrowienie') {
      gameEngine.sounds.playHealSpell();
      gameEngine.particles.spawnMagicRing(targetX, targetY, '#42f57e');

      for (const u of gameEngine.units) {
        if (u.isAlive && u.ownerId === casterUnit.ownerId && Math.hypot(u.x - targetX, u.y - targetY) <= spell.radius) {
          const healed = u.heal(spell.healAmount);
          if (healed > 0) {
            gameEngine.particles.spawnFloatingText(u.x, u.y - 12, `+${healed}`, '#42f57e');
          }
        }
      }
      return true;
    }

    if (spellId === 'przyzwanie_wilkow') {
      gameEngine.sounds.playOrderConfirm();
      gameEngine.particles.spawnMagicRing(targetX, targetY, '#e67e22');

      gameEngine.spawnUnit(casterUnit.ownerId, 'wilk', targetX - 16, targetY);
      gameEngine.spawnUnit(casterUnit.ownerId, 'wilk', targetX + 16, targetY);
      gameEngine.particles.spawnFloatingText(targetX, targetY - 14, 'Wilki przybyły!', '#ffffff');
      return true;
    }

    if (spellId === 'deszcz_ognia') {
      gameEngine.sounds.playThunderSpell();
      gameEngine.particles.spawnMagicRing(targetX, targetY, '#ff3b30');

      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          if (!gameEngine.isRunning) return;
          const rx = targetX + (Math.random() * spell.radius * 2 - spell.radius);
          const ry = targetY + (Math.random() * spell.radius * 2 - spell.radius);
          gameEngine.particles.spawnBlood(rx, ry, 8);
        }, i * 80);
      }

      for (const u of gameEngine.units) {
        if (u.isAlive && u.ownerId !== casterUnit.ownerId && Math.hypot(u.x - targetX, u.y - targetY) <= spell.radius) {
          u.takeDamage(spell.damage);
          gameEngine.particles.spawnFloatingText(u.x, u.y - 12, `-${spell.damage}`, '#ff3b30');
        }
      }
      for (const b of gameEngine.buildings) {
        if (b.isAlive && b.ownerId !== casterUnit.ownerId && Math.hypot(b.x - targetX, b.y - targetY) <= spell.radius) {
          b.takeDamage(spell.damage);
        }
      }
      return true;
    }

    return false;
  }
}
