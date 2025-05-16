# API Endpoint Implementation Plan: POST /api/decks/{deckId}/flashcards

## 1. Endpoint Overview
This endpoint is responsible for creating a new flashcard within a specific deck. The user must be authenticated and have ownership of the target deck. The flashcard's content (front and back) and its source (manual, AI-generated, or AI-edited) are provided in the request body. Upon successful creation, the endpoint returns the details of the newly created flashcard.

## 2. Request Details
-   **HTTP Method**: `POST`
-   **URL Structure**: `/api/decks/{deckId}/flashcards`
-   **Path Parameters**:
    -   `deckId` (UUID, required): The identifier of the deck in which to create the flashcard.
-   **Request Body (JSON)**:
    ```json
    {
      "front": "string (max 256 chars, required)",
      "back": "string (max 512 chars, required)",
      "source": "string (enum: 'manual', 'ai-full', 'ai-edited', required)"
    }
    ```
    -   `front`: The text content for the front of the flashcard.
    -   `back`: The text content for the back of theflashcard.
    -   `source`: Indicates how the flashcard was created. Must be one of the allowed enum values.

## 3. Utilized Types
The following types from `src/types.ts` will be used:
-   `CreateFlashcardCommand`: For typing the request payload after validation.
    ```typescript
    export interface CreateFlashcardCommand {
      front: TablesInsert<"flashcards">["front"];
      back: TablesInsert<"flashcards">["back"];
      source: FlashcardSourceEnum;
    }
    ```
-   `FlashcardDto`: For typing the response payload.
    ```typescript
    export type FlashcardDto = Omit<Tables<"flashcards">, "source"> & {
      source: FlashcardSourceEnum;
    };
    ```
-   `FlashcardSourceEnum`: Enum for the `source` field.
    ```typescript
    export enum FlashcardSourceEnum {
      MANUAL = "manual",
      AI_FULL = "ai-full",
      AI_EDITED = "ai-edited",
    }
    ```

## 4. Response Details
-   **Success Response (201 Created)**:
    -   **Content-Type**: `application/json`
    -   **Body**:
        ```json
        {
          "id": "uuid",
          "deck_id": "uuid",
          "front": "string",
          "back": "string",
          "source": "string", // e.g., "manual", "ai-full"
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
        This structure aligns with `FlashcardDto`.
-   **Error Responses**:
    -   `400 Bad Request`: Invalid request payload (e.g., missing fields, fields too long, invalid `source` value).
    -   `401 Unauthorized`: User is not authenticated.
    -   `403 Forbidden`: User does not own the specified deck.
    -   `404 Not Found`: The specified deck (`deckId`) does not exist.
    -   `500 Internal Server Error`: Unexpected server-side error.

## 5. Data Flow
1.  **Client Request**: The client sends a `POST` request to `/api/decks/{deckId}/flashcards` with a JWT in the `Authorization` header and the flashcard data in the JSON body.
2.  **Astro API Route Handler (`src/pages/api/decks/[deckId]/flashcards.ts`)**:
    a.  **Authentication**: Verifies the JWT. If invalid or missing, returns `401 Unauthorized`. Retrieves user information from `context.locals.user`.
    b.  **Path Parameter Extraction**: Extracts `deckId` from the URL.
    c.  **Request Body Parsing & Validation**: Parses the JSON request body. Validates the body against a Zod schema (checking for required fields, types, string lengths, and `source` enum values). If validation fails, returns `400 Bad Request`.
    d.  **Service Call**: Invokes `flashcardService.createFlashcard(deckId, user.id, validatedData)`.
    e.  **Response Formatting**: Receives the `FlashcardDto` (or error) from the service. Formats and sends the HTTP response (e.g., `201 Created` with `FlashcardDto` or an appropriate error status).
3.  **Flashcard Service (`src/lib/services/flashcard.service.ts`)**:
    a.  **Deck Verification & Authorization**:
        i.  Fetches the deck by `deckId` using `supabaseClient`.
        ii. If the deck is not found, throws a "Not Found" error (handled by the API route to return `404`).
        iii. If `deck.user_id` does not match the authenticated `userId`, throws a "Forbidden" error (handled by the API route to return `403`).
    b.  **Database Insertion**: Inserts the new flashcard record into the `flashcards` table using `supabaseClient`. The `deck_id` will be the validated `deckId`. `created_at` and `updated_at` are handled by the database.
    c.  **Event Logging**:
        i.  Determines the event type based on `flashcard.source`: `flashcard_created_manual` or `flashcard_created_from_ai`.
        ii. Inserts a record into the `event_logs` table (e.g., `user_id`, `event_type`, `timestamp`, `details: { flashcardId: newFlashcard.id, deckId: deckId }`).
    d.  **Return Value**: Returns the newly created flashcard data, mapped to `FlashcardDto`.
4.  **Database (Supabase/PostgreSQL)**:
    a.  The `flashcards` table stores the new flashcard.
    b.  The `event_logs` table stores the creation event.

## 6. Security Considerations
-   **Authentication**: Enforced via JWT. All requests must include a valid `Authorization: Bearer <token>` header. Astro middleware or handler logic will verify this.
-   **Authorization**: The `FlashcardService` must verify that the authenticated user owns the `deckId` before creating a flashcard in it. This prevents users from creating flashcards in other users' decks (mitigates IDOR).
-   **Input Validation**:
    -   Path parameters (`deckId`) should be validated for format (UUID).
    -   Request body (`front`, `back`, `source`) is strictly validated using Zod for presence, type, length constraints, and enum values. This protects against malformed data, potential injection attacks (though Supabase client helps with SQLi), and oversized data.
-   **SQL Injection**: Use of the Supabase client library with its query builders mitigates SQL injection risks.
-   **Error Handling**: Return generic error messages for `500 Internal Server Error` to avoid leaking sensitive system information. Specific error details should be logged server-side.
-   **CSRF**: As this is a stateless API endpoint using Bearer tokens, CSRF is generally not a concern if tokens are handled correctly (not stored in cookies accessible by JavaScript).
-   **Rate Limiting**: (Future consideration) Implement rate limiting if abuse is detected or anticipated.

## 7. Performance Considerations
-   **Database Queries**:
    -   Fetching the deck for validation: Ensure `deck_id` and `user_id` are indexed in the `decks` table for fast lookups.
    -   Inserting the flashcard: Primary key insertion is generally fast.
    -   Inserting into `event_logs`: Ensure efficient inserts.
-   **Payload Size**: The request and response payloads are relatively small, so this should not be a bottleneck. Max length constraints on `front` and `back` fields help manage data size.
-   **Service Logic**: The service logic is straightforward. Keep database interactions minimal and efficient.
-   **Cold Starts**: If using serverless functions for API routes, be mindful of potential cold start latencies. For Astro deployed on Node.js, this is less of an issue.

## 8. Implementation Steps
1.  **Define Zod Schema**:
    *   In `src/pages/api/decks/[deckId]/flashcards.ts`, define a Zod schema for validating the request body (`front`, `back`, `source`) according to the specified constraints.
2.  **Create API Route Handler (`src/pages/api/decks/[deckId]/flashcards.ts`)**:
    *   Create the file if it doesn't exist.
    *   Implement the `POST` handler function.
    *   Add `export const prerender = false;`.
    *   **Authentication**: Access `context.locals.supabase` and `context.locals.user`. Return `401` if user is not authenticated.
    *   **Path Parameter**: Get `deckId` from `context.params.deckId`. Validate if it's a UUID.
    *   **Request Body Validation**: Parse `await context.request.json()` and validate using the Zod schema. Return `400` with error details if invalid.
    *   **Service Instantiation**: Instantiate `FlashcardService`.
    *   **Call Service**: Call `flashcardService.createFlashcard(deckId, user.id, validatedData)`.
    *   **Error Handling**: Wrap the service call in a try-catch block. Map service errors to appropriate HTTP status codes (`403`, `404`, `500`).
    *   **Success Response**: Return `201 Created` with the `FlashcardDto` from the service.
3.  **Create `FlashcardService` (`src/lib/services/flashcard.service.ts`)**:
    *   Create the file if it doesn't exist.
    *   Define the `FlashcardService` class.
    *   The constructor should accept `SupabaseClient` (from `context.locals.supabase`).
    *   **Implement `createFlashcard` method**:
        *   **Deck Validation**:
            *   Query the `decks` table for the given `deckId`.
            *   If not found, throw an error (e.g., a custom `NotFoundError`).
            *   If `deck.user_id !== userId`, throw an error (e.g., a custom `ForbiddenError`).
        *   **Flashcard Creation**:
            *   Use `supabaseClient.from('flashcards').insert(...).select().single()` to create the flashcard and get the created record.
            *   Handle potential database errors.
        *   **Event Logging**:
            *   Construct the event log payload (type based on `source`, `user_id`, `flashcard_id`, `deck_id`).
            *   Insert into `event_logs` table: `supabaseClient.from('event_logs').insert(...)`. Consider error handling for this step (e.g., log failure but don't fail the main operation).
        *   **Return Data**: Map the created flashcard record to `FlashcardDto` (ensuring `source` is correctly typed as `FlashcardSourceEnum` if the DB returns a string) and return it.
4.  **Define Custom Error Types (Optional but Recommended)**:
    *   In `src/lib/errors.ts` (or similar), define custom error classes like `NotFoundError`, `ForbiddenError`, `ValidationError` that the service can throw and the API route can catch to map to HTTP statuses.
5.  **Update `src/types.ts` (if needed)**:
    *   Ensure `CreateFlashcardCommand`, `FlashcardDto`, and `FlashcardSourceEnum` are correctly defined and exported. (They appear to be correct based on provided context).
6.  **Database Schema**:
    *   Verify that `flashcards` table schema (columns, types, constraints for `front`, `back`, `source`, foreign key to `decks`) matches the requirements.
    *   Verify `event_logs` table schema is suitable for logging these events.
7.  **Testing**:
    *   **Unit Tests**: Test the Zod schema and `FlashcardService` logic (mocking Supabase client).
    *   **Integration Tests**: Test the API endpoint by making HTTP requests and verifying responses and database state changes. Cover success cases and all documented error scenarios (`400`, `401`, `403`, `404`, `500`).
8.  **Documentation**:
    *   Ensure API documentation (e.g., Swagger/OpenAPI if used, or internal docs) is updated to reflect this endpoint. (This plan itself serves as initial detailed documentation). 