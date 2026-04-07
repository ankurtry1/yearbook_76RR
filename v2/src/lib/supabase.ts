import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
