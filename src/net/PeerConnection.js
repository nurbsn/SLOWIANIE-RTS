/**
 * PeerConnection - Obsługa połączeń WebRTC P2P za pośrednictwem biblioteki PeerJS.
 */
export class PeerConnection {
  constructor() {
    this.peer = null;
    this.peerId = null;
    this.connections = new Map(); // peerId -> DataConnection
    this.isHost = false;
    this.onDataReceived = null;
    this.onPeerConnected = null;
    this.onPeerDisconnected = null;
    this.onError = null;
  }

  // Inicjalizacja klienta PeerJS
  init(customPeerId = null) {
    return new Promise((resolve, reject) => {
      if (typeof window.Peer === 'undefined') {
        console.warn("PeerJS library not loaded! Running in offline mode.");
        this.peerId = customPeerId || 'local-offline-peer';
        resolve(this.peerId);
        return;
      }

      try {
        const id = customPeerId || `slowianie-${Math.floor(Math.random() * 100000)}`;
        this.peer = new window.Peer(id, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          this.peerId = id;
          console.log(`[PeerJS] Połączono z serwerem sygnałowym. Twój PeerID: ${id}`);
          resolve(id);
        });

        this.peer.on('connection', (conn) => {
          this._handleIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.error("[PeerJS] Błąd połączenia:", err);
          if (this.onError) this.onError(err);
          // Fallback resolve
          resolve(id);
        });
      } catch (err) {
        console.error("Inicjalizacja PeerJS nie powiodła się:", err);
        resolve('local-offline-peer');
      }
    });
  }

  // Hostowanie pokoju
  hostGame() {
    this.isHost = true;
    return this.peerId;
  }

  // Dołączenie do hosta po PeerID
  connectToHost(hostPeerId) {
    return new Promise((resolve, reject) => {
      if (!this.peer) {
        reject(new Error("Peer not initialized"));
        return;
      }

      this.isHost = false;
      const conn = this.peer.connect(hostPeerId, { reliable: true });

      conn.on('open', () => {
        console.log(`[PeerJS] Połączono pomyślnie z hostem: ${hostPeerId}`);
        this.connections.set(hostPeerId, conn);
        this._setupConnectionEvents(conn);
        if (this.onPeerConnected) this.onPeerConnected(hostPeerId);
        resolve(conn);
      });

      conn.on('error', (err) => {
        console.error("[PeerJS] Błąd podczas łączenia z hostem:", err);
        if (this.onError) this.onError(err);
        reject(err);
      });
    });
  }

  _handleIncomingConnection(conn) {
    conn.on('open', () => {
      console.log(`[PeerJS] Nowy gracz dołączył: ${conn.peer}`);
      this.connections.set(conn.peer, conn);
      this._setupConnectionEvents(conn);
      if (this.onPeerConnected) this.onPeerConnected(conn.peer);
    });
  }

  _setupConnectionEvents(conn) {
    conn.on('data', (data) => {
      if (this.onDataReceived) {
        this.onDataReceived(conn.peer, data);
      }
    });

    conn.on('close', () => {
      console.log(`[PeerJS] Gracz rozłączony: ${conn.peer}`);
      this.connections.delete(conn.peer);
      if (this.onPeerDisconnected) this.onPeerDisconnected(conn.peer);
    });
  }

  // Wysłanie danych do konkretnego peera lub rozgłoszenie (broadcast)
  send(peerId, payload) {
    const conn = this.connections.get(peerId);
    if (conn && conn.open) {
      conn.send(payload);
    }
  }

  broadcast(payload) {
    for (const [peerId, conn] of this.connections) {
      if (conn && conn.open) {
        conn.send(payload);
      }
    }
  }

  disconnect() {
    for (const [_, conn] of this.connections) {
      conn.close();
    }
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}
