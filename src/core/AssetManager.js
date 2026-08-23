/**
 * AssetManager - Proceduralny generator spritów i tekstur pixel art w stylu retro RTS (Polanie 1996).
 * Wszystkie tekstury i sprajty są generowane na elementach Canvas i cachowane.
 */
export class AssetManager {
  constructor() {
    this.sprites = new Map();
    this.tileSize = 32; // Rozmiar kafelka w pikselach
  }

  async loadAll() {
    // Generowanie kafelków terenu
    this._generateTerrainTiles();
    // Generowanie budynków
    this._generateBuildings();
    // Generowanie jednostek
    this._generateUnits();
    // Generowanie pocisków i efektów
    this._generateProjectiles();
    // Generowanie ikon interfejsu
    this._generateIcons();
    return true;
  }

  get(key) {
    return this.sprites.get(key);
  }

  // --- GENERATOR KAFELKÓW TERENU ---
  _generateTerrainTiles() {
    const size = this.tileSize;

    // 1. Soczysta trawa (Grass)
    {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#4b752b';
      ctx.fillRect(0, 0, size, size);
      // Detale trawy
      for (let i = 0; i < 18; i++) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        ctx.fillStyle = (i % 3 === 0) ? '#629938' : ((i % 3 === 1) ? '#385c1e' : '#7cb342');
        ctx.fillRect(x, y, 2, 2);
      }
      this.sprites.set('tile_grass', canvas);
    }

    // 2. Wypasiona trawa (Grazed Grass - po zjedzeniu przez krowę)
    {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#7a7a3b';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 15; i++) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        ctx.fillStyle = (i % 2 === 0) ? '#5c5c28' : '#8f8f4a';
        ctx.fillRect(x, y, 2, 2);
      }
      this.sprites.set('tile_grazed', canvas);
    }

    // 3. Woda (Water)
    {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#2b6294';
      ctx.fillRect(0, 0, size, size);
      // Fale
      ctx.fillStyle = '#438bc9';
      ctx.fillRect(2, 6, 12, 2);
      ctx.fillRect(18, 14, 10, 2);
      ctx.fillRect(6, 22, 14, 2);
      ctx.fillStyle = '#1c4266';
      ctx.fillRect(2, 8, 12, 1);
      ctx.fillRect(18, 16, 10, 1);
      ctx.fillRect(6, 24, 14, 1);
      this.sprites.set('tile_water', canvas);
    }

    // 4. Głęboka woda (Deep Water)
    {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#16385c';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#234f7d';
      ctx.fillRect(4, 10, 10, 2);
      ctx.fillRect(14, 20, 12, 2);
      this.sprites.set('tile_deep_water', canvas);
    }

    // 5. Las / Drzewo (Forest)
    {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      // Podłoże
      ctx.fillStyle = '#3a5423';
      ctx.fillRect(0, 0, size, size);
      // Pień
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(13, 18, 6, 10);
      // Korona dębu/iglaka
      ctx.fillStyle = '#1e471b';
      ctx.beginPath();
      ctx.arc(16, 13, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d6928';
      ctx.beginPath();
      ctx.arc(14, 11, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#428f3c';
      ctx.beginPath();
      ctx.arc(13, 9, 5, 0, Math.PI * 2);
      ctx.fill();
      this.sprites.set('tile_forest', canvas);
    }

    // 6. Skały / Góry (Mountain / Rocks)
    {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#545454';
      ctx.fillRect(0, 0, size, size);
      // Ostre granie skały
      ctx.fillStyle = '#7a7a7a';
      ctx.beginPath();
      ctx.moveTo(4, 28);
      ctx.lineTo(16, 4);
      ctx.lineTo(28, 28);
      ctx.fill();
      ctx.fillStyle = '#3b3b3b';
      ctx.beginPath();
      ctx.moveTo(16, 4);
      ctx.lineTo(28, 28);
      ctx.lineTo(16, 28);
      ctx.fill();
      this.sprites.set('tile_rock', canvas);
    }

    // 7. Złoto / Kruszec (Gold Vein)
    {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#4a4338';
      ctx.fillRect(0, 0, size, size);
      // Samorodki złota
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(6, 8, 5, 5);
      ctx.fillRect(18, 6, 6, 6);
      ctx.fillRect(10, 18, 7, 6);
      ctx.fillRect(20, 20, 5, 5);
      ctx.fillStyle = '#fff080';
      ctx.fillRect(7, 9, 2, 2);
      ctx.fillRect(19, 7, 2, 2);
      ctx.fillRect(11, 19, 2, 2);
      this.sprites.set('tile_gold', canvas);
    }

    // 8. Błoto / Bagno (Mud)
    {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#523c2a';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 12; i++) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        ctx.fillStyle = (i % 2 === 0) ? '#382618' : '#694f38';
        ctx.fillRect(x, y, 3, 2);
      }
      this.sprites.set('tile_mud', canvas);
    }

    // 9. Ścieżka / Droga (Dirt Road)
    {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#8b6f47';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 10; i++) {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        ctx.fillStyle = '#735832';
        ctx.fillRect(x, y, 2, 2);
      }
      this.sprites.set('tile_road', canvas);
    }
  }

  // --- GENERATOR BUDYNKÓW ---
  _generateBuildings() {
    const playerColors = [
      { id: 0, primary: '#2d68c4', name: 'Niebiescy' }, // Gracz 1
      { id: 1, primary: '#c42d2d', name: 'Czerwoni' },  // Gracz 2 / Wróg
      { id: 2, primary: '#2dc447', name: 'Zieloni' },   // Gracz 3
      { id: 3, primary: '#e5b822', name: 'Żółci' },     // Gracz 4
    ];

    playerColors.forEach(p => {
      // 1. GRÓD / GŁÓWNA CHATA (64x64)
      {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        // Drewniane ściany z bali
        ctx.fillStyle = '#6b4324';
        ctx.fillRect(6, 20, 52, 38);
        // Deski / bale poziome
        ctx.fillStyle = '#4f3017';
        for (let y = 24; y < 58; y += 6) {
          ctx.fillRect(6, y, 52, 2);
        }
        // Dach kryty słomą / gontem
        ctx.fillStyle = '#a6823c';
        ctx.beginPath();
        ctx.moveTo(32, 4);
        ctx.lineTo(60, 22);
        ctx.lineTo(4, 22);
        ctx.fill();
        ctx.fillStyle = '#826327';
        ctx.fillRect(8, 20, 48, 3);
        // Drzwi
        ctx.fillStyle = '#2b1a0c';
        ctx.fillRect(26, 38, 12, 20);
        // Flaga / barwy plemienia
        ctx.fillStyle = p.primary;
        ctx.fillRect(28, 6, 16, 9);
        ctx.fillStyle = '#e8d282';
        ctx.fillRect(28, 5, 2, 14); // Maszt
        // Komin i dymek
        ctx.fillStyle = '#595959';
        ctx.fillRect(44, 10, 6, 8);
        this.sprites.set(`bld_grod_${p.id}`, canvas);
      }

      // 2. CHATA DRWALA (48x48)
      {
        const canvas = document.createElement('canvas');
        canvas.width = 48; canvas.height = 48;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#7a4e28';
        ctx.fillRect(6, 16, 36, 28);
        // Bale
        ctx.fillStyle = '#593618';
        for (let y = 20; y < 44; y += 6) ctx.fillRect(6, y, 36, 2);
        // Dach
        ctx.fillStyle = '#8c7038';
        ctx.beginPath();
        ctx.moveTo(24, 4);
        ctx.lineTo(44, 18);
        ctx.lineTo(4, 18);
        ctx.fill();
        // Stos drewna obok chaty
        ctx.fillStyle = '#9e673a';
        ctx.fillRect(32, 32, 12, 12);
        ctx.fillStyle = '#472b14';
        ctx.arc(35, 35, 2, 0, Math.PI * 2);
        ctx.arc(41, 35, 2, 0, Math.PI * 2);
        ctx.arc(38, 41, 2, 0, Math.PI * 2);
        ctx.fill();
        // Znak gracza
        ctx.fillStyle = p.primary;
        ctx.fillRect(8, 18, 6, 6);
        this.sprites.set(`bld_drwal_${p.id}`, canvas);
      }

      // 3. OBORA / ZAGRODA DLA KRÓW (56x56)
      {
        const canvas = document.createElement('canvas');
        canvas.width = 56; canvas.height = 56;
        const ctx = canvas.getContext('2d');
        // Ogrodzenie zagrody (płot drewniany)
        ctx.strokeStyle = '#6b4923';
        ctx.lineWidth = 3;
        ctx.strokeRect(4, 4, 48, 48);
        // Sztachety
        ctx.fillStyle = '#8a5e2e';
        for (let x = 6; x < 52; x += 8) {
          ctx.fillRect(x, 2, 3, 7);
          ctx.fillRect(x, 47, 3, 7);
        }
        // Wnętrze: słoma i koryto z sianem
        ctx.fillStyle = '#998a4d';
        ctx.fillRect(8, 8, 40, 40);
        // Szopa z dachem
        ctx.fillStyle = '#54361c';
        ctx.fillRect(8, 8, 40, 18);
        ctx.fillStyle = '#7a602c';
        ctx.fillRect(6, 6, 44, 10);
        // Koryto
        ctx.fillStyle = '#382210';
        ctx.fillRect(16, 32, 24, 8);
        ctx.fillStyle = '#b3a152'; // siano
        ctx.fillRect(18, 34, 20, 4);
        // Kolor
        ctx.fillStyle = p.primary;
        ctx.fillRect(24, 8, 8, 6);
        this.sprites.set(`bld_obora_${p.id}`, canvas);
      }

      // 4. KOSZARY / CHATA WOJÓW (56x56)
      {
        const canvas = document.createElement('canvas');
        canvas.width = 56; canvas.height = 56;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#524338';
        ctx.fillRect(6, 16, 44, 34);
        // Ostre palisadowe zwieńczenia
        ctx.fillStyle = '#7d6148';
        ctx.beginPath();
        ctx.moveTo(28, 4);
        ctx.lineTo(52, 18);
        ctx.lineTo(4, 18);
        ctx.fill();
        // Skrzyżowane topory / tarcza nad wejściem
        ctx.fillStyle = p.primary;
        ctx.beginPath();
        ctx.arc(28, 26, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(27, 21, 2, 10);
        ctx.fillRect(23, 25, 10, 2);
        // Drzwi okute żelazem
        ctx.fillStyle = '#261b14';
        ctx.fillRect(22, 34, 12, 16);
        this.sprites.set(`bld_koszary_${p.id}`, canvas);
      }

      // 5. ŚWIĄTYNIA ŚWIATOWIDA / PERUNA (56x56)
      {
        const canvas = document.createElement('canvas');
        canvas.width = 56; canvas.height = 56;
        const ctx = canvas.getContext('2d');
        // Kamienny krąg / podest
        ctx.fillStyle = '#4a4742';
        ctx.beginPath();
        ctx.arc(28, 30, 24, 0, Math.PI * 2);
        ctx.fill();
        // 4 kolumny / pogański chram
        ctx.fillStyle = '#755836';
        ctx.fillRect(10, 16, 6, 24);
        ctx.fillRect(40, 16, 6, 24);
        // Dach świątynny
        ctx.fillStyle = '#872b2b';
        ctx.beginPath();
        ctx.moveTo(28, 4);
        ctx.lineTo(48, 18);
        ctx.lineTo(8, 18);
        ctx.fill();
        // Posąg bóstwa (Światowid z 4 twarzami)
        ctx.fillStyle = '#d9c279';
        ctx.fillRect(25, 18, 6, 22);
        ctx.fillRect(23, 18, 10, 5);
        // Ołtarz ze świętym ogniem
        ctx.fillStyle = '#e85d04';
        ctx.fillRect(26, 38, 4, 5);
        ctx.fillStyle = '#ffba08';
        ctx.fillRect(27, 36, 2, 4);
        // Oznaczenie gracza
        ctx.fillStyle = p.primary;
        ctx.fillRect(22, 6, 12, 4);
        this.sprites.set(`bld_swiatynia_${p.id}`, canvas);
      }

      // 6. WIEŻA OBRONNA (32x48)
      {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 48;
        const ctx = canvas.getContext('2d');
        // Drewniana wieża strażnicza
        ctx.fillStyle = '#5c3a1e';
        ctx.fillRect(6, 12, 20, 34);
        // Belki krzyżowe
        ctx.strokeStyle = '#38210e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(6, 16); ctx.lineTo(26, 30);
        ctx.moveTo(26, 16); ctx.lineTo(6, 30);
        ctx.stroke();
        // Pomost strzelecki
        ctx.fillStyle = '#825933';
        ctx.fillRect(2, 6, 28, 8);
        // Daszek
        ctx.fillStyle = '#9c7b41';
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(30, 8);
        ctx.lineTo(2, 8);
        ctx.fill();
        // Kolor gracza
        ctx.fillStyle = p.primary;
        ctx.fillRect(12, 8, 8, 4);
        this.sprites.set(`bld_wieza_${p.id}`, canvas);
      }

      // 7. PALISADA / MUR (32x32)
      {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        // Naostrzone pale drewniane
        for (let i = 2; i < 30; i += 6) {
          ctx.fillStyle = '#6b4724';
          ctx.fillRect(i, 8, 5, 22);
          ctx.fillStyle = '#8f6336';
          ctx.beginPath();
          ctx.moveTo(i, 8);
          ctx.lineTo(i + 2.5, 2);
          ctx.lineTo(i + 5, 8);
          ctx.fill();
        }
        ctx.fillStyle = '#422a14';
        ctx.fillRect(0, 16, 32, 4);
        this.sprites.set(`bld_palisada_${p.id}`, canvas);
      }
    });
  }

  // --- GENERATOR JEDNOSTEK ---
  _generateUnits() {
    const playerColors = [
      { id: 0, primary: '#2d68c4' },
      { id: 1, primary: '#c42d2d' },
      { id: 2, primary: '#2dc447' },
      { id: 3, primary: '#e5b822' },
    ];

    // 1. KROWA (Zwierzę neutralne / hodowlane) - 32x32
    {
      const canvas = document.createElement('canvas');
      canvas.width = 32; canvas.height = 32;
      const ctx = canvas.getContext('2d');
      // Ciało biało-czarne
      ctx.fillStyle = '#f0ece1';
      ctx.beginPath();
      ctx.ellipse(16, 17, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Łaty
      ctx.fillStyle = '#2b2622';
      ctx.beginPath();
      ctx.ellipse(14, 15, 4, 3, 0.4, 0, Math.PI * 2);
      ctx.ellipse(19, 18, 3, 3, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Głowa i pysk
      ctx.fillStyle = '#f0ece1';
      ctx.beginPath();
      ctx.ellipse(26, 14, 4, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5a6b7'; // Różowy pyszczek
      ctx.fillRect(26, 14, 4, 3);
      // Rogi
      ctx.fillStyle = '#d6cbba';
      ctx.fillRect(24, 9, 2, 3);
      ctx.fillRect(27, 9, 2, 3);
      // Nogi
      ctx.fillStyle = '#2b2622';
      ctx.fillRect(9, 22, 2, 6);
      ctx.fillRect(13, 22, 2, 6);
      ctx.fillRect(18, 22, 2, 6);
      ctx.fillRect(22, 22, 2, 6);
      // Wymię (Polanie!)
      ctx.fillStyle = '#f7b2c0';
      ctx.fillRect(12, 21, 5, 3);
      this.sprites.set('unit_krowa', canvas);
    }

    // 2. WILK (Dzikie zwierzę / przywołaniec) - 24x24
    {
      const canvas = document.createElement('canvas');
      canvas.width = 24; canvas.height = 24;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#63615e';
      ctx.beginPath();
      ctx.ellipse(12, 12, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Głowa i uszy
      ctx.beginPath();
      ctx.ellipse(18, 10, 3, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c73a3a'; // Czerwone ślepia
      ctx.fillRect(18, 9, 1, 1);
      // Ogon i łapy
      ctx.fillStyle = '#4a4845';
      ctx.fillRect(4, 11, 4, 2);
      ctx.fillRect(7, 15, 2, 4);
      ctx.fillRect(15, 15, 2, 4);
      this.sprites.set('unit_wilk', canvas);
    }

    playerColors.forEach(p => {
      // 3. KMIECIK / CHŁOP (24x24)
      {
        const canvas = document.createElement('canvas');
        canvas.width = 24; canvas.height = 24;
        const ctx = canvas.getContext('2d');
        // Ciało i tunika w kolorze gracza
        ctx.fillStyle = p.primary;
        ctx.fillRect(8, 9, 8, 9);
        // Głowa i słomiany kapelusz
        ctx.fillStyle = '#f2c89d'; // skóra
        ctx.fillRect(9, 5, 6, 5);
        ctx.fillStyle = '#b89f58'; // kapelusz
        ctx.fillRect(7, 4, 10, 2);
        ctx.fillRect(9, 2, 6, 2);
        // Spodnie i buty
        ctx.fillStyle = '#574229';
        ctx.fillRect(9, 18, 3, 5);
        ctx.fillRect(13, 18, 3, 5);
        // Toporek w dłoni
        ctx.fillStyle = '#805934';
        ctx.fillRect(16, 7, 2, 10);
        ctx.fillStyle = '#94a1ad';
        ctx.fillRect(15, 6, 4, 3);
        this.sprites.set(`unit_kmiec_${p.id}`, canvas);
      }

      // 4. WOJ / TARCZOWNIK (24x24)
      {
        const canvas = document.createElement('canvas');
        canvas.width = 24; canvas.height = 24;
        const ctx = canvas.getContext('2d');
        // Pancerz kolczy
        ctx.fillStyle = '#788796';
        ctx.fillRect(8, 8, 8, 10);
        // Peleryna w barwach gracza
        ctx.fillStyle = p.primary;
        ctx.fillRect(7, 9, 2, 9);
        // Hełm ze szpicem
        ctx.fillStyle = '#9bb0c4';
        ctx.fillRect(9, 4, 6, 5);
        ctx.fillRect(11, 2, 2, 3);
        ctx.fillStyle = '#242424'; // szczelina wzrokowa
        ctx.fillRect(10, 6, 4, 1);
        // Tarcza okrągła słowiańska
        ctx.fillStyle = p.primary;
        ctx.beginPath();
        ctx.arc(6, 13, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d4af37'; // umbo
        ctx.beginPath();
        ctx.arc(6, 13, 2, 0, Math.PI * 2);
        ctx.fill();
        // Miecz w prawej ręce
        ctx.fillStyle = '#c5d3de';
        ctx.fillRect(16, 5, 2, 11);
        ctx.fillStyle = '#8f6f2c';
        ctx.fillRect(15, 14, 4, 2);
        // Nogi
        ctx.fillStyle = '#3b3226';
        ctx.fillRect(9, 18, 3, 5);
        ctx.fillRect(13, 18, 3, 5);
        this.sprites.set(`unit_woj_${p.id}`, canvas);
      }

      // 5. ŁUCZNIK (24x24)
      {
        const canvas = document.createElement('canvas');
        canvas.width = 24; canvas.height = 24;
        const ctx = canvas.getContext('2d');
        // Zielono-brązowy strój z akcentem gracza
        ctx.fillStyle = '#446132';
        ctx.fillRect(8, 8, 8, 10);
        ctx.fillStyle = p.primary;
        ctx.fillRect(9, 12, 6, 3); // pas
        // Głowa i kaptur
        ctx.fillStyle = '#314724';
        ctx.fillRect(8, 4, 8, 5);
        ctx.fillStyle = '#f2c89d';
        ctx.fillRect(10, 6, 4, 3);
        // Łuk refleksyjny
        ctx.strokeStyle = '#6e451b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(17, 12, 7, -Math.PI / 2.2, Math.PI / 2.2);
        ctx.stroke();
        // Kołczan ze strzałami na plecach
        ctx.fillStyle = '#8c592b';
        ctx.fillRect(5, 7, 3, 9);
        // Nogi
        ctx.fillStyle = '#473620';
        ctx.fillRect(9, 18, 3, 5);
        ctx.fillRect(13, 18, 3, 5);
        this.sprites.set(`unit_lucznik_${p.id}`, canvas);
      }

      // 6. KONNY WOJOWNIK / JAZDA (32x32)
      {
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        // Koń kasztanowy
        ctx.fillStyle = '#7a421d';
        ctx.beginPath();
        ctx.ellipse(16, 20, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Szyja i łeb konia
        ctx.beginPath();
        ctx.moveTo(20, 18);
        ctx.lineTo(26, 10);
        ctx.lineTo(28, 12);
        ctx.lineTo(23, 22);
        ctx.fill();
        // Nogi konia
        ctx.fillStyle = '#542d13';
        ctx.fillRect(9, 24, 2, 7);
        ctx.fillRect(13, 24, 2, 7);
        ctx.fillRect(19, 24, 2, 7);
        ctx.fillRect(23, 24, 2, 7);
        // Jeździec w zbroi
        ctx.fillStyle = '#8091a0';
        ctx.fillRect(13, 8, 6, 8);
        ctx.fillStyle = p.primary; // Płaszcz
        ctx.fillRect(10, 9, 3, 8);
        // Hełm
        ctx.fillStyle = '#a6b8c7';
        ctx.fillRect(14, 4, 5, 5);
        // Włócznia / lanca
        ctx.fillStyle = '#ab814b';
        ctx.fillRect(4, 2, 26, 2);
        ctx.fillStyle = '#d1dbe3';
        ctx.fillRect(28, 1, 4, 4);
        this.sprites.set(`unit_konny_${p.id}`, canvas);
      }

      // 7. KAPŁAN / ŻERCA (24x24)
      {
        const canvas = document.createElement('canvas');
        canvas.width = 24; canvas.height = 24;
        const ctx = canvas.getContext('2d');
        // Biała szata kapłańska z haftem gracza
        ctx.fillStyle = '#ededed';
        ctx.fillRect(7, 8, 10, 12);
        ctx.fillStyle = p.primary;
        ctx.fillRect(10, 8, 4, 12); // Pasaż runiczny
        // Głowa, długa siwa broda i wieniec
        ctx.fillStyle = '#f2c89d';
        ctx.fillRect(9, 4, 6, 4);
        ctx.fillStyle = '#ffffff'; // Broda
        ctx.fillRect(9, 8, 6, 6);
        ctx.fillRect(10, 14, 4, 2);
        // Święty kostur z kryształem
        ctx.fillStyle = '#7a5223';
        ctx.fillRect(17, 3, 2, 17);
        ctx.fillStyle = '#5ce1e6'; // Magiczny kryształ
        ctx.beginPath();
        ctx.arc(18, 3, 3, 0, Math.PI * 2);
        ctx.fill();
        this.sprites.set(`unit_kaplan_${p.id}`, canvas);
      }
    });
  }

  // --- POCISKI I CZĄSTKI ---
  _generateProjectiles() {
    // Strzała
    {
      const canvas = document.createElement('canvas');
      canvas.width = 16; canvas.height = 16;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#573d1c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, 8); ctx.lineTo(14, 8);
      ctx.stroke();
      ctx.fillStyle = '#b5c4d1'; // Grot
      ctx.beginPath();
      ctx.moveTo(14, 5); ctx.lineTo(16, 8); ctx.lineTo(14, 11);
      ctx.fill();
      ctx.fillStyle = '#ffffff'; // Lotki
      ctx.fillRect(2, 6, 3, 4);
      this.sprites.set('proj_arrow', canvas);
    }

    // Piorun Peruna (Bolt)
    {
      const canvas = document.createElement('canvas');
      canvas.width = 32; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#e0f7ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00c3ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(8, 20);
      ctx.lineTo(24, 28);
      ctx.lineTo(12, 48);
      ctx.lineTo(18, 64);
      ctx.stroke();
      this.sprites.set('spell_thunder', canvas);
    }
  }

  // --- IKONY INTERFEJSU (HUD) ---
  _generateIcons() {
    const iconSize = 24;

    // 1. Mleko (Kanka / Dzbanek)
    {
      const canvas = document.createElement('canvas');
      canvas.width = iconSize; canvas.height = iconSize;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ebe6df';
      ctx.beginPath();
      ctx.ellipse(12, 14, 7, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(8, 4, 8, 6);
      ctx.fillStyle = '#4287f5'; // Błękitny akcent
      ctx.fillRect(9, 12, 6, 3);
      this.sprites.set('icon_milk', canvas);
    }

    // 2. Drewno (Pnie)
    {
      const canvas = document.createElement('canvas');
      canvas.width = iconSize; canvas.height = iconSize;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#82562d';
      ctx.fillRect(4, 7, 16, 6);
      ctx.fillRect(4, 13, 16, 6);
      ctx.fillStyle = '#d49b61';
      ctx.fillRect(17, 7, 3, 6);
      ctx.fillRect(17, 13, 3, 6);
      this.sprites.set('icon_wood', canvas);
    }

    // 3. Złoto (Bryłka)
    {
      const canvas = document.createElement('canvas');
      canvas.width = iconSize; canvas.height = iconSize;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(12, 4);
      ctx.lineTo(20, 10);
      ctx.lineTo(17, 19);
      ctx.lineTo(6, 17);
      ctx.lineTo(5, 9);
      ctx.fill();
      ctx.fillStyle = '#fff49e';
      ctx.fillRect(10, 8, 4, 4);
      this.sprites.set('icon_gold', canvas);
    }

    // 4. Wiara / Mana (Święty Ogień / Kołowrót)
    {
      const canvas = document.createElement('canvas');
      canvas.width = iconSize; canvas.height = iconSize;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ff6b35';
      ctx.beginPath();
      ctx.arc(12, 13, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe66d';
      ctx.beginPath();
      ctx.arc(12, 13, 4, 0, Math.PI * 2);
      ctx.fill();
      this.sprites.set('icon_faith', canvas);
    }
  }
}
