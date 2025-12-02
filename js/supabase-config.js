// ----------------------------
// Supabase Connection Settings
// ----------------------------

// Replace these with your real Supabase project URL + anon key
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
