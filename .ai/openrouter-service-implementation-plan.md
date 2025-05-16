# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis Usługi

Usługa OpenRouter będzie stanowić centralny punkt integracji z API OpenRouter.ai w aplikacji. Jej głównym zadaniem jest umożliwienie wysyłania zapytań do różnych modeli językowych (LLM) dostępnych poprzez OpenRouter, zarządzanie konfiguracją, formatowanie żądań, parsowanie odpowiedzi (w tym odpowiedzi strukturalnych JSON) oraz obsługa błędów. Usługa będzie zaprojektowana z myślą o modularności i łatwości użycia w ramach backendu aplikacji (np. w endpointach API Astro lub funkcjach serwerowych Supabase Edge Functions).

**Kluczowe cele:**
-   Abstrakcja komunikacji z API OpenRouter.
-   Obsługa konfiguracji (klucz API, domyślny model).
-   Możliwość wysyłania komunikatów systemowych i użytkownika.
-   Wsparcie dla żądania ustrukturyzowanych odpowiedzi JSON (`response_format` ze schematem JSON).
-   Elastyczny wybór modelu i jego parametrów.
-   Spójna obsługa błędów i logowanie.
-   Obsługa odpowiedzi strumieniowych (opcjonalnie, jeśli wymagane).

## 2. Opis Konstruktora

Konstruktor usługi `OpenRouterService` będzie przyjmował obiekt konfiguracyjny, który dostarczy niezbędne parametry do działania usługi, takie jak klucz API.

```typescript
// src/lib/services/openrouter/OpenRouterService.ts

interface OpenRouterServiceConfig {
  apiKey: string;
  defaultModel?: string;
  apiBaseUrl?: string; // Domyślnie https://openrouter.ai/api/v1
  requestTimeout?: number; // w milisekundach
}

class OpenRouterService {
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly apiBaseUrl: string;
  private readonly requestTimeout: number;

  constructor(config: OpenRouterServiceConfig) {
    if (!config.apiKey) {
      throw new Error("OpenRouter API key is required.");
    }
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel || "mistralai/mistral-7b-instruct"; // Przykładowy domyślny model
    this.apiBaseUrl = config.apiBaseUrl || "https://openrouter.ai/api/v1";
    this.requestTimeout = config.requestTimeout || 30000; // 30 sekund timeout
  }

  // ... metody usługi
}

// Inicjalizacja usługi (np. w kontekście żądania API lub globalnie, jeśli bezpieczne)
// const openRouterService = new OpenRouterService({
//   apiKey: process.env.OPENROUTER_API_KEY,
// });
```

## 3. Publiczne Metody i Pola

### Metody Publiczne

1.  **`async getChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>`**
    *   **Opis**: Główna metoda do wysyłania żądania uzupełnienia czatu do API OpenRouter.
    *   **Argumenty**:
        *   `request: ChatCompletionRequest`: Obiekt zawierający:
            *   `model?: string`: Nazwa modelu do użycia (jeśli nie podano, użyje `defaultModel`).
            *   `messages: Message[]`: Tablica obiektów wiadomości (`{ role: "system" | "user" | "assistant", content: string }`).
            *   `response_format?: ResponseFormat`: Opcjonalny obiekt do żądania odpowiedzi w formacie JSON. Przykład: `{ type: 'json_schema', json_schema: { name: 'my_schema', strict: true, schema: { type: "object", properties: { ... } } } }`.
            *   `temperature?: number`: Parametr modelu.
            *   `max_tokens?: number`: Parametr modelu.
            *   `top_p?: number`: Parametr modelu.
            *   `stream?: boolean`: Czy odpowiedź ma być strumieniowa (domyślnie `false`).
            *   Inne parametry wspierane przez API OpenRouter.
    *   **Zwraca**: `Promise<ChatCompletionResponse>`: Obiekt zawierający odpowiedź z modelu, np. `choices`, `usage`.
    *   **Przykład użycia**:
        ```typescript
        // const response = await openRouterService.getChatCompletion({
        //   messages: [
        //     { role: "system", content: "Jesteś pomocnym asystentem." },
        //     { role: "user", content: "Opowiedz mi dowcip." }
        //   ],
        //   model: "openai/gpt-4o",
        //   temperature: 0.7,
        //   max_tokens: 150
        // });
        // console.log(response.choices[0].message.content);
        ```

2.  **`async getChatCompletionStream(request: ChatCompletionRequest, onChunk: (chunk: StreamChunk) => void, onError: (error: Error) => void, onEnd: () => void): Promise<void>`** (jeśli implementowane jest strumieniowanie)
    *   **Opis**: Metoda do obsługi odpowiedzi strumieniowych.
    *   **Argumenty**:
        *   `request: ChatCompletionRequest`: Jak wyżej, ale `stream` powinno być `true`.
        *   `onChunk`: Callback wywoływany dla każdego fragmentu danych.
        *   `onError`: Callback wywoływany w przypadku błędu strumienia.
        *   `onEnd`: Callback wywoływany po zakończeniu strumienia.
    *   **Zwraca**: `Promise<void>`.

### Pola Publiczne
Brak pól publicznych; konfiguracja i stan są zarządzane wewnętrznie.

## 4. Prywatne Metody i Pola

### Metody Prywatne

1.  **`private async _fetchFromApi<T>(endpoint: string, body: Record<string, any>, stream: boolean = false): Promise<T | ReadableStream<Uint8Array>>`**
    *   **Opis**: Wewnętrzna metoda do wykonywania żądań HTTP do API OpenRouter.
    *   **Argumenty**:
        *   `endpoint: string`: Ścieżka API (np. `/chat/completions`).
        *   `body: Record<string, any>`: Ciało żądania.
        *   `stream: boolean`: Czy żądanie jest strumieniowe.
    *   **Zwraca**: `Promise<T | ReadableStream<Uint8Array>>`: Sparsowana odpowiedź JSON lub strumień.
    *   **Logika**:
        *   Budowanie pełnego URL.
        *   Ustawianie nagłówków (`Authorization: Bearer ${this.apiKey}`, `Content-Type: application/json`, `HTTP-Referer`, `X-Title`).
        *   Wykonanie `fetch` z `AbortController` dla timeoutu.
        *   Obsługa błędów HTTP (4xx, 5xx).
        *   Parsowanie odpowiedzi JSON lub zwracanie strumienia.

2.  **`private _buildRequestBody(request: ChatCompletionRequest): Record<string, any>`**
    *   **Opis**: Buduje ciało żądania na podstawie `ChatCompletionRequest`.
    *   **Logika**:
        *   Ustawia `model` (używa `defaultModel`, jeśli nie podano).
        *   Przekazuje `messages`.
        *   Dołącza `response_format`, `temperature`, `max_tokens`, `stream` i inne parametry, jeśli są zdefiniowane.

3.  **`private _handleApiError(response: Response, responseBody?: any): Error`**
    *   **Opis**: Tworzy i zwraca odpowiedni obiekt błędu na podstawie odpowiedzi API.
    *   **Logika**: Mapuje statusy HTTP i komunikaty błędów z API na niestandardowe klasy błędów (np. `OpenRouterApiError`, `AuthenticationError`, `RateLimitError`).

### Pola Prywatne

*   `apiKey: string`
*   `defaultModel: string`
*   `apiBaseUrl: string`
*   `requestTimeout: number`

## 5. Obsługa Błędów

Usługa będzie implementować robustną obsługę błędów, kategoryzując je dla łatwiejszej diagnostyki i obsługi po stronie klienta.

1.  **`ConfigurationError`**: Zgłaszany, gdy brakuje kluczowych elementów konfiguracji (np. `apiKey`).
2.  **`NetworkError`**: Zgłaszany w przypadku problemów z połączeniem z API OpenRouter (np. timeout, błąd DNS).
3.  **`OpenRouterApiError`**: Ogólny błąd API OpenRouter.
    *   **`AuthenticationError` (dziedziczy po `OpenRouterApiError`)**: Błędy 401, 403.
    *   **`RateLimitError` (dziedziczy po `OpenRouterApiError`)**: Błąd 429.
    *   **`InvalidRequestError` (dziedziczy po `OpenRouterApiError`)**: Błąd 400.
    *   **`ServerError` (dziedziczy po `OpenRouterApiError`)**: Błędy 5xx.
4.  **`ResponseParsingError`**: Zgłaszany, gdy odpowiedź API nie jest prawidłowym JSON-em (gdy oczekiwano JSON) lub gdy strukturalna odpowiedź JSON nie pasuje do schematu.

Wszystkie błędy będą zawierać oryginalny status code (jeśli dotyczy) i komunikat błędu z API. Błędy będą logowane po stronie serwera (np. za pomocą `console.error` lub dedykowanego loggera).

**Mechanizmy**:
-   Bloki `try-catch` wokół operacji `fetch` i parsowania JSON.
-   Walidacja odpowiedzi HTTP status codes.
-   Opcjonalny mechanizm ponawiania prób (retry) z wykładniczym backoffem dla błędów sieciowych i `RateLimitError`.
-   Walidacja schematu JSON dla odpowiedzi strukturalnych przy użyciu biblioteki takiej jak `ajv` (jeśli `response_format.type === 'json_schema'`).

```typescript
// Przykładowe niestandardowe klasy błędów
// src/lib/services/openrouter/errors.ts
export class OpenRouterError extends Error {
  constructor(message: string, public cause?: any, public statusCode?: number) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ConfigurationError extends OpenRouterError {}
export class NetworkError extends OpenRouterError {}
export class OpenRouterApiError extends OpenRouterError {
  constructor(message: string, public apiDetails?: any, statusCode?: number, cause?: any) {
    super(message, cause, statusCode);
    this.apiDetails = apiDetails;
  }
}
export class AuthenticationError extends OpenRouterApiError {}
export class RateLimitError extends OpenRouterApiError {}
export class InvalidRequestError extends OpenRouterApiError {}
export class ServerError extends OpenRouterApiError {}
export class ResponseParsingError extends OpenRouterError {}
```

## 6. Kwestie Bezpieczeństwa

1.  **Klucz API**:
    *   Klucz API OpenRouter (`OPENROUTER_API_KEY`) musi być przechowywany jako sekret w zmiennych środowiskowych (np. w pliku `.env` lokalnie, w ustawieniach środowiska na platformie hostingowej np. Supabase, DigitalOcean).
    *   Nigdy nie umieszczać klucza API bezpośrednio w kodzie frontendowym ani nie ujawniać go publicznie.
    *   Usługa OpenRouter powinna działać wyłącznie po stronie serwera (np. API routes w Astro, Supabase Edge Functions).
2.  **Referer i Tytuł Aplikacji**:
    *   OpenRouter zaleca wysyłanie nagłówków `HTTP-Referer` (adres URL witryny) i `X-Title` (nazwa witryny) w żądaniach API. Pomaga to OpenRouter w identyfikacji ruchu i może być wymagane dla niektórych modeli lub funkcji.
    ```typescript
    // W _fetchFromApi
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:4321', // Ustawić odpowiednio
      'X-Title': process.env.APP_NAME || '10xcards', // Ustawić odpowiednio
    };
    ```
3.  **Walidacja Wejścia**:
    *   Walidować dane wejściowe do metody `getChatCompletion` (np. typy, obecność wymaganych pól), aby zapobiec nieoczekiwanym błędom lub potencjalnym problemom z bezpieczeństwem, zanim żądanie zostanie wysłane do OpenRouter.
4.  **Ograniczanie Zapytań (Rate Limiting)**:
    *   Oprócz obsługi błędu 429 z API OpenRouter, rozważyć implementację własnego mechanizmu rate limitingu po stronie serwera dla endpointów korzystających z usługi OpenRouter. Zapobiegnie to nadużyciom i pomoże kontrolować koszty. Można to zrealizować np. za pomocą Supabase Edge Functions z wykorzystaniem Redis lub bazy danych do śledzenia liczby zapytań.
5.  **Ochrona przed Prompt Injection**:
    *   Chociaż usługa backendowa nie jest bezpośrednio odpowiedzialna za interfejs użytkownika, należy pamiętać o ryzyku prompt injection. Komunikaty systemowe powinny być starannie przygotowane. Jeśli treść użytkownika jest włączana do fragmentów promptu mających specjalne znaczenie, musi być odpowiednio sanityzowana lub ograniczona.
6.  **Logowanie**:
    *   Logować szczegóły żądań i odpowiedzi (bez wrażliwych danych, takich jak pełne klucze API) w celach audytowych i diagnostycznych. Unikać logowania pełnej treści wiadomości użytkownika, jeśli zawiera ona dane wrażliwe, chyba że jest to konieczne i zgodne z polityką prywatności.

## 7. Plan Wdrożenia Krok po Kroku

Środowisko: Astro (TypeScript, API routes) + Supabase (potencjalnie dla Edge Functions).

**Krok 1: Konfiguracja Środowiska**

1.  Dodaj `OPENROUTER_API_KEY` do zmiennych środowiskowych:
    *   W pliku `.env` dla lokalnego dewelopmentu:
        ```
        OPENROUTER_API_KEY="sk-or-..."
        SITE_URL="http://localhost:4321"
        APP_NAME="10xCards"
        ```
    *   W ustawieniach środowiskowych platformy hostingowej (np. Vercel, Netlify dla Astro; Supabase Dashboard dla Edge Functions).
2.  Upewnij się, że `.env` jest dodany do `.gitignore`.

**Krok 2: Definicja Typów i Interfejsów**

1.  Utwórz plik `src/lib/services/openrouter/types.ts`:
    ```typescript
    // src/lib/services/openrouter/types.ts
    export interface Message {
      role: "system" | "user" | "assistant";
      content: string;
      // Opcjonalnie `name` jeśli używane jest wywoływanie funkcji (nie jest to główny focus tego planu)
    }

    export interface JsonSchemaProperty {
      type: string;
      description?: string;
      [key: string]: any; // Dla innych właściwości JSON Schema (np. format, items, enum)
    }
    
    export interface JsonSchema {
      name: string; // Identyfikator schematu
      strict?: boolean; // Czy model musi ściśle przestrzegać schematu
      description?: string; // Opis schematu
      schema: {
        type: "object";
        properties: Record<string, JsonSchemaProperty>;
        required?: string[];
        [key: string]: any;
      };
    }

    export interface ResponseFormat {
      type: "json_object" | "json_schema"; // json_object to prostsza wersja, json_schema dla pełnej kontroli
      json_schema?: JsonSchema; // Wymagane jeśli type to 'json_schema'
    }

    export interface ChatCompletionRequest {
      model?: string;
      messages: Message[];
      response_format?: ResponseFormat;
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
      stream?: boolean;
      // Można dodać inne parametry wspierane przez OpenRouter, np.:
      // tools?: any[];
      // tool_choice?: any;
      // frequency_penalty?: number;
      // presence_penalty?: number;
      // stop?: string | string[];
      // logit_bias?: Record<string, number>;
      // user?: string; // Identyfikator użytkownika końcowego
    }
    
    // Typy dla odpowiedzi (uproszczone, dostosować do pełnej odpowiedzi OpenRouter)
    export interface Choice {
      index: number;
      message: Message;
      finish_reason: string; // np. "stop", "length", "tool_calls"
    }
    
    export interface Usage {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    }
    
    export interface ChatCompletionResponse {
      id: string;
      object: string;
      created: number;
      model: string;
      choices: Choice[];
      usage?: Usage; // Może być opcjonalne w zależności od modelu/ustawień
      // system_fingerprint?: string; // dla niektórych modeli OpenAI
    }

    // Dla strumieniowania (example)
    export interface StreamChunkDelta {
        content?: string;
        role?: string;
    }
    export interface StreamChoice {
        index: number;
        delta: StreamChunkDelta;
        finish_reason: string | null;
    }
    export interface StreamChunk {
        id: string;
        model: string;
        choices: StreamChoice[];
    }
    ```

**Krok 3: Implementacja Klas Błędów**

1.  Utwórz plik `src/lib/services/openrouter/errors.ts` (jak w sekcji "Obsługa Błędów").

**Krok 4: Implementacja `OpenRouterService`**

1.  Utwórz plik `src/lib/services/openrouter/OpenRouterService.ts`.
2.  Zaimplementuj konstruktor, jak opisano w sekcji "Opis Konstruktora".
3.  Zaimplementuj prywatną metodę `_buildRequestBody`:
    ```typescript
    // W OpenRouterService.ts
    private _buildRequestBody(request: ChatCompletionRequest): Record<string, any> {
        const body: Record<string, any> = {
            model: request.model || this.defaultModel,
            messages: request.messages,
        };

        if (request.response_format) {
            body.response_format = request.response_format;
        }
        if (typeof request.temperature === 'number') {
            body.temperature = request.temperature;
        }
        if (typeof request.max_tokens === 'number') {
            body.max_tokens = request.max_tokens;
        }
        if (typeof request.top_p === 'number') {
            body.top_p = request.top_p;
        }
        if (typeof request.stream === 'boolean') {
            body.stream = request.stream;
            if (body.stream && body.response_format?.type === 'json_schema') {
                // Zgodnie z dokumentacją OpenAI, json_schema nie jest wspierany ze stream=true.
                // OpenRouter może mieć podobne ograniczenia lub zachowywać się inaczej.
                // Należy to zweryfikować. Na razie załóżmy, że nie jest to problem lub usługa to obsłuży.
                console.warn("Using json_schema with stream=true might have compatibility issues. Verify OpenRouter documentation.");
            }
        }
        // Dodaj inne opcjonalne parametry
        return body;
    }
    ```
4.  Zaimplementuj prywatną metodę `_handleApiError`:
    ```typescript
    // W OpenRouterService.ts
    // (Importuj klasy błędów)
    private async _handleApiError(response: Response): Promise<Error> {
        let errorBody;
        try {
            errorBody = await response.json();
        } catch (e) {
            // Ignoruj błąd parsowania, jeśli odpowiedź nie jest JSON
        }

        const message = errorBody?.error?.message || response.statusText || "OpenRouter API error";

        switch (response.status) {
            case 400:
                return new InvalidRequestError(message, errorBody, response.status);
            case 401:
                return new AuthenticationError("Invalid OpenRouter API Key or unauthorized.", errorBody, response.status);
            case 403:
                return new AuthenticationError("Forbidden. API key may not have permissions for this model/action.", errorBody, response.status);
            case 429:
                return new RateLimitError("Rate limit exceeded.", errorBody, response.status);
            case 500:
            case 502:
            case 503:
            case 504:
                return new ServerError(`OpenRouter server error: ${response.status}`, errorBody, response.status);
            default:
                return new OpenRouterApiError(`API request failed with status ${response.status}: ${message}`, errorBody, response.status);
        }
    }
    ```
5.  Zaimplementuj prywatną metodę `_fetchFromApi`:
    ```typescript
    // W OpenRouterService.ts
    private async _fetchFromApi<T>(endpoint: string, payload: Record<string, any>, stream: boolean = false): Promise<T> {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:4321', // Z .env
                    'X-Title': process.env.APP_NAME || '10xcards', // Z .env
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw await this._handleApiError(response);
            }
            
            if (stream) {
                // Dla uproszczenia, na razie zwracamy 'any'. Implementacja strumieniowania wymagałaby
                // zwrócenia ReadableStream i odpowiedniego przetwarzania.
                // Na potrzeby `getChatCompletion` (bez strumienia), parsujemy JSON.
                if (response.body) {
                     // To jest placeholder, właściwa obsługa strumienia będzie bardziej złożona
                    return response.body as any as T;
                }
                throw new Error("Stream response has no body");
            }

            return await response.json() as T;

        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof OpenRouterError) {
                 // Błąd już obsłużony i opakowany
                throw error;
            }
            if (error instanceof Error && error.name === 'AbortError') {
                throw new NetworkError(`Request timed out after ${this.requestTimeout}ms`, error);
            }
            // Inne nieoczekiwane błędy fetch
            throw new NetworkError(`Network request failed: ${(error as Error).message}`, error);
        }
    }
    ```
6.  Zaimplementuj publiczną metodę `getChatCompletion`:
    ```typescript
    // W OpenRouterService.ts
    async getChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        if (request.stream) {
            // Tutaj powinna być logika dla strumieniowania lub błąd, jeśli nie jest wspierane przez tę metodę.
            // Dla uproszczenia, ta metoda nie będzie obsługiwać strumieniowania.
            // Należy użyć dedykowanej metody np. getChatCompletionStream.
            throw new Error("Streaming is not supported by getChatCompletion. Use getChatCompletionStream instead.");
        }

        const body = this._buildRequestBody(request);
        
        try {
            const response = await this._fetchFromApi<ChatCompletionResponse>('/chat/completions', body, false);
            
            // Walidacja odpowiedzi JSON Schema, jeśli zażądano
            if (request.response_format?.type === 'json_schema' && request.response_format.json_schema && response.choices?.[0]?.message?.content) {
                try {
                    const contentJson = JSON.parse(response.choices[0].message.content);
                    // Tutaj można dodać walidację za pomocą `ajv`
                    // const ajv = new Ajv();
                    // const validate = ajv.compile(request.response_format.json_schema.schema);
                    // if (!validate(contentJson)) {
                    //   throw new ResponseParsingError("Response JSON does not match the provided schema.", { errors: validate.errors });
                    // }
                    // Jeśli walidacja przejdzie, można sparsowany obiekt przypisać z powrotem lub zostawić jako string
                    // response.choices[0].message.content = contentJson; // Opcjonalnie
                } catch (e) {
                    throw new ResponseParsingError(`Failed to parse or validate JSON response against schema: ${(e as Error).message}`, e, {
                        schema: request.response_format.json_schema.schema,
                        rawContent: response.choices[0].message.content
                    });
                }
            }
            return response;
        } catch (error) {
            console.error("OpenRouterService Error:", error); // Logowanie błędu
            throw error; // Przekaż błąd dalej
        }
    }
    ```
    *   **Uwaga dotycząca walidacji JSON Schema**: Pełna implementacja walidacji `ajv` wymagałaby dodania `ajv` jako zależności. Powyższy kod zawiera zakomentowany przykład.

**Krok 5: (Opcjonalnie) Implementacja Strumieniowania**
    Jeśli wymagane jest strumieniowanie:
1.  Zainstaluj `eventsource-parser` (lub podobną bibliotekę do parsowania Server-Sent Events):
    ```bash
    npm install eventsource-parser
    # lub yarn add eventsource-parser
    ```
2.  Zaimplementuj metodę `getChatCompletionStream` (lub zmodyfikuj `_fetchFromApi` i `getChatCompletion`):
    ```typescript
    // W OpenRouterService.ts (przykład uproszczony)
    // import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser';

    // async getChatCompletionStream(
    //     request: ChatCompletionRequest,
    //     onChunk: (chunk: StreamChunk) => void,
    //     onError: (error: Error) => void,
    //     onEnd: () => void
    // ): Promise<void> {
    //     const body = this._buildRequestBody({ ...request, stream: true });
    //     try {
    //         const streamResponse = await this._fetchFromApi<ReadableStream<Uint8Array>>('/chat/completions', body, true);
    //         const reader = streamResponse.getReader();
    //         const decoder = new TextDecoder();
    //         // const parser = createParser(...); // Skonfiguruj parser SSE

    //         let done = false;
    //         while (!done) {
    //             const { value, done: readerDone } = await reader.read();
    //             done = readerDone;
    //             const chunkValue = decoder.decode(value, { stream: true });
    //             // parser.feed(chunkValue);
    //             // W callbacku parsera:
    //             // if (event.type === 'event' && event.data) {
    //             //    if (event.data === '[DONE]') { onEnd(); break; }
    //             //    const parsedChunk = JSON.parse(event.data) as StreamChunk;
    //             //    onChunk(parsedChunk);
    //             // }
    //         }
    //     } catch (error) {
    //         onError(error as Error);
    //     }
    // }
    ```
    Powyższy fragment dla strumieniowania jest mocno uproszczony i wymagałby starannej implementacji parsera SSE.

**Krok 6: Użycie Usługi w API Route (Astro)**

1.  Utwórz endpoint API w Astro, np. `src/pages/api/ai/chat.ts`:
    ```typescript
    // src/pages/api/ai/chat.ts
    import type { APIRoute } from 'astro';
    import { OpenRouterService } from '../../../lib/services/openrouter/OpenRouterService';
    import type { ChatCompletionRequest } from '../../../lib/services/openrouter/types';
    import { OpenRouterError, ResponseParsingError } from '../../../lib/services/openrouter/errors';

    const openRouterApiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!openRouterApiKey) {
      console.error("FATAL: OPENROUTER_API_KEY is not set in environment variables.");
      // W środowisku produkcyjnym aplikacja może się nie uruchomić lub ten endpoint zwróci błąd
    }
    
    const service = new OpenRouterService({
      apiKey: openRouterApiKey || "fallback_or_error_key", // Użyj klucza lub obsłuż błąd
      // defaultModel: "...",
    });

    export const POST: APIRoute = async ({ request }) => {
      if (!openRouterApiKey) {
        return new Response(JSON.stringify({ error: "AI service is not configured." }), { status: 500 });
      }

      try {
        const body = await request.json() as ChatCompletionRequest;

        // Prosta walidacja
        if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
          return new Response(JSON.stringify({ error: "Invalid request: 'messages' array is required." }), { status: 400 });
        }
        
        // Przykład użycia z response_format.json_schema
        // const articleSchema = { /* ... definicja schematu ... */ }; 
        // body.response_format = {
        //   type: 'json_schema',
        //   json_schema: {
        //     name: 'article_extraction_schema',
        //     strict: true,
        //     schema: articleSchema
        //   }
        // };

        const completion = await service.getChatCompletion(body);
        return new Response(JSON.stringify(completion), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('[API /ai/chat Error]', error);
        if (error instanceof ResponseParsingError && error.cause) {
            // Jeśli błąd parsowania schematu, zwróć szczegóły
             return new Response(JSON.stringify({ 
                error: "Failed to process model response due to schema mismatch.",
                details: (error.cause as any).message,
                schemaDetails: (error.cause as any).schemaDetails
            }), { status: 500 });
        }
        if (error instanceof OpenRouterError) {
            return new Response(JSON.stringify({ error: error.message, details: (error as any).apiDetails }), { status: error.statusCode || 500 });
        }
        return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), { status: 500 });
      }
    };
    ```

**Krok 7: Testowanie**

1.  Napisz testy jednostkowe dla `OpenRouterService` (np. używając Vitest), mockując `fetch`.
2.  Testuj endpoint API za pomocą narzędzi takich jak Postman, cURL lub testów integracyjnych.
    *   Testuj różne modele.
    *   Testuj `response_format` z poprawnymi i niepoprawnymi schematami.
    *   Testuj obsługę błędów (np. podając zły klucz API, przekraczając limity).

**Krok 8: Dokumentacja**

1.  Uzupełnij JSDoc/TSDoc dla wszystkich publicznych metod i typów.
2.  Opisz sposób użycia usługi i konfiguracji w README projektu lub wewnętrznej dokumentacji.

Ten plan dostarcza solidnych podstaw do wdrożenia usługi OpenRouter. Kluczowe jest iteracyjne testowanie i dostosowywanie w miarę napotykania specyficznych wymagań lub zachowań API OpenRouter. 