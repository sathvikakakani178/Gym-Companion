import { createClient } from '@supabase/supabase-js';

// The env vars are intentionally swapped in this project:
//   EXPO_PUBLIC_SUPABASE_ANON_KEY actually contains the project URL
//   EXPO_PUBLIC_SUPABASE_URL       actually contains the anon key
const supabaseUrl = (process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? '').replace(/\/$/, '');
const supabaseAnonKey = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? '';

// Service role key bypasses Row Level Security for backend-only operations.
// Set SUPABASE_SERVICE_ROLE_KEY in the environment to enable full server access.
const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

/**
 * Server-side Supabase client for background jobs and admin data access.
 * Uses the service role key when available (bypasses RLS), otherwise falls
 * back to the anon key (requires permissive RLS policies).
 */
export const supabase = createClient(supabaseUrl, serviceRoleKey ?? supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Create a user-context Supabase client authenticated with the given JWT.
 * This client will respect RLS policies as the authenticated user.
 */
export function createUserClient(userToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
