# Schemat Bazy Danych dla 10xCards

## 1. Tabele i Kolumny

### 1.1. user_profiles
- **id**: UUID PRIMARY KEY (generowany w aplikacji; powiązany z tabelą Supabase `users`)
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT now()
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT now()

*Dodatkowe pola (np. ustawienia, preferences) mogą być dodane w przyszłych iteracjach.*

### 1.2. decks
- **id**: UUID PRIMARY KEY
- **user_id**: UUID NOT NULL
  - FOREIGN KEY do tabeli Supabase `users` (lub logicznie do `user_profiles`)
- **name**: VARCHAR(128) NOT NULL
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT now()
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT now()

### 1.3. flashcards
- **id**: UUID PRIMARY KEY (generowany w aplikacji)
- **deck_id**: UUID NOT NULL
  - FOREIGN KEY do `decks(id)`
- **front**: VARCHAR(256) NOT NULL
- **back**: VARCHAR(512) NOT NULL
- **source**: VARCHAR NOT NULL CHECK (source IN ('ai-full', 'ai-edited', 'manual'))
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT now()
- **updated_at**: TIMESTAMPTZ NOT NULL DEFAULT now()

### 1.4. event_logs
- **id**: UUID PRIMARY KEY
- **user_id**: UUID NOT NULL
  - FOREIGN KEY do tabeli Supabase `users` (lub `user_profiles`)
- **session_id**: UUID NOT NULL
- **event_type**: VARCHAR(64) NOT NULL
  - Opis typu zdarzenia (np. generacja fiszki)
- **payload**: JSONB NOT NULL
  - Przechowuje dodatkowe dane dotyczące zdarzenia
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT now()

## 2. Relacje Między Tabelami

- Jeden rekord w tabeli `user_profiles` (lub `users`) może posiadać wiele rekordów w tabeli `decks` (relacja jeden-do-wielu).
- Jeden rekord w tabeli `decks` może zawierać wiele rekordów w tabeli `flashcards` (relacja jeden-do-wielu).
- Jeden użytkownik (tabela `user_profiles` lub `users`) może mieć wiele wpisów w tabeli `event_logs`.

## 3. Indeksy

- Indeks na `decks(user_id)` – optymalizacja zapytań filtrowanych po użytkowniku.
- Indeks na `flashcards(deck_id)` – usprawnienie wyszukiwania fiszek w obrębie zestawu.
- Indeksy na `event_logs(user_id)` i `event_logs(session_id)` – dla efektywnego wyszukiwania logów zdarzeń.

## 4. Zasady PostgreSQL (RLS i Bezpieczeństwo)

- Wdrożenie zasad Row Level Security (RLS) na tabelach: `user_profiles`, `decks`, `flashcards` oraz `event_logs`. 
  - Przykładowo, polityka RLS na tabeli `decks` ograniczy dostęp do wierszy, gdzie `user_id` odpowiada identyfikatorowi bieżącego użytkownika.

## 5. Dodatkowe Uwagi

- Wszystkie identyfikatory (`id` w `user_profiles`, `decks`, `flashcards`, `event_logs` oraz `user_id`, `deck_id`, `session_id` jako klucze obce) są generowane na poziomie aplikacji przy użyciu UUID v7.
- Check constraint w tabeli `flashcards` zapewnia, że kolumna `source` przyjmuje tylko jedną z dozwolonych wartości: 'ai-full', 'ai-edited' lub 'manual'.
- Funkcjonalność spaced repetition jest pominięta w MVP i planowana na kolejne etapy rozwoju.
- Schemat został zaprojektowany zgodnie z zasadami normalizacji (do 3NF) oraz z myślą o skalowalności przy użyciu indeksów i RLS. 