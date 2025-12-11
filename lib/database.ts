import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database helper functions
export async function createUser(email: string, passwordHash: string, username?: string) {
  const { data, error } = await supabase.from("users").insert([
    {
      email,
      password_hash: passwordHash,
      username,
    },
  ])
  return { data, error }
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase.from("users").select("*").eq("email", email).single()
  return { data, error }
}

export async function fundUserAccount(userId: string, amount: number, asset = "USDT") {
  const { data, error } = await supabase.from("admin_funding").insert([
    {
      user_id: userId,
      amount,
      asset,
      status: "COMPLETED",
    },
  ])
  return { data, error }
}

export async function getUserStats(userId: string) {
  const { data: trades, error: tradesError } = await supabase.from("trades").select("*").eq("user_id", userId)

  const { data: staking, error: stakingError } = await supabase.from("staking").select("*").eq("user_id", userId)

  return { trades, staking, tradesError, stakingError }
}