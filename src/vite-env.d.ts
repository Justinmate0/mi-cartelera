/// <reference types="vite/client" />

// Tipado de las variables de entorno: asi TypeScript sabe que existen y que son string.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_TMDB_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
