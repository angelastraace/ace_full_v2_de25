import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export async function signUp(email: string, password: string) {
  try {
    if (!supabase) throw new Error("Supabase not configured")
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
      },
    })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Signup failed" }
  }
}

export async function signIn(email: string, password: string) {
  try {
    if (!supabase) throw new Error("Supabase not configured")
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Login error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Login failed" }
  }
}

export async function signOut() {
  try {
    if (!supabase) throw new Error("Supabase not configured")
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Logout failed" }
  }
}

export async function getCurrentUser() {
  try {
    if (!supabase) throw new Error("Supabase not configured")
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error("[v0] Get user error:", error)
    return null
  }
}