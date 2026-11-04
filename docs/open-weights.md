# Muse Spark Open identify path

## Fleet14 current scope — November 4, 2026

Both structured-output format attempts share one75-second deadline, configurable by IDENTIFY_OPEN_TIMEOUT_MS. After strict and closest USDA matching both fail, food nutrition may come from Muse Spark1.3 as a labelled model estimate; the optional identify provider is unchanged. Final tests603/0/6,DB39/39; build/TypeScript pass; lint0errors/11warnings. Earlier timing/USDA-only statements retain their original cutoffs. Owner Profile/model-line acceptance remains separate.

Built with Muse Spark Open. The optional per-account Profile switch sends initial food identification and portion estimates to Muse Spark Open through Baseten. SAM segmentation, voice transcription, corrections, labels and USDA reference matching keep their existing Meta/API and database paths. Hosted Meta identification remains the default for every account.

## Setup and rollout

Set server-only `IDENTIFY_OPEN_API_KEY`, `IDENTIFY_OPEN_BASE_URL` and `IDENTIFY_OPEN_MODEL`. The tested base URL is `https://inference.baseten.co/v1`; the tested model is `meta-models/muse-spark-open-1026`. Keep credential values in private environment configuration, never in the repository or an issue. Apply migration `0032_identify_provider.sql` before deploying the switch, then open Profile and enable **Identify food with Muse Spark Open** for the desired account. Disable it to return subsequent initial identification calls to hosted Meta.

The cookie-authenticated PATCH endpoint calls a narrowly scoped setting RPC. It changes only the caller’s preference; it does not weaken existing profile role guards. The switch is absent when the open credential is not configured. The preference defaults to `meta`, including during a missing-column rollout. Before migration 0032 is visible, only exact missing-metadata-column errors permit a legacy trace insert retry under the same three-second deadline; exact missing-wrapper errors permit ordinary legacy persistence, and detail reads retry the legacy post fields. Other schema, ownership and data errors are not hidden. A failed setting save reverts the visible switch and shows an error.

The configured model ID is restricted to the Muse Spark Open family, preserving the project’s Meta-only runtime rule. The adapter uses image-capable Chat Completions with strict JSON Schema and a 16,384-token output allowance, including reasoning. A structured-format refusal can retry with JSON-object mode and the same explicit schema; local parser validation still applies. Reasoning text is removed before JSON parsing. An HTTP failure, refusal, incomplete response or invalid result records the failed open call and falls back to hosted Meta. An unavailable optional preference read also retains hosted Meta.

Each new model trace stores its model and host. Post detail reads server-managed `posts.identify_model` and `posts.identify_host`, atomically committed with the initial item analysis by `persist_identified_analysis`; it never chooses an attempt from the trace stream. A later invalid, refused, incomplete or valid-but-uncommitted attempt cannot relabel an earlier committed meal. Replays preserve the original identity, and ordinary users cannot forge either field. Raw prompts and results remain admin-only. A successful Baseten identification shows **Identified by Muse Spark Open (model ID) · Built with Muse Spark Open**. A successful Meta fallback shows **Identified by Muse Spark 1.3**. Historical meals without a model identity are not relabeled.

## Live endpoint probes

Observed November 3, 2026. The existing privately supplied key authenticated; no credential was printed or published.

| Probe | HTTP | Observed response |
| --- | --- | --- |
| GET `/v1/models` | 200 | Listed both `meta-models/muse-spark-open` and exact `meta-models/muse-spark-open-1026`; the latter was selected. |
| Image + strict schema, `/v1/chat/completions` | 200 | `choices[0].message.content` contained the requested food JSON; finish reason `stop`. |
| Equivalent image + schema, `/v1/responses` | 200 | Responses-style completed output and usage returned. Chat Completions was selected as planned. |

Images and strict JSON Schema both worked, so the switch includes photographed meals as well as captions. These are observed probes, not a guarantee that every future call will complete.

## Eleven-case comparison

Started 2026-11-03T00:39:05.464Z. Ten licensed evaluation photos plus the caption **I ate half the rice**, one comparison per case. Both providers receive the same SAM regions and caption; USDA selection and portion scaling use the existing resolver unchanged. SAM is run once per photo. The comparison uses 1080-pixel JPEGs for both providers; it is not a production timing or food-accuracy acceptance run. The name scorer is the unchanged trigram matching rule from `scripts/eval.mjs` (threshold 0.5); its ‘invented’ count is a string-matching result, not a hallucination count.

| Case | Requested provider | Actual model | Foods and estimated grams | Total kcal | Unavailable foods | Seconds | Input/output tokens | Found/missed/invented |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01.jpg | meta | `muse-spark-1.3` | scrambled eggs (100 g); toasted bread (60 g) | 360.8 | none | 20.085 | 6815/2371 | 1/1/1 |
| 01.jpg | open | `meta-models/muse-spark-open-1026` | Scrambled eggs (100 g); Toasted white bread (60 g) | 360.8 | none | 43.881 | 6836/6437 | 1/1/1 |
| 02.jpg | meta | `muse-spark-1.3` | plain spaghetti (200 g) | 314.0 | none | 23.815 | 7239/1469 | 1/0/0 |
| 02.jpg | open | `meta-models/muse-spark-open-1026` | plain cooked spaghetti (250 g) | 327.5 | none | 16.413 | 4276/1320 | 0/1/1 |
| 03.jpg | meta | `muse-spark-1.3` | Tuna hosomaki rolls (110 g); Cucumber hosomaki rolls (90 g); Tuna nigiri (120 g); Squid nigiri (120 g); Surf clam nigiri (90 g); Cooked shrimp nigiri (90 g); Yellowtail white fish nigiri (90 g); Octopus nigiri (60 g); Sweet shrimp nigiri (60 g); Scallop nigiri (80 g); Salmon nigiri (70 g); Tamago egg omelet nigiri (80 g); Salmon roe gunkan with cucumber (50 g); Chopped tuna gunkan (90 g); Pickled ginger (15 g); Mackerel nigiri (60 g); Simmered shellfish nigiri (60 g) | 1315.8 | none | 96.615 | 58788/21485 | 0/1/17 |
| 03.jpg | open | `meta-models/muse-spark-open-1026` | Tuna nigiri sushi (140 g); Salmon nigiri sushi (70 g); Cooked shrimp nigiri sushi (120 g); Squid nigiri sushi (120 g); Surf clam nigiri sushi (120 g); Octopus nigiri sushi (75 g); Yellowtail nigiri sushi (120 g); Scallop nigiri sushi (110 g); Tamagoyaki sushi (80 g); Tuna hosomaki sushi roll (150 g); Cucumber hosomaki sushi roll (120 g); Salmon roe gunkan sushi with cucumber (70 g); Minced tuna gunkan sushi (110 g); Pickled ginger (20 g) | 1379.6 | none | 50.474 | 36329/12140 | 0/1/14 |
| 04.jpg | meta | `muse-spark-1.3` | Margherita pizza (240 g) | 638.4 | none | 48.531 | 6779/4218 | 1/0/0 |
| 04.jpg | open | `meta-models/muse-spark-open-1026` | Margherita pizza with mozzarella, tomato sauce, basil and ham (320 g) | unavailable | Margherita pizza with mozzarella, tomato sauce, basil and ham | 34.473 | 6910/3693 | 0/1/1 |
| 05.jpg | meta | `muse-spark-1.3` | Cheeseburger with lettuce, tomato, onion and pickle (280 g); French fries (120 g); Dipping sauce (30 g) | 1228.4 | none | 34.114 | 9147/4215 | 1/1/2 |
| 05.jpg | open | `meta-models/muse-spark-open-1026` | Cheeseburger with lettuce, tomato, pickles, red onion and melted cheese (300 g); French fries (150 g); Dipping sauce (30 g) | 1355.1 | none | 34.147 | 9117/5031 | 1/1/2 |
| 06.jpg | meta | `muse-spark-1.3` | grilled chicken Caesar salad with croutons (350 g) | 444.5 | none | 24.232 | 3439/2212 | 0/1/1 |
| 06.jpg | open | `meta-models/muse-spark-open-1026` | Caesar Salad with Grilled Chicken and Croutons (350 g) | 444.5 | none | 40.577 | 3350/3906 | 0/1/1 |
| 07.jpg | meta | `muse-spark-1.3` | Pancakes (120 g) | 338.4 | none | 24.487 | 4337/1971 | 1/0/0 |
| 07.jpg | open | `meta-models/muse-spark-open-1026` | Pancakes (150 g) | 423.0 | none | 21.844 | 4244/3703 | 1/0/0 |
| 08.jpg | meta | `muse-spark-1.3` | Ramen with cabbage, bean sprouts, green onions and half boiled egg (550 g) | 616.0 | none | 19.553 | 4049/1777 | 0/1/1 |
| 08.jpg | open | `meta-models/muse-spark-open-1026` | Ramen with cabbage, bean sprouts, green onions and half boiled egg (650 g) | 728.0 | none | 21.966 | 3956/2383 | 0/1/1 |
| 09.jpg | meta | `muse-spark-1.3` | crinkle-cut french fries (120 g); cheeseburger with cheese, lettuce, pickle, tomato and ketchup (280 g) | 1098.8 | none | 37.339 | 6793/3496 | 1/1/1 |
| 09.jpg | open | `meta-models/muse-spark-open-1026` | Crinkle-cut french fries (110 g); Cheeseburger with cheddar cheese, lettuce, tomato, pickles and ketchup (260 g) | 1017.1 | none | 21.949 | 6648/3192 | 1/1/1 |
| 10.jpg | meta | `muse-spark-1.3` | Yorkshire pudding (110 g); Roast lamb with gravy (200 g); stuffing (90 g) | 892.1 | none | 27.609 | 9071/3007 | 3/0/0 |
| 10.jpg | open | `meta-models/muse-spark-open-1026` | Roast lamb with gravy (180 g); Yorkshire pudding (135 g); Stuffing (90 g) | 915.3 | none | 25.142 | 8978/4812 | 3/0/0 |
| half-rice-caption | meta | `muse-spark-1.3` | cooked white rice (75 g) | 96.8 | none | 19.653 | 3121/1454 | not annotated |
| half-rice-caption | open | `meta-models/muse-spark-open-1026` | cooked white rice (100 g) | 129.0 | none | 18.888 | 3028/3541 | not annotated |

Times and token totals include identification and that provider’s USDA-resolution model calls; shared SAM time/tokens are excluded. Portions and totals are estimates, and one unmatched item leaves the whole-meal total unavailable while retaining known item nutrition. The half-rice caption has no measured food quantity or annotated name target.

## Spend bound and reproduction

Run `node --import tsx --env-file=.env.local scripts/open-weights-trial.mjs`. The script replaces trace persistence with an in-process sink, uses an in-memory USDA cache and permits only the model and USDA destinations; it creates no live posts, storage objects, cache rows or trace rows. A private receipt is written under `/tmp/`.

The conservative Baseten token-price estimate including both paid probes is **$0.146187** at the conservative uncached input price of $1.25/M tokens and output price of $4.25/M tokens. Cached input discounts are ignored; this is not a billing receipt. The script reserves input bytes (plus an image allowance) and the full output cap before every Baseten attempt and refuses a request that would exceed **$5.00**. Failed/unknown-usage attempts consume their reservation conservatively. Meta token usage is recorded separately; this Baseten dollar figure does not claim to price the hosted Meta calls.

Pricing was checked against the [Baseten pricing page](https://www.baseten.co/pricing/). Image support and Chat Completions format are also documented in the [official Meta hosted Baseten cookbook](https://github.com/meta-models/meta-oss-cookbook/blob/main/muse-spark/hosted/baseten.md).

## Verification and limits

- Adapter, reasoning removal, incomplete status, 500/invalid-result fallback, successful model identity, migration defaults and SQL scoping: `tests/open-identify.test.mjs` passed (4 tests). `tests/identify-provenance.test.mjs` adds five gates covering rollout retry boundaries, invalid/incomplete/refused Meta tracing, unchanged committed attribution after failed or uncommitted attempts, and persistence fallback versus ownership failures.
- `tests/db/identify-identity.test.mjs` verifies atomic model/item commitment, replay protection, wrong-job fencing, failed-transaction rollback, spoofed insert/update refusal, worker-RPC denial and cross-owner reads on both fresh and already-migrated local schemas. `scripts/trace-rollout-smoke.mjs` passed against actual pre-0032 local PostgREST, proving a normal Meta trace still persists and cleaning its exact fixture. `tests/db/identify-after.test.mjs` is the local-only end-to-end committed-model/owned-detail gate; its final receipt belongs to the combined validation on the Run 7 docs PR.
- Isolated PostgreSQL migration/RLS test: `tests/db/open-identify.test.mjs` passed (1 test), including a cross-owner update attempt and blocked role escalation.
- TypeScript, production build, changed-file ESLint and the two existing wording checks passed. The repository-wide lint retains its baseline 34 errors and 21 warnings.
- The required real Meta identify/matcher smoke passed, retaining normal SAM/Meta behavior. The separate real food-reference gate also passed (36 USDA reads). Retry-header checks passed (2 tests), and the real body-timeout retry check passed (1 test).
- The initial PostgreSQL-only run passed four SQL tests and could not exercise six API/Auth tests. Subsequent combined validation uses real disposable local Supabase Auth/PostgREST and scripted Meta; see the [Run 7 docs PR](https://github.com/aibraincoach/my-food-ai/pull/308) for the final combined full-suite receipt. The preference SQL gate supports both an unmigrated baseline and an already-migrated local schema. No production database writes substitute for isolated acceptance.
- Built Profile was inspected in Firefox at 390×844: provider row beneath Connect an agent, no horizontal overflow. A real save against the unmigrated schema showed an error and reverted Off. No designer frame exists for the new row; it uses the existing type, spacing, border and pill tokens. Screenshots were inspected in memory only.
- Migration 0032, production/preview environment configuration, production switch persistence, owner-visible open-model detail and owner acceptance remain Part 2. No production migration or provider-preference write was made during Part 1.
