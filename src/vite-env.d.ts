/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Build stamp, substituted at compile time by `define` in vite.config.ts.
 * These are literals in the emitted bundle, not runtime lookups, which is
 * why the footer can report the build without an API call.
 */
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
/** Short commit hash, or "local" when built outside a git checkout. */
declare const __GIT_COMMIT__: string;
declare const __BUILD_MODE__: string;
