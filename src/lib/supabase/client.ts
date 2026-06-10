import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Non-sensitive warning — no internal details exposed
  throw new Error('Supabase environment variables are missing. Check your .env.local file.');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
