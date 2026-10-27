# My Food AI

My Food AI records meals from photos and captions. SAM 3.1 finds food regions, Muse Spark 1.3 names foods and estimates portions, and Muse Voice Transcribe 1.0 transcribes speech. Nutrition numbers come from USDA FoodData Central and describe what was consumed. The app uses Next.js, Supabase Auth, Postgres, private media storage and a background job queue.

## Start locally

Use a supported Node.js release with native `--env-file` support. Clone this repository with your Git client, then enter its directory:

```sh
cp .env.example .env.local
npm install
npm run check
npm run dev
```

Fill the variable names in `.env.local` before running the check. Use a Supabase project with this repository's migrations applied in numeric order and the private media bucket configured. The check prints only check names and pass/fail results, stops at the first missing required variable, and exits unsuccessfully if a service check fails. It checks connectivity and model availability; it does not apply migrations or prove all application flows. Open the local address printed by the development server. Keep `.env.local` private and uncommitted.

## Variables

Required for the setup check:

- `MODEL_API_KEY`: server credential for the Meta Model API.
- `FDC_API_KEY`: server credential for USDA FoodData Central.
- `VERCEL_TOKEN`: credential for deployment configuration tasks.
- `SUPABASE_DB_URL`: database connection string for migrations and database checks.
- `SUPABASE_ACCESS_TOKEN`: credential for project management tasks.
- `NEXT_PUBLIC_SUPABASE_URL`: public project API address.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: public client key; access remains constrained by row-level security.
- `SUPABASE_SECRET_KEY`: server-only privileged database API key.
- `APP_URL`: application base address used by route checks and queue continuation.

Additional names used by development scripts and optional features:

- `TEST_USER_EMAIL`: first ordinary test user's sign-in identifier.
- `TEST_USER_PASSWORD`: first test user's password.
- `TEST_USER2_EMAIL`: second ordinary test user's sign-in identifier.
- `TEST_USER2_PASSWORD`: second test user's password.
- `MODEL_API_BASE_URL`: optional model endpoint override for offline tests.
- `ADMIN_EMAIL`: optional identifier used when granting the admin role.
- `WORKER_CONCURRENCY`: optional worker parallelism; defaults to one.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: optional browser push subscription key.
- `VAPID_PRIVATE_KEY`: optional server-only push signing key.
- `VAPID_SUBJECT`: optional push sender contact identifier.

Only public-prefixed names are intended for browser exposure. Deployment environment variables are configured separately from `.env.local`.

## Repository map

- `.cursor/`: editor rules and workflows.
- `config/`: review tool configuration.
- `docs/`: build plan, contracts and verification records.
- `public/`: static files and application icons.
- `scripts/`: setup, maintenance, fixture and review commands.
- `skills/`: contributor workflows.
- `src/`: application routes, components, model integrations and worker.
- `supabase/`: database migrations.
- `tests/`: automated checks.
- `tools/`: external review support tools.

`node_modules/`, build output and local uploads are generated or private working files, not application source. Evaluation fixtures are added under `eval/` by the evaluation item.

## Licences

Application source: [MIT licence](LICENSE). Dependencies, font, data and hosted-model terms: [third-party notices](THIRD_PARTY.md).
