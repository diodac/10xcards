import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateFlashcardSuggestions, AIServiceError, LLMUnavailableError, AIConfigurationError } from "./ai.service";
import {
  OpenRouterError as OpenRouterServiceError, // Alias used in ai.service.ts for OpenRouterError
  ConfigurationError as OpenRouterConfigurationError,
  NetworkError as OpenRouterNetworkError,
  ResponseParsingError as OpenRouterResponseParsingError,
  ServerError as OpenRouterServerError,
} from "./openrouter/errors";

// Mock OpenRouterService
// Factory function is executed before any imports in the module where vi.mock is called.
const mockGetChatCompletion = vi.fn();
vi.mock("./openrouter/open-router.service", () => {
  return {
    OpenRouterService: vi.fn().mockImplementation(() => {
      return {
        getChatCompletion: mockGetChatCompletion,
      };
    }),
  };
});

describe("generateFlashcardSuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Changed from vi.resetAllMocks()
    vi.unstubAllEnvs(); // Clean up env stubs from previous tests
  });

  afterEach(() => {
    vi.unstubAllEnvs(); // Ensure env stubs are cleaned up after each test
  });

  // Test case 1: Configuration Error when API key is missing
  it("should throw AIConfigurationError if OPENROUTER_API_KEY is not set", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", ""); // Simulate missing API key

    // Act & Assert
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(AIConfigurationError);
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(
      "Server configuration error: OpenRouter API key missing."
    );
  });

  // Test case 2: Successful flashcard generation
  it("should return flashcard suggestions on successful API call", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    const mockText = "Sample text for flashcards";
    const mockSuggestions = [
      { front: "Front 1", back: "Back 1" },
      { front: "Front 2", back: "Back 2" },
    ];
    mockGetChatCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockSuggestions),
          },
        },
      ],
    });

    // Act
    const result = await generateFlashcardSuggestions(mockText);

    // Assert
    expect(result).toEqual(mockSuggestions);
    expect(mockGetChatCompletion).toHaveBeenCalledTimes(1);
    expect(mockGetChatCompletion).toHaveBeenCalledWith({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: expect.stringContaining(mockText) }],
    });
  });

  // Test case 3: LLM response is not valid JSON
  it("should throw AIServiceError if LLM response is not valid JSON", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    const mockText = "Sample text";
    mockGetChatCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: "This is not JSON {", // Invalid JSON
          },
        },
      ],
    });

    // Act & Assert
    await expect(generateFlashcardSuggestions(mockText)).rejects.toThrowError(AIServiceError);
    await expect(generateFlashcardSuggestions(mockText)).rejects.toThrowError(
      "Failed to parse LLM response. Ensure the LLM output is a valid JSON array of {front: string, back: string} objects."
    );
  });

  // Test case 4: LLM response is valid JSON but not in expected format (e.g. missing keys)
  it("should throw AIServiceError if LLM response is not in FlashcardSuggestionDto[] format (missing keys)", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    const mockText = "Sample text";
    const invalidSuggestions = [{ question: "Q1", answer: "A1" }]; // Missing front/back
    mockGetChatCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(invalidSuggestions),
          },
        },
      ],
    });

    // Act & Assert
    await expect(generateFlashcardSuggestions(mockText)).rejects.toThrowError(AIServiceError);
    await expect(generateFlashcardSuggestions(mockText)).rejects.toThrowError(
      "LLM response is not in the expected FlashcardSuggestionDto[] format."
    );
  });

  // Test case 4b: LLM response is valid JSON but not an array of objects with correct properties
  it("should throw AIServiceError if LLM response is an array of non-objects or objects with wrong property types", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    const mockText = "Sample text";
    const testCases = [
      JSON.stringify(["string1", "string2"]), // Array of strings
      JSON.stringify([{ front: 123, back: "B1" }]), // front is not a string
      JSON.stringify([{ front: "F1", back: true }]), // back is not a string
      JSON.stringify({ front: "F1", back: "B1" }), // Not an array
    ];

    for (const invalidContent of testCases) {
      mockGetChatCompletion.mockResolvedValue({
        choices: [{ message: { content: invalidContent } }],
      });
      await expect(generateFlashcardSuggestions(mockText)).rejects.toThrowError(AIServiceError);
      await expect(generateFlashcardSuggestions(mockText)).rejects.toThrowError(
        "LLM response is not in the expected FlashcardSuggestionDto[] format."
      );
    }
  });

  // Test case 5: OpenRouterService throws OpenRouterConfigurationError
  it("should map OpenRouterConfigurationError to AIConfigurationError", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    mockGetChatCompletion.mockRejectedValue(new OpenRouterConfigurationError("OpenRouter config issue"));

    // Act & Assert
    await expect(generateFlashcardSuggestions("test")).rejects.toThrowError(AIConfigurationError);
    await expect(generateFlashcardSuggestions("test")).rejects.toThrowError(
      "OpenRouterService configuration error: OpenRouter config issue"
    );
  });

  // Test case 6: OpenRouterService throws ServerError (e.g., 503)
  it("should map OpenRouter ServerError (status 503) to LLMUnavailableError", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    const serverError = new OpenRouterServerError("Service unavailable", undefined, 503);
    mockGetChatCompletion.mockRejectedValue(serverError);

    // Act & Assert
    await expect(generateFlashcardSuggestions("test")).rejects.toThrowError(LLMUnavailableError);
    await expect(generateFlashcardSuggestions("test")).rejects.toThrowError(
      "LLM service unavailable: Service unavailable"
    );
  });

  // Test case 6b: OpenRouterService throws OpenRouterServiceError (base class) with statusCode 503
  it("should map OpenRouterServiceError with statusCode 503 to LLMUnavailableError", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    // OpenRouterServiceError is an alias for OpenRouterError in ai.service.ts
    const serviceError = new OpenRouterServiceError("Service unavailable direct", undefined, 503);
    mockGetChatCompletion.mockRejectedValue(serviceError);

    // Act & Assert
    await expect(generateFlashcardSuggestions("test")).rejects.toThrowError(LLMUnavailableError);
    await expect(generateFlashcardSuggestions("test")).rejects.toThrowError(
      "LLM service unavailable: Service unavailable direct"
    );
  });

  // Test case 7: OpenRouterService throws generic OpenRouterServiceError (not 5xx)
  it("should map generic OpenRouterServiceError (non-5xx) to AIServiceError", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    const genericError = new OpenRouterServiceError("Generic OpenRouter API error", undefined, 400);
    mockGetChatCompletion.mockRejectedValue(genericError);

    // Act & Assert
    await expect(generateFlashcardSuggestions("test")).rejects.toThrowError(AIServiceError);
    await expect(generateFlashcardSuggestions("test")).rejects.toThrowError(
      "OpenRouter API interaction failed: Generic OpenRouter API error"
    );
  });

  // Test case 8: OpenRouterService throws OpenRouterNetworkError
  it("should map OpenRouterNetworkError to AIServiceError", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    mockGetChatCompletion.mockRejectedValue(new OpenRouterNetworkError("Network issue"));

    // Act & Assert
    await expect(generateFlashcardSuggestions("test")).rejects.toThrowError(AIServiceError);
    await expect(generateFlashcardSuggestions("test")).rejects.toThrowError(
      "Network error while communicating with OpenRouter: Network issue"
    );
  });

  // Test case 9: OpenRouterService throws OpenRouterResponseParsingError
  it("should map OpenRouterResponseParsingError to AIServiceError", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    mockGetChatCompletion.mockRejectedValue(new OpenRouterResponseParsingError("Parsing issue"));

    // Act & Assert
    await expect(generateFlashcardSuggestions("test")).rejects.toThrowError(AIServiceError);
    await expect(generateFlashcardSuggestions("test")).rejects.toThrowError(
      "Failed to parse response from OpenRouter: Parsing issue"
    );
  });

  // Test case 10: No suggestions in OpenRouter response (empty choices array)
  it("should throw AIServiceError if no choices in OpenRouter response", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    mockGetChatCompletion.mockResolvedValue({ choices: [] });

    // Act & Assert
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(AIServiceError);
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(
      "No suggestions found in OpenRouter response or unexpected response structure."
    );
  });

  // Test case 10b: No message content in OpenRouter response
  it("should throw AIServiceError if no message content in OpenRouter response", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    mockGetChatCompletion.mockResolvedValue({
      choices: [{ message: {} }], // Message without content
    });

    // Act & Assert
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(AIServiceError);
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(
      "No suggestions found in OpenRouter response or unexpected response structure."
    );
  });

  // Test case 10c: Message content is null
  it("should throw AIServiceError if message content is null", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    mockGetChatCompletion.mockResolvedValue({
      choices: [{ message: { content: null } }],
    });
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(AIServiceError);
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(
      "No suggestions found in OpenRouter response or unexpected response structure."
    );
  });

  // Test case 11: Unexpected error (e.g., not an OpenRouter error)
  it("should throw AIServiceError for unexpected errors during generation", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    const unexpectedError = new Error("Something totally unexpected happened");
    mockGetChatCompletion.mockRejectedValue(unexpectedError);

    // Act & Assert
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(AIServiceError);
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(
      `An unexpected error occurred while trying to generate flashcards: ${unexpectedError.message}`
    );
  });

  // Test case 12: Re-throwing already mapped custom errors
  it("should re-throw AIServiceError if it is already an AIServiceError instance", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    const specificError = new AIServiceError("Specific AI error that was already mapped");
    mockGetChatCompletion.mockRejectedValue(specificError);

    // Act & Assert
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(AIServiceError);
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(
      "Specific AI error that was already mapped"
    );
  });

  it("should re-throw LLMUnavailableError if it is already an LLMUnavailableError instance", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    const specificError = new LLMUnavailableError("Specific LLM unavailable error, already mapped");
    mockGetChatCompletion.mockRejectedValue(specificError);

    // Act & Assert
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(LLMUnavailableError);
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(
      "Specific LLM unavailable error, already mapped"
    );
  });

  it("should re-throw AIConfigurationError if it is already an AIConfigurationError instance", async () => {
    // Arrange
    vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");
    const specificError = new AIConfigurationError("Specific AI config error, already mapped");
    mockGetChatCompletion.mockRejectedValue(specificError);

    // Act & Assert
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(AIConfigurationError);
    await expect(generateFlashcardSuggestions("test text")).rejects.toThrowError(
      "Specific AI config error, already mapped"
    );
  });
});
