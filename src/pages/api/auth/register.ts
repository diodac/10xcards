import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client"; // Adjusted path

export const prerender = false; // Required for API routes that handle dynamic requests

export const POST: APIRoute = async ({ request, cookies }) => {
  let email, password;
  try {
    const body = await request.json();
    email = body.email;
    password = body.password;
  } catch {
    // console.error("[API /auth/register] Error parsing request body:", _e); // Optional: To use _e, uncomment and define it in catch(_e)
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return new Response(JSON.stringify({ error: "Email and password are required and must be strings" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  const { data, error: signUpError } = await supabase.auth.signUp({
    email: email as string, // Ensure type is string
    password: password as string, // Ensure type is string
  });

  if (signUpError) {
    // console.error("[API /auth/register] Supabase signUp error message:", signUpError.message); // Optional: Keep for server logs
    return new Response(JSON.stringify({ error: signUpError.message || "An unknown error occurred during sign up." }), {
      status: signUpError.status || 500, // Use Supabase error status or default to 500
      headers: { "Content-Type": "application/json" },
    });
  }

  // User signed up successfully. Session cookie should be set by @supabase/ssr.
  // data.user contains the user object from Supabase.
  return new Response(JSON.stringify({ user: data.user }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
