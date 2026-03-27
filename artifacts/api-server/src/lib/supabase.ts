import { createClient } from '@supabase/supabase-js';

// The env vars are intentionally swapped in this project
// EXPO_PUBLIC_SUPABASE_ANON_KEY actually contains the project URL
// EXPO_PUBLIC_SUPABASE_URL actually contains the anon key
const supabaseUrl = (process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] || '').replace(/\/$/, '');
const supabaseAnonKey = process.env['EXPO_PUBLIC_SUPABASE_URL'] || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
