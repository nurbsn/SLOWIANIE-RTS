import { PeerConnection } from './PeerConnection.js';
import { MatrixLobby } from './MatrixLobby.js';

export const NET_MSG_TYPES = {
  LOBBY_JOIN: 'lobby_join',
  LOBBY_UPDATE: 'lobby_update',
  GAME_START: 'game_start',
  RTS_COMMAND: 'rts_command',
  CHAT_MESSAGE: 'chat_message',
  PING: 'ping'
};

/**
 * NetworkManager - Główny menedżer rozgrywki wieloosobowej, synchronizacji rozkazów i lobby Matrix.
 */
export class NetworkManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.peerConnection = new PeerConnection();
    this.matrixLobby = new MatrixLobby();
    this.isMultiplayer = false;
    this.isHost = false;
    this.localPlayerId = 0;
    this.lobbyPlayers = [];
    this.onLobbyChanged = null;
    this.onChatReceived = null;

    this._setupCallbacks();
  }

  _setupCallbacks() {
    this.peerConnection.onDataReceived = (senderPeerId, data) => {
      this._handlePacket(senderPeerId, data);
    };

    this.peerConnection.onPeerConnected = (peerId) => {
      if (this.isHost) {
        // Dodaj gracza do lobby
        const newPlayerSlot = {
          peerId: peerId,
          id: this.lobbyPlayers.length,
          name: `Słowianin_${this.lobbyPlayers.length + 1}`,
          color: this.lobbyPlayers.length === 1 ? '#c42d2d' : (this.lobbyPlayers.length === 2 ? '#2dc447' : '#e5b822'),
          team: this.lobbyPlayers.length,
          isReady: false
        };
        this.lobbyPlayers.push(newPlayerSlot);
        this.broadcastLobbyState();
      }
    };

    this.peerConnection.onPeerDisconnected = (peerId) => {
      if (this.isHost) {
        this.lobbyPlayers = this.lobbyPlayers.filter(p => p.peerId !== peerId);
        this.broadcastLobbyState();
      }
    };
  }

  async createRoom(hostName = 'Wódz_Polan', mapName = 'Słowiańska Puszcza') {
    const peerId = await this.peerConnection.init();
    this.peerConnection.hostGame();
    this.isMultiplayer = true;
    this.isHost = true;
    this.localPlayerId = 0;

    const roomCode = this.matrixLobby.generateRoomCode();
    this.lobbyPlayers = [
      {
        peerId: peerId,
        id: 0,
        name: hostName,
        color: '#2d68c4',
        team: 0,
        isReady: true,
        isHost: true
      }
    ];

    await this.matrixLobby.announceGameRoom({
      code: roomCode,
      hostName: hostName,
      peerId: peerId,
      mapName: mapName,
      maxPlayers: 4
    });

    if (this.onLobbyChanged) this.onLobbyChanged(this.lobbyPlayers);
    return { roomCode, peerId };
  }

  async joinRoom(hostPeerId, playerName = 'Gość_Słowianin') {
    const myPeerId = await this.peerConnection.init();
    this.isMultiplayer = true;
    this.isHost = false;

    await this.peerConnection.connectToHost(hostPeerId);
    this.peerConnection.send(hostPeerId, {
      type: NET_MSG_TYPES.LOBBY_JOIN,
      playerName: playerName
    });

    return myPeerId;
  }

  broadcastLobbyState() {
    this.peerConnection.broadcast({
      type: NET_MSG_TYPES.LOBBY_UPDATE,
      players: this.lobbyPlayers
    });
    if (this.onLobbyChanged) this.onLobbyChanged(this.lobbyPlayers);
  }

  startGame() {
    if (!this.isHost) return;
    this.peerConnection.broadcast({
      type: NET_MSG_TYPES.GAME_START,
      players: this.lobbyPlayers,
      mapSeed: 12345
    });
    this.gameEngine.setupMultiplayerGame(this.lobbyPlayers, this.localPlayerId);
  }

  sendRTSCommand(commandData) {
    if (!this.isMultiplayer) return;

    const packet = {
      type: NET_MSG_TYPES.RTS_COMMAND,
      senderId: this.localPlayerId,
      cmd: commandData
    };

    if (this.isHost) {
      this.peerConnection.broadcast(packet);
    } else {
      // Wyślij do hosta, który rozgłasza do wszystkich
      this.peerConnection.broadcast(packet);
    }
  }

  sendChat(text) {
    const sender = this.lobbyPlayers.find(p => p.id === this.localPlayerId);
    const packet = {
      type: NET_MSG_TYPES.CHAT_MESSAGE,
      senderName: sender ? sender.name : 'Gracz',
      text: text,
      time: new Date().toLocaleTimeString()
    };

    this.peerConnection.broadcast(packet);
    if (this.onChatReceived) this.onChatReceived(packet);
  }

  _handlePacket(senderPeerId, packet) {
    switch (packet.type) {
      case NET_MSG_TYPES.LOBBY_JOIN:
        // Obsługiwane przy połączeniu
        break;

      case NET_MSG_TYPES.LOBBY_UPDATE:
        this.lobbyPlayers = packet.players;
        const me = this.lobbyPlayers.find(p => p.peerId === this.peerConnection.peerId);
        if (me) this.localPlayerId = me.id;
        if (this.onLobbyChanged) this.onLobbyChanged(this.lobbyPlayers);
        break;

      case NET_MSG_TYPES.GAME_START:
        this.gameEngine.setupMultiplayerGame(packet.players, this.localPlayerId);
        break;

      case NET_MSG_TYPES.RTS_COMMAND:
        this.gameEngine.executeNetworkCommand(packet.senderId, packet.cmd);
        if (this.isHost) {
          // Prześlij dalej do innych
          this.peerConnection.broadcast(packet);
        }
        break;

      case NET_MSG_TYPES.CHAT_MESSAGE:
        if (this.onChatReceived) this.onChatReceived(packet);
        break;
    }
  }
}
