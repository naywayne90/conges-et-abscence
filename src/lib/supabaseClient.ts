import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eaqaptssfbcmraeegsny.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
