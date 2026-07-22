// ============================================================================
// DINA client — API configuration (single source of truth for the base URL)
// ============================================================================
// In dev, VITE_API_BASE stays a relative prefix and the Vite proxy forwards it
// to the server (see vite.config.ts) — same-origin, no CORS. In production the
// SPA is served alongside the API, so a relative base is still correct.

const RAW_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/dina/api/v1';

/** Normalized API base with no trailing slash. */
export const API_BASE = RAW_BASE.replace(/\/+$/, '');

export const APP_NAME = (import.meta.env.VITE_APP_NAME as string | undefined) ?? 'DINA';

/** Default per-request timeout (ms). LLM-backed calls override this. */
export const DEFAULT_TIMEOUT_MS = 60_000;

/** Long timeout for synthesis/investigate/insight endpoints (server allows 300s). */
export const LLM_TIMEOUT_MS = 300_000;
