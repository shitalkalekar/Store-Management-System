# Production Deployment Task List

Last updated: 2026-08-14

## Target architecture

- Cloudflare Pages Free: React/Vite frontend
- Render Free: Node.js/Express API
- MongoDB Atlas M0 Free: application database
- One application user: the pharmacy owner
- Approximately 250 customer records
- No application media/object-storage requirement
- Encrypted database backups stored outside Render and Atlas

This is a controlled, zero-cost single-owner deployment. Free-tier capacity is
adequate, but Render cold starts and the absence of Atlas M0 managed backups
must be accepted and mitigated. Do not expose the application publicly until
the final go/no-go gate is complete.

## 1. Finalize application scope

- [x] Confirm that the pharmacy owner is the only application user.
- [x] Keep one named administrator account; do not share it. Existing database
      accounts must be reconciled during Phase 8 before go-live.
- [x] Confirm whether customers need to log in themselves.
- [x] If customers do not log in, remove or disable customer login, customer
      passwords, public tracking, customer feedback, and customer payment
      endpoints.
- [x] Disable staff registration and staff-management features unless employees
      will actually receive individual accounts.
- [x] Confirm whether live Razorpay payments are required. Not required for the
      initial pilot; owner-entered payment records remain available.
- [x] Confirm whether WhatsApp messaging is required. Not required for the
      initial pilot.
- [x] Keep Chromium-based local WhatsApp automation disabled in production.
- [x] Use Meta WhatsApp Cloud API if WhatsApp is required. Not applicable while
      WhatsApp remains disabled.
- [x] List the customer fields the business genuinely needs.
- [x] Remove unnecessary sensitive fields and document retention/deletion rules
      in `PRODUCTION_DATA_SCOPE.md`.

## 2. Sanitize and protect the repository

- [x] Review and commit the existing security changes intentionally.
- [x] Confirm `.env`, `.runtime`, `data`, `.wwebjs_auth`, dumps, backups, logs,
      `node_modules`, and `dist` are ignored.
- [x] Make a protected repository backup before rewriting history.
- [x] Purge `backend/.wwebjs_auth` and `data/db` from the complete Git history.
- [x] Inspect the rewritten history before replacing the remote history.
- [x] Coordinate the force-push and require every old clone to be deleted or
      freshly cloned. Remote `main` was replaced on 2026-08-14; the user
      confirmed on 2026-08-16 that no old clones remain.
- [x] Scan the complete history for secrets after the rewrite. The fresh-clone
      credential-pattern scan found no credential values; legacy development
      seed passwords were removed during Phase 3.
- [x] Return the GitHub repository to private before production. GitHub CLI
      verified `visibility: PRIVATE` on 2026-08-16.
- [x] Enable branch protection for `main`. GitHub's branch API reported
      `protected: true` on 2026-08-16, and PR #1 reported `REVIEW_REQUIRED`
      with merging blocked.
- [x] Enable MFA for both GitHub accounts. MFA for `Nikhil270703` and
      `Developerr86` was confirmed by the user on 2026-08-16.
- [x] Do not allow automatic production deployments from untrusted branches.
      No deployment integrations or GitHub Actions workflows exist yet; the
      Render and Cloudflare setup tasks below restrict production to `main`.

History rewriting and force-pushing are destructive coordination operations.
They require explicit authorization immediately before execution.

Phase 2 rewrite record: the inspected clean root commit was force-pushed to
`main` as `8235e2ab525b0f57eff0a2f6b4496673f2b138e5`. An independent fresh clone
contained one root commit, no forbidden historical paths, and no matches for
the credential-value patterns used in the scan. On 2026-08-14, local GitHub CLI
access was restored for `Developerr86` with Write permission. The repository
was then made temporarily public, which gave the connected GitHub reader
read-only access. GitHub's branch API confirmed protection for `main` on
2026-08-16, and PR #1 confirmed that a review is required before merging. MFA
for both GitHub accounts was user-confirmed because GitHub does not expose
another personal account's MFA state to this collaborator. GitHub CLI then
verified private visibility, and the user confirmed that no old clones remain.
Phase 2 was completed on 2026-08-16.

## 3. Rotate credentials

- [ ] Generate a new JWT secret with at least 64 random characters. Run
      `cd backend && npm run secret:generate` only when it can be stored
      directly in the password manager and Render; never record it here.
- [ ] Rotate MongoDB, Razorpay, Meta/WhatsApp, SMTP/SMS, and gateway credentials
      that may ever have existed in source control or imported data. The
      owner-only procedure is documented in `PRODUCTION_CREDENTIAL_ROTATION.md`.
- [ ] Revoke and re-pair any WhatsApp browser session that was committed.
- [x] Replace all development administrator/staff/customer passwords. Obsolete
      credential-bearing seed/reset scripts were removed, and the tracked code
      scan found no remaining hardcoded password or credential fallback
      literals.
- [ ] Give the owner a unique password of at least 16 characters. The backend
      now enforces 16 characters for owner password changes and auto-seeding;
      the production account still needs its owner-chosen value.
- [ ] Store credentials in a password manager and platform secret stores.
- [ ] Enable MFA on GitHub, Cloudflare, Render, Atlas, Razorpay, and Meta.
- [ ] Never reuse the application password for an infrastructure account.

## 4. Prepare the frontend

- [ ] Change Axios to use `import.meta.env.VITE_API_BASE_URL` rather than a
      production-relative `/api` URL.
- [ ] Keep the local Vite proxy for local development only.
- [ ] Ensure no secret is placed in a `VITE_*` variable; these values are public.
- [ ] Remove unused gateway/tenant headers and code for standalone deployment.
- [ ] Keep authentication tokens out of persistent local storage.
- [ ] Clear authentication state after `401` responses and on logout.
- [ ] Add a friendly Render cold-start state and retry path.
- [ ] Avoid interpreting a cold-start timeout as an incorrect password.
- [ ] Confirm production source maps are not exposed unintentionally.
- [ ] Run `npm ci`, `npm audit --audit-level=high`, and `npm run build`.

## 5. Prepare the backend

- [ ] Listen on `0.0.0.0` and Render's injected `PORT` in production.
- [ ] Add graceful `SIGTERM`/`SIGINT` handling for HTTP and MongoDB shutdown.
- [ ] Keep `/health` minimal and add a database-aware readiness check.
- [ ] Keep Helmet, strict CORS, generic production errors, request limits,
      ObjectId validation, dangerous MongoDB key rejection, and rate limiting.
- [ ] Validate every inventory, billing, order, payment, and settings field.
- [ ] Add maximum lengths to customer names, addresses, notes, and searches.
- [ ] Ensure passwords, hashes, provider secrets, and authorization headers are
      never included in responses, exports, or logs.
- [ ] Add request IDs and redact customer-sensitive fields from logs.
- [ ] Run syntax checks and `npm audit --omit=dev --audit-level=high`.

## 6. Handle scheduled jobs safely

- [ ] Remove the SQLite backup cron from the Render web process.
- [ ] Never rely on Render Free's filesystem for backups or application data.
- [ ] Identify recurring-order and reminder jobs that are truly required.
- [ ] Disable nonessential jobs for the initial release.
- [ ] Prefer an owner-triggered manual action for low-frequency jobs initially.
- [ ] If external scheduling is introduced, make every job idempotent.
- [ ] Persist last-run, result, and error state in MongoDB.
- [ ] Display the last successful run to the owner.

Render Free sleeps after 15 minutes without inbound traffic. Scheduled code does
not run while the service is asleep, and missed executions are not replayed.

## 7. Create MongoDB Atlas M0

- [ ] Create a dedicated production Atlas project and enable account MFA.
- [ ] Create one M0 Free cluster near Render, preferably Singapore.
- [ ] Use a production-specific database name.
- [ ] Enable termination protection if available.
- [ ] Create a dedicated application database user with access only to the
      application database.
- [ ] Generate a long random database password and store it only in Render.
- [ ] Allow only Render's documented outbound ranges where possible.
- [ ] Avoid `0.0.0.0/0`; if temporarily unavoidable, document it and retain
      strong TLS, SCRAM credentials, least privilege, and monitoring.
- [ ] Configure available storage and connection alerts.
- [ ] Confirm the application cannot access unrelated databases.

## 8. Validate and migrate data

- [ ] Identify the authoritative local database; do not assume the currently
      connected development database is authoritative.
- [ ] Record collection and document counts by business entity.
- [ ] Remove demo data, duplicate records, and unused development accounts.
- [ ] Check for plaintext credentials or provider tokens in documents.
- [ ] Record inventory totals, outstanding balances, bills, and payments.
- [ ] Produce an encrypted logical `mongodump`; do not copy `data/db` files.
- [ ] Restore with current MongoDB Database Tools and `mongorestore`.
- [ ] Do not restore database users or roles.
- [ ] Compare all source/destination counts and financial/inventory totals.
- [ ] Confirm indexes and uniqueness constraints were created.
- [ ] Manually inspect at least ten representative records.
- [ ] Retain the old database offline and encrypted during verification.

## 9. Establish external encrypted backups

This section is a launch blocker because Atlas M0 has no managed cloud backup.

- [ ] Install current MongoDB Database Tools on a trusted administrator device.
- [ ] Create a separate least-privilege Atlas backup user.
- [ ] Produce a compressed single-file archive with `mongodump`.
- [ ] Encrypt the archive before it leaves the trusted device.
- [ ] Keep the encryption key in a password manager, separate from the archive.
- [ ] Schedule daily backups when data changes daily; otherwise at least weekly.
- [ ] Retain multiple generations (suggested: 7 daily, 4 weekly, 3 monthly).
- [ ] Keep at least one encrypted copy away from the pharmacy computer.
- [ ] A cloud-drive folder is acceptable only after local encryption.
- [ ] Record and alert on backup failure.
- [ ] Restore a backup into an isolated temporary database.
- [ ] Document recovery and repeat the restore test at least quarterly.

A backup is not verified until it has been restored successfully.

## 10. Configure Render Free

- [ ] Connect the private repository and create a Web Service.
- [ ] Set the production branch to `main`; do not enable production deploys
      from feature branches or pull-request previews.
- [ ] Root directory: `backend`.
- [ ] Runtime: Node.js; region: Singapore where available.
- [ ] Build command: `npm ci --omit=dev`.
- [ ] Start command: `npm start`.
- [ ] Health-check path: `/health`.
- [ ] Configure secrets only in Render's environment settings.
- [ ] Set at minimum:

```env
NODE_ENV=production
HOST=0.0.0.0
MONGO_URI=<atlas-connection-string>
JWT_SECRET=<new-random-secret>
JWT_ISSUER=tammewar-pharmacy
JWT_AUDIENCE=tammewar-pharmacy-api
JWT_EXPIRES_IN=2h
CUSTOMER_JWT_EXPIRES_IN=2h
CORS_ORIGINS=https://<project>.pages.dev
AUTO_SEED=false
PAYMENTS_ALLOW_MOCK=false
ONLINE_RESTORE_ENABLED=false
INTERNAL_AUTH_ENABLED=false
WHATSAPP_ENABLED=false
```

- [ ] Add Razorpay/Meta variables only when those live integrations are enabled.
- [ ] Confirm secrets do not appear in build or runtime logs.
- [ ] Test rollback and document the expected cold start of up to about a minute.

## 11. Configure Cloudflare Pages

- [ ] Enable Cloudflare account MFA.
- [ ] Create a Pages project from the private repository.
- [ ] Set the production branch to `main` and keep preview deployments
      isolated from production secrets and data.
- [ ] Root directory: `frontend`.
- [ ] Build command: `npm run build`.
- [ ] Output directory: `dist`.
- [ ] Configure the public frontend value:

```env
VITE_API_BASE_URL=https://<render-service>.onrender.com/result-analysis
```

- [ ] Confirm no backend secret is present in Cloudflare variables or built JS.
- [ ] Deploy the production branch and test the `pages.dev` URL.
- [ ] Add a custom domain if available and enforce HTTPS.
- [ ] Prevent search indexing for this private operational application.
- [ ] Review preview deployment access.
- [ ] Never connect preview deployments to production customer data; use a
      separate staging API/database or disable previews.

## 12. Lock down CORS and domains

- [ ] After obtaining the final Pages URL, configure that exact origin in
      Render's `CORS_ORIGINS`.
- [ ] Add the exact custom-domain origin if one is used.
- [ ] Remove localhost origins from production.
- [ ] Do not use `*`, wildcard `pages.dev`, or caller-provided permission headers.
- [ ] Verify unapproved browser origins receive no CORS permission.
- [ ] Verify direct API requests still require valid authentication.

## 13. Secure the owner account

- [ ] Create the owner through a controlled one-time setup and then leave
      `AUTO_SEED=false`.
- [ ] Require current-password confirmation for password changes.
- [ ] Invalidate or expire old sessions after credential rotation.
- [ ] Add application TOTP MFA if practical.
- [ ] Consider Cloudflare Access as an additional identity gate while retaining
      the application's own authentication.
- [ ] Record successful and failed administrator login attempts without logging
      passwords or full tokens.
- [ ] Establish a password-reset procedure that verifies the owner's identity.

## 14. Security regression testing

- [ ] Unauthenticated, forged-tenant, query-token, invalid-JWT, and expired-JWT
      requests return `401`.
- [ ] Public registration is blocked and failed logins trigger `429`.
- [ ] Only the owner can access customers, settings, exports, bulk actions, and
      destructive operations.
- [ ] Online restore remains disabled.
- [ ] Passwords and WhatsApp tokens never appear in responses or backups.
- [ ] MongoDB operator payloads and malformed IDs return `400`.
- [ ] Oversized bodies, invalid quantities/prices, and excessive strings fail.
- [ ] Rendered notes and customer values cannot execute HTML/script.
- [ ] HTTPS and security headers are present.
- [ ] CORS allows only the production frontend.
- [ ] No secret is present in frontend assets, Git history, or logs.
- [ ] Atlas rejects invalid credentials and unrelated database access.
- [ ] The backend and UI recover cleanly from a Render cold start.

## 15. Business workflow testing

- [ ] Owner login, password change, logout, and session expiry.
- [ ] Create/update customers and vendors.
- [ ] Create/update products; stock in, issue, low-stock, and expiry behavior.
- [ ] Create quotation; convert to order/invoice; generate bill PDF.
- [ ] Record payment and verify outstanding balance/customer ledger.
- [ ] Verify sales, stock, delivery, and outstanding reports.
- [ ] Test backup export and an isolated restore.
- [ ] Test the owner's intended desktop/mobile/tablet device.
- [ ] Test the first request after at least 15 minutes of inactivity.

## 16. Monitoring and operating procedures

- [ ] Enable Render, Cloudflare, and Atlas failure/security notifications.
- [ ] Add a low-frequency external uptime check to `/health`; do not use it to
      defeat Render's intended sleep behavior.
- [ ] Review failed login and application error events.
- [ ] Review Atlas network/users and infrastructure membership monthly.
- [ ] Run dependency audits and production builds before every release.
- [ ] Apply security updates regularly.
- [ ] Test backup recovery quarterly.
- [ ] Document password/JWT/database rotation, backup restoration, deployment
      rollback, emergency shutdown, and customer data export/deletion.

## Final go/no-go gate

- [ ] Git history is sanitized and all potentially exposed credentials rotated.
- [ ] Only the intended named owner account exists.
- [ ] Unused customer/staff authentication surfaces are disabled.
- [ ] Cloudflare Pages uses the correct production Render API.
- [ ] Render permits only the exact Cloudflare production origin.
- [ ] Atlas uses least-privilege credentials and a constrained network allowlist.
- [ ] The authoritative database was identified and migrated correctly.
- [ ] Customer, inventory, balance, bill, and payment totals match.
- [ ] A recent encrypted external backup exists and was restored successfully.
- [ ] Critical authorization/security regression tests pass.
- [ ] Complete business workflows pass on the deployed environment.
- [ ] No secrets appear in frontend assets, the repository, exports, or logs.
- [ ] The owner understands cold starts, backups, password hygiene, and incident
      reporting.

## Release commands

```powershell
cd backend
npm ci
npm audit --omit=dev --audit-level=high

cd ..\frontend
npm ci
npm audit --audit-level=high
npm run build
```
