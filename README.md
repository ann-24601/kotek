# Kotek 🐱

Codzienny coach rytuału kota i wirtualny behawiorysta. Aplikacja prowadzi właściciela
przez naturalny rytuał kota (**poluj → jedz → myj się → śpij**), pomaga dobrze się bawić,
trzymać regularność i w tle wyłapuje nieoczywiste zmiany w zachowaniu.

Estetyka: **„rysowane długopisem"** — czarne na białym, czytelne, zgodne z WCAG.
Nagłówki odręczne (Shantell Sans) + treść monospace (IBM Plex Mono).
Responsywne: **mobile domyślnie**, sidebar od 1024px.

## Stack

- **Next.js 14** (App Router) + React 18 + TypeScript
- **Tailwind CSS** + **shadcn/ui** (re-skin „rysowane długopisem")
- **TipTap** — edytor rich-text na ekranach z notatkami (Dziś, Ustawienia)
- Fonty: Shantell Sans (nagłówki) + IBM Plex Mono (body) przez `next/font`
- Zapis: `localStorage` (prefiks `kotek:`) z fallbackiem do pamięci sesji

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build produkcyjny
npm start        # serwer produkcyjny
```

## Deploy (Vercel)

Wypchnij repo na GitHub → w Vercel **New Project → Import**. Vercel wykryje Next.js
automatycznie (bez dodatkowej konfiguracji).

## Struktura

```
src/
  app/                 App Router: layout + globals.css + trasy
    page.tsx           Dziś
    behawiorysta/      Behawiorysta (czat — makieta)
    statystyki/        Statystyki (wykres + notatki)
    ustawienia/        Ustawienia
  components/
    AppFrame.tsx       powłoka: gate onboardingu + responsywna nawigacja
    Providers.tsx      kontekst (client)
    Icon.tsx           ikony „rysowane długopisem" (SVG)
    NoteEditor.tsx     edytor notatek (TipTap)
    ui/                komponenty shadcn (Button, ToggleChip)
  context/CatContext   stan profilu/dziennika + zapis
  lib/                 types, constants, storage, dates, demo, signals, utils
  screens/             Onboarding, Today, Chat, Stats, Settings (client)
```

## Behawiorysta AI

Okno czatu (`src/screens/Chat.tsx`) jest w pełni działającą makietą UI.
**Odpowiedzi AI nie są jeszcze podłączone** — funkcja `mockReply` zwraca komunikat
podglądu. Docelowo: **Next.js API route** (`app/api/chat`) z kluczem w zmiennej
środowiskowej (klucz NIE może trafić do przeglądarki), karmiony kontekstem z dziennika,
profilu zabawy i rytuału.

## Dane

Wszystko zapisywane lokalnie (`localStorage`, prefiks `kotek:`). Notatki zapisywane jako
HTML (TipTap). Dane demo: 21 dni (scenariusz nocnego miauczenia po przeprowadzce) —
z onboardingu lub z Ustawień.

> Kotek wspiera obserwację i rytuał — **nie zastępuje diagnozy lekarza weterynarii.**
