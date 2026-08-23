# Stan Projektu: SŁOWIANIE (Silnik RTS 2D w JS/HTML)

*Data ostatniej aktualizacji: 2026-08-23*

---

## 📌 Podsumowanie Projektu
Projekt **SŁOWIANIE** to kompletny, autonomiczny i modularny silnik strategicznej gry czasu rzeczywistego (RTS 2D) w czystym HTML5 / JavaScript (ES6 Modules), stworzony w hołdzie dla kultowej polskiej gry **Polanie** (1996).

Kod źródłowy projektu został pomyślnie opublikowany w repozytorium GitHub:
🔗 **[https://github.com/nurbsn/SLOWIANIE-RTS](https://github.com/nurbsn/SLOWIANIE-RTS)**

---

## 🚀 Ostatnie Zmiany i Stan Bieżący

1. **Architektura Silnika RTS 2D**:
   - Pętla gry z deterministycznym taktowaniem symulacji (`20 TPS`) i płynnym renderowaniem `requestAnimationFrame`.
   - Zintegrowana kamera 2D z obsługą powiększania (zoom), przewijania brzegowego i mini-mapą ze współrzędnymi radaru.
   - Płynny algorytm nawigacji **A* Pathfinding** z omijaniem przeszkód i ruchem po przekątnych.
   - Dwupoziomowa mgła wojny (**Fog of War**: nieodkryty teren, widok terenu poza zasięgiem wzroku, pole aktywnego widzenia jednostek/budynków).

2. **Mechanika Ekonomii i Walki (Klimat Gry Polanie)**:
   - **Mleko (🥛)**: Krowy pasą się na zielonych łąkach, zjadają trawę i przeżuwają (trawa staje się wyjedzona i regeneruje się z czasem). Kmiecie doją krowy i znoszą mleko do Grodu lub Obory. Mleko jest głównym surowcem rekrutacyjnym i żywnościowym.
   - **Drewno (🪵)**: Pozyskiwane przez wycinkę puszczy; ścięte drzewa odsłaniają wolny teren.
   - **Złoto / Kruszec (🪙)**: Wydobycie ze złóż skalnych na konnicę i zaawansowany pancerz.
   - **Wiara (✨)**: Generowana przez Świątynie Światowida i modlitwy Żerców.
   - **Jednostki**: Krowa, Kmieć, Wojownik Tarczownik, Łucznik, Konny Wojownik, Kapłan / Żerca, Dziki Wilk.
   - **Budynki**: Gród (Ratusz), Chata Drwala, Obora, Koszary, Świątynia, Wieża Strażnicza (automatyczny ostrzał), Palisada.
   - **Czary Pogańskie**: *Grom Peruna*, *Błogosławieństwo Swaroga*, *Zew Watahy*, *Gniew Światowida*.

3. **Autonomiczne Dźwięki i Pixel Art**:
   - **Proceduralny Pixel Art Renderer** w `AssetManager.js` – 9 rodzajów kafelków, pełny zestaw budynków i jednostek dla 4 kolorów graczy.
   - **Synteza Web Audio API** w `SoundSystem.js` – proceduralne efekty bitewne, rąbanie drewna, muczenie krów i słowiańska muzyka folkowa bez zewnętrznych plików mp3.

4. **Tryby Rozgrywki i Edytory**:
   - **Kampania Fabularna**: 3 pełne misje (*Przebudzenie w Puszczy*, *Obrona Świętego Gaju*, *Bitwa o Gród Główny*) z dialogami i celami.
   - **Potyczka (Skirmish AI)**: bot o 4 profilach taktycznych (*Zrównoważony, Rasz/Agresor, Magia Żerców, Twierdza*).
   - **Multiplayer P2P**: bezpośrednie WebRTC przez **PeerJS** oraz matchmaking w sieci **Matrix**.
   - **Edytor Map**: interaktywne pędzle terenu, stawianie surowców i budynków, generator losowy i eksport/import JSON.
   - **Edytor Kampanii & Studio Skryptów AI**: edycja misji i testowanie reguł bota w czasie rzeczywistym.

5. **Wdrożenie i Repozytorium**:
   - Projekt zainicjalizowany w Git, skonfigurowany branch `main`, stworzone `README.md` oraz `.gitignore`.
   - Kod wypchnięty do zdalnego repozytorium GitHub: `https://github.com/nurbsn/SLOWIANIE-RTS`.

---

## 📋 Otwarte Zadania i Propozycje Rozwoju (Next Steps)

- [ ] Dodanie kolejnych nacji/plemion słowiańskich o unikalnych cechach (np. Wiślanie, Pomorzanie, Dziadoszanie).
- [ ] Implementacja machin oblężniczych (tarany, katapulty).
- [ ] Rozszerzenie kampanii o kolejne rozdziały fabularne i animowane przerywniki.
- [ ] Dodanie efektów pogodowych (deszcz, śnieg, burza piorunowa wpływająca na widoczność i prędkość jednostek).
- [ ] Wsparcie dla mobilnego sterowania dotykowego (gesty pinch-to-zoom i panel dotykowy).

---

## 🎮 Jak wznowić pracę w nowej sesji
Użyj polecenia `/wczytaj` w nowej sesji, aby wczytać ten plik i podjąć pracę od bieżącego stanu.
Gra uruchamia się bezpośrednio przez otwarcie `index.html` lub uruchomienie lokalnego serwera:
```bash
npx serve .
# lub
python -m http.server 8080
```
