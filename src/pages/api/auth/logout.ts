import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

export const POST: APIRoute = async ({ cookies, request }) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error during sign out:", error.message);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Supabase.auth.signOut() should clear the session cookie automatically
  // via the AstroCookies adapter in createSupabaseServerInstance.
  // We can explicitly clear if needed, but it's usually handled.
  // cookies.delete("sb-access-token", { path: "/" });
  // cookies.delete("sb-refresh-token", { path: "/" });

  // Instead of redirecting from the API,
  // let the client-side handle redirection after a successful logout.
  return new Response(JSON.stringify({ message: "Wylogowano pomyślnie" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

// Fallback GET route for cases where POST is not used (e.g. simple link)
// Though POST is generally preferred for actions like logout.
export const GET: APIRoute = async ({ cookies, request, redirect }) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error during sign out (GET):", error.message);
    // Redirect to login page with an error query parameter perhaps
    return redirect("/login?error=logout_failed", 302);
  }

  // Redirect to login page after successful logout
  return redirect("/login?message=logged_out", 302);
};
