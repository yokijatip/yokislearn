const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export async function createSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { createClient } = await import("@supabase/supabase-js");
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const plannedTables = [
  "accounts",
  "profiles",
  "learning_items",
  "user_progress",
  "quiz_attempts",
  "quiz_answers",
  "game_scores",
] as const;
