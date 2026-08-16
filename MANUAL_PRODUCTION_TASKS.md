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
