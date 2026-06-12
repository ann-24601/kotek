---
name: dodaj-wpis
description: Dodaj wpis dziennika kota (aplikacja Kotek) na konkretny dzień, domyślnie dziś. Na podstawie słownego opisu, jak minął kotu dzień, wnioskuje 4 metryki (aktywność, apetyt, miauczenie, zabawa), zapisuje wpis do bazy i weryfikuje, że zapis się udał. Używaj, gdy użytkownik opisuje dzień kota i chce go odnotować/zapisać.
---

# Dodaj wpis dziennika kota (Kotek)

Zapisuje pojedynczy wpis dzienny aplikacji **Kotek** do tabeli `day_logs` w Supabase,
ustawiając 4 metryki na podstawie tego, co użytkownik opisze słowami, a następnie
weryfikuje, że wpis trafił do bazy.

Skill działa **wszędzie, gdzie podłączony jest konektor Supabase** — w Claude.ai
(przeglądarka/aplikacja) i w Claude Code. Nie wymaga lokalnych plików ani sekretów.

## Kiedy używać

Użytkownik opisuje dzień kota i chce go odnotować, np.:
- „Zapisz dzisiejszy dzień: dużo biegał, jadł normalnie, miauczał w nocy, bawiliśmy się wędką."
- „Dodaj wpis na 5 czerwca — apatyczny, nie chciał jeść."
- „Odnotuj, że dziś prawie nie wstawał i marudził pod drzwiami."

## Dostęp do bazy

Wszystkie operacje na bazie wykonuj przez **konektor Supabase** (narzędzie typu
`execute_sql` udostępniane przez konektor Supabase MCP). Konektor sam obsługuje
autoryzację — **nie potrzebujesz** `service_role`, `.env.local` ani `curl`.

Stałe projektu Kotek (wpisane na sztywno — apka jest jednoużytkownikowa):

- `project_id` = `iythcbjjzwalyftxwswo`
- `user_id`    = `0ced3e18-9c5e-4b29-8520-445759cc8cb6`

Tabela `day_logs`: PK `(user_id, date)`; `date` = `DATE` (`YYYY-MM-DD`);
`metrics` jsonb `{aktywnosc, apetyt, vocal, zabawa}`; `note` = HTML (TipTap), np. `<p>...</p>`, albo `NULL`.

> Jeśli konektor Supabase nie jest dostępny w danej rozmowie, poproś użytkownika,
> by go podłączył (Ustawienia → Konektory → Supabase), bo bez niego nie da się zapisać wpisu.

## Skala metryk (wnioskuj wartość z opisu)

Wybierz dla każdej metryki **jedną** wartość. Jeśli opis nic nie mówi o danej metryce,
ustaw „jak zwykle" (⟵ normal) — podaj komplet 4 wartości.

**aktywnosc** (Aktywność): `0` Brak · `1` Mało · `2` Jak zwykle ⟵ normal · `3` Dużo
**apetyt** (Apetyt) — `0` to czerwona flaga: `0` Mniej · `1` Jak zwykle ⟵ normal · `2` Więcej
**vocal** (Miauczenie): `0` Mniej · `1` Jak zwykle ⟵ normal · `2` Więcej · `3` Nocne · `4` Pod drzwiami · `5` O jedzenie
**zabawa** (Zabawa): `0` Brak · `1` Krótko · `2` Dobra sesja ⟵ normal

### Wskazówki interpretacji
- „normalnie / jak zawsze / bez zmian" → wartość normal danej metryki.
- „nie jadł / odmawiał jedzenia" → `apetyt = 0` (red flag — wspomnij o niej w podsumowaniu).
- „leżał cały dzień / apatyczny / nie wstawał" → `aktywnosc = 0` lub `1`.
- „nakręcony / szalał / dużo biegał" → `aktywnosc = 3`, często też `zabawa = 2`.
- Miauczenie: „budził w nocy" → `3`, „marudził pod drzwiami" → `4`, „domagał się jedzenia" → `5`,
  ogólnie „dużo miauczał" → `2`.
- Jeśli opis jest niejednoznaczny dla kluczowej metryki (np. nie wiadomo, czy jadł),
  dopytaj użytkownika ZANIM zapiszesz; drobne luki uzupełnij wartością normal.

## Procedura

1. **Ustal datę.** Domyślnie dziś (aktualna data w formacie `YYYY-MM-DD`). Jeśli użytkownik
   podał dzień („wczoraj", „5 czerwca") — przelicz na `YYYY-MM-DD`.
2. **Wywnioskuj 4 metryki** z opisu wg skali wyżej.
3. **Zbuduj notatkę** jako HTML akapit z opisem użytkownika, np.
   `<p>Dużo biegał, jadł normalnie, w nocy miauczał.</p>`. Bez notatki → `NULL`.
   W SQL apostrof w treści notatki podwajaj (`'` → `''`).
4. **(Opcjonalnie) sprawdź, czy wpis na ten dzień już istnieje** — by ostrzec o nadpisaniu.
   Wywołaj `execute_sql` konektora Supabase z `project_id` = `iythcbjjzwalyftxwswo`:
   ```sql
   select date from public.day_logs
   where user_id = '0ced3e18-9c5e-4b29-8520-445759cc8cb6' and date = '<YYYY-MM-DD>';
   ```
5. **Zapisz (upsert).** `on conflict (user_id, date)` robi upsert po kluczu głównym.
   Wywołaj `execute_sql` konektora Supabase z `project_id` = `iythcbjjzwalyftxwswo`:
   ```sql
   insert into public.day_logs (user_id, date, metrics, note)
   values (
     '0ced3e18-9c5e-4b29-8520-445759cc8cb6',
     '<YYYY-MM-DD>',
     '{"aktywnosc":<n>,"apetyt":<n>,"vocal":<n>,"zabawa":<n>}'::jsonb,
     '<HTML notatki>'        -- albo NULL (bez cudzysłowów)
   )
   on conflict (user_id, date) do update
     set metrics = excluded.metrics,
         note = excluded.note,
         updated_at = now()
   returning date, metrics, note, updated_at;
   ```
   Jeśli na ten dzień istniał już wpis (krok 4) — poinformuj użytkownika, że został nadpisany.
6. **Zweryfikuj zapis** — niezależny odczyt z bazy i porównanie z zamiarem:
   ```sql
   select date, metrics, note, updated_at from public.day_logs
   where user_id = '0ced3e18-9c5e-4b29-8520-445759cc8cb6' and date = '<YYYY-MM-DD>';
   ```
   Potwierdź, że: (a) zwrócono dokładnie jeden rekord, (b) wszystkie 4 klucze metryk mają
   oczekiwane wartości, (c) `note` zgadza się z zamierzoną. Jeśli coś się nie zgadza albo
   odpowiedź zawiera błąd — napraw i zweryfikuj ponownie.
7. **Podsumuj użytkownikowi** po polsku: datę i ustawione metryki z etykietami słownymi
   (np. „Aktywność: Dużo, Apetyt: Jak zwykle, Miauczenie: Nocne, Zabawa: Dobra sesja")
   oraz wynik weryfikacji. Jeśli `apetyt = 0` lub inne czerwone flagi — delikatnie zasugeruj
   obserwację / wizytę u weterynarza.

## Mapowanie wartość → etykieta (do podsumowania)

| metryka | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| aktywnosc | Brak | Mało | Jak zwykle | Dużo | – | – |
| apetyt | Mniej | Jak zwykle | Więcej | – | – | – |
| vocal | Mniej | Jak zwykle | Więcej | Nocne | Pod drzwiami | O jedzenie |
| zabawa | Brak | Krótko | Dobra sesja | – | – | – |
