import { createClient } from "@supabase/supabase-js"

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a mock Supabase client if credentials are missing
const createMockClient = () => {
  console.warn("Using mock Supabase client - database operations will be simulated")

  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          data: null,
          error: null,
        }),
        data: null,
        error: null,
      }),
      insert: async () => ({ data: { id: "mock-id" }, error: null }),
      update: async () => ({ data: { id: "mock-id" }, error: null }),
      delete: async () => ({ data: { id: "mock-id" }, error: null }),
    }),
    auth: {
      signUp: async () => ({ data: { user: { id: "mock-user" } }, error: null }),
      signIn: async () => ({ data: { user: { id: "mock-user" } }, error: null }),
      signOut: async () => ({ error: null }),
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: "mock-path" }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "https://example.com/mock-image.jpg" } }),
      }),
    },
  }
}

// Create the client with the provided credentials
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : (createMockClient() as any)

// Log connection status (remove in production)
if (supabaseUrl && supabaseAnonKey) {
  console.log("Supabase client initialized with real credentials")
} else {
  console.warn("Supabase client initialized with mock data - check your environment variables")
}