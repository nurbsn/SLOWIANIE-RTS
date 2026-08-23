/**
 * CampaignEditor - Narzędzie do tworzenia i edycji kampanii, misji, celów i dialogów.
 */
export class CampaignEditor {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.currentCampaign = {
      id: 'custom_campaign',
      title: 'Moja Kampania Słowian',
      description: 'Własna opowieść o walce o ziemie słowiańskie.',
      missions: []
    };
    this.selectedMissionIndex = 0;
  }

  createMission(title = 'Nowa Misja') {
    const newMission = {
      id: `mission_${this.currentCampaign.missions.length + 1}`,
      title: title,
      briefing: 'Opis fabularny misji...',
      objectives: ['Zbuduj osadę', 'Pokonaj wroga'],
      mapSize: 48,
      playerStart: { x: 10, y: 10 },
      initialResources: { milk: 100, wood: 200, gold: 50, faith: 0 },
      triggers: [
        {
          type: 'time_elapsed',
          time: 2,
          action: 'dialog',
          speaker: 'Wódz',
          text: 'Do boju, bracia Słowianie!'
        },
        {
          type: 'destroy_all_enemies',
          action: 'victory',
          message: 'Zwycięstwo!'
        }
      ]
    };
    this.currentCampaign.missions.push(newMission);
    this.selectedMissionIndex = this.currentCampaign.missions.length - 1;
    return newMission;
  }

  deleteMission(index) {
    if (index >= 0 && index < this.currentCampaign.missions.length) {
      this.currentCampaign.missions.splice(index, 1);
      this.selectedMissionIndex = Math.max(0, this.selectedMissionIndex - 1);
    }
  }

  exportCampaign() {
    const json = JSON.stringify(this.currentCampaign, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentCampaign.title.replace(/\s+/g, '_')}.campaign.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importCampaign(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.missions && Array.isArray(data.missions)) {
        this.currentCampaign = data;
        this.selectedMissionIndex = 0;
        return true;
      }
    } catch (e) {
      console.error("Błąd podczas importu kampanii:", e);
    }
    return false;
  }
}
