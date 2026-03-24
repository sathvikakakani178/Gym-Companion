import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Note: the two secrets were entered with their names swapped, so we read them cross-mapped.
// EXPO_PUBLIC_SUPABASE_ANON_KEY actually contains the project URL.
// EXPO_PUBLIC_SUPABASE_URL actually contains the anon/public JWT key.
const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').replace(/\/$/, '');
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
