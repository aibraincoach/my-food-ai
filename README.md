# My Food AI

Photograph a meal, write a caption or record a correction, then see what was consumed. My Food AI keeps a private meal history with food outlines, estimated portions, calculated nutrition and the corrections behind each result. It records meals; it gives no advice, sets no targets and makes no health claims. See the [analysis and evaluation limits](docs/eval.md).

## Meta models

| Model | What it does | Implementation |
| --- | --- | --- |
| SAM 3.1 (`sam-3.1`) | Finds food regions in meal photographs. | [Segmentation](src/lib/meta/sam.ts) |
| Muse Spark 1.3 (`muse-spark-1.3`) | Identifies foods and portions, interprets corrections and labels, and selects compatible nutrition references. | [Structured food analysis](src/lib/meta/spark.ts) |
| Muse Voice Transcribe 1.0 (`muse-voice-transcribe-1.0`) | Transcribes recorded corrections for confirmation. | [Transcription](src/lib/meta/transcribe.ts) |
| Muse Spark Open (`meta-models/muse-spark-open-1026`) | Provides an optional identify-and-portions path through Baseten. SAM and transcription stay on the Meta API. Built with Muse Spark Open. | [Adapter](src/lib/meta/open-weights.ts), [paired trial and reproduction](docs/open-weights.md), [implementation PR](https://github.com/aibraincoach/my-food-ai/pull/315) |

The open-weight path is off by default and selected per account from Profile. If it fails or produces an invalid result, identification falls back to Muse Spark 1.3. The post detail names the model that succeeded; server traces record the model and provider in `model_calls.model` and `model_calls.host`. These Run 7 additions have separate migration and production-acceptance gates; implementation is not a claim of deployment. [Provider implementation and checks](https://github.com/aibraincoach/my-food-ai/pull/315).

USDA FoodData Central supplies nutrition references. Values are scaled to estimated portions; a missing reference remains explicitly unavailable. USDA is a database, not an AI model. Camera capture, barcode decoding, image resizing and notifications use browser features or local code. The OpenAI-compatible SDK connects to Meta-model endpoints; it does not select an OpenAI runtime model. There is no text-to-speech or third-party AI voice. [Model client](src/lib/meta/client.ts), [food matching](src/lib/fdc/match.ts), [third-party notices](THIRD_PARTY.md).

## Reproduce the open-weight path

Configure these server-only names in the runtime environment:

- `IDENTIFY_OPEN_API_KEY`
- `IDENTIFY_OPEN_BASE_URL`
- `IDENTIFY_OPEN_MODEL`

Apply the documented migration before running the new profile preference and trace fields. Sign in, open Profile and turn on **Identify food with Muse Spark Open**. New meals use that account’s selected identification path; existing meals retain their recorded results. The detail line identifies the successful model, including **Built with Muse Spark Open** when applicable. Keep credential values private. [Setup, transport probes, eleven paired cases and limitations](docs/open-weights.md).

## What was built and checked

Implementation began October 26 for the November 4 submission. The source includes photo and caption capture, segmented food detail, editable item history, corrections, Saved meals and Log again, hydration and caffeine records, Days and Search, desktop navigation, durable photo uploads and revocable meal-agent access. Corrections retain superseded item history rather than erasing the earlier result. [Run 5 record](docs/run5-execution.md), [Run 6 plan](docs/plan-run6.md), [item-history data rules](supabase/migrations/0007_post_items_supersede.sql), [agent setup](docs/agents.md).

| Evidence | What it establishes |
| --- | --- |
| [Run 7 PR and execution receipts](https://github.com/aibraincoach/my-food-ai/pull/308) | Exact feature heads, test commands and counts, review results, false premises and remaining gates. A green build alone does not prove production acceptance. |
| [Combined database gate](https://github.com/aibraincoach/my-food-ai/pull/308#issuecomment-6593384089) | `npm run test:db`: 17 passed, zero failures or skips against disposable local Auth, REST, PostgreSQL and the built app with scripted model responses. This includes the post-to-ready path, atomic model provenance and the API-to-worker-to-detail identity check; local storage upload falls back to the live nutrition card. |
| [Ten-photo evaluation](docs/eval.md) | Licensed fixtures, name scoring, visual checks and their limits. Visual portion estimates are not measured nutritional ground truth. |
| [Open-weight comparison](docs/open-weights.md) | Eleven paired cases using the same region inputs and existing USDA resolver. One run per case; unavailable results remain visible. |
| [Production performance](docs/production-performance.md) | Measured worker phases and food-reference outcomes, with the tested revision and conditions. |
| [Feed and media measurements](docs/media-loading.md) | Before/after read counts, repeated-open results, image bytes and timing conditions. |
| [Worker drain](docs/load-test.md) | Queue behavior under a recorded burst; distinct from one-meal latency. |
| [Phone acceptance](docs/phone-acceptance.md) | Physical-device checks that browser emulation cannot establish. |

Run 7 addresses the feed’s request volume and slow opening, caching, immediate feedback on saves, food names before final totals, lease renewal and USDA retry timing. Each feature’s implementation, checks and remaining acceptance are linked from the [Run 7 plan and receipts](https://github.com/aibraincoach/my-food-ai/pull/308). Hardware-camera behavior, mobile-data timing, installed sessions, background push and owner acceptance of meal estimates require their own evidence.

## Start locally

Use Node.js with native `--env-file` support:

```sh
cp .env.example .env.local
npm install
npm run check
npm run dev
```

Fill the names in `.env.local` before the setup check. Use a Supabase project with this repository’s migrations applied in numeric order and its private media bucket configured. The check reports connectivity and model availability; it does not apply migrations or prove every application flow. Keep `.env.local` private and uncommitted. Deployment variables are configured separately. [Environment names](.env.example).

Migration number 0022 is permanently retired. Run 7 adds 0032, 0033 and 0034 for the optional provider, pending analysis items and worker safety; apply each only under its migration/merge order. [Run 7 migration sequence](docs/plan-run7.md).

TypeScript, lint and the production build run with:

```sh
npx tsc --noEmit
npm run lint
npm run build
```

The identification and food-reference gates use the actual configured Meta services:

```sh
node --env-file=.env.local --import tsx scripts/real-identify-smoke.mjs --real-meta
node --env-file=.env.local --import tsx scripts/real-food-match-smoke.mjs --real-meta
```

Real-model gates are explicit paid checks and are separate from the offline unit tests. Prompt/client changes run the identification and food-reference gates; broader meal-capacity and correction changes have their own gates. The exact commands and receipts are in the [review policy](REVIEW_POLICY.md), [review index](docs/reviews/README.md) and [feature PRs](https://github.com/aibraincoach/my-food-ai/pull/308). Database and pipeline tests hold the worker lease and must not run during recording.

## Licence

Application source is [MIT licensed](LICENSE). [Third-party notices](THIRD_PARTY.md) describe dependencies, fonts, hosted models, data and fixture terms.
