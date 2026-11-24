# Local authentication

A JWT remains valid across a backend restart when the signing key, expiry and account are unchanged. The default lifetime is 24 hours. Spring signs and verifies JWTs with the same configured `JWT_SECRET`. Missing credentials return HTTP 401 with `AUTHENTICATION_REQUIRED`. Rejected bearer credentials return HTTP 401 with `SESSION_EXPIRED`. Authorization and CORS denials retain their normal status.

## Stable local keys

From the `kidneycare-xai` application directory in PowerShell 7, run:

```powershell
& ./scripts/Initialize-LocalAuth.ps1
```

The helper creates the ignored `.env.auth.local` once and loads its random keys into the current process. Run it in each terminal that starts Spring Boot or FastAPI. Use your disposable local database settings. Keep the file across restarts. If replacing an existing local JWT key, users will sign in once to refresh old tokens.

For Compose, use `docker compose --env-file .env.auth.local up --build` from the same directory. Compose requires a JWT key and forwards `ML_INTERNAL_SECRET` to both internal services. Its frontend uses the Nginx `/api` proxy. In Vite development, use the default `/api` proxy or point `VITE_API_BASE_URL` to the intended local backend. Restart Vite after changing its environment.

## Shared frontend behavior

`AuthContext` and the shared Axios client use the same storage keys. An authenticated API request that returns 401 clears the credentials it actually used, then redirects to login with a session-expired notice. A late response from an older session cannot clear newer credentials. The public login form retains its own invalid-credentials error.

The full assistant and any floating chatbot should use `src/api/assistant.js` and the shared auth provider. The floating UI should close when authentication is lost and avoid caching JWTs or adding a separate redirect handler.
