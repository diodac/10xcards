import {
  ConfigurationError,
  InvalidRequestError,
  AuthenticationError,
  RateLimitError,
  ServerError,
  OpenRouterApiError,
  NetworkError,
  ResponseParsingError,
  OpenRouterError,
} from "./errors";
import type { ChatCompletionRequest, ChatCompletionResponse, ResponseFormat, StreamChunk } from "./types";

interface OpenRouterServiceConfig {
  apiKey: string;
  defaultModel?: string;
  apiBaseUrl?: string;
  requestTimeout?: number; // w milisekundach
}

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly apiBaseUrl: string;
  private readonly requestTimeout: number;

  constructor(config: OpenRouterServiceConfig) {
    if (!config.apiKey) {
      throw new ConfigurationError("OpenRouter API key is required.");
    }
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel || "mistralai/mistral-7b-instruct";
    this.apiBaseUrl = config.apiBaseUrl || "https://openrouter.ai/api/v1";
    this.requestTimeout = config.requestTimeout || 30000; // 30 sekund timeout
  }

  private _buildRequestBody(request: ChatCompletionRequest): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: request.model || this.defaultModel,
      messages: request.messages,
    };

    if (request.response_format) {
      body.response_format = request.response_format;
    }
    if (typeof request.temperature === "number") {
      body.temperature = request.temperature;
    }
    if (typeof request.max_tokens === "number") {
      body.max_tokens = request.max_tokens;
    }
    if (typeof request.top_p === "number") {
      body.top_p = request.top_p;
    }
    if (typeof request.stream === "boolean") {
      body.stream = request.stream;
      if (request.stream && request.response_format?.type === "json_schema") {
        console.warn(
          "Using json_schema with stream=true might have compatibility issues. Verify OpenRouter documentation."
        );
      }
    }
    // Dodaj inne opcjonalne parametry z ChatCompletionRequest, jeśli istnieją
    // (frequency_penalty, presence_penalty, stop, logit_bias, user, tools, tool_choice)
    // Przykład dla jednego: if (request.frequency_penalty) body.frequency_penalty = request.frequency_penalty;
    // Należy to zrobić dla wszystkich opcjonalnych parametrów zdefiniowanych w ChatCompletionRequest

    // Poniżej przykład dla wszystkich dodatkowych parametrów wymienionych w komentarzu w ChatCompletionRequest
    if (request.tools) body.tools = request.tools;
    if (request.tool_choice) body.tool_choice = request.tool_choice;
    if (typeof request.frequency_penalty === "number") body.frequency_penalty = request.frequency_penalty;
    if (typeof request.presence_penalty === "number") body.presence_penalty = request.presence_penalty;
    if (request.stop) body.stop = request.stop;
    if (request.logit_bias) body.logit_bias = request.logit_bias;
    if (request.user) body.user = request.user;

    return body;
  }

  private async _handleApiError(response: Response): Promise<Error> {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      // Ignoruj błąd parsowania, jeśli odpowiedź nie jest JSON lub jest pusta
    }

    const message =
      (errorBody as { error?: { message?: string } })?.error?.message || response.statusText || "OpenRouter API error";

    switch (response.status) {
      case 400:
        return new InvalidRequestError(message, errorBody, response.status);
      case 401:
        return new AuthenticationError("Invalid OpenRouter API Key or unauthorized.", errorBody, response.status);
      case 403:
        return new AuthenticationError(
          "Forbidden. API key may not have permissions for this model/action.",
          errorBody,
          response.status
        );
      case 429:
        return new RateLimitError("Rate limit exceeded.", errorBody, response.status);
      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(`OpenRouter server error: ${response.status}`, errorBody, response.status);
      default:
        return new OpenRouterApiError(
          `API request failed with status ${response.status}: ${message}`,
          errorBody,
          response.status
        );
    }
  }

  private async _fetchFromApi<T>(
    endpoint: string,
    payload: Record<string, unknown>,
    stream?: boolean
  ): Promise<T | ReadableStream<Uint8Array>> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          // Użycie import.meta.env dla zmiennych środowiskowych w Astro/Vite
          "HTTP-Referer": import.meta.env.SITE_URL || "http://localhost:4321",
          "X-Title": import.meta.env.APP_NAME || "10xcards",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // _handleApiError zwraca Promise<Error>, więc potrzebujemy await
        throw await this._handleApiError(response);
      }

      if (stream) {
        if (response.body) {
          return response.body;
        }
        throw new NetworkError("Stream response has no body");
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof OpenRouterError) {
        // Błąd już obsłużony i opakowany przez _handleApiError lub jest to ConfigurationError/NetworkError
        throw error;
      }
      // Błędy AbortError (timeout) lub inne błędy sieciowe z samego fetch
      if (error instanceof Error && error.name === "AbortError") {
        throw new NetworkError(`Request timed out after ${this.requestTimeout}ms`, error);
      }
      // Inne nieoczekiwane błędy fetch, które nie są instancją OpenRouterError
      throw new NetworkError(`Network request failed: ${(error as Error).message}`, error);
    }
  }

  public async getChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (request.stream) {
      throw new Error("Streaming is not supported by getChatCompletion. Use getChatCompletionStream instead.");
    }

    const body = this._buildRequestBody(request);

    try {
      const response = (await this._fetchFromApi<ChatCompletionResponse>(
        "/chat/completions",
        body,
        false
      )) as ChatCompletionResponse;

      if (
        request.response_format?.type === "json_schema" &&
        request.response_format.json_schema &&
        response.choices?.[0]?.message?.content
      ) {
        const currentSchema = request.response_format.json_schema.schema;
        try {
          // Próba parsowania, aby sprawdzić, czy jest to prawidłowy JSON
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const contentJson = JSON.parse(response.choices[0].message.content);

          // TODO: Implementacja walidacji za pomocą `ajv` zgodnie z planem
        } catch (e) {
          throw new ResponseParsingError(
            `Failed to parse or validate JSON response against schema: ${(e as Error).message}`,
            {
              originalError: e,
              schema: currentSchema,
              rawContent: response.choices[0].message.content,
            },
            undefined // statusCode
          );
        }
      }
      return response;
    } catch (error) {
      // Logowanie błędu po stronie serwera
      console.error("OpenRouterService Error in getChatCompletion:", error);
      // Przekaż błąd dalej, aby mógł być obsłużony przez wywołującego
      throw error;
    }
  }

  public async getChatCompletionStream(
    request: ChatCompletionRequest,
    onChunk: (chunk: StreamChunk) => void,
    onError: (error: Error) => void,
    onEnd: () => void
  ): Promise<void> {
    // TODO: Implementacja strumieniowania zgodnie z Krokiem 5 planu
    // Na razie rzucamy błąd, że nie jest zaimplementowane
    onError(new Error("getChatCompletionStream is not yet implemented."));
    onEnd(); // Wywołujemy onEnd, aby zakończyć operację
    return Promise.resolve();
  }

  // Pozostałe metody zostaną dodane w kolejnych krokach
}
