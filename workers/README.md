# Backend foundation

The frontend remains the TanStack Start app in `src/`. The API boundary is a separate Cloudflare Worker in `workers/api` so scraping and AI jobs can later move to Queues/Workflows without coupling them to page rendering.

## First local setup

1. Apply `supabase/migrations/20260808000000_initial_leadgen.sql` to the Supabase project.
2. Copy `workers/api/.dev.vars.example` to `workers/api/.dev.vars` and fill in the Supabase URL and anon key. Never put a service-role key in browser code.
3. From `workers/api`, run `npx wrangler dev` once Wrangler is installed.

The Worker currently exposes `GET /health`, `GET /api/campaigns`, and `POST /api/campaigns`. The latter two forward the user's Supabase access token so RLS remains the authorization boundary. Lead discovery/verification workers will be added after auth and the project connection are configured.
