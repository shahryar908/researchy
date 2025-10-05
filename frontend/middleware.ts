import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Only protect specific routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/chat(.*)',
  '/dashboard(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Only protect routes if they match our protected routes
  if (isProtectedRoute(req)) {
    auth().protect()
  }
  // All other routes (including /) are public
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
