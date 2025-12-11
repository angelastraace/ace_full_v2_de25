import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")
    const error = req.nextUrl.searchParams.get("error")

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${error}`, req.nextUrl.origin))
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", req.nextUrl.origin))
    }

    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin))
  } catch (error) {
    console.error("[v0] Auth callback error:", error)
    return NextResponse.redirect(new URL("/login?error=callback_failed", req.nextUrl.origin))
  }
}