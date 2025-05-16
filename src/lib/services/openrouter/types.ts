// src/lib/services/openrouter/types.ts
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  // Opcjonalnie `name` jeśli używane jest wywoływanie funkcji (nie jest to główny focus tego planu)
}

export interface JsonSchemaProperty {
  type: string;
  description?: string;
  [key: string]: unknown; // Dla innych właściwości JSON Schema (np. format, items, enum)
}

export interface JsonSchema {
  name: string; // Identyfikator schematu
  strict?: boolean; // Czy model musi ściśle przestrzegać schematu
  description?: string; // Opis schematu
  schema: {
    type: "object";
    properties: Record<string, JsonSchemaProperty>;
    required?: string[];
    [key: string]: unknown;
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
  tools?: unknown[]; // Zgodnie z planem, typ `any[]` zamieniony na `unknown[]`
  tool_choice?: unknown; // Zgodnie z planem, typ `any` zamieniony na `unknown`
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  logit_bias?: Record<string, number>;
  user?: string; // Identyfikator użytkownika końcowego
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
