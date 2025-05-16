import type { APIContext } from "astro";
import { CreateDeckSchema } from "../../lib/schemas/deck.schemas";
import { createDeck } from "../../lib/services/deck.service";
import type { CreateDeckCommand, DeckDto } from "../../types";

export const prerender = false;

export async function POST({ request, locals }: APIContext): Promise<Response> {
  const { session, supabase } = locals;

  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized", message: "Authentication required." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const userId = session.user.id;

  let requestBody: CreateDeckCommand;
  try {
    requestBody = await request.json();
  } catch (e: unknown) {
    console.error("Failed to parse request body:", e);
    return new Response(JSON.stringify({ error: "Bad Request", message: "Invalid JSON payload." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = CreateDeckSchema.safeParse(requestBody);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { name } = validationResult.data;

  try {
    const newDeck: DeckDto = await createDeck(name, userId, supabase);
    return new Response(JSON.stringify(newDeck), {
      status: 201, // Created
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/decks:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return new Response(JSON.stringify({ error: "Internal Server Error", message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
