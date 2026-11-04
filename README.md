# My Food AI

Photograph a meal, write a caption, or say what changed, and see what was consumed. My Food AI keeps a private meal history with food outlines, estimated portions, calculated nutrition and every correction behind each result. It records what was eaten. It gives no advice, sets no targets and makes no health claims.

Built for the Meta hackathon, October 26 to November 4, 2026.

## Meta models

| Model | Job in the app | Where it is called | Where its use is recorded |
| --- | --- | --- | --- |
| SAM 3.1 (`sam-3.1`) | Outlines each food in a meal photo. | [sam.ts](src/lib/meta/sam.ts) | `model_calls.model` |
| Muse Spark 1.3 (`muse-spark-1.3`) | Names the foods and their portions, reads nutrition labels, interprets corrections and picks the matching USDA reference. | [spark.ts](src/lib/meta/spark.ts), [match.ts](src/lib/fdc/match.ts) | `model_calls.model` |
| Muse Voice Transcribe 1.0 (`muse-voice-transcribe-1.0`) | Turns a spoken correction into text for the user to confirm. | [transcribe.ts](src/lib/meta/transcribe.ts) | `model_calls.model` |
| Muse Spark Open (`meta-models/muse-spark-open-1026`), Meta's open-weight model served by Baseten | An optional path for naming foods and portions. SAM and transcription stay on the Meta API. | [open-weights.ts](src/lib/meta/open-weights.ts) | `model_calls.model` and `model_calls.host`; post detail names the model that succeeded |

**Switch on Muse Spark Open:** sign in, open **Profile**, and turn on **Identify food with Muse Spark Open** under your handle. New meals use it, and post detail reads "Identified by Muse Spark Open". If it fails or returns an invalid result, the meal falls back to Muse Spark 1.3. [Setup and paired comparison](docs/open-weights.md).

To configure the open model on Baseten, supply the server-only `IDENTIFY_OPEN_API_KEY`, `IDENTIFY_OPEN_BASE_URL` and `IDENTIFY_OPEN_MODEL` values named in [.env.example](.env.example). Keep their values in private environment configuration. Built with Muse Spark Open under the [Muse Model License](https://huggingface.co/meta-models/Muse-Spark-Open-816B-A42B/blob/main/LICENSE.md).

USDA FoodData Central supplies nutrition references. It is a database, not a model. When strict matching fails, the deployed fallback can use a labelled closest USDA record or a labelled model estimate. If neither provides usable nutrition, the food is shown as unavailable. [Food matching](src/lib/fdc/match.ts), [third-party notices](THIRD_PARTY.md).

Packaged foods that USDA FoodData Central does not hold are looked up in Open Food Facts. Contains data from [Open Food Facts](https://world.openfoodfacts.org), available under the [Open Database License](https://opendatacommons.org/licenses/odbl/1-0/).

## For the judges

**Impact.** Food logging is abandoned because it is slow and its numbers are opaque. Here a photo is the whole entry, nutrition carries its USDA reference or an explicit model-estimate label, and a correction in plain words ("I ate half the rice") changes the record while keeping the earlier version. [Demo record](docs/demo.md).

**Use of Meta AI tooling.** SAM outlines photo foods, Muse Spark identifies them and interprets corrections, and Muse Voice Transcribe handles spoken corrections. Meta's open-weight Muse Spark Open is a real, switchable identification path. [Ten-photo evaluation and its limits](docs/eval.md), [real-model gates and their limits](docs/production-performance.md#pre-merge-gates-and-review), [open-weight comparison](docs/open-weights.md).

**Demo.** A photo becomes an outlined, calculated meal; a spoken correction changes it; a leftovers photo is marked "not eaten"; Days and Search find it again. [Demo record](docs/demo.md).

**Pending in PR #583.** Profile › How My Food AI works lists the models and the steps. It is not deployed yet. Accounts have separate meal histories.

**Technical depth.** A durable job queue with leases and retries runs the pipeline. Every model call is traced. Item history is never overwritten: a correction supersedes rows instead of editing them ([migration 0007](supabase/migrations/0007_post_items_supersede.sql)). Accounts have hourly spending caps, and meal agents use revocable tokens. Feed reads and photo bytes are measured. [Worker timing](docs/production-performance.md), [worker drain under load](docs/load-test.md), [feed and photo measurements](docs/media-loading.md), [database egress](docs/egress.md), [sign-in protection](docs/auth-protection.md), [agent access](docs/agents.md).

## What was built

Through deployed Fleet14 (#581): capture by photo, caption, barcode and nutrition label; outlined food detail; editable item history and corrections; Saved meals and Log again; drinks with water and caffeine; Days and Search; a desktop layout; durable uploads; delete with Undo and Recently deleted; and revocable meal-agent access. Each run's plan and report are in [docs](docs/), for example the [Run 8 report](docs/run8-final-report.md).

## Tests

Historical Fleet11 measurements, not a fresh result for main or the pending Fleet15 heads, using the [disposable local test stack](docs/testing.md); [commands, database identity and assertion audit](docs/evidence/test-lint-repairs/README.md):

| Command | Result |
| --- | --- |
| `npm run test:db` | 34 passed, 0 failed, 0 skipped |
| `npm test` (complete top-level suite with TypeScript loading) | 573 passed, 0 failed, 6 existing optional integration skips |
| `npm run lint` | 0 errors, 6 warnings |

[Fleet 11 validation logs and exact tested versions](https://github.com/aibraincoach/my-food-ai/blob/ccb1465/docs/evidence/run11-final-checks/verification.json).

The local stack runs real PostgreSQL, Auth, REST and app routes with scripted provider/Storage transports. It does not prove live provider availability or food accuracy.

A passing test is not production acceptance. Phone-camera capture, installed-app sessions, mobile-data timing and background push are not yet proven on a physical phone.

## Run it

Copy `.env.example` to `.env.local` and fill in the server-only values it names, then run `npm install` and `npm run dev`. Follow the [migration status and rollout order](docs/migrations.md); pending 0055 must run through its activation procedure after a compatible deployment. Never commit credentials.

## How this repository was built

Coding agents built it under written contracts, kept here: [planner contract](docs/planner-contract.md), [PM contract](docs/pm-contract.md), [review policy](REVIEW_POLICY.md), [backlog](BACKLOG.md).
