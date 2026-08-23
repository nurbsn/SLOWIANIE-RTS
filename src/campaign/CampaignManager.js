import { DEFAULT_CAMPAIGN } from './DefaultCampaign.js';

/**
 * CampaignManager - Zarządzanie postępami w kampanii, wczytywaniem misji i celów.
 */
export class CampaignManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.campaign = DEFAULT_CAMPAIGN;
    this.currentMissionIndex = 0;
    this.unlockedMissionIndex = 0;

    this._loadProgress();
  }

  getCurrentMission() {
    return this.campaign.missions[this.currentMissionIndex];
  }

  startMission(index) {
    if (index >= 0 && index < this.campaign.missions.length) {
      this.currentMissionIndex = index;
      const mission = this.campaign.missions[index];

      // Inicjalizacja gry z parametrami misji
      this.gameEngine.setupMission(mission);
      return mission;
    }
    return null;
  }

  onMissionComplete() {
    if (this.currentMissionIndex + 1 > this.unlockedMissionIndex) {
      this.unlockedMissionIndex = Math.min(this.campaign.missions.length - 1, this.currentMissionIndex + 1);
      this._saveProgress();
    }
  }

  _saveProgress() {
    try {
      localStorage.setItem('slowianie_campaign_progress', JSON.stringify({
        unlocked: this.unlockedMissionIndex
      }));
    } catch (e) {
      // Ignoruj błędy storage
    }
  }

  _loadProgress() {
    try {
      const saved = localStorage.getItem('slowianie_campaign_progress');
      if (saved) {
        const data = JSON.parse(saved);
        this.unlockedMissionIndex = data.unlocked || 0;
      }
    } catch (e) {
      this.unlockedMissionIndex = 0;
    }
  }
}
