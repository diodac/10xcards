# API Endpoint Implementation Plan: POST /api/ai/generate-flashcards

## 1. Przegląd punktu końcowego
Ten punkt końcowy API umożliwia użytkownikom przesyłanie fragmentu tekstu w celu wygenerowania sugestii fiszek przy użyciu modelu językowego (LLM) za pośrednictwem usługi OpenRouter.ai. Wygenerowane sugestie są zwracane do klienta i nie są automatycznie zapisywane w bazie danych. Endpoint wymaga autentykacji użytkownika.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `POST`
-   **Struktura URL**: `/api/ai/generate-flashcards`
-   **Parametry**: Brak parametrów URL.
-   **Ciało żądania (Request Body)**:
    ```json
    {
      "text": "string (wymagane, 1000-10000 znaków)"
    }
    ```
    -   Typ MIME: `application/json`

## 3. Wykorzystywane typy
Do implementacji tego punktu końcowego wykorzystane zostaną następujące typy zdefiniowane w `src/types.ts`:
-   **Command Model (Żądanie)**: `GenerateFlashcardsCommand`
    ```typescript
    export interface GenerateFlashcardsCommand {
      text: string;
    }
    ```
-   **DTO (Odpowiedź)**: `GenerateFlashcardsResponseDto`
    ```typescript
    export interface GenerateFlashcardsResponseDto {
      suggestions: FlashcardSuggestionDto[];
    }
    ```
-   **DTO (Element sugestii)**: `FlashcardSuggestionDto`
    ```typescript
    export type FlashcardSuggestionDto = Pick<Tables<"flashcards">, "front" | "back">;
    ```

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (200 OK)**:
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
-   **Kody statusu**:
    -   `200 OK`: Sugestie wygenerowane pomyślnie.
    -   `400 Bad Request`: Nieprawidłowe ciało żądania.
    -   `401 Unauthorized`: Użytkownik nie uwierzytelniony.
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera lub błąd komunikacji z LLM.
    -   `503 Service Unavailable`: Usługa LLM jest tymczasowo niedostępna.

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST` na adres `/api/ai/generate-flashcards` z ciałem zawierającym pole `text`.
2.  Middleware Astro weryfikuje autentykację użytkownika (np. sprawdzając token JWT Supabase). Jeśli użytkownik nie jest zalogowany, zwraca `401 Unauthorized`.
3.  Handler endpointu Astro (`src/pages/api/ai/generate-flashcards.ts`):
    a.  Pobiera `supabaseClient` oraz dane użytkownika (`user`) z `Astro.locals`.
    b.  Waliduje ciało żądania (`GenerateFlashcardsCommand`) przy użyciu schematu Zod (sprawdzenie obecności pola `text` i jego długości 1000-10000 znaków). W przypadku błędu walidacji, zwraca `400 Bad Request` i loguje zdarzenie (`AI_FLASHCARD_GENERATION_VALIDATION_ERROR`) do `event_logs`.
    c.  Wywołuje metodę (np. `generateSuggestions`) z serwisu `src/lib/services/ai.service.ts`, przekazując jej `text`.
4.  Serwis `ai.service.ts`:
    a.  Pobiera klucz API OpenRouter.ai ze zmiennych środowiskowych (`import.meta.env.OPENROUTER_API_KEY`).
    b.  Konstruuje prompt dla LLM na podstawie otrzymanego tekstu.
    c.  Wysyła żądanie do API OpenRouter.ai.
    d.  Przetwarza odpowiedź LLM, mapując ją na strukturę `FlashcardSuggestionDto[]`.
    e.  W przypadku błędów komunikacji z LLM (np. błędy API OpenRouter, timeout), zgłasza odpowiedni błąd, który zostanie obsłużony w handlerze endpointu.
5.  Handler endpointu Astro:
    a.  Jeśli wywołanie serwisu zakończy się sukcesem:
        i.  Loguje zdarzenie (`AI_FLASHCARD_GENERATION_SUCCESS`) do `event_logs` (np. z liczbą wygenerowanych sugestii).
        ii. Zwraca odpowiedź `200 OK` z `GenerateFlashcardsResponseDto` zawierającym listę sugestii.
    b.  Jeśli wywołanie serwisu zwróci błąd wskazujący na niedostępność LLM, zwraca `503 Service Unavailable` i loguje zdarzenie (`AI_FLASHCARD_GENERATION_LLM_UNAVAILABLE_ERROR`).
    c.  W przypadku innych błędów z serwisu lub nieoczekiwanych błędów serwera, zwraca `500 Internal Server Error` i loguje zdarzenie (`AI_FLASHCARD_GENERATION_SERVER_ERROR` lub `AI_FLASHCARD_GENERATION_LLM_ERROR`).

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Endpoint będzie chroniony. Dostęp tylko dla zalogowanych użytkowników. Middleware Astro będzie odpowiedzialne за weryfikację tokenu Supabase.
-   **Autoryzacja**: Po uwierzytelnieniu, każdy zalogowany użytkownik ma prawo korzystać z tej funkcji. Nie ma dodatkowych ról ani uprawnień.
-   **Walidacja danych wejściowych**:
    -   Pole `text` będzie walidowane (typ: string, wymagane, długość: 1000-10000 znaków) za pomocą Zod, aby zapobiec nadużyciom i błędom.
-   **Ochrona przed Prompt Injection**: Chociaż pełna ochrona jest wyzwaniem, należy unikać bezpośredniego wstawiania nieoczyszczonego tekstu użytkownika do krytycznych części promptu, jeśli to możliwe. Na obecnym etapie polegamy na zabezpieczeniach OpenRouter.ai i walidacji długości.
-   **Rate Limiting**: Zalecane jest wdrożenie mechanizmu rate limiting (np. per użytkownik) w celu ochrony przed nadużyciami i kontroli kosztów związanych z API LLM. Można to zrealizować na poziomie middleware Astro.
-   **Bezpieczeństwo kluczy API**: Klucz API do OpenRouter.ai będzie przechowywany jako zmienna środowiskowa serwera i nie będzie dostępny po stronie klienta.
-   **Logowanie zdarzeń**: Szczegółowe logowanie operacji i błędów do tabeli `event_logs` pomoże w monitorowaniu i wykrywaniu potencjalnych problemów bezpieczeństwa.
-   **Bezpieczna obsługa błędów**: Unikać zwracania szczegółowych informacji o błędach systemowych (np. stack trace) do klienta. Zamiast tego używać generycznych komunikatów i logować szczegóły po stronie serwera.

## 7. Rozważania dotyczące wydajności
-   **Czas odpowiedzi LLM**: Głównym czynnikiem wpływającym na wydajność będzie czas odpowiedzi od API OpenRouter.ai. Należy wybrać model LLM oferujący dobry kompromis między jakością a szybkością.
-   **Asynchroniczność**: Operacje I/O (komunikacja z LLM, logowanie do bazy danych) muszą być wykonywane asynchroniczronicznie, aby nie blokować pętli zdarzeń serwera.
-   **Optymalizacja promptu**: Struktura promptu wysyłanego do LLM może wpłynąć na czas generowania odpowiedzi i jej jakość. Warto poeksperymentować z różnymi sformułowaniami.
-   **Rozmiar payloadu**: Odpowiedź z listą sugestii może być duża, jeśli LLM wygeneruje wiele fiszek. Należy rozważyć, czy istnieje potrzeba paginacji sugestii lub ograniczenia ich liczby, chociaż specyfikacja tego nie wymaga.

## 8. Etapy wdrożenia
1.  **Konfiguracja środowiska**:
    *   Dodanie zmiennej środowiskowej `OPENROUTER_API_KEY` z kluczem do OpenRouter.ai (np. w pliku `.env`).
    *   Upewnienie się, że projekt jest skonfigurowany do korzystania ze zmiennych środowiskowych po stronie serwera w Astro.
2.  **Definicja schematu Zod**:
    *   Stworzenie lub aktualizacja pliku (np. `src/lib/schemas/ai.schemas.ts` lub bezpośrednio w pliku endpointu) ze schematem `GenerateFlashcardsCommandSchema` do walidacji `text`.
3.  **Implementacja serwisu `ai.service.ts`**:
    *   Stworzenie pliku `src/lib/services/ai.service.ts`.
    *   Implementacja funkcji np. `generateFlashcardSuggestions(text: string): Promise<FlashcardSuggestionDto[]>`.
    *   Wewnątrz funkcji:
        *   Pobranie `OPENROUTER_API_KEY`.
        *   Implementacja logiki komunikacji z API OpenRouter.ai (użycie `fetch` lub dedykowanej biblioteki HTTP).
        *   Obsługa odpowiedzi LLM, w tym parsowanie i mapowanie na `FlashcardSuggestionDto[]`.
        *   Implementacja mechanizmów obsługi błędów specyficznych dla OpenRouter.ai (np. rzucanie customowych błędów, aby handler mógł je odpowiednio zinterpretować).
4.  **Implementacja endpointu API `src/pages/api/ai/generate-flashcards.ts`**:
    *   Stworzenie pliku `src/pages/api/ai/generate-flashcards.ts`.
    *   Ustawienie `export const prerender = false;`.
    *   Implementacja handlera `POST` dla żądania:
        *   Pobranie `supabase` i `user` z `Astro.locals`.
        *   Sprawdzenie, czy użytkownik jest zalogowany; jeśli nie, zwrot `401`.
        *   Walidacja ciała żądania przy użyciu `GenerateFlashcardsCommandSchema`. W przypadku błędu, zwrot `400` i logowanie do `event_logs`.
        *   Wywołanie metody z `ai.service.ts`.
        *   Obsługa sukcesu: logowanie do `event_logs`, zwrot `200` z danymi.
        *   Obsługa błędów: rozróżnienie błędów LLM (`503`) od innych błędów serwera (`500`), logowanie do `event_logs` i zwrot odpowiedniego statusu.
5.  **Implementacja logowania do `event_logs`**:
    *   Stworzenie (jeśli nie istnieje) funkcji pomocniczej `src/lib/utils/logEvent.ts` (lub podobnej) do zapisu zdarzeń w tabeli `event_logs` przy użyciu `context.locals.supabase`. Funkcja powinna przyjmować `user_id`, `session_id` (do ustalenia skąd pozyskać), `event_type` i `payload`.
    *   Integracja logowania w handlerze endpointu dla różnych scenariuszy (sukces, błędy walidacji, błędy LLM, błędy serwera).
6.  **Testowanie**:
    *   Napisanie testów jednostkowych dla serwisu `ai.service.ts` (mockowanie API OpenRouter.ai).
    *   Napisanie testów integracyjnych dla endpointu API, obejmujących różne scenariusze (poprawne żądanie, błędy walidacji, błędy LLM, brak autentykacji).
    *   Testy manualne z użyciem narzędzi takich jak Postman lub cURL.
7.  **Dokumentacja**:
    *   Upewnienie się, że endpoint jest odpowiednio opisany w dokumentacji API (np. Swagger/OpenAPI, jeśli jest używane, lub wewnętrzna dokumentacja projektu). Ten plan stanowi część tej dokumentacji.
8.  **Review i wdrożenie**:
    *   Code review.
    *   Stopniowe wdrożenie na środowiska testowe/stagingowe, a następnie na produkcję.
    *   Monitorowanie działania endpointu po wdrożeniu (logi, metryki). 