import { AI_PRESETS } from '../ai/AIPresets.js';

/**
 * AIScriptEditor - Narzędzie do pisania, testowania i zarządzania skryptami AI dla bota i jednostek.
 */
export class AIScriptEditor {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.currentScript = '';
    this.selectedPresetKey = 'BALANCED';
    this.logs = [];
  }

  loadPreset(presetKey) {
    if (AI_PRESETS[presetKey]) {
      this.selectedPresetKey = presetKey;
      return AI_PRESETS[presetKey];
    }
    return null;
  }

  testScriptSyntax(scriptCode) {
    try {
      // Test parsowania
      new Function('ai', 'player', 'state', `
        function rule(name, fn) { fn(ai, player, state); }
        ${scriptCode}
      `);
      return { success: true, message: 'Składnia skryptu poprawna!' };
    } catch (e) {
      return { success: false, message: `Błąd składni: ${e.message}` };
    }
  }

  applyScriptToAI(botPlayerId, scriptCode) {
    const syntaxTest = this.testScriptSyntax(scriptCode);
    if (!syntaxTest.success) return syntaxTest;

    const botController = this.gameEngine.aiControllers.find(c => c.playerId === botPlayerId);
    if (botController) {
      botController.scriptEngine.parseAndLoad(scriptCode);
      return { success: true, message: `Skrypt pomyślnie wgrany do Bota Gracza ${botPlayerId + 1}!` };
    }
    return { success: false, message: 'Nie znaleziono kontrolera bota.' };
  }

  exportScript(scriptCode, filename = 'skrypt_slowianie.js') {
    const blob = new Blob([scriptCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
