# Plan implementacji widoku "Ekran generowania fiszek przez AI"

## 1. Przegląd
Celem tego widoku jest umożliwienie użytkownikom wprowadzenia dłuższego tekstu źródłowego (1000-10000 znaków), który następnie zostanie przesłany do API w celu wygenerowania sugestii fiszek przy użyciu sztucznej inteligencji. Widok będzie zawierał pole tekstowe na treść, przycisk do inicjowania generowania oraz będzie obsługiwał stany ładowania i błędy. Po pomyślnym wygenerowaniu sugestii, użytkownik zostanie przekierowany do ekranu przeglądu tych sugestii.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką:
-   `/ai/generate`

Założenie: Generowanie fiszek na tym etapie nie jest powiązane z konkretnym zestawem (`deckId`). Przypisanie do zestawu nastąpi na późniejszym etapie (ekran przeglądu sugestii).

## 3. Struktura komponentów
Widok będzie się składał z głównej strony Astro oraz osadzonego w niej komponentu React odpowiedzialnego za logikę formularza i interakcję z API.

```
src/layouts/Layout.astro
└── src/pages/ai/generate.astro (AIGenerationPage)
    └── src/components/ai/AIGenerationForm.tsx (React client component)
        ├── Shadcn/ui Label (dla Textarea)
        ├── Shadcn/ui Textarea (dla wprowadzania tekstu)
        ├── Element wyświetlający liczbę znaków (np. <p> lub <span>)
        ├── Shadcn/ui Button (do wysłania formularza)
        ├── Wskaźnik ładowania (np. Shadcn/ui Spinner lub tekst)
        └── Kontener na komunikaty o błędach (np. Shadcn/ui Alert)
```

## 4. Szczegóły komponentów

### `src/pages/ai/generate.astro` (AIGenerationPage)
-   **Opis komponentu**: Główna strona Astro dla widoku generowania fiszek. Odpowiada za ustawienie ogólnego layoutu strony, tytułu oraz osadzenie interaktywnego komponentu React `AIGenerationForm`.
-   **Główne elementy**:
    -   Standardowy layout aplikacji (np. `<Layout title="Generuj fiszki przez AI">`).
    -   Nagłówek strony (np. `<h1>Generuj fiszki z pomocą AI</h1>`).
    -   Instrukcje dla użytkownika dotyczące wprowadzania tekstu.
    -   Renderowanie komponentu `<AIGenerationForm client:load />` (lub `client:visible` w zależności od preferencji hydracji).
-   **Obsługiwane interakcje**: Brak bezpośrednich interakcji; delegowane do komponentu React.
-   **Obsługiwana walidacja**: Brak.
-   **Typy**: Zależne od używanego Layoutu.
-   **Propsy**: Props standardowe dla layoutu (np. `title`).

### `src/components/ai/AIGenerationForm.tsx` (React Component)
-   **Opis komponentu**: Interaktywny formularz React umożliwiający użytkownikowi wprowadzenie tekstu, walidację, wysłanie go do API w celu wygenerowania fiszek oraz obsługę stanów ładowania i błędów. Po sukcesie, komponent będzie odpowiedzialny za przekazanie wygenerowanych sugestii do następnego etapu (np. poprzez nawigację i przekazanie danych przez stan globalny).
-   **Główne elementy HTML i komponenty dzieci**:
    -   `<form>` obejmujący elementy.
    -   `Label` (Shadcn/ui) powiązany z Textarea.
    -   `Textarea` (Shadcn/ui) do wprowadzania tekstu przez użytkownika.
    -   Wyświetlacz liczby znaków (np. `<p>Liczba znaków: {charCount}/10000</p>`).
    -   `Button` (Shadcn/ui) typu "submit" z tekstem "Generuj fiszki".
    -   Warunkowo renderowany wskaźnik ładowania (np. komponent `Spinner` lub tekst "Generowanie...").
    -   Warunkowo renderowany komponent `Alert` (Shadcn/ui) do wyświetlania błędów walidacji lub błędów API.
-   **Obsługiwane interakcje**:
    -   Zmiana wartości w `Textarea`: aktualizacja stanu tekstu, liczby znaków.
    -   Kliknięcie przycisku "Generuj fiszki": uruchomienie walidacji, a następnie wywołanie API.
-   **Obsługiwana walidacja**:
    -   Długość wprowadzonego tekstu: musi zawierać od 1000 do 10000 znaków.
    -   Komunikat walidacyjny wyświetlany, jeśli warunek nie jest spełniony.
    -   Przycisk "Generuj fiszki" jest nieaktywny, jeśli tekst nie spełnia kryteriów walidacji lub trwa ładowanie.
-   **Typy**:
    -   Stan wewnętrzny: `textInput: string`, `isLoading: boolean`, `error: string | null`, `charCount: number`.
    -   Dane żądania API: `GenerateFlashcardsCommand`.
    -   Dane odpowiedzi API: `GenerateFlashcardsResponseDto`.
-   **Propsy**: Brak propsów od rodzica (komponent jest samodzielny w ramach strony).

## 5. Typy
Do implementacji widoku wykorzystane zostaną następujące, już zdefiniowane, typy (z `src/types.ts`):

-   **`GenerateFlashcardsCommand`**:
    ```typescript
    export interface GenerateFlashcardsCommand {
      text: string; // Tekst źródłowy do generowania fiszek
    }
    ```
-   **`FlashcardSuggestionDto`**:
    ```typescript
    export type FlashcardSuggestionDto = Pick<Tables<"flashcards">, "front" | "back">;
    // front: string - Przód sugerowanej fiszki
    // back: string - Tył sugerowanej fiszki
    ```
-   **`GenerateFlashcardsResponseDto`**:
    ```typescript
    export interface GenerateFlashcardsResponseDto {
      suggestions: FlashcardSuggestionDto[]; // Lista sugestii fiszek
    }
    ```
Nie przewiduje się potrzeby tworzenia nowych, niestandardowych typów ViewModel dla tego konkretnego widoku, poza stanami komponentu React.

## 6. Zarządzanie stanem
Stan będzie zarządzany głównie wewnątrz komponentu React `AIGenerationForm.tsx` przy użyciu hooków `useState`.

-   `textInput: string`: Przechowuje aktualną wartość wprowadzoną w polu `Textarea`. Inicjalizowany jako `""`.
-   `charCount: number`: Przechowuje aktualną liczbę znaków w `textInput`. Inicjalizowany jako `0`.
-   `isLoading: boolean`: Wskazuje, czy trwa proces komunikacji z API. `true` podczas ładowania, w przeciwnym razie `false`. Inicjalizowany jako `false`.
-   `error: string | null`: Przechowuje komunikat błędu (walidacji lub z API) do wyświetlenia użytkownikowi. `null` jeśli brak błędu. Inicjalizowany jako `null`.

**Przekazywanie danych do ekranu przeglądu sugestii:**
Po pomyślnym otrzymaniu sugestii z API, dane (`suggestions: FlashcardSuggestionDto[]`) muszą zostać przekazane do ekranu `/ai/review-suggestions`. Zalecanym podejściem jest użycie lekkiego, globalnego store'a po stronie klienta (np. Zustand lub Jotai) skonfigurowanego w projekcie Astro.
1.  Po otrzymaniu odpowiedzi, zapisz `suggestions` w store.
2.  Przekieruj użytkownika na stronę `/ai/review-suggestions` (np. używając `window.location.href`).
3.  Komponent na stronie `/ai/review-suggestions` odczyta dane ze store'a.

Nie jest konieczne tworzenie dedykowanego custom hooka (`useFlashcardGenerator`) wyłącznie dla tego widoku, chyba że logika API stanie się bardziej złożona lub będzie reużywana w innych miejscach. Na ten moment, logika może znajdować się bezpośrednio w komponencie `AIGenerationForm.tsx`.

## 7. Integracja API
Widok będzie integrował się z jednym punktem końcowym API:

-   **Endpoint**: `POST /api/ai/generate-flashcards`
-   **Cel**: Przesłanie tekstu źródłowego w celu wygenerowania sugestii fiszek.
-   **Typ żądania (Request Payload)**: `application/json`
    ```json
    {
      "text": "string" // (1000-10000 znaków)
    }
    ```
    Odpowiada typowi `GenerateFlashcardsCommand`.
-   **Typ odpowiedzi (Response Payload - 200 OK)**: `application/json`
    ```json
    {
      "suggestions": [
        {
          "front": "string",
          "back": "string"
        }
        // ... więcej sugestii
      ]
    }
    ```
    Odpowiada typowi `GenerateFlashcardsResponseDto`.
-   **Obsługa żądania**:
    -   Użycie standardowej funkcji `fetch` (lub biblioteki typu Axios, jeśli jest w projekcie).
    -   Ustawienie nagłówka `Content-Type: application/json`.
    -   Token autoryzacyjny JWT powinien być automatycznie obsługiwany przez konfigurację klienta Supabase lub globalne hooki `fetch` w Astro, jeśli są zdefiniowane.
-   **Obsługa odpowiedzi**:
    -   Sprawdzenie statusu odpowiedzi.
    -   Dla statusu `200 OK`: sparsowanie JSONa odpowiedzi, zapisanie sugestii w store i przekierowanie.
    -   Dla statusów błędów (`400`, `401`, `500`, `503`): wyświetlenie odpowiedniego komunikatu błędu.

## 8. Interakcje użytkownika
-   **Wpisywanie tekstu w `Textarea`**:
    -   Stan `textInput` jest aktualizowany.
    -   Stan `charCount` jest aktualizowany.
    -   Przycisk "Generuj fiszki" jest aktywny/nieaktywny w zależności od walidacji długości tekstu i stanu `isLoading`.
    -   Dynamiczne komunikaty walidacyjne (np. "Tekst za krótki/za długi") mogą być wyświetlane.
-   **Kliknięcie przycisku "Generuj fiszki"**:
    -   **Gdy tekst jest nieprawidłowy**: Wyświetlany jest błąd walidacji; API nie jest wywoływane.
    -   **Gdy tekst jest prawidłowy**:
        1.  `isLoading` ustawiane na `true`.
        2.  Poprzedni `error` jest czyszczony.
        3.  Wyświetlany jest wskaźnik ładowania.
        4.  Przycisk i pole tekstowe są deaktywowane.
        5.  Wysyłane jest żądanie do API.
        6.  **Po sukcesie API**:
            -   `isLoading` ustawiane na `false`.
            -   Sugestie są zapisywane w globalnym store.
            -   Użytkownik jest przekierowywany na `/ai/review-suggestions`.
        7.  **Po błędzie API**:
            -   `isLoading` ustawiane na `false`.
            -   Wyświetlany jest odpowiedni komunikat błędu.
            -   Przycisk i pole tekstowe są ponownie aktywowane.

## 9. Warunki i walidacja
-   **Warunek główny**: Tekst wprowadzony przez użytkownika musi mieć długość od 1000 do 10000 znaków.
-   **Miejsce walidacji**: W komponencie `AIGenerationForm.tsx`, przed wysłaniem żądania do API.
-   **Wpływ na interfejs**:
    -   Przycisk "Generuj fiszki" jest nieaktywny (`disabled`), jeśli:
        -   `textInput.length < 1000`
        -   `textInput.length > 10000`
        -   `isLoading === true`
    -   Komunikat o błędzie walidacji jest wyświetlany, jeśli użytkownik spróbuje wysłać formularz z nieprawidłowym tekstem lub dynamicznie podczas pisania.
    -   Licznik znaków informuje użytkownika o bieżącej długości tekstu.

## 10. Obsługa błędów
-   **Błędy walidacji po stronie klienta**:
    -   **Problem**: Tekst za krótki lub za długi.
    -   **Obsługa**: Wyświetlenie komunikatu np. "Tekst musi zawierać od 1000 do 10000 znaków." Ustawienie stanu `error` w komponencie. Zapobieganie wysłaniu żądania API.
-   **Błędy API**:
    -   **`400 Bad Request`**:
        -   **Problem**: Nieprawidłowe dane wysłane do serwera (np. walidacja po stronie serwera również wykryła problem).
        -   **Obsługa**: Wyświetlenie komunikatu "Nieprawidłowe dane wejściowe. Upewnij się, że tekst ma od 1000 do 10000 znaków." Ustawienie stanu `error`.
    -   **`401 Unauthorized`**:
        -   **Problem**: Użytkownik nie jest zalogowany lub sesja wygasła.
        -   **Obsługa**: Wyświetlenie komunikatu "Nie jesteś zalogowany lub Twoja sesja wygasła. Zaloguj się ponownie." Ustawienie stanu `error`. Można rozważyć przekierowanie na stronę logowania.
    -   **`500 Internal Server Error`**:
        -   **Problem**: Wewnętrzny błąd serwera lub błąd podczas komunikacji z LLM.
        -   **Obsługa**: Wyświetlenie komunikatu "Wystąpił błąd serwera. Spróbuj ponownie później." Ustawienie stanu `error`.
    -   **`503 Service Unavailable`**:
        -   **Problem**: Usługa LLM jest tymczasowo niedostępna.
        -   **Obsługa**: Wyświetlenie komunikatu "Usługa generowania fiszek jest tymczasowo niedostępna. Spróbuj ponownie później." Ustawienie stanu `error`.
    -   **Błąd sieciowy (ogólny `fetch` error)**:
        -   **Problem**: Brak połączenia z internetem, serwer nieosiągalny.
        -   **Obsługa**: Wyświetlenie komunikatu "Błąd połączenia. Sprawdź swoje połączenie internetowe i spróbuj ponownie." Ustawienie stanu `error`.
-   **Sposób wyświetlania błędów**: Użycie komponentu `Alert` z biblioteki Shadcn/ui, wyświetlanego warunkowo, gdy stan `error` nie jest `null`.

## 11. Kroki implementacji
1.  **Utworzenie strony Astro**:
    -   Stwórz plik `src/pages/ai/generate.astro`.
    -   Dodaj podstawową strukturę strony, używając istniejącego layoutu (np. `Layout.astro`).
    -   Dodaj tytuł strony i ewentualne statyczne teksty/instrukcje.
2.  **Utworzenie komponentu React `AIGenerationForm`**:
    -   Stwórz plik `src/components/ai/AIGenerationForm.tsx`.
    -   Zaimplementuj strukturę JSX formularza, używając komponentów z Shadcn/ui (`Label`, `Textarea`, `Button`, `Alert`, `Spinner` - jeśli potrzebny jako oddzielny komponent).
    -   Dodaj wyświetlacz licznika znaków.
3.  **Implementacja logiki stanu w `AIGenerationForm`**:
    -   Zdefiniuj stany: `textInput`, `charCount`, `isLoading`, `error` używając `useState`.
    -   Zaimplementuj funkcję obsługi zmiany wartości w `Textarea` (`handleInputChange`), aktualizującą `textInput` i `charCount`.
4.  **Implementacja walidacji**:
    -   Dodaj logikę sprawdzającą długość `textInput`.
    -   Dynamicznie ustawiaj atrybut `disabled` dla przycisku "Generuj fiszki" na podstawie wyniku walidacji i stanu `isLoading`.
    -   Wyświetlaj komunikaty o błędach walidacji.
5.  **Implementacja obsługi wysyłania formularza (`handleSubmit`)**:
    -   W funkcji `handleSubmit`:
        -   Sprawdź ponownie warunki walidacji. Jeśli nie są spełnione, ustaw `error` i przerwij.
        -   Ustaw `isLoading(true)` i wyczyść `error`.
        -   Wywołaj funkcję `fetch` do `POST /api/ai/generate-flashcards` z `textInput` w ciele żądania.
        -   Obsłuż odpowiedź sukcesu (status 200):
            -   Pobierz `suggestions` z odpowiedzi.
            -   Zapisz `suggestions` w globalnym store (np. Zustand/Jotai - jeśli nie ma, trzeba go pierw skonfigurować).
            -   Przekieruj użytkownika na `/ai/review-suggestions`.
            -   Ustaw `isLoading(false)`.
        -   Obsłuż odpowiedzi błędów (statusy 4xx, 5xx):
            -   Ustaw odpowiedni komunikat w stanie `error`.
            -   Ustaw `isLoading(false)`.
        -   Obsłuż błędy sieciowe (blok `catch` dla `fetch`).
6.  **Integracja `AIGenerationForm` ze stroną Astro**:
    -   W `src/pages/ai/generate.astro`, zaimportuj i umieść komponent `<AIGenerationForm client:load />` (lub `client:visible`).
7.  **Konfiguracja globalnego store (jeśli nie istnieje)**:
    -   Jeśli projekt nie używa jeszcze globalnego store'a (np. Zustand, Jotai), skonfiguruj go, aby umożliwić przekazywanie `suggestions` między stronami.
8.  **Styling i UX**:
    -   Dostosuj wygląd i responsywność formularza za pomocą Tailwind CSS.
    -   Upewnij się, że komunikaty o stanie (ładowanie, błędy) są jasne i czytelne dla użytkownika.
9.  **Testowanie**:
    -   Przetestuj ręcznie wszystkie ścieżki interakcji:
        -   Wprowadzanie poprawnego tekstu i pomyślne generowanie.
        -   Wprowadzanie tekstu za krótkiego/za długiego.
        -   Scenariusze błędów API (można mockować odpowiedzi serwera lub testować na środowisku deweloperskim z odpowiednimi warunkami).
        -   Responsywność widoku.
10. **Code Review i Refaktoryzacja**:
    -   Przeprowadź przegląd kodu pod kątem czystości, wydajności i zgodności z dobrymi praktykami.
    -   Dokonaj ewentualnych poprawek.
