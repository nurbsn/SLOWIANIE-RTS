/**
 * AIPresets - Profile zachowań sztucznej inteligencji o różnym stopniu trudności i stylu walki.
 */
export const AI_PRESETS = {
  BALANCED: {
    id: 'balanced',
    name: 'Zrównoważony Słowianin',
    description: 'Równomiernie rozwija gospodarkę krów i lasu, po czym szkoli zbalansowaną armię.',
    difficulty: 'Normalny',
    workerRatio: 0.35,
    attackThreshold: 8,
    preferredUnits: ['woj', 'lucznik', 'konny'],
    retreatHpPercent: 0.25,
    buildOrder: ['drwal', 'obora', 'koszary', 'swiatynia', 'wieza']
  },
  AGGRESSIVE: {
    id: 'aggressive',
    name: 'Wojowniczy Wódz (Rasz)',
    description: 'Szybko stawia koszary, szkoli wojów i bezlitośnie najeżdża osady przeciwnika.',
    difficulty: 'Trudny',
    workerRatio: 0.25,
    attackThreshold: 4,
    preferredUnits: ['woj', 'lucznik'],
    retreatHpPercent: 0.1,
    buildOrder: ['koszary', 'obora', 'wieza', 'drwal']
  },
  PRIEST_MAGIC: {
    id: 'priest_magic',
    name: 'Żerca Świętego Gaju',
    description: 'Skupia się na świątyniach, generowaniu wiary, kapłanach i czarach obszarowych.',
    difficulty: 'Trudny',
    workerRatio: 0.3,
    attackThreshold: 6,
    preferredUnits: ['kaplan', 'woj', 'konny'],
    retreatHpPercent: 0.35,
    buildOrder: ['obora', 'koszary', 'swiatynia', 'swiatynia', 'wieza']
  },
  TURTLE: {
    id: 'turtle',
    name: 'Obrońca Grodu (Twierdza)',
    description: 'Otacza bazę wieżami obronnymi i palisadami, gromadzi wielkie stada krów i uderza z zaskoczenia.',
    difficulty: 'Średni',
    workerRatio: 0.45,
    attackThreshold: 14,
    preferredUnits: ['lucznik', 'konny', 'woj'],
    retreatHpPercent: 0.4,
    buildOrder: ['drwal', 'obora', 'wieza', 'wieza', 'koszary', 'swiatynia']
  }
};
