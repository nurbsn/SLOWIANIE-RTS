import { AI_PRESETS } from '../ai/AIPresets.js';

/**
 * MenuManager - Obsługa przełączania ekranów menu głównego, potyczki, kampanii, multiplayer i edytorów.
 */
export class MenuManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.currentScreen = 'main-menu';
    this.screens = [
      'main-menu',
      'skirmish-menu',
      'campaign-menu',
      'multiplayer-menu',
      'map-editor-menu',
      'campaign-editor-menu',
      'ai-editor-menu',
      'game-hud',
      'pause-modal',
      'game-over-modal'
    ];
  }

  init() {
    this._attachMenuButtons();
    this.showScreen('main-menu');
  }

  showScreen(screenId) {
    this.currentScreen = screenId;
    this.screens.forEach(s => {
      const el = document.getElementById(s);
      if (el) {
        el.style.display = (s === screenId) ? 'flex' : 'none';
      }
    });

    const canvas = document.getElementById('game-canvas');
    if (screenId === 'game-hud') {
      if (canvas) canvas.style.display = 'block';
    }

    this.gameEngine.sounds.playClick();
  }

  _attachMenuButtons() {
    // 1. MENU GŁÓWNE
    this._on('btn-menu-campaign', () => this.openCampaignMenu());
    this._on('btn-menu-skirmish', () => this.openSkirmishMenu());
    this._on('btn-menu-multiplayer', () => this.openMultiplayerMenu());
    this._on('btn-menu-map-editor', () => this.openMapEditor());
    this._on('btn-menu-campaign-editor', () => this.openCampaignEditor());
    this._on('btn-menu-ai-editor', () => this.openAIScriptEditor());

    // 2. POWROTY DO MENU GŁÓWNEGO
    document.querySelectorAll('.btn-back-main').forEach(btn => {
      btn.addEventListener('click', () => {
        this.gameEngine.stopGame();
        this.showScreen('main-menu');
      });
    });

    // 3. POTYCZKA (SKIRMISH)
    this._on('btn-start-skirmish', () => {
      const aiDiff = document.getElementById('skirmish-ai-diff')?.value || 'BALANCED';
      const mapSize = parseInt(document.getElementById('skirmish-map-size')?.value || '64', 10);
      this.gameEngine.startSkirmish(mapSize, aiDiff);
      this.showScreen('game-hud');
    });

    // 4. KAMPANIA
    this._on('btn-start-mission', () => {
      const selectedMission = parseInt(document.getElementById('campaign-mission-select')?.value || '0', 10);
      this.gameEngine.campaign.startMission(selectedMission);
      this.showScreen('game-hud');
    });

    // 5. MULTIPLAYER
    this._on('btn-host-multiplayer', async () => {
      const name = document.getElementById('mp-player-name')?.value || 'Wódz_Polan';
      const result = await this.gameEngine.network.createRoom(name);
      const codeDisplay = document.getElementById('mp-host-code-display');
      if (codeDisplay) codeDisplay.textContent = `Kod Pokoju: ${result.roomCode} (Peer: ${result.peerId})`;
    });

    this._on('btn-join-multiplayer', async () => {
      const hostId = document.getElementById('mp-join-peer-id')?.value;
      const name = document.getElementById('mp-player-name')?.value || 'Gość_Słowianin';
      if (hostId) {
        await this.gameEngine.network.joinRoom(hostId, name);
      }
    });

    this._on('btn-mp-start-game', () => {
      this.gameEngine.network.startGame();
      this.showScreen('game-hud');
    });

    // 6. EDYTOR MAPY
    this._on('btn-editor-export', () => {
      this.gameEngine.mapEditor.exportMap();
    });

    this._on('btn-editor-playtest', () => {
      this.gameEngine.mapEditor.deactivate();
      this.gameEngine.startPlaytest();
      this.showScreen('game-hud');
    });

    // 7. EDYTOR SKRYPTÓW AI
    this._on('btn-ai-apply', () => {
      const code = document.getElementById('ai-script-textarea')?.value;
      const res = this.gameEngine.aiScriptEditor.applyScriptToAI(1, code);
      alert(res.message);
    });

    this._on('btn-ai-test-syntax', () => {
      const code = document.getElementById('ai-script-textarea')?.value;
      const res = this.gameEngine.aiScriptEditor.testScriptSyntax(code);
      alert(res.message);
    });

    // 8. PAUZA / OPCJE
    this._on('btn-resume-game', () => {
      this.gameEngine.isPaused = false;
      document.getElementById('pause-modal').style.display = 'none';
    });

    this._on('btn-quit-match', () => {
      this.gameEngine.stopGame();
      document.getElementById('pause-modal').style.display = 'none';
      this.showScreen('main-menu');
    });

    // Suwaki głośności
    const sfxSlider = document.getElementById('slider-sfx-volume');
    if (sfxSlider) {
      sfxSlider.addEventListener('input', (e) => {
        this.gameEngine.sounds.setSfxVolume(parseFloat(e.target.value));
      });
    }

    const musicSlider = document.getElementById('slider-music-volume');
    if (musicSlider) {
      musicSlider.addEventListener('input', (e) => {
        this.gameEngine.sounds.setMusicVolume(parseFloat(e.target.value));
      });
    }
  }

  _on(elemId, handler) {
    const el = document.getElementById(elemId);
    if (el) el.addEventListener('click', handler);
  }

  openCampaignMenu() {
    this.showScreen('campaign-menu');
    const select = document.getElementById('campaign-mission-select');
    const briefingText = document.getElementById('campaign-briefing-text');
    if (select) {
      select.innerHTML = '';
      this.gameEngine.campaign.campaign.missions.forEach((m, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = m.title;
        opt.disabled = idx > this.gameEngine.campaign.unlockedMissionIndex;
        select.appendChild(opt);
      });

      const updateBriefing = () => {
        const m = this.gameEngine.campaign.campaign.missions[select.value];
        if (m && briefingText) {
          briefingText.innerHTML = `<h3>${m.title}</h3><p>${m.briefing}</p><h4>Cele misji:</h4><ul>${m.objectives.map(o => `<li>${o}</li>`).join('')}</ul>`;
        }
      };

      select.onchange = updateBriefing;
      updateBriefing();
    }
  }

  openSkirmishMenu() {
    this.showScreen('skirmish-menu');
  }

  openMultiplayerMenu() {
    this.showScreen('multiplayer-menu');
    this.gameEngine.network.matrixLobby.searchPublicRooms();
  }

  openMapEditor() {
    this.showScreen('map-editor-menu');
    this.gameEngine.startMapEditor();
  }

  openCampaignEditor() {
    this.showScreen('campaign-editor-menu');
  }

  openAIScriptEditor() {
    this.showScreen('ai-editor-menu');
    const textarea = document.getElementById('ai-script-textarea');
    if (textarea) {
      textarea.value = this.gameEngine.aiScriptEditor.gameEngine.aiControllers[0]?.scriptEngine?.getDefaultScript() || '';
    }
  }
}
