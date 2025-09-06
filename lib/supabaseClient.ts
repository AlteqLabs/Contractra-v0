import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials for demonstration purposes.
// In a real application, these should be stored securely in environment variables.
const supabaseUrl = 'https://zkqribgivdxttfkqpono.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcXJpYmdpdmR4dHRma3Fwb25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzEwMzYsImV4cCI6MjA2ODUwNzAzNn0.d4kojavnkINTvbpYiryvLmcRd83oXLSvGFwJGW9D-dA';

// This implementation prevents a hard crash and allows the UI to display a helpful message if credentials are missing.
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

export const supabaseError = (!supabaseUrl || !supabaseAnonKey)
    ? "Configuration Error: The Supabase URL and anonymous key are missing. Please add them to lib/supabaseClient.ts"
    : null;
