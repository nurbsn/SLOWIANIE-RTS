/**
 * Player - Reprezentacja gracza (człowiek lub bot AI), zarządzanie zasobami i limitem populacji.
 */
export class Player {
  constructor(id, name, color, isAI = false, team = 0) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.isAI = isAI;
    this.team = team;

    // Słowiańskie surowce (Polanie style)
    this.milk = 150;   // Mleko - pożywienie, rekrutacja i podstawa rozwoju
    this.wood = 250;   // Drewno - budynki, obrona, narzędzia
    this.gold = 50;    // Kruszec / Złoto - zaawansowana broń, pancerze, kapłani
    this.faith = 0;    // Wiara / Mana świątynna - potężne czary bóstw

    this.currentPop = 0;
    this.maxPop = 10;
    this.isDefeated = false;

    // Drzewko ulepszeń (badania)
    this.upgrades = {
      sharpAxes: false,       // +2 do szybkości zbierania drewna i ataku kmieci
      ironShields: false,     // +2 pancerza dla wojów i jazdy
      compositeBows: false,   // +30 do zasięgu łuczników
      perunBlessing: false    // +50 max many dla kapłanów i szybsza regeneracja
    };
  }

  addMilk(amount) {
    this.milk = Math.max(0, Math.floor(this.milk + amount));
  }

  addWood(amount) {
    this.wood = Math.max(0, Math.floor(this.wood + amount));
  }

  addGold(amount) {
    this.gold = Math.max(0, Math.floor(this.gold + amount));
  }

  addFaith(amount) {
    this.faith = Math.max(0, Math.min(300, Math.floor(this.faith + amount)));
  }

  canAfford(cost) {
    if (!cost) return true;
    if (cost.milk && this.milk < cost.milk) return false;
    if (cost.wood && this.wood < cost.wood) return false;
    if (cost.gold && this.gold < cost.gold) return false;
    if (cost.faith && this.faith < cost.faith) return false;
    return true;
  }

  payCost(cost) {
    if (!this.canAfford(cost)) return false;
    if (cost.milk) this.milk -= cost.milk;
    if (cost.wood) this.wood -= cost.wood;
    if (cost.gold) this.gold -= cost.gold;
    if (cost.faith) this.faith -= cost.faith;
    return true;
  }

  refundCost(cost) {
    if (!cost) return;
    if (cost.milk) this.milk += cost.milk;
    if (cost.wood) this.wood += cost.wood;
    if (cost.gold) this.gold += cost.gold;
    if (cost.faith) this.faith += cost.faith;
  }

  recalculatePopulation(units, buildings) {
    let pop = 0;
    let max = 0;

    for (const u of units) {
      if (u.ownerId === this.id && u.isAlive && !u.isNeutralAnimal) {
        pop += 1;
      }
    }

    for (const b of buildings) {
      if (b.ownerId === this.id && b.isAlive && b.isConstructed) {
        if (b.buildingType === 'grod') max += 10;
        if (b.buildingType === 'obora') max += 5;
      }
    }

    this.currentPop = pop;
    this.maxPop = Math.min(100, Math.max(10, max)); // Max 100 limit populacji
  }
}
