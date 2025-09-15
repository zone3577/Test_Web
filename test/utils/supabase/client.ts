import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

export const createClient = () => {
  console.log('Creating Supabase client with URL:', supabaseUrl ? 'Present' : 'Missing');
  return createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );
};
