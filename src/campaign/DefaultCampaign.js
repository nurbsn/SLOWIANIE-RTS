/**
 * DefaultCampaign - Oficjalna kampania fabularna "Zjednoczenie Plemion Słowian".
 */
export const DEFAULT_CAMPAIGN = {
  id: 'slowianie_origins',
  title: 'Zjednoczenie Plemion Słowian',
  description: 'Poprowadź plemię Polan od skromnej puszczańskiej osady po potężne zjednoczone księstwo.',
  missions: [
    {
      id: 'mission_1',
      title: 'Misja 1: Przebudzenie w Puszczy',
      briefing: 'Witaj, Mściwoju! Nasza stara osada została spustoszona przez leśnych rozbójników. Musimy zebrać ocalałe krowy, odbudować gród i zebrać 250 dzbanów mleka, by wyżywić ludzi i przygotować się do obrony.',
      objectives: [
        'Zgromadź 250 jednostek Mleka ze stada krów',
        'Zbuduj Oborę i Chatę Drwala',
        'Zniszcz obóz rozbójników na wschodzie'
      ],
      mapSize: 48,
      playerStart: { x: 8, y: 12 },
      initialResources: { milk: 80, wood: 150, gold: 0, faith: 0 },
      triggers: [
        {
          type: 'time_elapsed',
          time: 2,
          action: 'dialog',
          speaker: 'Stary Kmieć',
          text: 'Dzięki bogom, że ocalałeś, wodzu! Krowy pasą się na łące – wyślij nas, byśmy zebrali mleko, a postawimy gród na nowo!'
        },
        {
          type: 'collect_milk',
          amount: 250,
          action: 'dialog',
          speaker: 'Stary Kmieć',
          text: 'Zapasy mleka są pełne! Teraz wyśzkolmy kilku tarczowników i zrównajmy z ziemią obozowisko zbójców!'
        },
        {
          type: 'destroy_all_enemies',
          action: 'victory',
          message: 'Wspaniałe zwycięstwo! Puszcza jest bezpieczna, a wieści o twoim męstwie dotarły do sąsiednich grodów.'
        }
      ]
    },
    {
      id: 'mission_2',
      title: 'Misja 2: Obrona Świętego Gaju',
      briefing: 'Wieletowie najechali święte wzgórze Peruna! Kapłan Żerca potrzebuje twojej ochrony, aby dokończyć rytuał przesilenia. Zbuduj Świątynię, obroń chram i użyj boskich gromów, by rozgromić najeźdźców.',
      objectives: [
        'Wybuduj Świątynię Światowida',
        'Wyszkol przynajmniej 2 Kapłanów',
        'Odrzuć wszystkie fale najeźdźców Wieletów'
      ],
      mapSize: 56,
      playerStart: { x: 12, y: 14 },
      initialResources: { milk: 120, wood: 200, gold: 80, faith: 40 },
      triggers: [
        {
          type: 'time_elapsed',
          time: 3,
          action: 'dialog',
          speaker: 'Żerca Dobromir',
          text: 'Gromy Peruna są z nami! Wznieś świątynię, a obdarzymy twoich wojów błogosławieństwem siły!'
        },
        {
          type: 'time_elapsed',
          time: 60,
          action: 'spawn_reinforcements',
          ownerId: 1, // Wróg
          spawnX: 1300,
          spawnY: 600,
          units: [{ type: 'woj' }, { type: 'woj' }, { type: 'lucznik' }]
        },
        {
          type: 'destroy_all_enemies',
          action: 'victory',
          message: 'Święty Gaj ocalony! Bogowie pobłogosławili twój lud wielką mocą!'
        }
      ]
    },
    {
      id: 'mission_3',
      title: 'Misja 3: Bitwa o Gród Główny',
      briefing: 'Nadszedł czas na ostateczne starcie. Zdradziecki kniaź Boruta zabarykadował się w potężnej twierdzy. Zbuduj potężną konnicę, łuczników i kapłanów, przełam palisady i zniszcz jego Gród Główny!',
      objectives: [
        'Zbuduj rozwiniętą osadę i zorganizuj wielką armię',
        'Zniszcz główny Gród Boruty',
        'Zjednocz wszystkie plemiona pod jednym sztandarem!'
      ],
      mapSize: 64,
      playerStart: { x: 10, y: 12 },
      initialResources: { milk: 200, wood: 300, gold: 120, faith: 50 },
      triggers: [
        {
          type: 'time_elapsed',
          time: 2,
          action: 'dialog',
          speaker: 'Kniaź Boruta',
          text: 'Ha! Myślisz, że możesz mnie pokonać na mojej własnej ziemi? Moje wieże obrócą twoich ludzi w popiół!'
        },
        {
          type: 'destroy_all_enemies',
          action: 'victory',
          message: 'Chwała Słowianom! Zdradziecki kniaź poległ, a wszystkie rody uznały twoje panowanie. Narodziło się Wielkie Księstwo Słowian!'
        }
      ]
    }
  ]
};
