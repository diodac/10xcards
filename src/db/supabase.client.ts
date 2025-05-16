import { type SupabaseClient as OriginalSupabaseClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types";

// Re-export SupabaseClient with the Database generics applied for type safety throughout the app
// as per project guidelines (backend.mdc: Use SupabaseClient type from `src/db/supabase.client.ts`).
export type SupabaseClient = OriginalSupabaseClient<Database>;

// If you also intend to create and export a client instance from this file:
// import { createClient } from '@supabase/supabase-js';
// export const supabase = createClient(
//   import.meta.env.PUBLIC_SUPABASE_URL,
//   import.meta.env.PUBLIC_SUPABASE_ANON_KEY
// );

export const cookieOptions: CookieOptionsWithName = {
  // name: 'sb', // Default cookie name can be customized, if not specified @supabase/ssr uses a default
  path: "/",
  secure: true, // Should be true in production, ensure your site is HTTPS
  httpOnly: true,
  sameSite: "lax",
  maxAge: 1000 * 60 * 60 * 24 * 365, // Example: 1 year, adjust as needed
};

// Helper function to parse the cookie header as provided in supabase-auth.mdc
function parseCookieHeader(cookieHeader: string | null | undefined): { name: string; value: string }[] {
  if (!cookieHeader) {
    return [];
  }
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions, // Uses the defined cookieOptions
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie"));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

// Note: Ensure 'src/db/database.types.ts' exists or is created with your Supabase schema.
// If it doesn't exist, you might get TypeScript errors.
// You can generate this file using: npx supabase gen types typescript --project-id your-project-id > src/db/database.types.ts
