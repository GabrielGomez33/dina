# DINA — frontend

A single-page console for DINA's intelligence modules. **DIGIM** (gather /
research / relationship graph / semantic cloud) is the first page; the shell is
built so new modules are one registry entry + one route away.

Modeled on the proven **mirror-client** infrastructure: `client/` holds the Vite
app, CI builds it on GitHub Actions and ships the compiled `dist/` to the server,
where Apache serves it as static files.

```
dina/
├─ package.json            # repo root marker ({})
├─ .github/workflows/
│  └─ ci-cd.yml            # quality gates + deploy (imitates Mirror's pipeline)
└─ client/                 # the Vite + React + TypeScript SPA
   ├─ src/
   │  ├─ lib/              # apiClient (DUMP transport), apiConfig, types, modules
   │  ├─ hooks/useAsync    # abortable data fetching (no races / leaks)
   │  ├─ components/       # Layout (module rail), ErrorBoundary, RouteError
   │  ├─ digim/            # DIGIM page pieces (history / detail / run)
   │  ├─ pages/            # HomePage, DigimPage, NotFound
   │  └─ theme/tokens.css  # intelligence-console palette (shared with DIGIM)
   ├─ .htaccess.template   # SPA routing + cache rules (copied into dist/ on build)
   └─ vite.config.ts       # base '/dina', dev proxy /dina/api → server
```

## Local development

```bash
cd client
cp .env.example .env.local          # adjust VITE_DEV_API_TARGET if needed
npm install
npm run dev                         # http://localhost:5173/dina/
```

`npm run dev` proxies `/dina/api/*` to the DINA server (`VITE_DEV_API_TARGET`,
default `https://localhost:8445`) so the SPA and API are same-origin — no CORS.
The server already allowlists the Vite dev origins (`:5173`, `:4173`).

Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `format`.

## How it talks to DINA

Everything goes through `src/lib/apiClient.ts` — one hardened `request()` (timeout,
abort composition, typed JSON, normalized `ApiError`) with a thin typed method per
endpoint. It is a faithful view of the server's DUMP-compliant API documented in
`dina-server/docs/digim/API.md`. No component calls `fetch` directly.

## Production layout

- SPA served at **`https://<host>/dina/`** from `/var/www/dina-client/dist`.
- API at **`/dina/api/v1/*`** — Apache must proxy `/dina/api` to the DINA Node
  server **before** the static docroot, e.g. in the vhost:

  ```apache
  ProxyPass        /dina/api  http://127.0.0.1:8445/dina/api
  ProxyPassReverse /dina/api  http://127.0.0.1:8445/dina/api
  Alias /dina /var/www/dina-client/dist
  <Directory /var/www/dina-client/dist>
    AllowOverride All
    Require all granted
  </Directory>
  ```

  The `.htaccess` (shipped in `dist/`) handles SPA history fallback and never
  rewrites `/dina/api/*`.

## CI/CD

`.github/workflows/ci-cd.yml` (mirrors mirror-client):

- **Quality gates** (every push/PR): `npm ci` → ESLint → `tsc -b --noEmit` →
  Vite build → verify `dist/index.html` + `.htaccess` → bundle-size → `npm audit`.
- **Deploy** (push to `master` only): download the built artifact, back up the
  server's current `dist/`, SCP the new build, `chmod -R a+rX`, smoke-test
  `/dina/`, roll back on failure, tag the release.

### Required GitHub Actions secrets

| Secret | Purpose |
|---|---|
| `SERVER_HOST` | Deploy target hostname/IP |
| `SERVER_USER` | SSH user for deploy |
| `SERVER_SSH_KEY` | Private key for that user (deploy key) |
| `SERVER_DIST_PATH` | Absolute path to the served dist dir, e.g. `/var/www/dina-client/dist` |
| `VITE_API_BASE` | *(optional)* API base baked into the build; defaults to `/dina/api/v1` |

`GITHUB_TOKEN` is the built-in workflow token (no PAT needed). These mirror the
mirror-client secrets minus the PayPal keys, which DINA doesn't use.
