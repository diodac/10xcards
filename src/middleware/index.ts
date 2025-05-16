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

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  // Calculate session ID if session exists
  let sessionId: string | undefined = undefined;
  if (session?.access_token) {
    const hash = crypto.createHash("sha256");
    hash.update(session.access_token);
    sessionId = hash.digest("hex");
  }

  // Store user, session, supabase client, and session ID in Astro.locals
  locals.session = session;
  locals.user = user ? { id: user.id, email: user.email } : undefined;
  locals.supabase = supabase;
  locals.sessionId = sessionId;

  const currentPath = url.pathname;

  // If user is authenticated and tries to access login/register, redirect to dashboard
  if (user && AUTH_REDIRECT_PATHS.includes(currentPath)) {
    return redirect("/decks", 302); // Or your main app page
  }

  // If user is not authenticated and tries to access a protected route, redirect to login
  // This assumes any path NOT in PUBLIC_PATHS is protected.
  if (!user && !PUBLIC_PATHS.some((publicPath) => currentPath.startsWith(publicPath))) {
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
