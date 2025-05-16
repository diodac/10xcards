import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

export const prerender = false; // Required for API routes that handle dynamic requests

export const POST: APIRoute = async ({ request, cookies }) => {
  let email, password;
  try {
    const body = await request.json();
    email = body.email;
    password = body.password;
  } catch (_e) {
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

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email: email as string,
    password: password as string,
  });

  if (signInError) {
    return new Response(JSON.stringify({ error: signInError.message || "An unknown error occurred during sign in." }), {
      status: signInError.status || 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // User signed in successfully. Session cookie should be set by @supabase/ssr.
  // data.user contains the user object from Supabase.
  return new Response(JSON.stringify({ user: data.user }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
