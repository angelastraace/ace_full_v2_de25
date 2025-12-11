import { type NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /about, /blog/first-post)
  const { pathname } = request.nextUrl

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    // In production, check for admin role in Supabase
    // For now, allow access - add proper auth checks here
    return NextResponse.next()
  }

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/trade", "/earn", "/staking", "/vip", "/rewards", "/profile", "/settings"]

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // Check for auth token in request
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}