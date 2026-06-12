# Kotek — PRD / dokument przekazania (handoff)

> **Cel dokumentu:** kompletny kontekst do kontynuacji budowy w Claude Code. Zawiera pozycjonowanie, podstawę merytoryczną, stan obecny, specyfikacje funkcji, model danych, integrację AI oraz stack techniczny.
> **Status:** MVP — aplikacja `kotek/` na stacku **Next.js + shadcn/ui + TipTap** (migracja z Vite wykonana). UI w stylu „rysowane długopisem". Zaimplementowany rdzeń: onboarding, Dziś, Behawiorysta (makieta czatu, bez API), Statystyki, Ustawienia. Stary prototyp `Kotek APP.jsx` zostaje jako referencja logiki.
> **Wersja:** 2.3 · Next.js + shadcn + TipTap, responsywność (mobile domyślnie, sidebar ≥1024px). v2.3: notatka przeniesiona na dół ekranu „Dziś", rozbudowana baza porad merytorycznych (`src/lib/tips.ts`) dopasowywana do statystyk i odświeżana kliknięciem.
> **Nazwa produktu:** **Kotek** (wcześniej robocza: KotoDziennik).

---

## 0. Design system / styl wizualny (v2)

**Estetyka przewodnia: „rysowane długopisem" — czytelne, ale odręczne.** Inspiracja: dołączone referencje (aplikacja „one year" / garden) oraz logo „the cool cat" — proste, czarne kontury na bieli.

- **Kolorystyka:** białe tła (`#fff`), czarne teksty i rysunki (`#111`). Jedyny dodatkowy kolor to czerwień ostrzegawcza (`#b4231a`) dla czerwonych flag oraz niebieski pierścień fokusa (`#1452ff`) ze względów dostępności. Bez palety „notatnik/klinika" z v1.
- **Symbolika (ikony):** zachowujemy *koncepcję* symboli z v1 (zabawa, jedzenie, kuweta, sen, nastrój, filary…), ale **całkowicie zmieniamy formę** — zamiast emoji i ikon-kwiatków z referencji rysujemy własne ikony SVG „brzydko rysowane długopisem, ale czytelne" (`src/components/Icon.tsx`): czarny kontur `currentColor`, celowo lekko nierówne linie, zaokrąglone końce. Awatary kota to też hand-drawn ikony (nie emoji).
- **Typografia (decyzja: nagłówki odręczne + body czytelne):** nagłówki/akcenty font **Shantell Sans** (odręczny, ale zaprojektowany pod czytelność), treść **Inter** (maks. czytelność). To kompromis estetyka ↔ WCAG.
- **Kształty:** „odręczne" pudełka — kontur 2px + nieregularne `border-radius` (różne na każdym rogu), lekki „sketch" cień (przesunięty solid). Pigułki-etykiety (np. „dziś") czarne tło / biały tekst.
- **Dostępność (WCAG 2.1 AA):** maksymalny kontrast (czarne na bieli), widoczny `:focus-visible`, cele dotykowe ≥44px, semantyczny HTML (`nav`, `main`, `header`, `fieldset/legend`, `label`), `aria-pressed` na przełącznikach, ikony dekoracyjne `aria-hidden`, link „przejdź do treści", respektowanie `prefers-reduced-motion`.
- **UX writing:** zwięźle, po polsku, ciepło ale konkretnie. **Imię kota zawsze w mianowniku** (np. „Jak tam Mruczek?", „Mruczek miauczy o jedzenie — jak to przerwać?") — unikamy błędnej odmiany przez generyczne wstawianie imienia.
- **Responsywność (skalowalność mobile + desktop):** mobile-first — **mobile jest widokiem domyślnym**. Jeden breakpoint **1024px**: poniżej = telefon (górny pasek z logo + ustawienia, dolna nawigacja); od 1024px = desktop (boczny panel/sidebar) + wyśrodkowana kolumna treści (`--content-max: 720px`). Przewija się tylko panel treści (`.app { height:100dvh; overflow:hidden }`, scroll w `.main`), żeby nie psuło się przy zmianie rozmiaru okna.

---

## 1. Streszczenie (TL;DR)

Kotek to aplikacja, która łączy trzy role:

1. **Codzienny coach** — prowadzi właściciela przez naturalny rytuał kota (zabawa → jedzenie → mycie → sen) i pomaga w dwóch konkretnych problemach: jak **dobrze bawić się z kotem** oraz jak utrzymać **regularność karmienia/zabawy** i przełamać wyuczone złe nawyki (np. miauczenie o jedzenie).
2. **Behawiorysta AI** — czat oparty na modelu Claude, który doradza na podstawie danych konkretnego kota.
3. **Cichy obserwator** — śledzi tylko **nieoczywiste** sygnały behawioralne (które właściciel sam przeoczy) i wykrywa odchylenia od indywidualnej normy kota.

**Zasada przewodnia całej aplikacji: Rytuał (poluj → jedz → myj się → śpij).** To spina zabawę z karmieniem i organizuje cały interfejs.

**Kluczowa zmiana względem pierwszej wersji MVP:** ciężar przesuwa się z obserwacji zachowań na **codzienne wsparcie/coaching**. Obserwacja zostaje, ale schodzi na drugi plan i ogranicza się do sygnałów nieoczywistych.

---

## 2. Problem i grupa docelowa

**Użytkownik:** właściciel kota (często kota domowego), zaangażowany, ale:
- nie umie skutecznie wybawić kota (kot "nie reaguje na zabawki", szybko się nudzi, jest lękliwy lub mało aktywny),
- zapomina o rygorze regularnych posiłków/zabaw,
- nieświadomie utrwala złe nawyki kota (np. kot nauczył się, że miauczeniem wymusza jedzenie),
- przeocza subtelne zmiany w zachowaniu, które mogą sygnalizować problem.

**Czego NIE chcemy:** poradnika dla laików z oczywistościami. Aplikacja ma dawać **dopasowaną, działającą pomoc** i codzienne wsparcie, nie listę porad ogólnych.

---

## 3. Pozycjonowanie

Z "aplikacji, która zauważa zmiany" → **aplikacja, która prowadzi codzienny rytuał kota**, pomaga przełamywać złe nawyki i dopiero w tle pełni rolę obserwatora i behawiorysty.

---

## 4. Podstawa merytoryczna (research)

Decyzje produktowe są oparte na etologii klinicznej i wytycznych. Skrót najważniejszych ustaleń:

### 4.1 Obserwacja — dlaczego "odchylenie od normy"
- U kotów sygnałem choroby/bólu/stresu jest **zmiana względem indywidualnej normy** danego kota, nie samo zachowanie. Koty maskują dolegliwości (mechanizm przetrwania), więc wczesne wykrycie polega na wyłapaniu zmiany trendu.
- Behawioralne objawy choroby: spadek aktywności, zmiany apetytu/picia, zmiany w pielęgnacji i interakcjach społecznych, problemy z kuwetą, zmiany wokalizacji.
- Źródła: AAFP/ISFM, *Clinical Handbook of Feline Behavior Medicine* (Wiley), Horwitz & Rodan 2018.

### 4.2 Środowisko — 5 filarów (AAFP/ISFM)
1. Bezpieczne kryjówki (najlepiej wyżej).
2. Rozdzielone, wielokrotne zasoby (miska, woda, kuweta, drapak, legowiska — osobno).
3. Możliwość zabawy i zachowań łowieckich.
4. Przewidywalny, spójny kontakt z człowiekiem (bez zmuszania).
5. Szacunek dla węchu kota.
- Źródło: AAFP and ISFM Feline Environmental Needs Guidelines (2013).

### 4.3 Zabawa = sekwencja łowiecka
- Zabawa to ekspresja polowania: **wpatrywanie → skradanie/pościg → atak/gryzienie → "zabawa" z ofiarą** (powtarzanie sekwencji).
- Częste błędy właścicieli: machanie zabawką przy pysku, przyciąganie jej w stronę kota (prawdziwa ofiara ucieka i się chowa), brak możliwości "złapania" zdobyczy (niedokończona sekwencja = frustracja).
- Dopasowanie do **stylu łowieckiego**: łowca powietrzny ("ptaki", ruch w górze/skoki) vs naziemny ("myszy", ruch poziomy po ziemi); preferencje faktury/dźwięku/rozmiaru.
- Koty bywają **neofobiczne** — ostrożne wobec nowości, obserwują z dystansu zanim uznają coś za bezpieczne.
- Dla kota trudnego do wybawienia / seniora: zacząć od samego wodzenia wzrokiem (to już 1. etap sekwencji), powolny ruch obok, krótkie sesje, stopniowanie.
- Czas: ok. 10–20 min, 1–2× dziennie; koty domowe — częste, krótkie sesje.
- Źródła: Cats.com, Kinship, Preventive Vet, Cat Behavior Associates, Modern Cat.

### 4.4 Miauczenie o jedzenie = wyuczony nawyk
- Koty szybko uczą się, co daje efekt; ustępowanie miauczeniu (podanie jedzenia) wzmacnia zachowanie. **Intermittent reinforcement** (czasem ulegam) utrwala je najmocniej.
- Rozwiązanie: stałe pory karmienia + **nigdy** nie karmić w reakcji na miauczenie (bez kontaktu wzrokowego, mówienia, głaskania podczas napraszania) + nagradzać ciszę.
- **Wybuch wygaszania (extinction burst):** na początku miauczenie może się nasilić — to znak, że metoda działa; ustąpienie wtedy uczy kota, że "głośniej = skuteczniej". To kluczowy moment, w którym właściciele pękają → aplikacja musi o tym ostrzegać.
- **Zastrzeżenie medyczne:** nasilony apetyt/miauczenie mogą wynikać z nadczynności tarczycy, cukrzycy, a u seniorów nocne miauczenie z dysfunkcji poznawczej → najpierw weterynarz.
- Źródła: ASPCA, EWASH, KitchenGrove, The Purrfect Guide, Canagan.

### 4.5 Rytuał łowiecki spina zabawę i karmienie
- Naturalny cykl: **poluj → złap → jedz → myj się → śpij**, idealnie domykany 2× na dobę (świt/zmierzch — koty są krepuskularne).
- Zasada **bawić → potem karmić**: zabawa przed posiłkiem uruchamia instynkt łowiecki i daje satysfakcjonujący rytm.
- **Wieczorne wyciszenie**: energiczna zabawa → ostatni posiłek ~1–1,5 h przed snem → mycie → sen. Bezpośrednio rozwiązuje nocne budzenie i napraszanie.
- Brak realizacji instynktu polowania → niepożądane zachowania: agresja, nocne nawoływanie, ciągłe domaganie się uwagi, nadmierne wylizywanie, załatwianie poza kuwetą.
- Źródła: Jackson Galaxy (*Total Cat Mojo*), Adopt a Pet, ORIJEN, Hervey Foundation, Mud Bay, Space Cat Academy.

---

## 5. Stan obecny (co już istnieje)

**Nowa aplikacja: katalog `kotek/`** — pełny projekt Next.js 14 + React + TypeScript (migracja z Vite zakończona, patrz 11), gotowy do wypchnięcia na GitHub i Vercel. UI w stylu „rysowane długopisem" (sekcja 0).

Zaimplementowany **rdzeń** (zakres pierwszej iteracji nowego UI):
- **Onboarding (3 kroki, stepper):** powitanie → profil (imię, awatar z hand-drawn ikon, **płeć: „kocur"/„kotka"**, **sterylizacja/kastracja: Tak/Nie** (v2.3), tryb życia, inne zwierzęta + **notatka o kocie** — rasa/choroby/charakter, v2.3) → profil zabawy (styl łowiecki, temperament, chęć do zabawy, preferencje zabawek, pytanie o nocne budzenie). Każda etykieta pola ma hand-drawn ikonę. Skrót „Wypełnij danymi demo". Pola onboardingu wydzielone do `src/components/CatProfileFields.tsx` i współdzielone z trybem edycji w Ustawieniach.
- **Dziś (hub dnia):** powitanie z datą, **klikalna porada merytoryczna** dopasowana do statystyk zachowań kota (kliknięcie pokazuje kolejną — `src/lib/tips.ts`, ~40 porad), 4 odhaczane pola (Aktywność, Apetyt, Miauczenie, Zabawa), na końcu **notatka dnia** (TipTap) tuż nad przyciskiem „Zapisz dzień". Karty sygnałów z silnika — w kolejnej iteracji.
- **Behawiorysta:** **makieta czatu (bez API)** — pełne, działające UI (bąbelki, podpowiedzi startowe, kompozytor), atrapa odpowiedzi `mockReply` z czytelnym komunikatem „tryb podglądu". Docelowo podłączymy model AI (sekcja 10).
- **Ustawienia (v2.3):** nagłówek to jedna linia **„Ustawienia · {imię}"** z przyciskiem **„Edytuj"** po prawej (bez awatara, pigułki i podtytułu). **Podsumowanie profilu** wprowadzonego w onboardingu jako lista wierszy z hand-drawn ikonami (płeć, sterylizacja/kastracja, tryb życia, inne zwierzęta, styl łowiecki, temperament, chęć do zabawy, ulubione zabawki, nocne budzenie — bez ramki, bez nagłówka „Profil kota"), a pod nią **notatka o kocie tylko do odczytu** (renderowany HTML z `.tiptap`). „Edytuj" otwiera **ten sam formularz co onboarding** (wszystkie pola + edycja notatki) z „Zapisz zmiany"/„Anuluj". Sekcja danych (bez ramki i bez nagłówka „Dane"): licznik „Wpisów w dzienniku", „Wczytaj dane demo" i „Wyczyść dziennik" (z potwierdzeniem) — oba w jednym stylu przycisku.
- **Silnik sygnałów** (`src/lib/signals.ts`): uczy się normy (mode z okresu >7 dni) i wykrywa odchylenia ostatnich 7 dni; czerwone flagi kuwety (krew/brak moczu) z komunikatem o pilnej konsultacji. Ograniczony do metryk nieoczywistych (8.6).
- **Zapis** przez `localStorage` (prefiks `kotek:`), z fallbackiem do pamięci sesji.
- **Dane demo** (21 dni): scenariusz nocnego miauczenia + chowania po przeprowadzce.

**Stary prototyp** `Kotek APP.jsx` (single-file artifact, paleta „notatnik", emoji, recharts) zostaje jako **referencja logiki/symboliki** — nie jest już rozwijany.

**Jeszcze niezaimplementowane (kolejna iteracja):** osobna zakładka **Rytuał** (builder rutyny + automatyczne wieczorne wyciszenie), plan „Przerwij wyuczony nawyk", widok Trendów (wykresy z karty sygnału), pętla feedbacku po sesji zabawy, realne podłączenie AI.

---

## 6. Zakres MVP — przegląd zmian

| Obszar | Decyzja |
|---|---|
| Struktura | Nadal **3 zakładki**, przebudowa akcentów |
| Zakładka 1 | **Dziś** — hub rytuału + dopasowana wskazówka zabawy + lekki zapis nieoczywistych sygnałów |
| Zakładka 2 | **Rytuał** (NOWA, serce coachingu) — pory posiłków/zabaw, automatyczne wieczorne wyciszenie, konsekwencja/seria, plan zmiany nawyku, profil zabawy |
| Zakładka 3 | **Behawiorysta** — czat AI bez zmian w UI, rozszerzony kontekst |
| Trendy/wykresy | Schodzą z osobnej zakładki do widoku otwieranego z karty sygnału ("pokaż przebieg") |
| Obserwacja | Tylko sygnały **nieoczywiste**; usunięte oczywiste alerty (nie je / nie bawi się) |

---

## 7. Architektura ekranów

```
Onboarding (jednorazowo)
  ├─ profil kota
  ├─ 5 filarów (checklista)
  ├─ profil zabawy (NOWE, ~4 pytania)
  └─ pytanie: "Czy kot budzi Cię w nocy/nad ranem?" (ustawia priorytet i porę wieczornego rytuału)

App (3 zakładki + overlay ustawień)
  ├─ [Dziś]      hub dnia
  ├─ [Rytuał]    coaching: rutyna + plany + profil zabawy
  └─ [Behawiorysta] czat AI

Overlay: Ustawienia (profil, filary, profil zabawy, dane demo, reset)
Widok pomocniczy: Trendy (otwierany z karty sygnału)
```

---

## 8. Specyfikacje funkcji

### 8.1 Onboarding (rozszerzenie)
Krok **profilu zabawy** (~4 pytania, patrz 8.3) oraz pytanie o nocne budzenie:
- "Czy kot budzi Cię w nocy lub nad ranem?" → Tak / Nie / Nie wiem.
- Odpowiedź ustawia domyślną porę i priorytet wieczornego rytuału (patrz 8.4). **Wieczorny rytuał jest włączony domyślnie niezależnie od odpowiedzi** — pytanie służy dostrojeniu, nie włączeniu/wyłączeniu.

**Notatka o kocie (zaimplementowane v2.3):** w kroku profilu znajduje się pole notatki (TipTap) — rasa, choroby przewlekłe, charakter — jako kontekst dla porad i czatu AI. Zapisywane w `cat:profile.notes`.

**Płeć i sterylizacja (v2.3):** płeć prezentowana jako **„kocur" (samiec) / „kotka" (samica)** — w modelu `sex` zachowuje wartości `"kot"`/`"kotka"`, etykiety mapuje `sexLabel`. Dodano pole **sterylizacja/kastracja** (`neutered: bool`, Tak/Nie) — istotne klinicznie i behawioralnie (apetyt, znaczenie terytorium, nocne nawoływanie). Etykiety wszystkich pól mają hand-drawn ikony (ikony `gender`, `scissors` dodane do `Icon.tsx`).

**Współdzielony formularz (v2.3):** wszystkie pola onboardingu są komponentami w `src/components/CatProfileFields.tsx` (`ProfileFields`, `PlayFields`, `NotesField` + helpery `catFormFromState`/`catFormToProfile`/`catFormToPlay`). Dzięki temu tryb „Edytuj" w Ustawieniach pokazuje identyczne kontrolki co onboarding.

### 8.2 Zakładka "Dziś" (hub dnia)

**Stan zaimplementowany (v2.3), w kolejności od góry:**
1. **Data** (pigułka „dziś · …").
2. **Klikalna porada merytoryczna** pod powitaniem — jedna na ekran, dopasowana do statystyk zachowań kota (patrz 8.3); kliknięcie pokazuje kolejną poradę z puli. Afordancja „kolejna porada" z ikoną odświeżenia.
3. **4 odhaczane pola** — Aktywność, Apetyt, Miauczenie, Zabawa (8.6).
4. **Notatka dnia** (TipTap) — przeniesiona na **dół ekranu, tuż nad przyciskiem „Zapisz dzień"** (decyzja v2.3: zapis metryk najpierw, notatka jako podsumowanie na końcu).

**Docelowo (kolejne iteracje):** dzisiejszy rytuał (checklista poluj→jedz→myj→śpij z buildera), lekki zapis „nic nietypowego" jednym dotknięciem, **karty sygnałów** z silnika (8.7) z przejściem do czatu AI / widoku trendu i propozycją planu „Przerwij miauczenie" (8.5) przy wokalizacji nocnej/pod drzwiami.

### 8.3 Coach zabawy (dopasowany, NIE krok-po-kroku)

**Profil zabawy** (`cat:playProfile`) — ustawiany w onboardingu, doszlifowywany w czasie:
- `huntingStyle`: `air` (powietrzny/ptaki) | `ground` (naziemny/myszy) | `mixed`
- `toyPrefs`: lista z {pióro, futro, sznurek/wstążka, szelest/dźwięk, miękkie do gryzienia, twarde do klepania}
- `temperament`: `confident` (pewny/atletyczny) | `timid` (lękliwy/ostrożny) | `lowEnergy` (senior/niskoenergetyczny)
- `engagement`: `easy` | `hard` | `none` ("w ogóle nie chce")
- `learnedNotes`: notatki uczone z feedbacku sesji

**Dopasowane podpowiedzi** w formacie "nie działa → spróbuj". Przykładowa biblioteka reguł (filtrowana profilem):
- Nie rusza za zabawką w powietrzu → przeciągaj po podłodze, chowaj za meble (prawdopodobnie łowca naziemny).
- Klepnie i traci zainteresowanie → pozwól **złapać** zdobycz co kilka prób (niedokończona sekwencja frustruje).
- Ucieka od nowej zabawki → zostaw ją w pobliżu na kilka dni (neofobia); nie wymachuj przy pysku.
- "W ogóle nie chce" / senior → zacznij od wodzenia wzrokiem, powolny ruch obok, krótkie sesje.
- Zawsze: **zakończ sesję złapaniem zdobyczy, potem posiłek.**

**Pętla uczenia (lekka):** po sesji 2 dotknięcia — "Jak poszło?" → `Zignorował` / `Trochę` / `Dobre polowanie` + opcjonalnie "co zadziałało" (typ ruchu/zabawki). Wyniki dostrajają profil i kolejne podpowiedzi. Bez kreatora krok-po-kroku: codziennie jedna wskazówka + biblioteka technik.

**Baza porad (zaimplementowane v2.3, `src/lib/tips.ts`):** ~40 merytorycznych porad opartych na sekcji 4 (sekwencja łowiecka, rytuał poluj→jedz→myj→śpij, wyuczone miauczenie o jedzenie i wybuch wygaszania, 5 filarów środowiska, neofobia, koty krepuskularne, sygnały zdrowotne / bramka weterynaryjna). Każda porada ma `id`, `text` i `tags` (`play`, `play-air`, `play-ground`, `play-shy`, `begging`, `night`, `ritual`, `environment`, `activity`, `appetite`, `vet`, `general`).

**Dopasowanie do statystyk (`rankTips(logs)`):** z ostatnich 7 wpisów wyznacza aktywne sygnały (zabawa Brak/Krótko → `play`+`ritual`; miauczenie Nocne/Pod drzwiami/O jedzenie → `night`+`begging`; niska aktywność → `activity`; apetyt ≠ „jak zwykle" → `appetite`). Zwraca pełną listę porad: najpierw trafne (przetasowane), potem reszta — dzięki czemu kliknięcie cyklicznie przewija porady, zaczynając od dopasowanych. Brak danych → fallback `play`+`ritual`+`general`. To „Faza 1+" dopasowania; docelowo wzbogacone o profil zabawy, notatki i wyniki sesji.

**Bezpieczeństwo:** nagły spadek chęci do zabawy u wcześniej aktywnego kota → coach nie nakłania na siłę, sugeruje konsultację (możliwy ból/choroba).

### 8.4 Zakładka "Rytuał" + automatyczne wieczorne wyciszenie

**Builder rutyny** (`cat:routine`):
- 2–4 posiłki dziennie (norma dla dorosłych), opcjonalna zabawa przed kluczowymi posiłkami.
- Pory można wiązać z **czynnością-kotwicą**, nie tylko zegarem (np. "po przebraniu się po pracy") — rutyna przewidywalna, ale elastyczna.

**Wieczorne wyciszenie — DECYZJA: automatyczne, włączone domyślnie.**
- Aplikacja domyślnie prowadzi co wieczór sekwencję **energiczna zabawa → ostatni posiłek (~1–1,5 h przed snem) → mycie → sen** i aktywnie przypomina o jej krokach.
- Pora dostraja się na podstawie pytania z onboardingu (godzina snu) i może być edytowana w ustawieniach rytuału.
- To domyślne zachowanie dla każdego użytkownika (nie opt-in). Użytkownik może je wyłączyć/przesunąć w ustawieniach, ale start jest automatyczny.

**Konsekwencja / seria** (dla właściciela, nie kota):
- Lekkie odhaczanie realizacji + seria ("wieczorny rytuał: 5 dni z rzędu"). Motywuje człowieka. Bez nadmiernej gamifikacji.

### 8.5 Plan "Przerwij wyuczony nawyk" (flagowy: miauczenie o jedzenie)

Prowadzony mini-program (~2–3 tyg.), `cat:plan`:
1. **Bramka medyczna** — przed startem pytanie "Czy weterynarz wykluczył przyczyny medyczne?" (tarczyca/cukrzyca/senior). Bez potwierdzenia plan behawioralny się nie uruchamia; aplikacja kieruje do weterynarza.
2. Zablokowanie stałych pór karmienia (z buildera 8.4).
3. Zasada: karm **tylko** o porach / gdy kot jest cichy; nigdy w reakcji na miauczenie — bez kontaktu wzrokowego, mówienia, głaskania podczas napraszania.
4. **Ostrzeżenie o wybuchu wygaszania** wyświetlane na starcie i przypominane: "Przez pierwsze dni może być głośniej — to znak, że metoda działa. Ustąpienie teraz cofnie cały postęp."
5. Przekierowanie energii: zabawa lub mata węchowa/puzzle feeder przed "oknem" napraszania.
6. Codzienny log: "Uległeś dziś?" → pasek postępu + zachęta. Behawiorysta AI dostępny do dostrajania.

**Most obserwacja → coaching:** gdy silnik sygnałów wykryje wzorzec wokalizacji "nocne / pod drzwiami", aplikacja sama proponuje ten plan (+ bramkę medyczną), zamiast tylko alarmować.

### 8.6 Warstwa obserwacji — co zostaje / znika

**Zostają (nieoczywiste, łatwe do przeoczenia, wysoka wartość kliniczna):**
- **Kuweta** — najcenniejsze; kategorie + czerwone flagi (krew, brak moczu, wysiłek).
- **Wokalizacja** — wzorzec/kontekst (nocne, pod drzwiami, uporczywe), nie sam fakt.
- **Pielęgnacja** — nad-/niedomywanie (DODAĆ — umyka aż do wyłysień/zaniedbania).
- **Kontakt z domem** — chowanie vs nadmierna lepkość.
- **Nastrój/napięcie** — czujny/lękliwy/agresywny.

**Znikają z codziennego nagłówka (oczywiste — właściciel sam zauważy):**
- "Nie je / je mniej" jako codzienny alert (apetyt przestaje być codziennym chipem).
- "Nie bawi się" jako alert → zabawa przechodzi do coachingu (czy zrobiliśmy sesję i jak poszła), a nie metryki-alarmu.

Efekt: codzienny zapis lekki — w większości dni jedno dotknięcie "nic nietypowego".

### 8.7 Silnik sygnałów (deviation detection) — zachować i dostosować

Logika z prototypu (zachować, ograniczyć do metryk z 8.6):
- Minimum **7 dni** danych, by ustalić normę.
- Baseline = `mode` wartości z okresu starszego niż okno 7 dni (fallback: cała historia).
- Okno ostatnich **7 dni**; sygnał gdy ≥3 wpisy odbiegają w kierunku "niepokojącym" i ≥50% ostatnich wpisów.
- Kierunek niepokoju per metryka (`low` / `high` / `both`).
- **Czerwone flagi** kuwety (krew, brak moczu) → sygnał wysokiej wagi, komunikat o pilnej konsultacji weterynaryjnej.

### 8.8 Behawiorysta AI (czat — UI bez zmian)

Rozszerzyć **kontekst** podawany modelowi (system prompt) o:
- konfigurację rutyny (`cat:routine`) i jej realizację (seria/odhaczenia),
- profil zabawy (`cat:playProfile`) + wyniki ostatnich sesji,
- aktywny plan zmiany nawyku (`cat:plan`) + jego postęp,
- (trimmed) subtelne sygnały i status 5 filarów.

Dodać 2 podpowiedzi startowe: **"Jak dziś bawić się z [imię]?"** oraz **"Kot miauczy o jedzenie — jak to przerwać?"**.

Granice: coaching dotyczy **timingu i konsekwencji**, nie porcji/diety (to do weterynarza); zawsze rozróżniać napraszanie od realnego dystresu; przy objawach alarmowych kierować do weterynarza.

---

## 9. Model danych (`localStorage`, prefiks `kotek:`)

> Zaimplementowane w `src/lib/types.ts` + `src/lib/storage.ts`. Klucze poniżej bez prefiksu (faktycznie `kotek:profile` itd.).

| Klucz | Zawartość |
|---|---|
| `cat:profile` | `{ name, avatar, sex, neutered, indoor, multi, notes }` (`avatar` = klucz hand-drawn ikony, nie emoji; `sex`: `"kot"`=samiec/„kocur", `"kotka"`=samica; `neutered`=bool sterylizacja/kastracja, v2.3) |
| `cat:pillars` | `{ p1..p5: bool }` (5 filarów) |
| `cat:playProfile` | `{ huntingStyle, toyPrefs[], temperament, engagement, learnedNotes }` |
| `cat:routine` | `{ meals:[{id,time|anchor,label}], plays:[{id,time|anchor}], eveningWindDown:{enabled:true, bedtime, lastMealOffsetMin} }` |
| `cat:plan` | `{ type:"stop-begging", startedAt, vetCleared:bool, dailyLog:[{date, gaveIn:bool, notes}] }` |
| `cat:logs` | **(zaimplementowane v2.1)** `[{ date, m:{aktywnosc, apetyt, vocal, zabawa}, note }]` |

> **Uwaga (v2.1):** model dzienny uproszczono do **4 odhaczanych pól na ekranie „Dziś"**: `aktywnosc`, `apetyt` (wartość „Nie je" = czerwona flaga), `vocal` (miauczenie), `zabawa`. Usunięto `kuweta/litter`, `events`, `grooming`, `social`, `mood`, `ritual`, `playSessions`. **Do rozważenia:** powrót kuwety (czerwone flagi: krew/brak moczu) jako osobnego, opcjonalnego pola — była klinicznie najcenniejsza.

---

## 10. Integracja AI (szczegóły techniczne)

> **Stan w v2:** czat behawiorysty jest **makietą bez API** (`src/screens/Chat.tsx`, funkcja `mockReply` zwraca komunikat „tryb podglądu"). UI jest kompletne. Poniżej plan docelowego podłączenia modelu. **Uwaga bezpieczeństwa:** w projekcie webowym (GitHub/Vercel) **nie wolno wołać API Anthropic z przeglądarki z kluczem** — klucz wyciekłby. Docelowo wywołanie modelu przechodzi przez **funkcję serwerową** (np. Vercel Serverless Function / Edge), która trzyma klucz w zmiennej środowiskowej i buduje system prompt z kontekstem kota.

- Endpoint (docelowo, server-side): `POST https://api.anthropic.com/v1/messages` z kluczem z env.
- Model: aktualny Claude (np. **`claude-sonnet-4-6`** dla balansu jakość/koszt; do trudnych przypadków `claude-opus-4-8`), `max_tokens: 1000`. Warto włączyć prompt caching dla stałej części system promptu.
- Użyć pola **`system`** na instrukcje + świeży kontekst kota (budowany przy każdym wysłaniu), `messages` = historia rozmowy.
- Odpowiedź: filtrować bloki `type === "text"` z `data.content`, łączyć.
- System prompt (PL): rola behawiorysty/etologa klinicznego; zasady — opieraj się na danych dziennika tego kota, rozróżniaj przyczyny medyczne vs behawioralne, przy objawach alarmowych kieruj pilnie do weterynarza, nie diagnozuj chorób, dawaj konkretne kroki, pisz zwięźle po polsku. Dołączyć dane z sekcji 8.8.

---

## 11. Stack techniczny

> **Status (v2.2): migracja wykonana.** Aplikacja działa na docelowym stacku **Next.js + shadcn/ui + TipTap** (poprzedni Vite usunięty). Build (`next build`) przechodzi, brak błędów w konsoli.

- **Framework: Next.js 14 (App Router) + React 18 + TypeScript.** Trasy: `/` (Dziś), `/behawiorysta`, `/statystyki`, `/ustawienia`. Daje wbudowany routing, SSR/SSG i — kluczowe — **API route** do bezpiecznego podłączenia modelu AI bez wystawiania klucza w przeglądarce (sekcja 10). Deploy: GitHub → **Vercel** (auto-detekcja Next.js, bez `vercel.json`).
- **Biblioteka UI: shadcn/ui** (Radix + Tailwind, util `cn`). Komponenty w `src/components/ui/` (`button` — cva, `toggle-chip`) z **nałożoną skórką „rysowane długopisem"** (czarne na białym, nieregularne kontury, Shantell Sans + IBM Plex Mono). Pozostałe komponenty shadcn dokładamy w miarę potrzeb (Dialog, Tabs itd.).
- **Edytor tekstu: TipTap** (`@tiptap/react` + StarterKit) — komponent `src/components/NoteEditor.tsx` używany na ekranach z notatkami (notatka dnia w „Dziś", notatki o kocie w „Ustawieniach”). Zapisuje **HTML**; zachowane wykropkowane tło + monospace + placeholder. Lista notatek w „Statystykach" pokazuje czysty tekst (strip HTML).
- **Styling:** Tailwind CSS + tokeny w `src/app/globals.css` (`--ink`, `--paper`, `--r-box`, `--dot`, fonty) i `tailwind.config.ts`. Prymitywy `.sketch-box`, `.tag`, `.dotted` w `@layer components`.
- **Fonty:** `next/font/google` — Shantell Sans (`--font-shantell`) + IBM Plex Mono (`--font-plex`), subset latin-ext.
- **Layout responsywny:** mobile-first, **mobile domyślny**; `@media (min-width: 1024px)` → sidebar. Powłoka `AppFrame` (`height:100dvh; overflow:hidden`, scroll w `<main>`), gate onboardingu po stronie klienta.
- **Zapis:** `localStorage` (prefiks `kotek:`) z fallbackiem do pamięci sesji; docelowo opcjonalnie baza (Vercel KV / Postgres) przy kontach.
- **Struktura:** `src/app/` (layout, globals.css, trasy), `src/components/` (AppFrame, Providers, Icon, NoteEditor, `ui/`), `src/context/` (CatContext), `src/lib/` (types, constants, storage, dates, demo, signals, utils), `src/screens/` (Onboarding, Today, Chat, Stats, Settings — client).

> Logika domenowa (`src/lib/*`) jest frameworko-niezależna — przeszła z Vite 1:1.

---

## 12. Dane demo

Zachować generator danych demo (`demoLogs`) i dostosować do nowego modelu: scenariusz "mniej zabawy + nocne miauczenie po przeprowadzce" + przykładowa rutyna i 1 aktywny plan "stop-begging" w trakcie, by od razu pokazać warstwę coachingu. Dane wczytywane z onboardingu i z ustawień.

---

## 13. Bezpieczeństwo, granice, dobrostan

- **Nie zastępujemy weterynarza.** Disclaimer w onboardingu i przy planach.
- Plan przełamywania nawyku **gated** za potwierdzeniem wykluczenia przyczyn medycznych.
- Nie podajemy porcji/dawek/diet (to weterynarz); coaching = timing i konsekwencja.
- Ostrzeżenie o wybuchu wygaszania, by właściciel nie cofnął postępów.
- Rozróżniać napraszanie od dystresu; nie zalecać ignorowania kota w realnej potrzebie.
- Czerwone flagi (kuweta: krew/brak moczu; brak jedzenia >24 h) → komunikat o pilnej konsultacji.

---

## 14. Poza zakresem MVP (backlog)

- Integracja z automatycznym karmnikiem/feederem (przeniesienie skojarzenia "jedzenie" z człowieka).
- Biblioteka wideo z technikami zabawy.
- Profile wielu kotów.
- Mata węchowa / puzzle feeder jako osobny moduł.
- Eksport rutyny dla opiekunki/pet-sittera oraz raport dla weterynarza.
- Śledzenie wagi, sezonowość, przypomnienia push.

---

## 15. Decyzje i otwarte kwestie

**Rozstrzygnięte:**
- **Stack (v2.2, wykonane):** **Next.js 14 + TypeScript + shadcn/ui (Tailwind) + TipTap** (notatki) → GitHub + Vercel. Migracja z Vite zakończona (patrz 11).
- **Styl:** „rysowane długopisem", czarne na białym; nagłówki odręczne (Shantell Sans) + **body monospace (IBM Plex Mono)**; WCAG AA.
- **Symbolika:** zachowana koncepcja, nowa forma — własne hand-drawn ikony SVG (bez emoji, bez kwiatków z referencji).
- **Layout:** mobile-first, **mobile domyślny**; jeden breakpoint **1024px** → sidebar. Ustawienia = koło zębate w prawym górnym rogu (nie w nawigacji). Nawigacja: Dziś · Behawiorysta · Statystyki.
- **„Dziś” (v2.3):** data → hasło o kotku z **klikalną poradą** (dopasowaną do statystyk, odświeżaną kliknięciem) → 4 odhaczane pola (Aktywność, Apetyt, Miauczenie, Zabawa) → **notatka na dole, nad „Zapisz dzień"**. Bez „Rytuału dnia".
- **Czat AI:** na razie bez API (makieta), docelowo przez Next.js API route (klucz w env).
- **Język:** tylko PL w MVP.

**Wciąż otwarte (nieblokujące):**
1. **Kuweta:** wrócić jako osobne (opcjonalne) pole z czerwonymi flagami, czy zostają 4 pola?
2. **Logo:** używamy dołączonego „the cool cat" jako logo, czy zostaje hand-drawn ikona kota?
3. Plan „Przerwij nawyk" — tylko miauczenie o jedzenie czy szablon pod inne nawyki?
4. Hosting czatu AI: Vercel Serverless vs Edge; rate-limiting/auth?

---

## 16. Kolejne kroki (dla Claude Code)

**Zrobione (v2):** model danych (9) z `grooming`/`ritual`/`playSessions`; profil zabawy + pytanie o nocne budzenie w onboardingu; „Dziś" wg 8.2 (bez widoku trendów); obserwacja ograniczona do 8.6 + silnik sygnałów (8.7); dane demo (12); makieta czatu (UI).

**Zrobione (v2.3):** notatka przeniesiona na dół „Dziś" (nad „Zapisz dzień"); rozbudowana baza ~40 porad merytorycznych (`src/lib/tips.ts`) z tagami; dopasowanie porad do statystyk zachowań (`rankTips`) i odświeżanie kliknięciem; nowe ikony `refresh`/`note`; **notatka o kocie w onboardingu**; **Ustawienia jako podsumowanie profilu + tryb „Edytuj"** (współdzielony formularz `CatProfileFields.tsx`); sekcja **Dane** bez ramki z ujednoliconymi przyciskami; **płeć „kocur/kotka"**, pole **sterylizacja/kastracja**, **hand-drawn ikony przy etykietach pól** (nowe ikony `gender`, `scissors`); podsumowanie profilu bez ramki/awatara/nagłówka; nagłówek „Ustawienia · {imię}" z „Edytuj" w jednej linii; **notatka o kocie widoczna w podsumowaniu (read-only)**.

**Do zrobienia (kolejna iteracja):**
1. Zakładka **Rytuał** (8.4) z **automatycznym** wieczornym wyciszeniem (builder rutyny, seria/konsekwencja).
2. **Coach zabawy** (8.3) z pętlą feedbacku po sesji („Jak poszło?").
3. Plan **„Przerwij miauczenie"** (8.5): bramka medyczna + ostrzeżenie o wybuchu wygaszania.
4. **Widok Trendów** otwierany z karty sygnału (wykresy — np. lekka biblioteka albo własny SVG w stylu odręcznym).
5. **Podłączenie AI** (10): funkcja serwerowa + system prompt z kontekstem (8.8).
6. Drobne: deklinacja imienia kota (opcjonalnie), eksport/raport, push.

---

*Dokument do swobodnej edycji. Kod produkcyjny: katalog `kotek/` (Next.js 14 + React + TS + shadcn/ui + TipTap). Referencja logiki/symboliki: `Kotek APP.jsx`.*
