import { createBrowserClient } from "@supabase/ssr";

// Create the Supabase client instance for the browser
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

