import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Logs an event to the Supabase 'event_logs' table.
 *
 * @param supabase The Supabase client instance.
 * @param userId The ID of the user associated with the event (optional).
 * @param sessionId The ID of the session associated with the event (optional).
 * @param eventType A string identifying the type of event (e.g., 'AI_FLASHCARD_GENERATION_SUCCESS').
 * @param payload An optional object containing additional data related to the event.
 */
export async function logEvent(
  supabase: SupabaseClient,
  userId: string | undefined,
  sessionId: string | undefined,
  eventType: string,
  payload?: object
): Promise<void> {
  if (!supabase) {
    console.error("logEvent: Supabase client is not available. Skipping logging.");
    return;
  }

  const logEntry = {
    user_id: userId,
    session_id: sessionId,
    event_type: eventType,
    payload: payload || {},
    // timestamp will be handled by Supabase (e.g., default now() or created_at)
  };

  try {
    const { error } = await supabase.from("event_logs").insert([logEntry]);

    if (error) {
      console.error("Error logging event to Supabase:", {
        eventType,
        userId,
        sessionId,
        dbError: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    } else {
      // Optional: console.log for successful local dev logging verification
      // console.log(`Event logged successfully: ${eventType}`, { userId, sessionId });
    }
  } catch (e) {
    console.error("Exception during logEvent execution:", {
      eventType,
      userId,
      sessionId,
      exception: e instanceof Error ? e.message : String(e),
    });
  }
}
