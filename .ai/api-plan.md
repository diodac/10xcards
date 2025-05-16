# REST API Plan

## 1. Resources

-   **User Profile (`user_profiles`)**: Represents user-specific application data, extending Supabase users.
    -   Corresponds to `user_profiles` table.
-   **Decks (`decks`)**: Represents a collection of flashcards.
    -   Corresponds to `decks` table.
-   **Flashcards (`flashcards`)**: Represents an individual flashcard with a front and back.
    -   Corresponds to `flashcards` table.
-   **AI (`ai_service`)**: A virtual resource representing interactions with the LLM for flashcard generation.
    -   Does not directly map to a single table, but interacts with `flashcards` and `event_logs`.
-   **Event Logs (`event_logs`)**: For internal logging of significant application events.
    -   Corresponds to `event_logs` table. (Primarily for internal use, may not have extensive public API endpoints beyond what's needed for stats if any).

## 2. Endpoints

### 2.1. User Profile

#### `GET /api/profile`
-   **Description**: Retrieve the current authenticated user's profile.
-   **Request Payload**: None
-   **Response Payload (200 OK)**:
    ```json
    {
      "id": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp"
      // Additional profile fields if added in the future
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Profile retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `404 Not Found`: Profile not found for the user (should be auto-created).
    -   `500 Internal Server Error`: Server error.

#### `PUT /api/profile`
-   **Description**: Update the current authenticated user's profile.
-   **Request Payload**:
    ```json
    {
      // updatable profile fields, e.g.
      // "preferences": { ... }
    }
    ```
-   **Response Payload (200 OK)**:
    ```json
    {
      "id": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp"
      // Updated profile fields
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Profile updated successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid request payload or validation error.
    -   `401 Unauthorized`: User not authenticated.
    -   `404 Not Found`: Profile not found.
    -   `500 Internal Server Error`: Server error.

### 2.2. Decks

#### `POST /api/decks`
-   **Description**: Create a new deck.
-   **Request Payload**:
    ```json
    {
      "name": "string (max 128 chars, required)"
    }
    ```
-   **Response Payload (201 Created)**:
    ```json
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
-   **Success Codes**:
    -   `201 Created`: Deck created successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid request payload (e.g., missing name, name too long).
    -   `401 Unauthorized`: User not authenticated.
    -   `500 Internal Server Error`: Server error.

#### `GET /api/decks`
-   **Description**: List all decks for the authenticated user.
-   **Query Parameters**:
    -   `page` (int, optional, default: 1): Page number for pagination.
    -   `pageSize` (int, optional, default: 10): Number of items per page.
    -   `sortBy` (string, optional, default: "created_at"): Field to sort by (e.g., "name", "created_at").
    -   `order` (string, optional, default: "desc"): Sort order ("asc" or "desc").
-   **Response Payload (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "user_id": "uuid",
          "name": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 10,
        "totalItems": 100,
        "totalPages": 10
      }
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Decks retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `500 Internal Server Error`: Server error.

#### `GET /api/decks/{deckId}`
-   **Description**: Retrieve a specific deck by its ID.
-   **Request Payload**: None
-   **Response Payload (200 OK)**:
    ```json
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
      // Optionally include a sample of flashcards or flashcard count
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Deck retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not have access to this deck.
    -   `404 Not Found`: Deck not found.
    -   `500 Internal Server Error`: Server error.

#### `PUT /api/decks/{deckId}`
-   **Description**: Update an existing deck.
-   **Request Payload**:
    ```json
    {
      "name": "string (max 128 chars, required)"
    }
    ```
-   **Response Payload (200 OK)**:
    ```json
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Deck updated successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid request payload.
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not have access to this deck.
    -   `404 Not Found`: Deck not found.
    -   `500 Internal Server Error`: Server error.

#### `DELETE /api/decks/{deckId}`
-   **Description**: Delete a deck and all its associated flashcards.
-   **Request Payload**: None
-   **Response Payload (204 No Content)**: None
-   **Success Codes**:
    -   `204 No Content`: Deck deleted successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not have access to this deck.
    -   `404 Not Found`: Deck not found.
    -   `500 Internal Server Error`: Server error.

### 2.3. Flashcards

#### `POST /api/decks/{deckId}/flashcards`
-   **Description**: Create one or more new flashcards within a specific deck.
-   **Request Payload**:
    ```json
    {
      "flashcards": [
        {
          "front": "string (max 256 chars, required)",
          "back": "string (max 512 chars, required)",
          "source": "string (required, enum: 'manual', 'ai-full', 'ai-edited')"
        }
        // ... more flashcard objects
      ]
    }
    ```
-   **Response Payload (201 Created)**:
    ```json
    {
      "createdFlashcards": [
        {
          "id": "uuid",
          "deck_id": "uuid",
          "front": "string",
          "back": "string",
          "source": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        // ... more created flashcard objects
      ]
    }
    ```
-   **Success Codes**:
    -   `201 Created`: Flashcards created successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid request payload (missing fields, invalid source, content too long).
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not have access to this deck.
    -   `404 Not Found`: Deck not found.
    -   `500 Internal Server Error`: Server error.

#### `GET /api/decks/{deckId}/flashcards`
-   **Description**: List all flashcards within a specific deck.
-   **Query Parameters**:
    -   `page` (int, optional, default: 1): Page number for pagination.
    -   `pageSize` (int, optional, default: 10): Number of items per page.
    -   `sortBy` (string, optional, default: "created_at"): Field to sort by (e.g., "front", "created_at").
    -   `order` (string, optional, default: "desc"): Sort order ("asc" or "desc").
    -   `source` (string, optional): Filter by source ('manual', 'ai-full', 'ai-edited').
-   **Response Payload (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "deck_id": "uuid",
          "front": "string",
          "back": "string",
          "source": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 10,
        "totalItems": 50,
        "totalPages": 5
      }
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Flashcards retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not have access to this deck.
    -   `404 Not Found`: Deck not found.
    -   `500 Internal Server Error`: Server error.

#### `GET /api/decks/{deckId}/flashcards/{flashcardId}`
-   **Description**: Retrieve a specific flashcard by its ID from a specific deck.
-   **Request Payload**: None
-   **Response Payload (200 OK)**:
    ```json
    {
      "id": "uuid",
      "deck_id": "uuid",
      "front": "string",
      "back": "string",
      "source": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Flashcard retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not have access to this flashcard/deck.
    -   `404 Not Found`: Flashcard or Deck not found.
    -   `500 Internal Server Error`: Server error.

#### `PUT /api/decks/{deckId}/flashcards/{flashcardId}`
-   **Description**: Update an existing flashcard.
-   **Request Payload**:
    ```json
    {
      "front": "string (max 256 chars, optional)",
      "back": "string (max 512 chars, optional)",
      "source": "string (optional, enum: 'manual', 'ai-full', 'ai-edited')"
    }
    ```
-   **Response Payload (200 OK)**:
    ```json
    {
      "id": "uuid",
      "deck_id": "uuid",
      "front": "string",
      "back": "string",
      "source": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Flashcard updated successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid request payload.
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not have access to this flashcard/deck.
    -   `404 Not Found`: Flashcard or Deck not found.
    -   `500 Internal Server Error`: Server error.

#### `DELETE /api/decks/{deckId}/flashcards/{flashcardId}`
-   **Description**: Delete a flashcard.
-   **Request Payload**: None
-   **Response Payload (204 No Content)**: None
-   **Success Codes**:
    -   `204 No Content`: Flashcard deleted successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not have access to this flashcard/deck.
    -   `404 Not Found`: Flashcard or Deck not found.
    -   `500 Internal Server Error`: Server error.

### 2.4. AI Flashcard Generation

#### `POST /api/ai/generate-flashcards`
-   **Description**: Submit text to an LLM to generate flashcard suggestions. These are suggestions and not yet saved to the database.
-   **Request Payload**:
    ```json
    {
      "text": "string (required, 1000-10000 chars)"
    }
    ```
-   **Response Payload (200 OK)**:
    ```json
    {
      "suggestions": [
        {
          "front": "string",
          "back": "string"
        }
        // ... more suggestions
      ]
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Suggestions generated successfully.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid request payload (e.g., text length out of bounds).
    -   `401 Unauthorized`: User not authenticated.
    -   `500 Internal Server Error`: Error communicating with LLM or other server error.
    -   `503 Service Unavailable`: LLM service is temporarily unavailable.

### 2.5. Study Session (MVP)

#### `GET /api/decks/{deckId}/study-flashcards`
-   **Description**: Retrieve flashcards from a deck for a study session. In MVP, this might return all flashcards from the deck, or a shuffled subset. Logic for spaced repetition algorithm is primarily client-side for MVP.
-   **Query Parameters**:
    -   `limit` (int, optional): Maximum number of flashcards to return.
-   **Response Payload (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "deck_id": "uuid",
          "front": "string",
          "back": "string",
          "source": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        // ... more flashcards
      ]
    }
    ```
-   **Success Codes**:
    -   `200 OK`: Flashcards for study retrieved successfully.
-   **Error Codes**:
    -   `401 Unauthorized`: User not authenticated.
    -   `403 Forbidden`: User does not have access to this deck.
    -   `404 Not Found`: Deck not found.
    -   `500 Internal Server Error`: Server error.

## 3. Authentication and Authorization

-   **Mechanism**: Supabase Auth (JWT-based).
-   **Implementation**:
    1.  Clients will authenticate with Supabase directly (e.g., email/password, OAuth) to obtain a JWT.
    2.  For all protected API endpoints, the client must include the JWT in the `Authorization` header: `Authorization: Bearer <SUPABASE_JWT>`.
    3.  The API backend will verify the JWT. If valid, the `user_id` from the token will be used to scope data access.
    4.  Supabase Row Level Security (RLS) policies will be implemented on `user_profiles`, `decks`, `flashcards`, and `event_logs` tables to ensure users can only access their own data.
        -   Example RLS for `decks`: `CREATE POLICY "Enable read access for own decks" ON decks FOR SELECT USING (auth.uid() = user_id);`
        -   Similar policies for INSERT, UPDATE, DELETE.

## 4. Validation and Business Logic

### 4.1. Validation Conditions

-   **General**:
    -   All UUIDs must be in valid UUID format.
    -   Timestamps will be handled by the database (`DEFAULT now()` or `updated_at` triggers).
-   **User Profile**:
    -   Future fields will have their own validation.
-   **Decks (`POST /api/decks`, `PUT /api/decks/{deckId}`):**
    -   `name`: Required, string, max length 128 characters.
-   **Flashcards (`POST /api/decks/{deckId}/flashcards`, `PUT /api/decks/{deckId}/flashcards/{flashcardId}`):**
    -   `front`: Required on create, string, max length 256 characters.
    -   `back`: Required on create, string, max length 512 characters.
    -   `source`: Required on create, must be one of `'manual'`, `'ai-full'`, `'ai-edited'`.
-   **AI Generation (`POST /api/ai/generate-flashcards`):**
    -   `text`: Required, string, length between 1000 and 10000 characters.

### 4.2. Business Logic Implementation

1.  **AI Flashcard Generation (US-003, US-004):**
    -   `POST /api/ai/generate-flashcards`: Takes user text, sends to LLM via OpenRouter.ai. Returns suggestions.
        -   An `event_log` of type `ai_generation_requested` is created.
    -   Client-side: User reviews suggestions.
    -   `POST /api/decks/{deckId}/flashcards`: User saves selected/edited suggestions.
        -   `source` is set to `'ai-full'` if saved directly, or `'ai-edited'` if modified by the user.
        -   An `event_log` of type `flashcard_created_from_ai` is created.
2.  **Manual Flashcard Creation (US-007):**
    -   `POST /api/decks/{deckId}/flashcards`: User provides `front`, `back`.
        -   `source` is set to `'manual'`.
        -   An `event_log` of type `flashcard_created_manual` is created.
3.  **Editing Flashcards (US-005):**
    -   `PUT /api/decks/{deckId}/flashcards/{flashcardId}`: Allows updating `front`, `back`, and `source`.
        -   If an AI-generated card (`'ai-full'`) is edited, its `source` should be updated to `'ai-edited'`.
4.  **Deleting Flashcards (US-006):**
    -   `DELETE /api/decks/{deckId}/flashcards/{flashcardId}`: Removes the flashcard.
5.  **Deck Management:**
    -   Standard CRUD operations for decks. Deleting a deck will cascade delete its flashcards (handled by database constraints or application logic).
6.  **Study Session (US-008):**
    -   `GET /api/decks/{deckId}/study-flashcards`: Provides flashcards for study. MVP assumes client-side SR algorithm.
    -   (Future) If SR metadata is stored, an endpoint like `POST /api/flashcards/{flashcardId}/review` might be added to update SR parameters.
7.  **User Account Deletion (PRD GDPR compliance):**
    -   Supabase handles user deletion in `auth.users`.
    -   A mechanism (e.g., database trigger on `auth.users` delete, or a dedicated admin process) must ensure that associated data in `user_profiles`, `decks`, `flashcards`, and `event_logs` is also deleted or anonymized.
    -   A `DELETE /api/profile` endpoint could initiate this process for the current user, which would then call Supabase to delete the auth user, and subsequently trigger cascading deletes.
8.  **Statistics (PRD - Success Metrics):**
    -   The `event_logs` table will store events related to AI generation (`ai_generation_requested`, `ai_flashcard_suggestion_created`) and flashcard creation (`flashcard_created_from_ai`, `flashcard_created_manual`).
    -   These logs can be queried internally to calculate metrics like:
        -   Number of AI-generated flashcards vs. accepted.
        -   Percentage of flashcards created via AI vs. manual.
    -   No public API endpoint for these stats is defined for MVP unless explicitly required for user-facing features.

### 4.3. Rate Limiting and Security Considerations
-   **Rate Limiting**: Implement rate limiting on sensitive or expensive endpoints, especially `POST /api/ai/generate-flashcards`.
-   **Input Sanitization**: Ensure all user inputs are sanitized to prevent XSS and other injection attacks, although ORM/query builders often handle SQL injection.
-   **HTTPS**: API should only be accessible via HTTPS.
-   **Error Handling**: Consistent error response format. Avoid leaking sensitive stack trace information in production. 