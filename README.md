# Loopmark

Loopmark is a QR-code platform for creating static codes and editable, trackable short links. Static codes encode their content directly, are available without an account, and do not expire. Dynamic codes use a Loopmark short link so their destination or hosted content can be updated without changing the printed QR code.

## Requirements

- Node.js 20.9 or later
- npm 10 or later
- PostgreSQL 15 or later

## Local setup

1. Copy `.env.example` to both `.env` (repository root, used by Prisma) and `apps/web/.env.local` (used by Next.js). Set `DATABASE_URL` and a long random `AUTH_SECRET` in both files.
2. Install dependencies with `npm install`.
3. Generate the Prisma client and apply database migrations: `npm run db:generate` then `npm run db:migrate`.
4. Start the app: `npm run dev`, then open `http://localhost:3000`.

After changing environment variables, restart the web server. Do not commit either local environment file.

Google sign-in requires OAuth client credentials with `http://localhost:3000/api/auth/callback/google` configured as an authorized redirect URI. Email verification and password reset emails use Resend; set `RESEND_API_KEY` and `EMAIL_FROM`. In development, when Resend is not configured, email links are written to the server console for local testing.

## Dynamic short links

The dynamic QR builder supports website redirects, hosted business cards (including a downloadable vCard), PDF links, multiple-link pages, social profiles, coupons, products, videos, image galleries, external links or captured lead forms, feedback pages, event pages with `.ics` downloads, and iOS/Android app-store routing. PNG/SVG exports support sizes through 4000 px and designs are stored with saved codes. A signed-in workspace member can create and edit dynamic codes; edits preserve the existing slug. The builder keeps an unfinished draft in browser storage so it can be resumed after signing in. Workspace owners/admins can invite verified-email teammates, manage member roles/removal, and issue scoped API keys. The versioned API currently supports listing and creating dynamic QR codes. Dashboard favorites, pause/resume, per-code analytics, and form-response inbox/export are also available. Scan recording currently uses deferred PostgreSQL writes, not a durable queue.

The optional Cloudflare Worker in `apps/redirect` resolves short links from KV cache and falls back to the app's database-backed resolver API. Set `NEXT_PUBLIC_SHORT_URL` to the public short-link origin and configure `REDIRECT_REVALIDATION_SECRET` identically in the app and Worker. Before deploying the Worker:

1. Create a Cloudflare KV namespace and replace the placeholder namespace ID in `apps/redirect/wrangler.toml`.
2. Set the Worker `APP_ORIGIN` to the deployed app URL.
3. Configure the matching `REDIRECT_REVALIDATION_SECRET` as a Worker secret and an app environment variable.
4. Deploy with `npm run redirect:deploy`.

Local Worker development uses `npm run redirect:dev`. Its local KV state is managed by Wrangler. The Worker uses Cloudflare KV rather than Redis; production KV provisioning and the production app/Worker deployment are not included in this repository setup.

PDF codes currently link to a publicly hosted HTTPS PDF; file uploads and storage are not implemented yet.

## Available checks

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run redirect:typecheck`
- `npm run redirect:test`
- `npx prisma migrate status --schema=packages/db/prisma/schema.prisma`

## Deployment readiness

The application has not been deployed. Before a production launch, configure the production database, `AUTH_SECRET`, `SCAN_HASH_SECRET`, HTTPS `NEXT_PUBLIC_APP_URL`, email provider/sender, OAuth credentials and callback URLs as applicable, and Cloudflare KV/Worker values if using the Worker. Set `ADMIN_EMAILS` to an explicit allowlist. Apply migrations with `npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma` only after verifying the target database and backup/recovery plan. Do not copy development secrets to production.

CI checks lint, typecheck, unit tests, Prisma migrations against an ephemeral PostgreSQL service, production build, and Worker checks. Production deployment, backups/restore, durable scan queue, monitoring, and external provider delivery still require configuration and operational verification.

The authenticated account export is available at `/api/account/export`. Configure `ANALYTICS_RETENTION_SECRET` and `ANALYTICS_RETENTION_DAYS` and schedule an authenticated `POST /api/cron/analytics-retention` to run retention cleanup; the endpoint is disabled until a secret is configured. The default retention is 365 days (allowed range: 30–3650 days).
