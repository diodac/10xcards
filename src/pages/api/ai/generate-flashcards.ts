import type { APIRoute } from "astro";
import { GenerateFlashcardsCommandSchema } from "../../../lib/schemas/ai.schemas";
import { generateFlashcardSuggestions, OpenRouterError, LLMUnavailableError } from "../../../lib/services/ai.service";
import type { GenerateFlashcardsResponseDto, GenerateFlashcardsCommand } from "../../../types";
import { logEvent } from "../../../lib/utils/logEvent";

export const prerender = false;

// Define dummy user and session identifiers for use when no actual user is present
const DUMMY_USER_ID = "dummy-user-001";
const DUMMY_SESSION_ID = "dummy-session-001";

export const POST: APIRoute = async ({ request, locals }) => {
  const { user, supabaseClient } = locals;

  // For now, we operate with a dummy user. Authentication check is bypassed.
  // if (!user) {
  //   return new Response("Unauthorized: User not authenticated", { status: 401 });
  // }

  let command: GenerateFlashcardsCommand;
  try {
    const body = await request.json();
    const validationResult = GenerateFlashcardsCommandSchema.safeParse(body);
    if (!validationResult.success) {
      await logEvent(supabaseClient, DUMMY_USER_ID, DUMMY_SESSION_ID, "AI_FLASHCARD_GENERATION_VALIDATION_ERROR", {
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
    await logEvent(supabaseClient, DUMMY_USER_ID, DUMMY_SESSION_ID, "AI_FLASHCARD_GENERATION_VALIDATION_ERROR", {
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

    await logEvent(supabaseClient, DUMMY_USER_ID, DUMMY_SESSION_ID, "AI_FLASHCARD_GENERATION_SUCCESS", {
      numSuggestions: suggestions.length,
      firstSuggestion: suggestions[0],
    });

    return new Response(JSON.stringify(responseDto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof LLMUnavailableError) {
      await logEvent(supabaseClient, DUMMY_USER_ID, DUMMY_SESSION_ID, "AI_FLASHCARD_GENERATION_LLM_UNAVAILABLE_ERROR", {
        errorMessage: error.message,
        textInput: command.text.substring(0, 200) + (command.text.length > 200 ? "..." : ""),
      });
      return new Response(JSON.stringify({ message: error.message }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (error instanceof OpenRouterError) {
      await logEvent(supabaseClient, DUMMY_USER_ID, DUMMY_SESSION_ID, "AI_FLASHCARD_GENERATION_LLM_ERROR", {
        errorMessage: error.message,
        textInput: command.text.substring(0, 200) + (command.text.length > 200 ? "..." : ""),
      });
      return new Response(JSON.stringify({ message: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    await logEvent(supabaseClient, DUMMY_USER_ID, DUMMY_SESSION_ID, "AI_FLASHCARD_GENERATION_SERVER_ERROR", {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      textInput: command.text.substring(0, 200) + (command.text.length > 200 ? "..." : ""),
    });
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ message: `Internal Server Error: ${errorMessage}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
