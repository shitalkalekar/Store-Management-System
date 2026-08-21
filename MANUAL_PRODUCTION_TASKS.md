# Manual Production Tasks

This file contains account-owner and platform-console work intentionally
deferred while the implementation phases continue. None of these items blocks
local development. Complete each item by the stated deadline; never paste a
secret, password, recovery code, or connection string into this repository.

## Before connecting production infrastructure

- [ ] **M-01 — Production JWT secret:** When configuring Render, run
      `cd backend && npm run secret:generate`, then store the result directly
      in the password manager and Render as `JWT_SECRET`.
- [ ] **M-02 — MongoDB credentials:** Create or rotate the dedicated Atlas
      application user before Render connects to the production database.
- [ ] **M-03 — Infrastructure MFA:** Enable MFA on Cloudflare, Render, and
      Atlas before production secrets or customer data are added.
- [ ] **M-04 — Trusted deployment branches:** In Render and Cloudflare, set
      `main` as the only production branch. Do not expose production secrets or
      customer data to pull-request/preview deployments.

## Before migrating data or going live

- [ ] **M-05 — Owner password:** Give the named pharmacy owner a unique
      password of at least 16 characters and store it in the password manager.
- [ ] **M-06 — Revoke legacy integrations:** Log out/revoke the committed
      WhatsApp browser session. Keep WhatsApp disabled; do not re-pair it for
      the pilot.
- [ ] **M-07 — Retired provider credentials:** Revoke or rotate any historical
      Razorpay, Meta/WhatsApp, SMTP, SMS, or gateway credentials. If an account
      or credential never existed, record the item as not applicable.
- [ ] **M-08 — Credential separation:** Confirm the application owner password,
      GitHub password, infrastructure passwords, database password, and JWT
      secret are all distinct.

## Phase 7 — reported complete on 2026-08-21

The user reported the Atlas console work complete. The agent cannot read
another account's Atlas console, so M-10 through M-13 are recorded as
user-confirmed rather than independently verified. M-14 is the one item that
produces repository-side evidence — run it and keep the output.

- [x] **M-10 — Atlas ownership and MFA:** In the production Atlas organization,
      configure two MFA methods for each administrator and enable the
      organization-wide Require MFA control.
- [x] **M-11 — Dedicated Free cluster:** Create project
      `tammewar-pharmacy-production` and Free/M0 cluster
      `tammewar-pharmacy-prod`, preferably AWS Singapore, with no sample data
      and termination protection enabled when available.
- [x] **M-12 — Least-privilege application user:** Create `tammewar_app` with
      only `readWrite` on `tammewar_pharmacy_prod`, restricted to the production
      cluster where available. Store its generated password only in the team
      password manager and later in Render.
- [x] **M-13 — Network and alerts:** Temporarily allowlist only the trusted
      migration device, never `0.0.0.0/0`; configure available Logical Size,
      Connections, and administrative-change notifications. Add Render's full
      service-specific outbound CIDR list during Phase 10.
- [x] **M-14 — Access verification:** Inject the Atlas URI from the password
      manager and run `cd backend && npm.cmd run atlas:verify`. Retain the
      non-secret success output in the private operations record. Re-run this
      after Phase 10 adds Render's outbound ranges, and after any change to the
      application user's roles.

## Confirmed controls

- [x] GitHub MFA is enabled for `Nikhil270703` and `Developerr86`.
- [x] GitHub `main` is protected and requires review.
- [x] The GitHub repository is private.
- [x] Old pre-rewrite repository clones have been removed.

## Phase 9 — encrypted backups (launch blocker)

Tooling and procedure are implemented in the repository; these are the
device-side and account-side actions. See `BACKUP_RUNBOOK.md`.

- [ ] **M-15 — MongoDB Database Tools:** Install the current tools on the
      trusted administrator device so `mongodump` and `mongorestore` are on
      `PATH`. The versions bundled with older MongoDB server installs are not
      supported against current Atlas.
- [ ] **M-16 — Backup user and passphrase:** Create Atlas user
      `tammewar_backup` with built-in `read` on `tammewar_pharmacy_prod` only —
      not the application user. Generate an archive passphrase of at least 20
      characters and store it in the password manager as an entry separate from
      the database password.
- [ ] **M-17 — Schedule and off-site copy:** Schedule `npm run backup:create`
      daily on the administrator device (Task Scheduler or `cron`), never in
      the Render web process. Keep at least one encrypted copy away from the
      pharmacy computer.
- [ ] **M-18 — First restore drill:** Run `npm run backup:restore-verify`
      against an isolated verification database, compare counts and business
      totals with production, inspect ten representative records, then drop the
      verification database and record the date. **A backup that has not been
      restored is not a verified backup, and this gate blocks go-live.**

## Phases 10-13 — hosting and owner account

See `HOSTING_RUNBOOK.md` and `OWNER_ACCOUNT_RUNBOOK.md`.

- [ ] **M-19 — Render service:** Create the Web Service from `render.yaml`,
      enter the four secret variables, disable PR previews, confirm no secret
      appears in build or runtime logs, and test a rollback.
- [ ] **M-20 — Cloudflare Pages project:** Create the project, set
      `VITE_API_BASE_URL` to the Render API, disable or isolate previews, and
      confirm the generated CSP, HSTS, and `X-Robots-Tag` headers are served.
- [ ] **M-21 — Final CORS origin:** Set Render's `CORS_ORIGINS` to the exact
      Pages origin (and custom domain, if used), then verify over the wire that
      a lookalike origin receives no CORS permission and that a direct API
      request still requires a token.
- [ ] **M-22 — Create the owner account:** Run `npm run owner:create` against
      production once, store the password in the password manager, and confirm
      exactly one account exists.
- [ ] **M-23 — Cloudflare Access:** Put an Access policy in front of the Pages
      hostname, scoped to the owner's email. This is the chosen second factor;
      in-app TOTP was decided against on 2026-08-21.
- [ ] **M-24 — Deployed security checks:** Against the deployed environment,
      confirm rendered notes cannot execute script, `npm run atlas:verify`
      passes from the allowlisted device, and the backend and UI recover
      cleanly from a cold start.

## After the initial release

- [ ] **M-09 — Scheduling review:** After observing real usage, decide whether
      recurring-order processing needs an external scheduler. Keep the current
      owner-triggered workflow if it is sufficient. Any future scheduler must
      call an authenticated, idempotent job entry point and must not run inside
      the Render web process.
