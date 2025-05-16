# API Endpoint Implementation Plan: POST /api/decks/{deckId}/flashcards

## 1. Endpoint Overview
This endpoint is responsible for creating one or more new flashcards within a specific deck. The user must be authenticated and have ownership of the target deck. The flashcards' content (front and back) and their source (manual, AI-generated, or AI-edited) are provided in the request body as a list. Upon successful creation, the endpoint returns a list of the newly created flashcards.

## 2. Request Details
-   **HTTP Method**: `POST`
-   **URL Structure**: `/api/decks/{deckId}/flashcards`
-   **Path Parameters**:
    -   `deckId` (UUID, required): The identifier of the deck in which to create the flashcards.
-   **Request Body (JSON)**:
    ```json
    {
      "flashcards": [
        {
          "front": "string (max 256 chars, required)",
          "back": "string (max 512 chars, required)",
          "source": "string (enum: 'manual', 'ai-full', 'ai-edited', required)"
        }
        // ... more flashcard objects
      ]
    }
    ```
    -   `flashcards`: An array of flashcard objects to be created. Each object contains:
        -   `front`: The text content for the front of the flashcard.
        -   `back`: The text content for the back of the flashcard.
        -   `source`: Indicates how the flashcard was created. Must be one of the allowed enum values.

## 3. Utilized Types
The following types from `src/types.ts` will be used:
-   `CreateFlashcardsCommand`: For typing the request payload after validation. (Note: This type name implies a list, or the inner type will be used for each item in the list).
    ```typescript
    export interface CreateFlashcardItem { // Renamed from CreateFlashcardCommand for clarity
      front: TablesInsert<"flashcards">["front"];
      back: TablesInsert<"flashcards">["back"];
      source: FlashcardSourceEnum;
    }

    export interface CreateFlashcardsCommand {
      flashcards: CreateFlashcardItem[];
    }
    ```
-   `FlashcardDto`: For typing each flashcard in the response payload.
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
          "createdFlashcards": [
            {
              "id": "uuid",
              "deck_id": "uuid",
              "front": "string",
              "back": "string",
              "source": "string", // e.g., "manual", "ai-full"
              "created_at": "timestamp",
              "updated_at": "timestamp"
            }
            // ... more created flashcard objects
          ]
        }
        ```
        This structure contains a list, where each item aligns with `FlashcardDto`.
-   **Error Responses**:
    -   `400 Bad Request`: Invalid request payload (e.g., empty array, invalid item).
    -   `401 Unauthorized`: User is not authenticated.
    -   `403 Forbidden`: User does not own the specified deck.
    -   `404 Not Found`: The specified deck (`deckId`) does not exist.
    -   `500 Internal Server Error`: Unexpected server-side error.

## 5. Data Flow
1.  **Client Request**: The client sends a `POST` request to `/api/decks/{deckId}/flashcards` with a JWT in the `Authorization` header and the list of flashcard data in the JSON body.
2.  **Astro API Route Handler (`src/pages/api/decks/[deckId]/flashcards.ts`)**:
    a.  **Authentication**: Verifies the JWT. If invalid or missing, returns `401 Unauthorized`. Retrieves user information from `context.locals.user`.
    b.  **Path Parameter Extraction**: Extracts `deckId` from the URL.
    c.  **Request Body Parsing & Validation**: Parses the JSON request body (expecting an object like `{ "flashcards": [...] }`). Validates the `flashcards` array and each item within it against a Zod schema (checking for required fields, types, string lengths, and `source` enum values for each flashcard). If validation fails (e.g., empty array, invalid item), returns `400 Bad Request`.
    d.  **Service Call**: Invokes `flashcardService.createFlashcards(deckId, user.id, validatedData.flashcards)`.
    e.  **Response Formatting**: Receives a list of `FlashcardDto` (or error) from the service. Formats and sends the HTTP response (e.g., `201 Created` with the list of `FlashcardDto` or an appropriate error status).
3.  **Flashcard Service (`src/lib/services/flashcard.service.ts`)**:
    a.  **Deck Verification & Authorization**:
        i.  Fetches the deck by `deckId` using `supabaseClient`. This is done once before processing the list of flashcards.
        ii. If the deck is not found, throws a "Not Found" error (handled by the API route to return `404`).
        iii. If `deck.user_id` does not match the authenticated `userId`, throws a "Forbidden" error (handled by the API route to return `403`).
    b.  **Database Insertion (Iterative or Batch)**:
        i.  Iterates through the provided list of flashcard data.
        ii. For each flashcard:
            1.  Inserts the new flashcard record into the `flashcards` table using `supabaseClient`. The `deck_id` will be the validated `deckId`. `created_at` and `updated_at` are handled by the database.
            2.  (Consideration for Supabase: `insert` can take an array of objects for batch insertion, which is more efficient.)
    c.  **Event Logging (Iterative)**:
        i.  For each successfully created flashcard:
            1.  Determines the event type based on `flashcard.source`: `flashcard_created_manual` or `flashcard_created_from_ai`.
            2.  Inserts a record into the `event_logs` table (e.g., `user_id`, `event_type`, `timestamp`, `details: { flashcardId: newFlashcard.id, deckId: deckId }`).
    d.  **Return Value**: Returns a list of the newly created flashcard data, each mapped to `FlashcardDto`. If batch insertion is used, Supabase's `.select()` will return the list of created records.
4.  **Database (Supabase/PostgreSQL)**:
    a.  The `flashcards` table stores the new flashcards.
    b.  The `event_logs` table stores the creation events.

## 6. Security Considerations
-   **Authentication**: Enforced via JWT. All requests must include a valid `Authorization: Bearer <token>` header. Astro middleware or handler logic will verify this.
-   **Authorization**: The `FlashcardService` must verify that the authenticated user owns the `deckId` before creating flashcards in it. This prevents users from creating flashcards in other users' decks (mitigates IDOR).
-   **Input Validation**:
    -   Path parameters (`deckId`) should be validated for format (UUID).
    -   Request body (`flashcards` array and its items: `front`, `back`, `source`) is strictly validated using Zod. This includes checking if the `flashcards` array is not empty and each object conforms to constraints (presence, type, length, enum values). This protects against malformed data, potential injection attacks, and oversized data.
-   **SQL Injection**: Use of the Supabase client library with its query builders (especially for batch inserts) mitigates SQL injection risks.
-   **Error Handling**: Return generic error messages for `500 Internal Server Error` to avoid leaking sensitive system information. Specific error details should be logged server-side.
-   **CSRF**: As this is a stateless API endpoint using Bearer tokens, CSRF is generally not a concern if tokens are handled correctly (not stored in cookies accessible by JavaScript).
-   **Rate Limiting**: (Future consideration) Implement rate limiting if abuse is detected or anticipated.

## 7. Performance Considerations
-   **Database Queries**:
    -   Fetching the deck for validation: Ensure `deck_id` and `user_id` are indexed in the `decks` table for fast lookups.
    -   Inserting the flashcards: Batch insertion into `flashcards` table using Supabase's ability to insert an array of rows is highly recommended for performance.
    -   Inserting into `event_logs`: Similarly, if multiple events are logged, consider batching if the logging mechanism supports it and it's critical for performance. Otherwise, individual inserts per flashcard are acceptable.
-   **Payload Size**: The request and response payloads can be larger due to the list of flashcards. Max length constraints on `front` and `back` fields, and potentially a limit on the number of flashcards per request (e.g., 50-100), should be considered to manage data size and processing time.
-   **Service Logic**: The service logic will iterate over the flashcards or use batch operations. Ensure error handling within loops or batch operations is robust (e.g., what happens if one flashcard in a batch fails to insert?). Transactions might be needed for all-or-nothing semantics if required, though Supabase might handle this implicitly with batch inserts.
-   **Cold Starts**: If using serverless functions for API routes, be mindful of potential cold start latencies. For Astro deployed on Node.js, this is less of an issue.

## 8. Implementation Steps
1.  **Define Zod Schema**:
    *   In `src/pages/api/decks/[deckId]/flashcards.ts`, define a Zod schema for validating the request body. This will be an object schema containing a `flashcards` field, which is an array of flashcard objects. Each flashcard object schema will validate `front`, `back`, and `source`. Ensure the array is non-empty.
2.  **Create API Route Handler (`src/pages/api/decks/[deckId]/flashcards.ts`)**:
    *   Create the file if it doesn't exist.
    *   Implement the `POST` handler function.
    *   Add `export const prerender = false;`.
    *   **Authentication**: Access `context.locals.supabase` and `context.locals.user`. Return `401` if user is not authenticated.
    *   **Path Parameter**: Get `deckId` from `context.params.deckId`. Validate if it's a UUID.
    *   **Request Body Validation**: Parse `await context.request.json()`. Validate the `flashcards` array and its contents using the Zod schema. Return `400` with error details if invalid.
    *   **Service Instantiation**: Instantiate `FlashcardService`.
    *   **Call Service**: Call `flashcardService.createFlashcards(deckId, user.id, validatedData.flashcards)`.
    *   **Error Handling**: Wrap the service call in a try-catch block. Map service errors to appropriate HTTP status codes (`403`, `404`, `500`).
    *   **Success Response**: Return `201 Created` with an object like `{ "createdFlashcards": [...] }` containing the list of `FlashcardDto` from the service.
3.  **Create `FlashcardService` (`src/lib/services/flashcard.service.ts`)**:
    *   Create the file if it doesn't exist.
    *   Define the `FlashcardService` class.
    *   The constructor should accept `SupabaseClient` (from `context.locals.supabase`).
    *   **Implement `createFlashcards` method** (pluralized, takes an array of flashcard data):
        *   **Deck Validation**:
            *   Query the `decks` table for the given `deckId` (once at the beginning).
            *   If not found, throw an error (e.g., a custom `NotFoundError`).
            *   If `deck.user_id !== userId`, throw an error (e.g., a custom `ForbiddenError`).
        *   **Flashcard Creation (Batch Recommended)**:
            *   Prepare an array of flashcard objects for insertion, adding `deck_id` to each.
            *   Use `supabaseClient.from('flashcards').insert(flashcardsToInsertArray).select()` to create all flashcards in a single operation and get the created records.
            *   Handle potential database errors from the batch operation.
        *   **Event Logging (Iterative or Batch)**:
            *   For each successfully created flashcard from the `select()` result:
                *   Construct the event log payload.
                *   Insert into `event_logs` table. Consider batching these inserts as well if performance is critical and many flashcards are created at once.
        *   **Return Data**: Map the created flashcard records to `FlashcardDto` and return the list.
4.  **Define Custom Error Types (Optional but Recommended)**:
    *   In `src/lib/errors.ts` (or similar), define custom error classes like `NotFoundError`, `ForbiddenError`, `ValidationError` that the service can throw and the API route can catch to map to HTTP statuses.
5.  **Update `src/types.ts` (if needed)**:
    *   Ensure `CreateFlashcardsCommand`, `CreateFlashcardItem`, `FlashcardDto`, and `FlashcardSourceEnum` are correctly defined and exported as per the updated structure.
6.  **Database Schema**:
    *   Verify that `flashcards` table schema (columns, types, constraints for `front`, `back`, `source`, foreign key to `decks`) matches the requirements.
    *   Verify `event_logs` table schema is suitable for logging these events.
7.  **Testing**:
    *   **Unit Tests**: Test the Zod schema and `FlashcardService` logic (mocking Supabase client).
    *   **Integration Tests**: Test the API endpoint with various scenarios:
        *   Creating a list of valid flashcards.
        *   Sending an empty `flashcards` array (should be a `400`).
        *   Sending a list where one or more flashcards are invalid (e.g., missing `front`, `source` incorrect). Define behavior: reject all or create valid ones? (Typically reject all for simplicity and atomicity).
        *   Cover other error scenarios (`401`, `403`, `404`, `500`).
8.  **Documentation**:
    *   Ensure API documentation (e.g., Swagger/OpenAPI if used, or internal docs) is updated to reflect this endpoint. (This plan itself serves as initial detailed documentation). 