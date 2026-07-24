// FootVerse – Supabase Client
// Single instance exported for use across the entire application.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[FootVerse] Supabase environment variables are missing.\n' +
    'Create a .env.local file with:\n' +
    '  VITE_SUPABASE_URL=<your project url>\n' +
    '  VITE_SUPABASE_ANON_KEY=<your anon key>'
  );
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
);
