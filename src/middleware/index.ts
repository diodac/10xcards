import { createSupabaseServerInstance } from "@/db/supabase.client";
import { defineMiddleware } from "astro:middleware";
import crypto from "node:crypto";

// Define public paths that do not require authentication.
// Add any other public static pages or specific API routes if necessary.
const PUBLIC_PATHS = [
  "/", // Assuming the homepage is public
  "/login",
  "/register",
  "/forgot-password", // If you have this page
  "/reset-password", // If you have this page
  // Auth API endpoints are implicitly public if they don't check session themselves,
  // but explicitly listing them can be clearer.
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  // Add other public paths like /about, /pricing, etc.
];

// Define paths that authenticated users should be redirected away from.
const AUTH_REDIRECT_PATHS = ["/login", "/register"];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Get the authenticated user
  const {
    data: { user: authenticatedUser },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error fetching authenticated user in middleware:", userError.message);
    // Depending on the error, you might want to clear the session or handle it differently
  }

  // Get the session details (e.g., for access_token)
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Error fetching session in middleware:", sessionError.message);
  }

  // Calculate session ID if session and access_token exist
  let sessionId: string | undefined = undefined;
  if (session?.access_token) {
    const hash = crypto.createHash("sha256");
    hash.update(session.access_token);
    sessionId = hash.digest("hex");
  }

  // Store user, session, supabase client, and session ID in Astro.locals
  locals.session = session; // session object from getSession()
  locals.user = authenticatedUser ? { id: authenticatedUser.id, email: authenticatedUser.email } : undefined;
  locals.supabase = supabase;
  locals.sessionId = sessionId;

  const currentPath = url.pathname;

  // If user is authenticated (based on authenticatedUser) and tries to access login/register, redirect to dashboard
  if (authenticatedUser && AUTH_REDIRECT_PATHS.includes(currentPath)) {
    return redirect("/decks", 302); // Or your main app page
  }

  // If user is not authenticated (based on authenticatedUser) and tries to access a protected route, redirect to login
  if (!authenticatedUser && !PUBLIC_PATHS.some((publicPath) => currentPath.startsWith(publicPath))) {
    // Exception for API routes that might be public but not explicitly listed (e.g. /api/public-data)
    // You might need more granular checks for API routes if some are public and some are protected.
    if (currentPath.startsWith("/api/")) {
      // Allow API calls to proceed if they are not auth related and might have their own auth checks or are public.
      // For a stricter approach, ensure all public API endpoints are in PUBLIC_PATHS.
      return next();
    }
    return redirect("/login", 302);
  }

  // Proceed to the next middleware or the requested page/endpoint
  const response = await next();
  return response;
});
