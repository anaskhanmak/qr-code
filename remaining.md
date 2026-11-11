# Loopmark: Remaining Work

This document tracks the product and engineering work that remains before Loopmark meets the original production-ready QR SaaS brief. It is a roadmap, not a claim that the listed integrations or features already exist.

## Current state

### Implemented foundation

- Next.js App Router application with TypeScript and Tailwind CSS.
- PostgreSQL data model and Prisma migrations.
- Email/password account registration, email verification, password reset, and Google sign-in foundations.
- Static QR generation without an account for URL, text, email, SMS, phone, Wi-Fi, vCard, and location, with PNG/SVG downloads.
- Dynamic QR builder for URL redirects, business cards, hosted PDF links, and multiple-link pages.
- Workspace-scoped QR creation and editing; editing preserves a code's slug.
- Hosted business-card, PDF-link, and multiple-link pages; business cards have a vCard download route.
- Cloudflare Worker short-link resolver with KV caching, app resolver fallback, and cache invalidation.
- Web and Worker unit tests, typechecks, and lint checks.

### Important limitations of the current foundation

- Dynamic PDF codes accept an already hosted HTTPS URL. There is no file upload, object storage, signed upload, or WebP conversion pipeline.
- The redirect cache is Cloudflare KV, not the originally requested Upstash Redis. KV is eventually consistent and is not a substitute for an analytics event queue or rate limiter.
- The Worker namespace ID in [`apps/redirect/wrangler.toml`](./apps/redirect/wrangler.toml) is a local placeholder. Production Worker and app deployment have not been performed.
- Scan resolution and redirects exist, but scans are not recorded in an analytics pipeline. Dashboard scan totals, breakdowns, exports, and reports are not implemented.
- The dynamic QR editor does not yet include the design studio, file manager, status controls, scheduling, scan limits, custom domains, or most advanced options.
- The current dashboard is a basic list, not the full QR management, billing, team, or analytics dashboard.
- The marketing shell and generator pages are only a foundation. The full marketing, CMS, SEO, and performance scope remains.
- A local migration being up to date does not constitute a production database migration, backup policy, or deployment.

## Remaining product work

### 1. Design studio and export

- Integrate `qr-code-styling` for a configurable client-side preview and maintain a compatible server-side renderer for export.
- Implement the requested dot patterns, corner frames and balls, independent eye color, solid/gradient foreground, background/transparent output, and centered logo controls.
- Add logo sizing, margin and knockout options; raise error correction when a logo is used.
- Add scannability checks for contrast and logo coverage, with clear warnings before download.
- Add decorative frames with editable CTA text, font, and color.
- Save reusable designs and workspace brand kits.
- Export PNG at configurable resolutions up to 4000 px, SVG, PDF, and EPS; support bulk ZIP export.
- Test export rendering, dimensions, transparency, QR readability, and error cases.

### 2. Scan analytics and event pipeline

- Record scan events asynchronously so redirect latency is not coupled to analytics storage.
- Persist timestamp, a keyed/hash-derived IP identifier (never the raw IP), country/city where available, device, OS, browser, language, referrer, and unique/total classification.
- Select and operate a durable queue and event store; define retries, idempotency, retention, and dead-letter handling.
- Filter bots, crawlers, and link-preview fetches from human scan totals while documenting the classification behavior.
- Add visitor-cookie or privacy-aware fingerprint logic for unique-scan estimates and define consent/retention rules.
- Add per-QR and workspace analytics: time series, unique vs total, country/city, device/OS/browser, peak-hours heatmap, and date ranges.
- Add CSV/PDF exports and scheduled email reports.
- Add configurable retention and deletion jobs. Keep analytics data out of the redirect critical path.
- Measure redirect latency (including cache misses) and establish uptime/latency alerts against the requested p95 target.

### 3. Plans, payments, and usage enforcement

- Select and integrate a payment provider (Stripe, Paddle, or an appropriate local provider); the choice remains open.
- Store plan definitions, prices, currencies, entitlements, and limits in configuration or the database rather than hard-coding them in UI or actions.
- Implement Free, Starter, Pro, Business, and Enterprise plan definitions, including dynamic-code quotas and the specified feature differences.
- Implement monthly/yearly pricing, supported currencies (PKR, USD, AED, GBP, CAD), and geo-based default currency selection.
- Carry the selected plan through pricing, checkout, subscription creation, and return URLs.
- Implement trials, conversion, webhook signature verification, idempotent event processing, failed-payment grace periods, and billing portal/invoices.
- Enforce entitlements on the server for QR creation, seats, custom domains, API, bulk operations, white-labeling, and analytics retention.
- On downgrade, pause excess dynamic codes instead of deleting them; define and test which codes remain active.
- Add usage meters and clear quota/upgrade states.

### 4. Remaining dynamic QR types and builder capabilities

Add validated content schemas, accessible forms, previews, hosted mobile pages, and tests for each type:

- Product page, video, social media, image gallery, coupon, feedback, lead generation, custom block-based page, app store, survey, event, password-protected content, business page, and bio page.
- Business cards: add the contact-exchange lead form and inbox in addition to the existing vCard download.
- Lead forms and feedback/survey responses: persist submissions, associate them with the QR and workspace, add abuse controls, inbox views, and CSV export.
- App Store codes: implement safe iOS/Android detection and configurable store fallback.
- Events: generate and validate `.ics` downloads.
- Password-protected codes: hash secrets, throttle attempts, avoid leaking protected content, and provide recovery/edit behavior.
- Custom pages: define a constrained block schema, sanitize rendered content, and ensure editable previews match hosted output.

Expand the builder into the specified flow: basic info, appearance, content, images, social links, contact exchange, advanced options, naming, design, and save. Add scheduling, scan limits, expiry, custom slugs, password protection, UTM passthrough, and a GDPR banner with server-side validation and clear interactions with redirects and hosted pages.

### 5. Dashboard, workspaces, and integrations

- Build QR list/grid views with All/Dynamic/Static/Favourites tabs, search, filters, folders, status, date, and pagination.
- Add thumbnails and code actions for edit, download, duplicate, favourite, pause/resume, delete, and folder moves.
- Add bulk selection and bulk delete/move/download/pause.
- Add static QR persistence only if the product intends account-managed static codes; preserve the no-account static generator.
- Add CSV-driven bulk QR creation with validation, preview, useful row-level errors, and ZIP export.
- Add folders and persistent favorite/status controls.
- Implement team invitations, role-based access (Owner/Admin/Editor/Viewer), membership management, and audit history.
- Add custom-domain setup and verification, certificate/SSL lifecycle, ownership checks, and safe redirect-domain handling.
- Add API key creation, hashed key storage, rotation/revocation, scoped REST endpoints, rate limits, usage visibility, and OpenAPI documentation.
- Add signed webhook configuration, event delivery/retries, secret rotation, and delivery logs for scan and lead events.
- Add account settings, data export, account deletion, billing portal, invoices, and clear session/security controls.

### 6. Admin and CMS

- Add role-gated `/admin` access with server-side authorization on every action and route.
- Add user, workspace, subscription, plan, pricing, and coupon management.
- Add QR moderation, destination blocking, abuse reports, and an auditable moderation history.
- Add platform scan statistics with appropriate access controls and aggregation.
- Add CMS editing for testimonials, FAQs, stats, client logos, and blog content; do not publish fabricated testimonials as real customer endorsements.
- Add an admin change log and safeguards for destructive or high-impact operations.

### 7. Marketing site, SEO, and product content

- Complete the home page with original copy/assets, accurate product screenshots, functional QR-type tabs, design showcase, server-rendered real metrics, editable placeholder testimonials, product-specific FAQ, pricing, enterprise CTA, and footer.
- Complete `/free-qr-codes`, `/dynamic-qr-codes`, `/pricing`, `/about`, `/contact-enterprise`, `/privacy`, `/terms`, `/refund-policy`, and `/blog`.
- Persist enterprise inquiries and notify the sales inbox; add validation, spam controls, and clear success/error feedback.
- Implement MDX blog content and editorial metadata.
- Add per-page metadata, canonical URLs, Open Graph metadata/images via `next/og`, sitemap, robots rules, and JSON-LD for Organization, WebSite, SoftwareApplication, FAQPage, and pricing Product/Offer entities.
- Make WhatsApp/chat contact configurable and ensure the floating control is accessible and unobtrusive.
- Use only original, licensed, or appropriately generated branding, copy, images, testimonials, and screenshots.

### 8. Security, privacy, and compliance hardening

- Add Zod validation at every external/server boundary, including webhooks, APIs, forms, uploads, query parameters, and Worker-to-app resolver requests.
- Implement rate limits for authentication, generators, redirects, password gates, leads, and API routes. Select and deploy a shared rate-limit store; Cloudflare KV alone is not the planned Redis solution.
- Integrate Google Safe Browsing (or a vetted equivalent) on destination save and periodic rescan; define review/appeal behavior and avoid blocking benign sites based only on transient failures.
- Harden short-link redirect behavior against unsafe protocols, malformed URLs, open redirects, cache poisoning, and stale cache data.
- Verify Worker invalidation authorization, secret handling, replay/error behavior, and ensure secrets never enter client bundles or logs.
- Add CSRF protections where required by the framework and deployment, strict security headers/CSP, secure cookies, and production HTTPS enforcement.
- Add password-protected QR hashing, attempt throttling, and tests for brute-force resistance.
- Add cookie consent and a GA4 integration through Partytown only after consent and configuration. Ensure one tag loads once and is deferred.
- Implement user data export, account deletion, configurable retention, and documented data processing. Do not retain raw IP addresses.
- Review Pakistan PDPA/GDPR applicability with qualified counsel; technical controls alone do not establish legal compliance.
- Add dependency and secret scanning, security headers checks, abuse monitoring, and incident-response documentation.

### 9. Reliability, performance, and accessibility

- Establish production error monitoring (Sentry or equivalent), structured logs with sensitive-data redaction, uptime monitoring, and alert ownership.
- Define database backup schedules, retention, restore drills, and migration rollback/recovery procedures.
- Define operational limits for uploads, queues, webhook delivery, and large exports.
- Optimize all marketing routes for the mobile Lighthouse 90+ goal; measure actual deployed pages rather than relying on local build output.
- Keep home transfer under 1.5 MB: responsive AVIF/WebP images, no autoplay video, no GIFs, lazy-load non-critical content, and defer third-party scripts.
- Test responsive layouts down to 360 px and keyboard/screen-reader flows against WCAG 2.1 AA.
- Provide meaningful alt text, visible focus, labelled icon controls, accessible errors/status announcements, and keyboard navigation throughout the builder.
- Add production-like load tests for redirect cache hits/misses, analytics enqueueing, and high-volume QR listing/export.

### 10. Tests, CI, and production delivery

- Expand Vitest coverage for QR rendering, content validation, plan entitlements, slug resolution, cache invalidation, URL safety, analytics aggregation, and webhook idempotency.
- Add Playwright end-to-end coverage for sign-up/verification, create/edit dynamic QR, scan, view analytics, and upgrade; include static generation/download and mobile/keyboard flows.
- Run test suites against isolated databases and resettable fixtures; avoid depending on a developer's personal local database.
- Add GitHub Actions for lint, typecheck, unit tests, database migration checks, Worker validation, and Playwright E2E. Add preview deployment only after secrets/environments are configured.
- Add a safe production migration procedure and verify migration status before deployment.
- Configure Vercel (or chosen app host), production PostgreSQL (Neon/Supabase), Cloudflare Worker/KV, custom domains, email sender/domain authentication, OAuth callbacks, payment webhooks, analytics, and error monitoring.
- Create real Cloudflare KV namespace IDs and production Worker secrets; set Worker `APP_ORIGIN` and app `NEXT_PUBLIC_SHORT_URL` to the actual domains.
- Decide whether to retain Cloudflare KV or replace/augment it with Upstash Redis for redirect caching, counters, and rate limits. Document cache TTL, invalidation, consistency, and failure behavior.
- Run a production smoke test for sign-up, email verification, dynamic QR save/edit, redirects, hosted pages, cache invalidation, backups, and monitoring.
- Deploy only after security, privacy, restore, rollback, and operational checklists have owners and evidence.

## Suggested delivery sequence

This sequence retains the original phases while separating launch blockers from product expansion:

1. **Phase 3 — QR design studio and export:** complete renderer, designs, scannability, templates, and export formats.
2. **Phase 4 — Scan analytics:** add asynchronous logging, privacy-aware scan classification, dashboards, exports, retention, and monitoring.
3. **Phase 5 — Billing and plan limits:** implement provider/webhooks, plans, trials, usage enforcement, downgrade handling, and billing UI.
4. **Phase 6 — Remaining QR types:** add hosted content types, form-response inboxes, file storage, and advanced builder features.
5. **Phase 7 — Teams and integrations:** add collaboration, custom domains, API keys, REST/OpenAPI, webhooks, and bulk operations.
6. **Phase 8 — Admin:** add moderation, CMS, pricing controls, platform reporting, and admin auditability.
7. **Phase 9 — Marketing completion:** finish public pages, SEO/schema, consent-aware analytics, performance, and accessibility.
8. **Phase 10 — Launch hardening:** finish security/privacy review, CI/E2E, operations, backup/restore, monitoring, and production deployment.

Some work is cross-cutting: for example, uploads are needed by PDF and image-based QR types, while pricing and entitlement checks must be designed before exposing paid-only dashboard/API features. Order dependent implementation so the underlying capability is ready before the UI advertises it.

## Production launch checklist

- [ ] Choose and document the production short-link/cache architecture (Cloudflare KV, Upstash Redis, or a justified combination).
- [ ] Provision production app hosting, PostgreSQL, cache/queue, object storage, email, and domain/DNS.
- [ ] Replace the placeholder Cloudflare KV namespace ID and set the production Worker origin.
- [ ] Configure production secrets using the host's secret manager; never copy local `.env` values into source control.
- [ ] Configure OAuth redirect URIs, verified email sender, billing webhooks, custom-domain handling, and consent-aware analytics.
- [ ] Complete rate limiting, URL reputation checks, security headers, abuse/reporting, data export/deletion, and retention controls.
- [ ] Complete automated migration checks, E2E tests, backup/restore drills, and rollback procedures.
- [ ] Verify redirect behavior for active, unknown, paused, expired, scheduled, password-protected, and limited-scan codes.
- [ ] Verify cache invalidation after edits and document expected behavior when the invalidation service is unavailable.
- [ ] Verify alerts, error monitoring, redirect uptime, queue health, database health, and incident ownership.
- [ ] Measure Lighthouse, transfer size, accessibility, responsive layouts, and redirect p95 on production-like infrastructure.
- [ ] Publish accurate privacy, terms, refund, cookie, and support information before taking payments or collecting production analytics.

## Local development and validation

The current local setup and environment-variable names are documented in [`README.md`](./README.md) and [`.env.example`](./.env.example). Existing checks include:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run redirect:typecheck
npm run redirect:test
npx prisma migrate status --schema=packages/db/prisma/schema.prisma
```

These checks validate the implemented foundation; they do not prove that the unimplemented features in this roadmap are complete or that production infrastructure is configured.
