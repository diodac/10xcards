import type { SupabaseClient } from "../../db/supabase.client"; // As per backend.mdc rule
import type { CreateFlashcardItem, FlashcardDto, FlashcardSourceEnum } from "../../types";
import type { TablesInsert, Tables } from "../../db/database.types"; // Added TablesInsert and Tables
import { NotFoundError, ForbiddenError } from "../errors";
import { v7 as uuidv7 } from "uuid"; // Import v7 from uuid package

export class FlashcardService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Creates multiple flashcards in a specified deck for a given user.
   *
   * @param deckId The ID of the deck where flashcards will be created.
   * @param userId The ID of the user creating the flashcards.
   * @param flashcardsData An array of flashcard data items to create.
   * @returns A promise that resolves to an array of created FlashcardDto.
   * @throws NotFoundError if the deck with the given deckId is not found.
   * @throws ForbiddenError if the user does not own the deck.
   */
  async createFlashcards(
    deckId: string,
    userId: string,
    flashcardsData: CreateFlashcardItem[]
  ): Promise<FlashcardDto[]> {
    // 1. Deck Verification & Authorization
    const { data: deck, error: deckError } = await this.supabase
      .from("decks")
      .select("user_id")
      .eq("id", deckId)
      .single();

    if (deckError) {
      // Log the actual error for debugging purposes
      console.error(`Error fetching deck ${deckId}:`, deckError);
      // Check if it's a PostgREST error indicating 0 rows, which means not found
      if (deckError.code === "PGRST116") {
        throw new NotFoundError(`Deck with ID ${deckId} not found.`);
      }
      // For other unexpected database errors
      throw new Error(`An unexpected error occurred while fetching the deck: ${deckError.message}`);
    }

    if (!deck) {
      throw new NotFoundError(`Deck with ID ${deckId} not found.`);
    }

    if (deck.user_id !== userId) {
      throw new ForbiddenError(`User does not have permission to add flashcards to deck ${deckId}.`);
    }

    // 2. Flashcard Creation (Batch Insert)
    const flashcardsToInsert: TablesInsert<"flashcards">[] = flashcardsData.map((flashcard) => ({
      id: uuidv7(), // Generate UUID v7 for each flashcard
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source as string, // Ensure source is string for insert type
      deck_id: deckId,
      // created_at, updated_at are handled by the DB
    }));

    const { data: insertedFlashcards, error: insertError } = await this.supabase
      .from("flashcards")
      .insert(flashcardsToInsert) // Removed 'as any[]' cast
      .select();

    if (insertError) {
      console.error("Error inserting flashcards:", insertError);
      // Consider more specific error handling or custom error types if needed
      throw new Error(`Failed to create flashcards: ${insertError.message}`);
    }

    if (!insertedFlashcards || insertedFlashcards.length === 0) {
      // This case should ideally not happen if insert was successful without error and flashcardsToInsert was not empty
      // but good to have a safeguard.
      console.warn("Flashcard insertion reported success but returned no data.");
      throw new Error("Failed to create flashcards: No data returned after insertion.");
    }

    // 3. Map to DTO
    // The 'source' from the DB is a string, ensure it matches FlashcardSourceEnum for DTO
    const createdFlashcardsDto: FlashcardDto[] = insertedFlashcards.map((flashcard: Tables<"flashcards">) => ({
      ...flashcard,
      source: flashcard.source as FlashcardSourceEnum, // Cast DB string back to enum for DTO
    }));

    // --- Placeholder for Event Logging (Step 3.c) ---
    // TODO: Implement event logging into 'event_logs' table for each createdFlashcardsDto item.
    console.log("Flashcards created successfully", { count: createdFlashcardsDto.length, deckId });

    return createdFlashcardsDto;
  }
}
