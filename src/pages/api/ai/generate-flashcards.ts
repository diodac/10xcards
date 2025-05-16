import type { APIRoute } from "astro";
// import crypto from "node:crypto"; // Removed, sessionId now comes from locals
import { GenerateFlashcardsCommandSchema } from "../../../lib/schemas/ai.schemas";
import {
  generateFlashcardSuggestions,
  AIServiceError,
  LLMUnavailableError,
  AIConfigurationError,
} from "../../../lib/services/ai.service";
import type { GenerateFlashcardsResponseDto, GenerateFlashcardsCommand } from "../../../types";
import { logEvent } from "../../../lib/utils/logEvent";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const { user, supabase, sessionId } = locals;

  if (!user) {
    // This case should ideally be caught by middleware for protected routes,
    // but it's good practice to have it here too.
    return new Response("Unauthorized: User not authenticated", { status: 401 });
  }

  const userId = user.id;
  // Use sessionId from locals (renamed to localSessionId to avoid conflict with any other potential sessionId variable if one existed)
  // provide a fallback if not present (e.g., if session didn't exist)
  const eventSessionId = sessionId || "no-session-token";

  let command: GenerateFlashcardsCommand;
  try {
    const body = await request.json();
    const validationResult = GenerateFlashcardsCommandSchema.safeParse(body);
    if (!validationResult.success) {
      await logEvent(supabase, userId, eventSessionId, "AI_FLASHCARD_GENERATION_VALIDATION_ERROR", {
        errors: validationResult.error.flatten().fieldErrors,
        requestBody: body,
      });
      return new Response(
        JSON.stringify({
          message: "Validation failed",
          errors: validationResult.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    command = validationResult.data as GenerateFlashcardsCommand;
  } catch (error) {
    const requestText = await request.text().catch(() => "Could not read request text");
    // In this early error (invalid JSON), user/session might be available but command is not.
    // userId and eventSessionId from above are still valid.
    await logEvent(supabase, userId, eventSessionId, "AI_FLASHCARD_GENERATION_VALIDATION_ERROR", {
      error: error instanceof Error ? error.message : String(error),
      requestBody: requestText,
    });
    return new Response(JSON.stringify({ message: "Invalid request body: Must be valid JSON." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const suggestions = await generateFlashcardSuggestions(command.text);
    const responseDto: GenerateFlashcardsResponseDto = { suggestions };

    await logEvent(supabase, userId, eventSessionId, "AI_FLASHCARD_GENERATION_SUCCESS", {
      numSuggestions: suggestions.length,
      firstSuggestion: suggestions[0],
    });

    return new Response(JSON.stringify(responseDto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const commonErrorPayload = {
      textInput: command.text.substring(0, 200) + (command.text.length > 200 ? "..." : ""),
    };

    if (error instanceof LLMUnavailableError) {
      await logEvent(supabase, userId, eventSessionId, "AI_FLASHCARD_GENERATION_LLM_UNAVAILABLE_ERROR", {
        errorMessage: error.message,
        ...commonErrorPayload,
      });
      return new Response(JSON.stringify({ message: error.message }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof AIServiceError) {
      await logEvent(supabase, userId, eventSessionId, "AI_FLASHCARD_GENERATION_AI_SERVICE_ERROR", {
        errorMessage: error.message,
        errorCause: error.cause,
        ...commonErrorPayload,
      });
      return new Response(JSON.stringify({ message: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof AIConfigurationError) {
      await logEvent(supabase, userId, eventSessionId, "AI_FLASHCARD_GENERATION_CONFIG_ERROR", {
        errorMessage: error.message,
        ...commonErrorPayload,
      });
      return new Response(JSON.stringify({ message: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    const errorStack = error instanceof Error ? error.stack : undefined;
    await logEvent(supabase, userId, eventSessionId, "AI_FLASHCARD_GENERATION_SERVER_ERROR", {
      errorMessage: errorMessage,
      errorStack: errorStack,
      ...commonErrorPayload,
    });
    return new Response(JSON.stringify({ message: `Internal Server Error: ${errorMessage}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
