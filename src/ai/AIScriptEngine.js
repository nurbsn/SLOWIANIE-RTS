/**
 * AIScriptEngine - Silnik reguł behawioralnych AI pozwalający na modyfikowanie i tworzenie własnych skryptów.
 */
export class AIScriptEngine {
  constructor() {
    this.customRules = [];
  }

  // Domyślne reguły skryptowe
  getDefaultScript() {
    return `// Skrypt AI Słowian
// Reguły uruchamiane cyklicznie dla bota

rule("Zbieraj drewno gdy mało", function(ai, player, state) {
  if (player.wood < 100 && ai.getIdleWorkers().length > 0) {
    ai.assignIdleWorkersToWood();
  }
});

rule("Dój krowy gdy mało mleka", function(ai, player, state) {
  if (player.milk < 80 && ai.getIdleWorkers().length > 0) {
    ai.assignIdleWorkersToCows();
  }
});

rule("Buduj chatę wojów", function(ai, player, state) {
  if (player.wood >= 140 && player.milk >= 50 && !ai.hasBuilding("koszary")) {
    ai.tryBuildNearBase("koszary");
  }
});

rule("Szkol wojowników", function(ai, player, state) {
  if (player.milk >= 80 && player.wood >= 20 && player.currentPop < player.maxPop) {
    ai.trainUnitFrom("koszary", "woj");
  }
});

rule("Atakuj gdy armia gotowa", function(ai, player, state) {
  const army = ai.getCombatUnits();
  if (army.length >= ai.preset.attackThreshold) {
    const enemyBase = ai.findEnemyBase();
    if (enemyBase) {
      ai.orderAttack(army, enemyBase.x, enemyBase.y);
    }
  }
});
`;
  }

  parseAndLoad(scriptText) {
    this.customRules = [];
    const ruleRegex = /rule\s*\(\s*["']([^"']+)["']\s*,\s*function\s*\(([^)]*)\)\s*\{([\s\S]*?)\}\s*\);?/g;
    let match;

    while ((match = ruleRegex.exec(scriptText)) !== null) {
      const name = match[1];
      const body = match[3];
      try {
        const fn = new Function('ai', 'player', 'state', body);
        this.customRules.push({ name, fn });
      } catch (err) {
        console.error(`Błąd w regule AI "${name}":`, err);
      }
    }
  }

  execute(aiController, player, gameEngine) {
    const state = {
      gameTime: gameEngine.gameTime,
      unitsCount: gameEngine.units.filter(u => u.ownerId === player.id).length
    };

    for (const rule of this.customRules) {
      try {
        rule.fn(aiController, player, state);
      } catch (e) {
        // Kontynuuj w razie błędu pojedynczej reguły
      }
    }
  }
}
