import { z } from "zod";
import type { APIContext } from "astro";
import { FlashcardSourceEnum, type CreateFlashcardsCommand } from "../../../../types";
import { FlashcardService } from "../../../../lib/services/flashcard.service"; // Will be uncommented later

export const prerender = false;

const flashcardItemSchema = z.object({
  front: z
    .string()
    .min(1, "Front content cannot be empty.")
    .max(256, "Front content exceeds maximum length of 256 characters."),
  back: z
    .string()
    .min(1, "Back content cannot be empty.")
    .max(512, "Back content exceeds maximum length of 512 characters."),
  source: z.nativeEnum(FlashcardSourceEnum, { errorMap: () => ({ message: "Invalid flashcard source." }) }),
});

const createFlashcardsSchema = z.object({
  flashcards: z.array(flashcardItemSchema).min(1, "At least one flashcard must be provided."),
});

export async function POST(context: APIContext): Promise<Response> {
  // 1. Authentication & Authorization
  if (!context.locals.user) {
    return new Response(JSON.stringify({ message: "Unauthorized: User not authenticated." }), { status: 401 });
  }
  const user = context.locals.user;
  const supabase = context.locals.supabase;

  // 2. Path Parameter Extraction and Validation
  const { deckId } = context.params;
  if (!deckId) {
    // This case should ideally be handled by Astro's routing if the param is mandatory
    return new Response(JSON.stringify({ message: "Bad Request: Deck ID is missing." }), { status: 400 });
  }
  // Basic UUID validation (more robust validation might be needed depending on requirements)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(deckId)) {
    return new Response(JSON.stringify({ message: "Bad Request: Invalid Deck ID format." }), { status: 400 });
  }

  // 3. Request Body Parsing and Validation
  let requestBody: CreateFlashcardsCommand;
  try {
    const rawBody = await context.request.json();
    const validationResult = createFlashcardsSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          message: "Bad Request: Invalid request body.",
          errors: validationResult.error.flatten().fieldErrors,
        }),
        { status: 400 }
      );
    }
    requestBody = validationResult.data;
  } catch {
    return new Response(JSON.stringify({ message: "Bad Request: Could not parse JSON body." }), { status: 400 });
  }

  // Placeholder for service call and response
  const flashcardService = new FlashcardService(supabase);
  try {
    const createdFlashcards = await flashcardService.createFlashcards(deckId, user.id, requestBody.flashcards);
    return new Response(JSON.stringify({ createdFlashcards }), { status: 201 });
  } catch (error: unknown) {
    // Map service errors to HTTP status codes (e.g., 403, 404, 500)
    // This is a simplified example; more specific error handling will be added.
    if (error instanceof Error) {
      if (error.message === "Deck not found") {
        // Example custom error check
        return new Response(JSON.stringify({ message: "Not Found: The specified deck does not exist." }), {
          status: 404,
        });
      } else if (error.message === "Forbidden") {
        // Example custom error check
        return new Response(JSON.stringify({ message: "Forbidden: User does not own the specified deck." }), {
          status: 403,
        });
      }
    }
    console.error("Error creating flashcards:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred during flashcard creation.";
    return new Response(JSON.stringify({ message: "Internal Server Error", error: errorMessage }), { status: 500 });
  }
}
