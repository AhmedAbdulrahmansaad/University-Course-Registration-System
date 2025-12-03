/**
 * Supabase Client - Singleton Instance
 * This file creates and exports a single Supabase client instance
 * to be used throughout the application for all database operations.
 */

import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Construct the Supabase URL
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Export URL and key for server-side usage
export { supabaseUrl, supabaseAnonKey };
