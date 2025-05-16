import { v7 as uuidv7 } from "uuid"; // Import uuid v7 generator
import type { SupabaseClient } from "../../db/supabase.client";
import type { DeckDto } from "../../types";
import type { TablesInsert } from "../../db/database.types";

/**
 * Creates a new deck for a given user.
 *
 * @param name - The name of the deck.
 * @param userId - The ID of the user creating the deck.
 * @param supabase - The Supabase client instance.
 * @returns A promise that resolves to the created DeckDto.
 * @throws Will throw an error if the database operation fails.
 */
export async function createDeck(name: string, userId: string, supabase: SupabaseClient): Promise<DeckDto> {
  const newDeckId = uuidv7(); // Generate UUID v7 for the new deck

  const deckToInsert: TablesInsert<"decks"> = {
    id: newDeckId, // Use the generated UUID
    name,
    user_id: userId,
    // created_at and updated_at should be handled by the database or set here if required by TablesInsert
  };

  const { data, error } = await supabase.from("decks").insert(deckToInsert).select().single();

  if (error) {
    // Log the error for server-side inspection if a logging service is available
    console.error("Error creating deck:", error.message);
    // Re-throw a more generic error or a custom error type
    throw new Error(`Failed to create deck in the database: ${error.message}`);
  }

  if (!data) {
    // This case should ideally not be reached if error is null,
    // but it's a good safeguard.
    console.error("No data returned after creating deck, though no error was reported.");
    throw new Error("Failed to create deck: no data returned from database.");
  }

  // The 'data' should match DeckDto. Supabase client performs this mapping.
  return data as DeckDto;
}

// Optional: Define a DeckService class if more methods are planned for decks.
// export class DeckService {
//   constructor(private supabase: SupabaseClient) {}
//
//   async createDeck(name: string, userId: string): Promise<DeckDto> {
//     // ... implementation ...
//   }
// }
