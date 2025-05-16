# API Endpoint Implementation Plan: Create New Deck (`POST /api/decks`)

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom tworzenie nowego zestawu fiszek (deck). Po pomyślnym utworzeniu, zwraca szczegóły nowo utworzonego zestawu.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `POST`
-   **Struktura URL**: `/api/decks`
-   **Nagłówki**:
    -   `Authorization: Bearer <SUPABASE_JWT>` (wymagany do uwierzytelnienia)
    -   `Content-Type: application/json`
-   **Request Body**: Wymagany jest obiekt JSON o następującej strukturze:
    ```json
    {
      "name": "string (max 128 znaków, wymagane)"
    }
    ```
    -   `name`: Nazwa zestawu fiszek. Musi być ciągiem znaków, nie może być pusty i nie może przekraczać 128 znaków.

## 3. Wykorzystywane typy
-   **Command Model (Żądanie)**: `CreateDeckCommand` (z `src/types.ts`)
    ```typescript
    // src/types.ts
    export type CreateDeckCommand = Pick<TablesInsert<"decks">, "name">;
    ```
-   **DTO (Odpowiedź)**: `DeckDto` (z `src/types.ts`)
    ```typescript
    // src/types.ts
    export type DeckDto = Tables<"decks">;
    ```

## 4. Szczegóły odpowiedzi
-   **Odpowiedź sukcesu (201 Created)**:
    ```json
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
    Pola odpowiadają strukturze tabeli `decks` w bazie danych.
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Nieprawidłowe dane wejściowe (np. brakujące pole `name`, zbyt długa nazwa).
    -   `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
    -   `500 Internal Server Error`: Błąd po stronie serwera.

## 5. Przepływ danych
1.  Klient wysyła żądanie `POST` na `/api/decks` z JWT w nagłówku `Authorization` oraz `name` w ciele żądania.
2.  Middleware Astro (lub logika w handlerze API) weryfikuje JWT. Jeśli nieprawidłowy, zwraca `401 Unauthorized`.
3.  Handler API w `src/pages/api/decks.ts` odbiera żądanie.
4.  Dane wejściowe (`name`) są walidowane przy użyciu schemy Zod. Jeśli walidacja nie powiodła się, zwracany jest błąd `400 Bad Request`.
5.  Handler API pobiera `user_id` z sesji uwierzytelnionego użytkownika (`context.locals.session.user.id`).
6.  Handler API wywołuje metodę `createDeck(name, userId)` w `DeckService` (`src/lib/services/deck.service.ts`).
7.  `DeckService` używa klienta Supabase (`context.locals.supabase`) do wstawienia nowego rekordu do tabeli `decks` z podanym `name` i `user_id`.
8.  (Opcjonalnie) `DeckService` loguje zdarzenie `deck_created` do tabeli `event_logs`.
9.  Jeśli operacja w bazie danych zakończy się sukcesem, `DeckService` zwraca nowo utworzony obiekt `DeckDto`.
10. Handler API otrzymuje `DeckDto` od serwisu i zwraca odpowiedź `201 Created` z `DeckDto` w ciele.
11. W przypadku błędu podczas operacji w bazie danych lub w serwisie, zgłaszany jest wyjątek, który jest przechwytywany przez globalny mechanizm obsługi błędów lub w handlerze API, zwracając `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Wszystkie żądania do tego endpointu muszą być uwierzytelnione przy użyciu JWT (Supabase Auth). Handler API musi weryfikować obecność i ważność tokenu oraz istnienie sesji użytkownika. Dostęp realizowany przez `context.locals.supabase.auth` oraz `context.locals.session`.
-   **Autoryzacja**: Nowy zestaw jest automatycznie powiązany z uwierzytelnionym użytkownikiem (`user_id` z tokenu JWT). Polityki RLS (Row Level Security) w Supabase dla tabeli `decks` zapewnią, że użytkownicy mogą tworzyć zestawy tylko dla siebie (`auth.uid() = user_id`).
-   **Walidacja danych wejściowych**: Ciało żądania (`name`) musi być walidowane (typ, długość, wymagane) za pomocą Zod, aby zapobiec błędom i potencjalnym atakom (np. DoS przez zbyt duże payloady, choć ograniczenie 128 znaków jest małe).
-   **Ochrona przed CSRF**: Standardowe mechanizmy Astro i fakt, że jest to API JSON z autoryzacją Bearer, minimalizują ryzyko CSRF.
-   **Rate Limiting**: Rozważyć w przyszłości, jeśli endpoint będzie narażony na nadużycia.

## 7. Obsługa błędów
-   **Błędy walidacji (400 Bad Request)**:
    -   Jeśli pole `name` brakuje, jest puste, nie jest stringiem lub przekracza 128 znaków. Odpowiedź powinna zawierać szczegóły błędu walidacji.
    ```json
    // Przykład
    {
      "error": "Validation failed",
      "details": [
        { "path": ["name"], "message": "Name must be a string with a maximum of 128 characters" }
      ]
    }
    ```
-   **Brak autoryzacji (401 Unauthorized)**:
    -   Jeśli token JWT jest nieobecny, nieważny lub wygasł.
    ```json
    {
      "error": "Unauthorized",
      "message": "Authentication required."
    }
    ```
-   **Błędy serwera (500 Internal Server Error)**:
    -   W przypadku niepowodzenia zapisu do bazy danych lub innego nieoczekiwanego błędu serwera. Odpowiedź nie powinna ujawniać wrażliwych szczegółów błędu.
    ```json
    {
      "error": "Internal Server Error",
      "message": "An unexpected error occurred. Please try again later."
    }
    ```
-   **Logowanie błędów**:
    -   Błędy walidacji (400) i autoryzacji (401) mogą być logowane na poziomie INFO dla celów monitorowania.
    -   Błędy serwera (500) muszą być logowane na poziomie ERROR ze wszystkimi szczegółami (stack trace, kontekst żądania) do systemu logowania aplikacji.
    -   Pomyślne utworzenie zestawu może być logowane jako zdarzenie biznesowe (`deck_created`) w tabeli `event_logs` (np. z `user_id`, `deck_id`).

## 8. Rozważania dotyczące wydajności
-   Operacja tworzenia zestawu jest stosunkowo prosta (pojedynczy zapis do bazy danych).
-   Indeks na `user_id` w tabeli `decks` jest ważny dla wydajności zapytań filtrujących zestawy dla użytkownika, ale nie ma bezpośredniego wpływu na operację `INSERT`.
-   Walidacja jest szybka.
-   Potencjalnym wąskim gardłem może być jedynie sama baza danych pod dużym obciążeniem, co jest mało prawdopodobne dla tej operacji w typowych warunkach.

## 9. Etapy wdrożenia
1.  **Aktualizacja `src/types.ts`** (jeśli konieczne):
    -   Upewnić się, że `CreateDeckCommand` i `DeckDto` są poprawnie zdefiniowane i wyeksportowane. (Zgodnie z dostarczonymi informacjami, typy już istnieją).

2.  **Utworzenie/Aktualizacja `DeckService` (`src/lib/services/deck.service.ts`)**:
    -   Zdefiniować klasę `DeckService` lub zestaw funkcji.
    -   Stworzyć metodę `async createDeck(name: string, userId: string, supabase: SupabaseClient): Promise<DeckDto>`:
        -   Przyjmuje `name`, `userId` oraz instancję klienta Supabase.
        -   Wykonuje operację `insert` na tabeli `decks` używając `supabase.from('decks').insert({ name, user_id: userId }).select().single()`.
        -   Obsługuje potencjalne błędy z operacji bazodanowej (np. przez `throw` lub zwracanie obiektu z błędem).
        -   (Opcjonalnie) Loguje zdarzenie `deck_created` do tabeli `event_logs` (`supabase.from('event_logs').insert(...)`).
        -   Zwraca utworzony obiekt `DeckDto`.

3.  **Implementacja schemy walidacji Zod**:
    -   W `src/pages/api/decks.ts` (lub w dedykowanym pliku schem np. `src/lib/schemas/deck.schemas.ts` i importowanym):
        ```typescript
        import { z } from 'zod';

        export const CreateDeckSchema = z.object({
          name: z.string().min(1, "Name is required").max(128, "Name cannot exceed 128 characters"),
        });
        ```

4.  **Implementacja handlera API (`src/pages/api/decks.ts`)**:
    -   Utworzyć plik `src/pages/api/decks.ts`.
    -   Eksportować `prerender = false`.
    -   Zaimplementować funkcję `POST` async `({ request, locals }: APIContext): Promise<Response>`:
        -   Sprawdzić uwierzytelnienie:
            ```typescript
            const { session, supabase } = locals;
            if (!session?.user) {
              return new Response(JSON.stringify({ error: "Unauthorized", message: "Authentication required." }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }
            const userId = session.user.id;
            ```
        -   Odczytać i sparsować ciało żądania JSON. Obsłużyć błąd parsowania (try-catch).
        -   Zwalidować ciało żądania używając `CreateDeckSchema.safeParse(body)`:
            -   Jeśli walidacja nie powiedzie się, zwrócić odpowiedź `400 Bad Request` ze szczegółami błędów.
        -   Wywołać `deckService.createDeck(validatedData.name, userId, supabase)` (instancję serwisu należy utworzyć lub zaimportować).
        -   Jeśli serwis zwróci błąd lub rzuci wyjątek, obsłużyć go i zwrócić `500 Internal Server Error`.
        -   Jeśli operacja się powiedzie, zwrócić odpowiedź `201 Created` z `DeckDto` jako JSON.
        -   Zapewnić odpowiednie nagłówki `Content-Type: application/json` dla wszystkich odpowiedzi.

5.  **Testowanie**:
    -   Napisać testy jednostkowe dla `DeckService` (mockując klienta Supabase).
    -   Napisać testy integracyjne/E2E dla endpointu API:
        -   Przypadek sukcesu (201).
        -   Błędy walidacji (400) dla różnych przypadków (brak `name`, `name` za długie, `name` nie string).
        -   Błąd autoryzacji (401) - brak tokenu, nieważny token.
        -   Sprawdzić, czy `user_id` jest poprawnie ustawiany.
        -   (Opcjonalnie) Sprawdzić, czy log zdarzenia `deck_created` został utworzony.

6.  **Dokumentacja**:
    -   Zaktualizować dokumentację API (np. Swagger/OpenAPI, jeśli jest używana) o szczegóły tego endpointu. Plan `.ai/api-plan.md` już zawiera te informacje.

7.  **Polityki RLS w Supabase**:
    -   Upewnić się, że odpowiednie polityki RLS są na miejscu dla tabeli `decks` aby umożliwić operacje INSERT dla uwierzytelnionych użytkowników na ich własnych danych:
      ```sql
      -- Umożliwia użytkownikom wstawianie nowych zestawów dla siebie
      CREATE POLICY "Enable insert for authenticated users for their own decks"
      ON public.decks
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

      -- Umożliwia użytkownikom odczyt własnych zestawów (już powinno istnieć)
      CREATE POLICY "Enable read access for own decks"
      ON public.decks
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
      ```
      (Sprawdzić istniejące polityki i dostosować w razie potrzeby).
``` 