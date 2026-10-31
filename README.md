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
- `ADMIN_EMAIL`: optional operator convenience only; production authorization does not read it. Admin pages and trace access read `public.profiles.role`; grant that role privately after the account and profile exist.
- `WORKER_CONCURRENCY`: optional worker parallelism; defaults to one.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: optional browser push subscription key.
- `VAPID_PRIVATE_KEY`: optional server-only push signing key.
- `VAPID_SUBJECT`: optional push sender contact identifier.

Only public-prefixed names are intended for browser exposure. Deployment environment variables are configured separately from `.env.local`.

## Testing

`node --env-file=.env.local scripts/browser-session.mjs` prints the test session cookies as one JSON line for the browser driver.
Add `--user=2` to obtain the second test account’s session cookies.
Treat the output as a credential: consume it locally and keep it out of logs, issues and screenshots.

### Historical handover note (2026-10-29)

The following snapshot is retained as history; current deployment and merge state must be checked separately.

> Ordinary configured test-account production sign-in has been exercised successfully. PR #203 adds a cookie-only `scripts/browser-session.mjs`; that script is still unmerged into main. Its removed magic-link fallback is not a supported mode. Never publish session-cookie output.
>
> ## Run 3 delivery status
>
> Main contains the shared round2 tokens from #200. #202 merged into its existing `run3/tokens` base, not main; its plus-menu code is not released on main by that merge. Other Run3 features and their production acceptance remain pending. The current administrative record is in CLAUDE.md; neither an open feature branch nor a green preview build proves production acceptance.

## Repository map

- `.cursor/`: editor rules and workflows.
- `config/`: review tool configuration.
- `docs/`: build plan, contracts and verification records.
- `public/`: static files and application icons.
- `scripts/`: setup, maintenance, fixture and review commands.
- `skills/`: contributor workflows.
- `src/`: application routes, components, model integrations and worker.
- `supabase/`: database migrations.
- `tests/`: automated checks. The database and pipeline tests hold the worker lease and must not run during a demo.
- `tools/`: external review support tools.

`node_modules/`, build output and local uploads are generated or private working files, not application source. Evaluation fixtures are added under `eval/` by the evaluation item.

## Licences

Application source: [MIT licence](LICENSE). Dependencies, font, data and hosted-model terms: [third-party notices](THIRD_PARTY.md).

[Meal photo evaluation](docs/eval.md)

## Submission write-up

Implementation work began on October 26 for the November 4 submission. The pull-request implementation covers a private meal feed, camera and gallery capture, food outlines, editable item history, a correction thread, search and day views. Supporting changes add retry handling, current-item totals, stored nutrition cards, evaluation fixtures and a queue load runner. These changes are submitted for review; this write-up does not claim they are all merged or validated in production.

SAM 3.1 receives a meal photograph and finds food regions. Muse Spark 1.3 receives the photograph, caption and relevant correction context, then returns structured food names and portion estimates. Muse Voice Transcribe 1.0 receives recorded speech and returns text for the user to confirm before posting. Nutrition values come from USDA FoodData Central and are scaled to estimated portions; the models do not supply authoritative nutrient values.

The app records consumed food. It does not provide advice, goals or health claims, and it does not share meals between users. Portion amounts are estimates. The licensed evaluation set uses explicitly annotated food names and rough visual gram estimates, which are not measured nutritional ground truth.

Production evidence remains pending the merge phase: the [meal photo evaluation](docs/eval.md), [queue load test](docs/load-test.md), and two complete runs of the [production demo checklist](docs/demo.md). Device camera and notification behavior also require real-device verification. A pending result is not a passing result.

## Runtime AI and browser features

All runtime AI calls use the Meta Model API: SAM 3.1 (`sam-3.1`) segments food in photos; Muse Spark 1.3 (`muse-spark-1.3`) identifies foods and portions, interprets corrections and searches, checks repeat meals, and selects compatible food-database records with an explicit no-match result; Muse Voice Transcribe 1.0 (`muse-voice-transcribe-1.0`) transcribes recorded corrections. The OpenAI-compatible SDK is a client for Meta's endpoint, not a call to an OpenAI model.

Camera access, microphone recording, image resizing, deterministic barcode decoding, and notifications use browser features or local code. USDA FoodData Central supplies nutrition database records; it is not an AI model. The app currently has no text-to-speech or spoken output, including OS or browser speech synthesis. No third-party AI voice is used.

Nutrition summaries are formatted from calculated USDA values. Known nutrient sums retain named omissions; model-written nutrition numbers are not published as calculated totals. Food resolution has a shared time budget and records external, cached and reused provenance.

Before merging a model prompt, output-cap or client change, run the explicit paid Meta gate:

```sh
node --env-file=.env.local --import tsx scripts/real-identify-smoke.mjs --real-meta
```

It uses licensed evaluation photo 03, real SAM regions and the actual structured identify parser, then the actual food resolver on frozen public USDA candidates from the refined ham failure, with at most eight Meta requests and a four-minute deadline. It writes no database or storage records. Keep its sanitized head, status, token and latency receipt beside the review; a nonzero exit blocks release. Both identify and matcher paths must pass for prompt, cap or client changes; neither a fake provider nor an identify-only run replaces this gate. USDA FoodData Central is a nutrition database, not an AI model. This is separate from the offline unit suite. Photo portions remain estimates.

For changes to meal capacity or execution deadlines, run the complete busy-meal gate as well:

```sh
node --env-file=.env.local --import tsx scripts/real-identify-smoke.mjs --real-meta --full-meal
```

This explicit paid mode runs fresh SAM, identification and every identified food through the actual two-lane resolver. USDA search is read-only and its cache exists only in memory. Limits are 80 Meta requests, 40 USDA reads, 262,144 reserved output tokens and 270 seconds; the receipt reports actual usage without asserting a dollar price. No database or storage writes occur. The production nutrition phase gets at most 180 seconds, capped by the invocation's remaining 270-second processing allowance with 15 seconds reserved for persistence and a further 30 seconds before the platform's 300-second limit. Late worker handoffs defer to the durable scheduled wake instead of extending the invocation with a timer.

Changes to prior-meal confirmation also require its explicit real decision gate:

```sh
node --env-file=.env.local --import tsx scripts/real-same-meal-smoke.mjs --real-meta
```

It checks identical photos/captions, different foods and a changed caption amount through the actual reuse-confirmation service. It permits at most six Meta calls in two minutes, uses licensed fixtures, and writes no database or storage records. Only a completed, strictly boolean confirmation can authorize copying nutrition; inconclusive confirmation continues normal analysis.

Prior nutrition is reused only when every item has finite core nutrition and a matching current-version selection or validated-copy trace for its food-database source. Legacy, incomplete or unproven results remain a historical hint and are analyzed again.
