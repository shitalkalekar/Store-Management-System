# Render, Cloudflare Pages, and CORS runbook

Phases 10, 11, and 12 of `PRODUCTION_DEPLOYMENT_TASKLIST.md`.

These are account-console steps. Nothing here can be completed from the
repository, but every value the consoles need is defined here so the two sides
cannot drift apart.

Never paste a secret into this repository, a pull request, or a screenshot.

## Order of operations

The two services reference each other, so they are configured in three passes:

1. **Render first**, with a placeholder `CORS_ORIGINS`. This yields the API
   hostname.
2. **Cloudflare Pages second**, using that hostname as `VITE_API_BASE_URL`.
   This yields the frontend origin.
3. **Back to Render**, replacing the placeholder with the exact Pages origin,
   and back to Atlas to add Render's outbound ranges.

## 1. Render web service

`render.yaml` in the repository root declares the non-secret shape of the
service. Either apply it as a Blueprint or mirror it by hand.

| Setting | Value |
| --- | --- |
| Type | Web Service, Free |
| Region | Singapore (match the Atlas region) |
| Root directory | `backend` |
| Runtime | Node |
| Build command | `npm ci --omit=dev` |
| Start command | `npm start` |
| Health check path | `/health` |
| Branch | `main` |
| Pull request previews | **disabled** |

Environment variables. Everything marked *secret* is entered only in Render's
environment settings, sourced from the password manager:

```env
NODE_ENV=production
HOST=0.0.0.0
TRUST_PROXY=1
JWT_ISSUER=tammewar-pharmacy
JWT_AUDIENCE=tammewar-pharmacy-api
JWT_EXPIRES_IN=2h
CUSTOMER_JWT_EXPIRES_IN=2h
AUTO_SEED=false
PAYMENTS_ALLOW_MOCK=false
ONLINE_RESTORE_ENABLED=false
INTERNAL_AUTH_ENABLED=false
WHATSAPP_ENABLED=false

MONGO_URI=<secret: Atlas SRV string ending /tammewar_pharmacy_prod?retryWrites=true&w=majority>
MONGO_DB_NAME=tammewar_pharmacy_prod
JWT_SECRET=<secret: output of `cd backend && npm run secret:generate`>
CORS_ORIGINS=<the exact Cloudflare Pages origin, filled in during pass 3>
```

Notes that matter:

- **Do not set `PORT`.** Render injects it, and the server refuses to start in
  production if the platform did not supply one.
- **`TRUST_PROXY=1`** is required. Render terminates TLS one hop in front of the
  service; without it every request looks like it comes from the same address
  and the per-IP login rate limit stops discriminating.
- **`MONGO_DB_NAME` is mandatory** and must equal the database named in the
  URI. Startup verifies both and refuses to run against the wrong database.
- Do not add Razorpay or Meta variables. Those integrations stay disabled for
  the pilot.

The server validates this whole set at boot through
`env.assertSafeConfiguration()`, so a misconfiguration fails the deploy loudly
rather than starting with a weaker posture. `backend/test/productionConfig.test.js`
covers the same rules.

After the first deploy:

- Read the build and runtime logs and confirm no secret value appears in them.
- Confirm `GET /health` returns `{"ok":true}` and `GET /ready` returns
  `{"ready":true}` once Atlas is connected.
- Deploy a second time and use **Rollback** to confirm the rollback path works.
- Note the expected **cold start of up to about a minute** after 15 minutes of
  inactivity. This is Free-tier behaviour, not a fault; the frontend shows a
  waking-up state rather than an error.

## 2. Atlas network access for Render

Once the service exists, open its **Connect → Outbound** panel and copy
**every** listed CIDR into Atlas **Network Access**. Render may use any address
in its regional outbound ranges, so a partial list produces intermittent
connection failures.

Remove the temporary migration-device IP after Phase 8's checks are finished.
Never use `0.0.0.0/0`.

## 3. Cloudflare Pages project

| Setting | Value |
| --- | --- |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Production branch | `main` |
| Preview deployments | disabled, or isolated from production data |

One public build variable:

```env
VITE_API_BASE_URL=https://<render-service>.onrender.com/result-analysis
```

`VITE_*` values are embedded into the browser bundle. Never put a secret in
one. `VITE_API_BASE_URL` and the local-only `VITE_DEV_PORT` are the only
variables the frontend has, and the build fails outright if the API base URL is
missing.

### Headers, robots, and SPA routing are generated, not hand-maintained

`frontend/build/cloudflarePagesAssets.js` emits `_headers`, `_redirects`, and
`robots.txt` into `dist` at build time. The Content-Security-Policy's
`connect-src` is derived from `VITE_API_BASE_URL`, so the policy cannot drift
from the API the bundle actually calls. The build refuses a non-HTTPS API URL.

The emitted policy sets `default-src 'self'`, a strict `script-src 'self'`,
`frame-ancestors 'none'`, HSTS, `X-Content-Type-Options`, `Referrer-Policy:
no-referrer`, a restrictive `Permissions-Policy`, and
`X-Robots-Tag: noindex, nofollow` — this is a private operational application
and must not be indexed. `index.html` carries a matching `robots` meta tag.

Verify after the first deploy:

```bash
curl -sI https://<project>.pages.dev | grep -iE 'content-security-policy|strict-transport|x-robots-tag'
curl -s  https://<project>.pages.dev/robots.txt
```

Then confirm no secret reached the bundle:

```bash
cd frontend && VITE_API_BASE_URL=https://<render-service>.onrender.com/result-analysis npm run build
grep -rEi "mongodb\+srv|JWT_SECRET|rzp_(live|test)|-----BEGIN" dist/ || echo "clean"
```

### Preview deployments

Preview builds must never point at the production API or production data. Either
disable previews, or give them a separate staging API and database. Review who
can access preview URLs.

## 4. Lock down CORS (Phase 12)

Set Render's `CORS_ORIGINS` to the **exact** Pages origin, and to the custom
domain origin as well if one is used:

```env
CORS_ORIGINS=https://tammewar-pharmacy.pages.dev
# or, with a custom domain:
CORS_ORIGINS=https://tammewar-pharmacy.pages.dev,https://shop.example
```

The server rejects at boot any origin list that contains `*`, a wildcard
hostname, `http://`, `localhost`/`127.0.0.1`, or a trailing path. Unapproved
origins receive no `Access-Control-Allow-Origin` header at all, and credentialed
CORS is never enabled.

Verify against the deployed API:

```bash
# The production origin is granted.
curl -sI -H 'Origin: https://tammewar-pharmacy.pages.dev' \
  https://<render-service>.onrender.com/health | grep -i access-control-allow-origin

# A lookalike origin is not.
curl -sI -H 'Origin: https://tammewar-pharmacy.pages.dev.attacker.test' \
  https://<render-service>.onrender.com/health | grep -i access-control-allow-origin || echo "no CORS permission — correct"

# CORS is not authentication: a direct request still needs a token.
curl -s https://<render-service>.onrender.com/result-analysis/customers
# {"error":"Authentication required"}
```

`backend/test/requestHardening.test.js` asserts the same behaviour locally on
every test run.

## 5. Optional: Cloudflare Access as a second factor

The application has no in-app TOTP. Cloudflare Access (Zero Trust, free for
small teams) can put an identity gate in front of the whole frontend, so a
stolen owner password alone is not enough to reach the login screen.

1. Zero Trust → **Access → Applications → Add a self-hosted application**
   covering the Pages hostname.
2. Policy: **Allow**, matched on the owner's email address only.
3. Identity provider: a one-time PIN to that address, or a Google/Microsoft
   account already protected by MFA.
4. Leave the application's own login in place. Access is an additional gate, not
   a replacement — the API is reachable directly and is still protected only by
   its own JWT authentication.

Because the API origin is not behind Access, this raises the bar for reaching
the UI but does not protect the API. Treat it as defence in depth on top of the
owner password, not as the owner's MFA.

## Deployment restrictions to confirm

- Render: production branch is `main`; PR previews are off.
- Cloudflare: production branch is `main`; previews are off or isolated.
- GitHub: `main` is protected and requires review, and the repository is
  private. Both were verified during Phase 2.
