const REQUIRED_ENV_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

type RequiredEnvKey = (typeof REQUIRED_ENV_KEYS)[number];

function readEnvValue(key: RequiredEnvKey): string {
  const value = import.meta.env[key];

  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable "${key}". Add it to v2/.env.local and restart the Vite dev server.`,
    );
  }

  return value;
}

export function getSupabaseEnv() {
  return {
    supabaseUrl: readEnvValue('VITE_SUPABASE_URL'),
    supabaseAnonKey: readEnvValue('VITE_SUPABASE_ANON_KEY'),
  };
}
