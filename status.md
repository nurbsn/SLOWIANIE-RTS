# Stan Projektu: SŁOWIANIE (Silnik RTS 2D w JS/HTML)

## 📌 Podsumowanie Projektu
Projekt **SŁOWIANIE** to kompletny, autonomiczny i modularny silnik strategicznej gry czasu rzeczywistego (RTS 2D) w czystym HTML5 / JavaScript (ES6 Modules), stworzony w hołdzie dla kultowej polskiej gry **Polanie** (1996). 

Silnik nie wymaga zewnętrznych bibliotek budowania (Webpack/Vite/Babel) i działa natychmiast po otwarciu `index.html` w dowolnej nowoczesnej przeglądarce.

---

## 🚀 Zrealizowane Funkcjonalności

### 1. Mechanika Rozgrywki (Inspirowana grą Polanie)
- **Unikalny model ekonomiczny**:
  - **Mleko (🥛)**: Krowy pasą się na zielonych łąkach, wyjadając soczystą trawę do stanu wypasionej murawy (która z czasem regeneruje się i odrasta). Mleko zbierają Kmiecie lub jest ono dostarczane wprost z Obory. Mleko stanowi podstawowy surowiec żywnościowy i rekrutacyjny.
  - **Drewno (🪵)**: Kmiecie wycinają drzewa z puszczy i znoszą kłody do Grodu lub Chaty Drwala. Po wycięciu drzew pole staje się wolnym terenem.
  - **Złoto / Kruszec (🪙)**: Wydobywane ze złóż skalnych, potrzebne do opancerzenia, konnicy i kapłanów.
  - **Wiara (✨)**: Generowana przez Świątynie Światowida i modlitwy Żerców, wykorzystywana do potężnych zaklęć bóstw słowiańskich.
- **Jednostki**:
  - `Krowa` (pasie się, daje mleko, wędruje po pastwiskach),
  - `Kmieć` (buduje, naprawia, rąbie drewno, doi krowy, wydobywa złoto),
  - `Woj Tarczownik` (piechota z mieczem i tarczą),
  - `Łucznik` (walka dystansowa z łukiem),
  - `Konny Wojownik` (szybka jazda o potężnym uderzeniu),
  - `Kapłan / Żerca` (rzuca czary: Grom Peruna, Błogosławieństwo Swaroga, Zew Watahy z wilkami, Gniew Światowida),
  - `Wilk` (dzika bestia / przywołaniec).
- **Budynki**:
  - `Gród (Ratusz)`, `Chata Drwala`, `Obora dla Krów`, `Chata Wojów (Koszary)`, `Świątynia Światowida`, `Wieża Strażnicza (automatyczny ostrzał)`, `Palisada`.
- **Systemy Świata**:
  - Dwupoziomowa mgła wojny (*Fog of War* - nieodkryte / odkryte / w polu widzenia).
  - Nawigacja i A* Pathfinding z ruchem po skosie i omijaniem przeszkód.
  - Kamera z płynnym powiększaniem (zoom), przewijaniem brzegowym i mini-mapą.
  - Efekty cząsteczkowe (krew, wióry drewna, dym, kręgi zaklęć, unoszący się tekst obrażeń i zbiorów).

### 2. Dźwięk i Muzyka (Web Audio API)
- Proceduralna synteza dźwięków walki, rąbania lasu, ryku krów, czarów gromowych i potwierdzeń rozkazów.
- Generator proceduralnej, folkowej muzyki słowiańskiej w skali modalnej bez potrzeby zewnętrznych plików mp3.

### 3. Grafika Pixel Art (AssetManager)
- W pełni algorytmicznie generowane tekstury i sprajty pixel art w pamięci Canvas:
  - 9 rodzajów kafelków terenu (trawa, wypasiona trawa, woda, głęboka woda, las, skały, złoto, błoto, trakty),
  - Pełny zestaw budynków i jednostek w barwach 4 graczy.

### 4. Multiplayer P2P i Lobby Matrix
- Integracja z **PeerJS** do bezpośredniej synchronizacji rozkazów graczy przez WebRTC bez dedykowanego serwera.
- Moduł **MatrixLobby** do ogłaszania i odkrywania otwartych sesji w zdecentralizowanej sieci Matrix.
- Kody pokoi i natychmiastowe dołączanie po identyfikatorze.

### 5. Edytory wbudowane w silnik
- **Edytor Map**: Pędzle terenu, stawianie surowców, krów, budynków, generator losowy, eksport i import JSON oraz natychmiastowy przycisk "Przetestuj Mapę".
- **Edytor Kampanii**: Tworzenie nowych misji, dialogów, celów fabularnych i wyzwalaczy.
- **Studio Skryptów AI**: Edytor kodu taktycznego w JavaScript z testem składni w czasie rzeczywistym i wgrywaniem do bota.

### 6. Kampania Fabularna "Zjednoczenie Plemion Słowian"
- Misja 1: *Przebudzenie w Puszczy*
- Misja 2: *Obrona Świętego Gaju*
- Misja 3: *Bitwa o Gród Główny*

---

## 📁 Struktura Projektu
- `index.html` – Główny interfejs gry, ekrany i punkt wejścia.
- `style.css` – Stylizacja w estetyce drewniano-pergaminowej z elementami słowiańskimi.
- `src/core/` – Pętla gry, kamera, wejście, synteza audio i assety pixel art.
- `src/world/` – Siatka mapy, surowce, mgła wojny, algorytm A*.
- `src/entities/` – Klasy jednostek, budynków, pocisków i cząsteczek.
- `src/gameplay/` – Gracz, selekcja jednostek, drzewko technologii, zaklęcia.
- `src/ai/` – Kontroler bota, silnik reguł AI, profile zachowań.
- `src/net/` – Komunikacja WebRTC PeerJS i lobby Matrix.
- `src/campaign/` – Kampania fabularna, triggery, dialogi.
- `src/editor/` – Edytor mapy, kampanii i skryptów AI.
- `src/ui/` – Zarządzanie HUD i ekranami menu.

---

## 🎮 Jak uruchomić grę
1. Otwórz plik `index.html` w przeglądarce (np. Chrome, Firefox, Edge, Safari) lub uruchom lokalny serwer HTTP:
   ```bash
   npx serve .
   # lub
   python -m http.server 8080
   ```
2. Wybierz z Menu Głównego:
   - **Kampania Fabularna** – przejdź kolejne misje fabularne z dialogami i celami.
   - **Potyczka (Skirmish AI)** – stocz bitwę z botem AI na wybranym poziomie trudności.
   - **Gra Wieloosobowa** – załóż pokój lub dołącz do innego gracza przez WebRTC.
   - **Edytory** – zaprojektuj własne mapy, misje i skrypty AI.
