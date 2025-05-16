import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlashcardService } from "../../src/lib/services/flashcard.service";
import { NotFoundError, ForbiddenError } from "../../src/lib/errors";
import { FlashcardSourceEnum, type CreateFlashcardItem, type FlashcardDto } from "../../src/types";
import type { SupabaseClient } from "../../src/db/supabase.client";
import { v7 as uuidv7 } from "uuid";
import type { Tables } from "../../src/db/database.types";

// Mock the uuidv7 function
vi.mock("uuid", async (importOriginal) => {
  const original = await importOriginal<typeof import("uuid")>();
  return {
    ...original, // Preserves other uuid exports if any
    v7: vi.fn(),
  };
});

describe("FlashcardService", () => {
  let mockSupabaseClient: any; // Using any for easier mocking of chained Supabase calls
  let flashcardService: FlashcardService;
  let mockSingleDeck: ReturnType<typeof vi.fn>; // Declare here to be accessible in all tests
  let mockInsert: ReturnType<typeof vi.fn>;
  let mockSelectFlashcards: ReturnType<typeof vi.fn>;

  const mockUserId = "user-123";
  const mockDeckId = "deck-456";
  const mockFlashcardData1: CreateFlashcardItem = { front: "Q1", back: "A1", source: FlashcardSourceEnum.MANUAL };
  const mockFlashcardData2: CreateFlashcardItem = { front: "Q2", back: "A2", source: FlashcardSourceEnum.AI_FULL };
  const mockFlashcardsData: CreateFlashcardItem[] = [mockFlashcardData1, mockFlashcardData2];

  const generatedUuid1 = "uuid-1";
  const generatedUuid2 = "uuid-2";

  beforeEach(() => {
    mockInsert = vi.fn();
    const mockSelectDeck = vi.fn();
    mockSelectFlashcards = vi.fn();
    mockSingleDeck = vi.fn(); // Initialize here
    const mockEqDeck = vi.fn(() => ({ single: mockSingleDeck }));

    mockSupabaseClient = {
      from: vi.fn((tableName: string) => {
        if (tableName === "decks") {
          return { select: mockSelectDeck, eq: mockEqDeck };
        }
        if (tableName === "flashcards") {
          // For .insert().select() chain
          mockInsert.mockReturnValue({ select: mockSelectFlashcards });
          return { insert: mockInsert };
        }
        // Default fallbacks for any other table name, returning chainable mocks
        const defaultReturn = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
        };
        defaultReturn.select.mockReturnValue(defaultReturn);
        defaultReturn.insert.mockReturnValue(defaultReturn);
        defaultReturn.eq.mockReturnValue(defaultReturn);
        return defaultReturn;
      }),
    };

    mockSelectDeck.mockReturnValue({ eq: mockEqDeck });

    flashcardService = new FlashcardService(mockSupabaseClient as unknown as SupabaseClient);

    (uuidv7 as ReturnType<typeof vi.fn>)
      .mockReset()
      .mockReturnValueOnce(generatedUuid1)
      .mockReturnValueOnce(generatedUuid2);
  });

  describe("createFlashcards - Deck Verification & Authorization", () => {
    it("should throw NotFoundError if deck does not exist (PGRST116 error)", async () => {
      mockSingleDeck.mockResolvedValue({ data: null, error: { code: "PGRST116", message: "Row not found" } });
      await expect(flashcardService.createFlashcards(mockDeckId, mockUserId, mockFlashcardsData)).rejects.toThrow(
        new NotFoundError(`Deck with ID ${mockDeckId} not found.`)
      );
    });

    it("should throw NotFoundError if deck data is null and no error", async () => {
      mockSingleDeck.mockResolvedValue({ data: null, error: null });
      await expect(flashcardService.createFlashcards(mockDeckId, mockUserId, mockFlashcardsData)).rejects.toThrow(
        new NotFoundError(`Deck with ID ${mockDeckId} not found.`)
      );
    });

    it("should throw a generic error for other Supabase errors during deck fetching", async () => {
      const dbError = { message: "Unexpected database error", code: "DB_ERR" };
      mockSingleDeck.mockResolvedValue({ data: null, error: dbError });
      await expect(flashcardService.createFlashcards(mockDeckId, mockUserId, mockFlashcardsData)).rejects.toThrow(
        `An unexpected error occurred while fetching the deck: ${dbError.message}`
      );
    });

    it("should throw ForbiddenError if the user does not own the deck", async () => {
      mockSingleDeck.mockResolvedValue({ data: { user_id: "other-user-id" }, error: null });
      await expect(flashcardService.createFlashcards(mockDeckId, mockUserId, mockFlashcardsData)).rejects.toThrow(
        new ForbiddenError(`User does not have permission to add flashcards to deck ${mockDeckId}.`)
      );
    });
  });

  describe("createFlashcards - Flashcard Creation & DTO Mapping", () => {
    beforeEach(() => {
      mockSingleDeck.mockResolvedValue({ data: { user_id: mockUserId }, error: null });
    });

    it('should call supabase.from("flashcards").insert() with correctly mapped data', async () => {
      // Arrange: Simulate successful insert returning an empty array of items (to focus on insert call itself)
      mockSelectFlashcards.mockResolvedValue({
        data: [
          // Even if empty, the call to select should resolve for this test
          // to ensure the chain doesn't break if the method expects a return from .select()
          // We test for actual data in another test
        ],
        error: null,
      });

      // Act
      // We expect this to throw because the service checks if insertedFlashcards has length > 0
      // but for this test, we only care about the call to insert.
      try {
        await flashcardService.createFlashcards(mockDeckId, mockUserId, mockFlashcardsData);
      } catch {
        /* Expected to throw, catch and continue. No variable needed. */
      }

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("flashcards");
      expect(mockInsert).toHaveBeenCalledWith([
        { id: generatedUuid1, front: "Q1", back: "A1", source: "manual", deck_id: mockDeckId },
        { id: generatedUuid2, front: "Q2", back: "A2", source: "ai-full", deck_id: mockDeckId },
      ]);
      expect(mockSelectFlashcards).toHaveBeenCalled();
    });

    it("should throw an error if flashcard insertion fails", async () => {
      const insertError = { message: "Insert failed", code: "INS_FAIL" };
      mockSelectFlashcards.mockResolvedValue({ data: null, error: insertError });

      await expect(flashcardService.createFlashcards(mockDeckId, mockUserId, mockFlashcardsData)).rejects.toThrow(
        `Failed to create flashcards: ${insertError.message}`
      );
    });

    it("should throw an error if flashcard insertion returns no data (empty array)", async () => {
      mockSelectFlashcards.mockResolvedValue({ data: [], error: null });

      await expect(flashcardService.createFlashcards(mockDeckId, mockUserId, mockFlashcardsData)).rejects.toThrow(
        "Failed to create flashcards: No data returned after insertion."
      );
    });

    it("should throw an error if flashcard insertion returns null data and no error", async () => {
      mockSelectFlashcards.mockResolvedValue({ data: null, error: null });

      await expect(flashcardService.createFlashcards(mockDeckId, mockUserId, mockFlashcardsData)).rejects.toThrow(
        "Failed to create flashcards: No data returned after insertion."
      );
    });

    it("should return correctly mapped FlashcardDto[] on successful creation", async () => {
      const dbFlashcards: Tables<"flashcards">[] = [
        {
          id: generatedUuid1,
          deck_id: mockDeckId,
          front: "Q1",
          back: "A1",
          source: "manual",
          created_at: "ts1",
          updated_at: "ts1",
        },
        {
          id: generatedUuid2,
          deck_id: mockDeckId,
          front: "Q2",
          back: "A2",
          source: "ai-full",
          created_at: "ts2",
          updated_at: "ts2",
        },
      ];
      mockSelectFlashcards.mockResolvedValue({ data: dbFlashcards, error: null });

      const result = await flashcardService.createFlashcards(mockDeckId, mockUserId, mockFlashcardsData);

      expect(result).toEqual<FlashcardDto[]>([
        {
          id: generatedUuid1,
          deck_id: mockDeckId,
          front: "Q1",
          back: "A1",
          source: FlashcardSourceEnum.MANUAL,
          created_at: "ts1",
          updated_at: "ts1",
        },
        {
          id: generatedUuid2,
          deck_id: mockDeckId,
          front: "Q2",
          back: "A2",
          source: FlashcardSourceEnum.AI_FULL,
          created_at: "ts2",
          updated_at: "ts2",
        },
      ]);
      expect(uuidv7).toHaveBeenCalledTimes(mockFlashcardsData.length);
    });
  });
});
