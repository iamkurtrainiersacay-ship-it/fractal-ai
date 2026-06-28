/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_SOCIAL_SUPABASE_URL: string;
  readonly VITE_SOCIAL_SUPABASE_ANON_KEY: string;
  readonly VITE_MAKE_GENERATE_WEBHOOK: string;
  readonly VITE_MAKE_SCHEDULE_WEBHOOK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
