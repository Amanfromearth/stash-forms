# Global investing research forms

Next.js survey with versioned questionnaires, partial saves, an admin dashboard, and CSV exports.

## Run locally

Install dependencies with `bun install`, copy `.env.example` to `.env.local`, and configure the database and admin secrets. Apply migrations with `bun run db:migrate`, then start the app with `bun dev`.

## Form versions

The migration in `drizzle/0003_clean_raza.sql` first copies the existing live `form_config` into **v1** (falling back to the original questionnaire for a fresh database). It labels all existing submissions, including partial saves, as v1 without changing their answers or timestamps. The legacy config table remains intact. The migration then adds the global questionnaire as **v2**.

- `/` serves the current questionnaire with no public version badge or version parameter. Old links containing `?version=` redirect to the same URL without that parameter.
- Version numbers are internal records for preserving question sets, responses, and historical analytics. Admin views retain their version selector.
- Every new submission and partial save records the version that was loaded when the respondent started. Sessions cannot overwrite responses from another version.
- Admin and settings have a version selector. Charts, filters, response details, and CSV exports use the selected version's saved questions and options.
- **Publish New Version** in settings inserts a new snapshot (v3, v4, etc.) and makes it the latest form. It preserves earlier versions and their responses.

Use `bun run db:migrate` for deployment, rather than `db:push`: the migration includes the data snapshots and existing-response version assignment. The missing initial migration referenced by the original journal is restored so the complete migration chain also works on fresh databases.

## Country preselection and flags

Country detection starts in the background when the app opens, including on the welcome screen. A first-party server action reads the visitor IP from the hosting proxy headers and calls `https://api.country.is/{ip}` on the server, with a 1.5-second timeout. The browser does not call country.is. The hero does not wait for the lookup, and a detection result never replaces a country the respondent has selected manually.

The host must forward the visitor IP using `cf-connecting-ip`, `x-vercel-forwarded-for`, `x-forwarded-for`, or `x-real-ip`. Local, private, missing, invalid, and failed lookups leave manual country selection available. Only the detected country name returns to the browser; raw visitor IPs are not stored by this feature.

All 249 flags are served locally from `public/flags`. See its README for Nucleo and supplementary territory sources.

## Returning respondents

Unfinished answers and the current question are saved on the respondent's device
on every edit, separately from the debounced server autosave. Reloads and a later
visit in the same browser can resume a draft for up to 30 days. Each draft keeps
its original published question snapshot and form version even after a newer
questionnaire is published. Temporary resume failures fall back to the local
draft, and unavailable browser storage never blocks filling out the form.

Each tab owns its active draft using a browser lock so another tab cannot
overwrite its answers. On browsers without Web Locks, same-tab reload recovery
still works; drafts in other tabs are left alone. Server-issued sessions expire
for writes after 24 hours but can refresh securely for 30 days without changing
the response ID or version. Keep `SESSION_SECRET` stable across deployments.

A successful submission replaces the local answers with a completion receipt.
Returning respondents see the original thank-you screen and GIF. Only choosing
**Submit another response** creates a new response identity. Duplicate submission
retries never create another response or change its recorded time. Clearing
browser data removes local recovery; it does not delete previously saved server
responses or historical analytics.

## Checks

Security limits use a separate `security_rate_limits` table added by migration
`0004_security_rate_limits.sql`. Apply `bun run db:migrate` before starting the
updated app. This migration creates only the security table and its index; it
does not change submissions, question snapshots, or analytics.

Login permits 5 attempts per 15 minutes per trusted visitor IP, using a signed
browser identity when that IP is unavailable. Survey limits allow 120 partial
saves and 10 submission attempts per minute **per signed survey session**, with
separate allowances for saves and completion. New responses have a limit of 30
per hour per signed browser identity, plus a generous 1,000 per hour network
ceiling when a trusted IP is available. People sharing Wi-Fi, a mobile carrier,
or a VPN do not pool their autosave or completion quotas. Existing partial
responses can still finish when the browser or network new-response quota is
exhausted. Retrying an identical completed submission returns success without
changing its answers, timestamps, or analytics. Limits persist across instances
and restarts. Expired
counters are removed in bounded batches. If security storage is unavailable,
login and writes fail closed instead of allowing unlimited requests.

On Vercel the hosting-provided `x-real-ip` is used automatically. On another host,
set `TRUSTED_PROXY_IP_HEADER` to a single-IP header your proxy **overwrites** and
prevent requests from bypassing that proxy. Without a trusted IP, unrelated
browsers remain independent and no shared global fallback bucket is used.
Arbitrary forwarded IP headers are never trusted. Signed browser cookies contain
random IDs, and security counters store salted hashes rather than raw addresses.

Admin pages, settings updates, and CSV exports check the session themselves in
addition to proxy protection. CSV export neutralizes spreadsheet formulas without
changing the stored answers or historical charts.

- `bun test`: questionnaire preservation, answer validation, version handling, security migration preservation, concurrent rate limits, and CSV escaping.
- `bun run test:security`: isolated PostgreSQL fixtures exercise the actual login, submission, authorization, analytics, and export handlers, including 60 respondents sharing an IP, missing trusted IPs, save quota exhaustion, and concurrent submission retries. It never connects to the configured live database.
- `bun run typecheck`
- `bun run lint`
- `bun run build` (requires access to Google Fonts for the existing font setup).
