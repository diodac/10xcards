import type { FlashcardSuggestionDto } from "../../types";
import { OpenRouterService } from "./openrouter/open-router.service";
import {
  OpenRouterError as OpenRouterServiceError, // Alias to avoid naming conflict
  ConfigurationError as OpenRouterConfigurationError,
  NetworkError as OpenRouterNetworkError,
  ResponseParsingError as OpenRouterResponseParsingError,
} from "./openrouter/errors";

// Custom error classes for more specific error handling in the API endpoint
export class AIServiceError extends Error {
  constructor(
    message: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

export class LLMUnavailableError extends AIServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "LLMUnavailableError";
  }
}

export class AIConfigurationError extends AIServiceError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "AIConfigurationError";
  }
}

/**
 * Generates flashcard suggestions using the OpenRouter.ai API via OpenRouterService.
 * @param text The input text to generate flashcards from.
 * @returns A promise that resolves to an array of flashcard suggestions.
 * @throws {AIServiceError} If there's an issue with the AI service.
 * @throws {LLMUnavailableError} If the LLM service is unavailable.
 * @throws {AIConfigurationError} If the AI service is not configured properly.
 */
export async function generateFlashcardSuggestions(text: string): Promise<FlashcardSuggestionDto[]> {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set.");
    throw new AIConfigurationError("Server configuration error: OpenRouter API key missing.");
  }

  const openRouterService = new OpenRouterService({
    apiKey,
    // Potentially override defaultModel, apiBaseUrl, requestTimeout if needed
  });

  const prompt = `Given the following text, generate a list of flashcards. Each flashcard should have a 'front' and a 'back'. Format the output as a JSON array of objects, where each object has a "front" and a "back" key. Text: ${text}`;
  const model = "openai/gpt-4o-mini"; // Or choose a model from OpenRouterService defaults or config

  try {
    const response = await openRouterService.getChatCompletion({
      model: model,
      messages: [{ role: "user", content: prompt }],
      // response_format can be added here if structured JSON output is explicitly required by schema
      // For this prompt, we rely on the LLM to produce a parsable JSON string.
    });

    if (response.choices && response.choices.length > 0 && response.choices[0].message?.content) {
      const content = response.choices[0].message.content;
      let suggestions: FlashcardSuggestionDto[];
      try {
        // Attempt to parse the JSON content
        suggestions = JSON.parse(content);
      } catch (parseError) {
        // Handle only JSON syntax errors here
        console.error("Failed to parse LLM response content:", parseError, { responseContent: content });
        throw new AIServiceError(
          "Failed to parse LLM response. Ensure the LLM output is a valid JSON array of {front: string, back: string} objects.",
          { originalError: parseError, responseContent: content }
        );
      }

      // If parsing was successful, then validate the structure
      if (
        !Array.isArray(suggestions) ||
        !suggestions.every((s) => typeof s.front === "string" && typeof s.back === "string")
      ) {
        // This error is for invalid structure after successful parsing
        throw new AIServiceError("LLM response is not in the expected FlashcardSuggestionDto[] format.", {
          responseContent: content,
        });
      }
      return suggestions;
    } else {
      throw new AIServiceError("No suggestions found in OpenRouter response or unexpected response structure.", {
        apiResponse: response,
      });
    }
  } catch (error) {
    console.error("Error during flashcard generation with OpenRouterService:", error);

    if (error instanceof OpenRouterConfigurationError) {
      throw new AIConfigurationError(`OpenRouterService configuration error: ${error.message}`, error);
    }
    // Check for more specific errors before the general OpenRouterServiceError (aliased OpenRouterError)
    if (error instanceof OpenRouterNetworkError) {
      throw new AIServiceError(`Network error while communicating with OpenRouter: ${error.message}`, error);
    }
    if (error instanceof OpenRouterResponseParsingError) {
      throw new AIServiceError(`Failed to parse response from OpenRouter: ${error.message}`, error);
    }
    if (error instanceof OpenRouterServiceError) {
      // OpenRouterServiceError is the base for API errors from OpenRouterService
      // Specific errors like RateLimitError, AuthenticationError, ServerError will also be caught here.
      // For now, we'll map 503-like errors to LLMUnavailableError.
      // The OpenRouterService already has ServerError for 500, 502, 503, 504.
      if (
        error.statusCode === 503 ||
        (error.name === "ServerError" && error.statusCode && error.statusCode >= 500 && error.statusCode <= 504)
      ) {
        throw new LLMUnavailableError(`LLM service unavailable: ${error.message}`, error);
      }
      throw new AIServiceError(`OpenRouter API interaction failed: ${error.message}`, error);
    }
    if (
      error instanceof AIServiceError ||
      error instanceof LLMUnavailableError ||
      error instanceof AIConfigurationError
    ) {
      // Re-throw already mapped custom errors
      throw error;
    }
    // Handle other unexpected issues not originating from OpenRouterService directly but within this function
    throw new AIServiceError(
      `An unexpected error occurred while trying to generate flashcards: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}
