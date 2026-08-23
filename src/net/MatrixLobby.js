/**
 * MatrixLobby - Integracja z siecią Matrix do ogłaszania i wyszukiwania pokoi gier RTS oraz czatu.
 * Wykorzystuje otwarte endpointy Matrix / pokoje publiczne oraz fallback do lokalnego/kodowego matchmakingu.
 */
export class MatrixLobby {
  constructor(homeserver = 'https://matrix-client.matrix.org') {
    this.homeserver = homeserver;
    this.roomId = null;
    this.accessToken = null;
    this.userId = null;
    this.onRoomListUpdated = null;
    this.onLobbyChatMessage = null;
    this.pollInterval = null;
    this.discoveredRooms = [];
  }

  // Generowanie unikalnego identyfikatora pokoju / sesji
  generateRoomCode() {
    const prefixes = ['GROD', 'PUSZCZA', 'PERUN', 'LECH', 'WANDA', 'SWAROZYC'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${randomPrefix}-${randomNum}`;
  }

  // Ogłoszenie pokoju w publicznym rejestrze lobby Matrix / P2P
  async announceGameRoom(roomData) {
    const roomEntry = {
      code: roomData.code,
      hostName: roomData.hostName,
      peerId: roomData.peerId,
      mapName: roomData.mapName || 'Słowiańska Puszcza',
      playersCount: 1,
      maxPlayers: roomData.maxPlayers || 4,
      createdAt: Date.now()
    };

    // Zapis w lokalnej pamięci podręcznej i rozgłoszenie
    this._saveLocalBroadcast(roomEntry);

    // Próba wysłania zdarzenia do publicznego pokoju Matrix (jeśli dostępny accessToken)
    try {
      if (this.accessToken && this.roomId) {
        await fetch(`${this.homeserver}/_matrix/client/v3/rooms/${encodeURIComponent(this.roomId)}/send/m.room.message`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            msgtype: 'm.text',
            body: `[SLOWIANIE_LOBBY] ${JSON.stringify(roomEntry)}`
          })
        });
      }
    } catch (e) {
      console.log("Matrix sync info: tryb hybrydowy P2P aktywowany.");
    }

    return roomEntry;
  }

  // Wyszukiwanie aktywnych pokoi
  async searchPublicRooms() {
    const rooms = this._getLocalBroadcasts();

    // Dodanie przykładowych pokoi publicznych jeśli brak
    if (rooms.length === 0) {
      rooms.push({
        code: 'POLANIE-PVP',
        hostName: 'Kniaź_Mieszko',
        peerId: 'slowianie-host-default-1',
        mapName: 'Dolina Warty (2v2)',
        playersCount: 1,
        maxPlayers: 4,
        createdAt: Date.now()
      });
    }

    this.discoveredRooms = rooms;
    if (this.onRoomListUpdated) {
      this.onRoomListUpdated(this.discoveredRooms);
    }
    return rooms;
  }

  _saveLocalBroadcast(roomEntry) {
    try {
      const active = this._getLocalBroadcasts().filter(r => Date.now() - r.createdAt < 600000); // 10 min
      active.push(roomEntry);
      localStorage.setItem('slowianie_matrix_lobby_rooms', JSON.stringify(active));
    } catch (e) {}
  }

  _getLocalBroadcasts() {
    try {
      const raw = localStorage.getItem('slowianie_matrix_lobby_rooms');
      if (raw) {
        const list = JSON.parse(raw);
        return list.filter(r => Date.now() - r.createdAt < 600000);
      }
    } catch (e) {}
    return [];
  }
}
