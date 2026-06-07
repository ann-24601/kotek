---
name: dodaj-wpis
description: Dodaj wpis dziennika kota (aplikacja Kotek) na konkretny dzień, domyślnie dziś. Na podstawie słownego opisu, jak minął kotu dzień, wnioskuje 4 metryki (aktywność, apetyt, miauczenie, zabawa), zapisuje wpis do bazy i weryfikuje, że zapis się udał. Używaj, gdy użytkownik opisuje dzień kota i chce go odnotować/zapisać.
---

# Dodaj wpis dziennika kota (Kotek)

Zapisuje pojedynczy wpis dzienny aplikacji **Kotek** do tabeli `day_logs` w Supabase,
ustawiając 4 metryki na podstawie tego, co użytkownik opisze słowami, a następnie
weryfikuje, że wpis trafił do bazy.

## Kiedy używać

Użytkownik opisuje dzień kota i chce go odnotować, np.:
- „Zapisz dzisiejszy dzień: dużo biegał, jadł normalnie, miauczał w nocy, bawiliśmy się wędką."
- „Dodaj wpis na 5 czerwca — apatyczny, nie chciał jeść."
- „Odnotuj, że dziś prawie nie wstawał i marudził pod drzwiami."

## Autoryzacja

Zapis/odczyt idą przez **REST API Supabase (PostgREST)** kluczem **service_role**
(omija RLS — dlatego `user_id` podajesz jawnie). Wartości czytaj z `kotek/.env.local`,
NIE wpisuj kluczy na stałe w komendach ani w odpowiedzi. Wczytaj je do shella przed
wywołaniami (uruchamiaj z katalogu repo albo użyj ścieżki bezwzględnej do `.env.local`):

```bash
set -a; . "kotek/.env.local"; set +a
BASE="$NEXT_PUBLIC_SUPABASE_URL/rest/v1"
AUTH=(-H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
```

Dane wpisu: tabela `day_logs`, PK `(user_id, date)`; `date` = `YYYY-MM-DD`;
`metrics` jsonb `{aktywnosc, apetyt, vocal, zabawa}`; `note` = HTML (TipTap), np. `<p>...</p>`.

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

1. **Ustal datę.** Domyślnie dziś (`date +%F`). Jeśli użytkownik podał dzień
   („wczoraj", „5 czerwca") — przelicz na `YYYY-MM-DD`.
2. **Wczytaj sekrety** (sekcja „Autoryzacja"). `user_id` = `$KOTEK_USER_ID`.
3. **Wywnioskuj 4 metryki** z opisu wg skali wyżej.
4. **Zbuduj notatkę** jako HTML akapit z opisem użytkownika, np.
   `<p>Dużo biegał, jadł normalnie, w nocy miauczał.</p>`. Bez notatki → `null`.
5. **(Opcjonalnie) sprawdź, czy wpis na ten dzień już istnieje** — by ostrzec o nadpisaniu:
   ```bash
   curl -s "${AUTH[@]}" "$BASE/day_logs?user_id=eq.$KOTEK_USER_ID&date=eq.<YYYY-MM-DD>&select=date"
   ```
6. **Zapisz (upsert).** `Prefer: resolution=merge-duplicates` robi upsert po `(user_id,date)`:
   ```bash
   curl -s "${AUTH[@]}" \
     -H "Content-Type: application/json" \
     -H "Prefer: resolution=merge-duplicates,return=representation" \
     "$BASE/day_logs?on_conflict=user_id,date" \
     -d '{
       "user_id":"'"$KOTEK_USER_ID"'",
       "date":"<YYYY-MM-DD>",
       "metrics":{"aktywnosc":<n>,"apetyt":<n>,"vocal":<n>,"zabawa":<n>},
       "note":"<HTML lub null>"
     }'
   ```
   Jeśli na ten dzień istniał już wpis — poinformuj użytkownika, że został nadpisany.
7. **Zweryfikuj zapis** — niezależny odczyt z bazy i porównanie z zamiarem:
   ```bash
   curl -s "${AUTH[@]}" \
     "$BASE/day_logs?user_id=eq.$KOTEK_USER_ID&date=eq.<YYYY-MM-DD>&select=date,metrics,note,updated_at"
   ```
   Potwierdź, że: (a) zwrócono dokładnie jeden rekord, (b) wszystkie 4 klucze metryk mają
   oczekiwane wartości, (c) `note` zgadza się z zamierzoną. Jeśli coś się nie zgadza albo
   odpowiedź zawiera błąd/`message` — napraw i zweryfikuj ponownie.
8. **Podsumuj użytkownikowi** po polsku: datę i ustawione metryki z etykietami słownymi
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
