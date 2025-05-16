/// <reference types="astro/client" />

// Add Supabase related types to Astro.locals
declare namespace App {
  interface Locals extends astroHTML.Locals {
    user?: import("@supabase/supabase-js").User;
    supabaseClient: import("@supabase/supabase-js").SupabaseClient; // Using the direct import as src/db/supabase.client.ts is not yet confirmed
    session?: import("@supabase/supabase-js").Session | null; // Make session available on locals
    // If you have a custom session object or other properties from middleware, add them here
    // session?: import('@supabase/supabase-js').Session | null;
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
