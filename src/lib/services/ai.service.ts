import type { FlashcardSuggestionDto } from "../../types";

// Custom error classes for more specific error handling in the API endpoint
export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

export class LLMUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMUnavailableError";
  }
}

/**
 * Generates flashcard suggestions using the OpenRouter.ai API.
 * @param text The input text to generate flashcards from.
 * @returns A promise that resolves to an array of flashcard suggestions.
 * @throws {OpenRouterError} If there's an issue with the OpenRouter.ai API request or response.
 * @throws {LLMUnavailableError} If the LLM service is unavailable.
 */
export async function generateFlashcardSuggestions(text: string): Promise<FlashcardSuggestionDto[]> {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set.");
    // In a real scenario, you might throw a configuration error or handle this differently.
    // For now, throwing a generic error that the endpoint handler will catch as 500.
    throw new Error("Server configuration error: OpenRouter API key missing.");
  }

  // TODO: Construct a more sophisticated prompt based on requirements.
  const prompt = `Given the following text, generate a list of flashcards. Each flashcard should have a 'front' and a 'back'. Format the output as a JSON array of objects, where each object has a "front" and a "back" key. Text: ${text}`;

  // Placeholder for OpenRouter.ai API details
  const openRouterApiUrl = "https://openrouter.ai/api/v1/chat/completions"; // Replace with actual endpoint if different
  // TODO: Select an appropriate model. Using a placeholder.
  const model = "openai/gpt-3.5-turbo";

  try {
    const response = await fetch(openRouterApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": `https://your-site-url.com`, // Optional: Replace with your site URL
        "X-Title": `Your App Name`, // Optional: Replace with your app name
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        // TODO: Adjust other parameters like max_tokens, temperature as needed
      }),
    });

    if (!response.ok) {
      // Attempt to read error details from OpenRouter response
      let errorDetails = "Failed to fetch suggestions from OpenRouter.";
      try {
        const errorData = await response.json();
        errorDetails = errorData.error?.message || JSON.stringify(errorData);
      } catch (parseError) {
        // Could not parse error response, use status text
        console.warn("Could not parse error response from OpenRouter:", parseError);
        errorDetails = `OpenRouter API request failed with status ${response.status}: ${response.statusText}`;
      }

      if (response.status === 503) {
        throw new LLMUnavailableError(`LLM service unavailable: ${errorDetails}`);
      }
      throw new OpenRouterError(`OpenRouter API Error: ${errorDetails}`);
    }

    const data = await response.json();

    // TODO: Implement robust parsing and validation of the LLM's response structure.
    // This is a simplistic approach and assumes the LLM perfectly follows the prompt format.
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      const content = data.choices[0].message.content;
      try {
        // The prompt asks for a JSON array string, so we need to parse it.
        const suggestions: FlashcardSuggestionDto[] = JSON.parse(content);
        if (
          !Array.isArray(suggestions) ||
          !suggestions.every((s) => typeof s.front === "string" && typeof s.back === "string")
        ) {
          throw new OpenRouterError("LLM response is not in the expected FlashcardSuggestionDto[] format.");
        }
        return suggestions;
      } catch (e) {
        console.error("Failed to parse LLM response content:", e);
        throw new OpenRouterError(
          "Failed to parse LLM response. Ensure the LLM output is a valid JSON array of {front: string, back: string} objects."
        );
      }
    } else {
      throw new OpenRouterError("No suggestions found in OpenRouter response or unexpected response structure.");
    }
  } catch (error) {
    if (error instanceof OpenRouterError || error instanceof LLMUnavailableError) {
      // Re-throw custom errors to be handled by the endpoint
      throw error;
    }
    // Handle network errors or other unexpected issues
    console.error("Error calling OpenRouter API:", error);
    throw new Error(
      `An unexpected error occurred while trying to generate flashcards: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
