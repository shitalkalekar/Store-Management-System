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

## Phase 7 — required before migration

- [ ] **M-10 — Atlas ownership and MFA:** In the production Atlas organization,
      configure two MFA methods for each administrator and enable the
      organization-wide Require MFA control.
- [ ] **M-11 — Dedicated Free cluster:** Create project
      `tammewar-pharmacy-production` and Free/M0 cluster
      `tammewar-pharmacy-prod`, preferably AWS Singapore, with no sample data
      and termination protection enabled when available.
- [ ] **M-12 — Least-privilege application user:** Create `tammewar_app` with
      only `readWrite` on `tammewar_pharmacy_prod`, restricted to the production
      cluster where available. Store its generated password only in the team
      password manager and later in Render.
- [ ] **M-13 — Network and alerts:** Temporarily allowlist only the trusted
      migration device, never `0.0.0.0/0`; configure available Logical Size,
      Connections, and administrative-change notifications. Add Render's full
      service-specific outbound CIDR list during Phase 10.
- [ ] **M-14 — Access verification:** Inject the Atlas URI from the password
      manager and run `cd backend && npm.cmd run atlas:verify`. Retain the
      non-secret success output in the private operations record.

## Confirmed controls

- [x] GitHub MFA is enabled for `Nikhil270703` and `Developerr86`.
- [x] GitHub `main` is protected and requires review.
- [x] The GitHub repository is private.
- [x] Old pre-rewrite repository clones have been removed.

## After the initial release

- [ ] **M-09 — Scheduling review:** After observing real usage, decide whether
      recurring-order processing needs an external scheduler. Keep the current
      owner-triggered workflow if it is sufficient. Any future scheduler must
      call an authenticated, idempotent job entry point and must not run inside
      the Render web process.
