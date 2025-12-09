import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/submit(.*)",
  "/c/new(.*)",
  "/invite(.*)",
]);

// Routes that don't require onboarding
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/onboarding(.*)",
  "/api(.*)",
  "/",
  "/c",
  "/c/(.*)/events/(.*)", // Event detail pages are public
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const url = request.nextUrl;

  // Protect auth-required routes
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Check onboarding for authenticated users on non-public routes
  if (userId && !isPublicRoute(request)) {
    // Import here to avoid circular dependencies
    const { hasCompletedOnboarding } = await import("@/lib/actions/user-preferences");
    const completed = await hasCompletedOnboarding();

    if (!completed) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
