import { BUILDING_TYPES, BUILDING_CONFIGS } from '../entities/Building.js';
import { UNIT_TYPES, UNIT_CONFIGS } from '../entities/Unit.js';

/**
 * TechTree - Drzewo technologiczne, koszty, wymagania budynków i jednostek.
 */
export const TECH_UPGRADES = {
  SHARP_AXES: {
    id: 'sharpAxes',
    name: 'Żelazne Topory',
    description: 'Zwiększa prędkość wycinki lasu przez Kmieci o 30% i siłę ich ataku o +3.',
    cost: { wood: 100, gold: 50 },
    researchTime: 15
  },
  IRON_SHIELDS: {
    id: 'ironShields',
    name: 'Dębowe Tarcze z Okuciem',
    description: 'Zwiększa pancerz Wojów i Jazdy o +2.',
    cost: { wood: 120, gold: 80 },
    researchTime: 20
  },
  COMPOSITE_BOWS: {
    id: 'compositeBows',
    name: 'Łuki Cisowe',
    description: 'Zwiększa zasięg strzału Łuczników o 40 pikseli i obrażenia o +3.',
    cost: { wood: 150, gold: 60 },
    researchTime: 20
  },
  PERUN_BLESSING: {
    id: 'perunBlessing',
    name: 'Łaska Gromowładnego Peruna',
    description: 'Zwiększa maksymalną manę Kapłanów do 150 i przyspiesza jej regenerację.',
    cost: { faith: 60, gold: 100 },
    researchTime: 25
  }
};

export class TechTree {
  static getBuildingCost(buildingType) {
    const config = BUILDING_CONFIGS[buildingType];
    return config ? config.cost : { milk: 0, wood: 0, gold: 0 };
  }

  static getUnitCost(unitType) {
    const config = UNIT_CONFIGS[unitType];
    return config ? config.cost : { milk: 0, wood: 0, gold: 0 };
  }

  static canBuildBuilding(player, buildingType, existingBuildings) {
    // Sprawdź czy gracza stać
    const cost = this.getBuildingCost(buildingType);
    if (!player.canAfford(cost)) return { allowed: false, reason: 'Brak surowców' };

    // Wymagania technologiczne
    if (buildingType === BUILDING_TYPES.KOSZARY || buildingType === BUILDING_TYPES.OBORA) {
      const hasGrod = existingBuildings.some(b => b.ownerId === player.id && b.buildingType === BUILDING_TYPES.GROD && b.isConstructed);
      if (!hasGrod) return { allowed: false, reason: 'Wymaga Grodu' };
    }

    if (buildingType === BUILDING_TYPES.SWIATYNIA) {
      const hasKoszary = existingBuildings.some(b => b.ownerId === player.id && b.buildingType === BUILDING_TYPES.KOSZARY && b.isConstructed);
      if (!hasKoszary) return { allowed: false, reason: 'Wymaga Koszar' };
    }

    return { allowed: true };
  }

  static canTrainUnit(player, unitType) {
    const cost = this.getUnitCost(unitType);
    if (!player.canAfford(cost)) return { allowed: false, reason: 'Brak surowców' };
    if (player.currentPop >= player.maxPop && unitType !== UNIT_TYPES.KROWA) {
      return { allowed: false, reason: 'Osiągnięto limit ludności (zbuduj Oborę lub Gród)' };
    }
    return { allowed: true };
  }
}
