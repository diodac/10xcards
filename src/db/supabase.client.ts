import type { SupabaseClient as OriginalSupabaseClient } from "@supabase/supabase-js";

// Re-exporting SupabaseClient as per project guidelines mentioned in backend.mdc
// This allows for a centralized point of control for this type if needed later.
export type SupabaseClient = OriginalSupabaseClient;

// If you also intend to create and export a client instance from this file:
// import { createClient } from '@supabase/supabase-js';
// export const supabase = createClient(
//   import.meta.env.PUBLIC_SUPABASE_URL,
//   import.meta.env.PUBLIC_SUPABASE_ANON_KEY
// );
