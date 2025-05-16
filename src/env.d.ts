/// <reference types="astro/client" />

// Add Supabase related types to Astro.locals
declare namespace App {
  interface Locals {
    user?: {
      id: string;
      email?: string; // Email can be undefined based on Supabase user object
      // Add any other user properties you intend to store from the Supabase user object
    };
    session?: import("@supabase/supabase-js").Session | null; // Store the full session if needed
    supabase: import("@supabase/supabase-js").SupabaseClient; // Made non-optional
    sessionId?: string; // Renamed from hashedSessionId
    // Add other properties to Astro.locals as needed for your application
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
