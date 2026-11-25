# #1365: remove whole dictionaries from browser code

The reading pages loaded both full language dictionaries. Browser card builders and ResultsCard now require provider translators. Database card reads move to a server-only module; the three dictionary factories become server-only. The table uses a small canonical USDA identity/sort data module. Existing card/table goldens, including stored English PNG bytes, are unchanged. There are no message, dependency or intended product-behavior changes.

Plan f96f858a, PM D1(a) conditional on unchanged 5b goldens. Source base: 89ccc81b5b905daf1e1df70b3a09296bb1eebc0a. Main's subsequent 79e5e8a6 email-template merge changed no src/public files.

## Local JS observations

One cold Chromium context per cell, production builds against disposable local backends, service workers blocked. Raw bytes count unique loaded JS responses; encoded body bytes are ResourceTiming network bytes (gzip), excluding headers. These are localhost observations, not production CDN or latency claims. The final JA Profile detailed receipt (23 chunks, versus the lost original summary of 21) was recovered separately after the original runner lost it during teardown, on a fresh synthetic fixture with the same app build and backend configuration. Other cells were not repeated.

| Locale / page | Chunks base → head | Raw JS bytes base → head | Encoded body bytes base → head | EN/JA admin + other-card sentinels |
|---|---:|---:|---:|---|
| en sign-in | 13 → 13 | 857,937 → 857,684 | 251,330 → 251,203 | absent → absent |
| en home | 26 → 26 | 1,405,876 → 1,275,275 | 423,020 → 383,808 | present → absent |
| en post | 26 → 24 | 1,404,857 → 1,179,934 | 422,596 → 356,705 | present → absent |
| en days | 21 → 20 | 1,234,784 → 1,096,752 | 368,654 → 327,218 | present → absent |
| en profile | 22 → 21 | 1,221,969 → 1,073,308 | 366,678 → 321,865 | present → absent |
| ja sign-in | 13 → 13 | 857,937 → 857,684 | 251,330 → 251,203 | absent → absent |
| ja home | 26 → 24 | 1,405,876 → 1,179,934 | 423,020 → 356,705 | present → absent |
| ja post | 24 → 24 | 1,310,535 → 1,179,934 | 395,917 → 356,705 | present → absent |
| ja days | 21 → 20 | 1,234,784 → 1,096,752 | 368,654 → 327,218 | present → absent |
| ja profile | 22 → 23 | 1,221,969 → 1,168,649 | 366,678 → 348,968 | present → absent |

Exact paths, SHA-256 chunk hashes and emitted factory hashes are in module-comparison.json. Across the measured union: 328 base / 334 head factories, with 263 identical hashes. Base chunk /_next/static/chunks/1bo_mupbsqbq_.js (163,592 raw bytes) contains full root dictionaries in modules 92336 (61,924 factory bytes) and 40857 (82,787). Both complete dictionary payload hashes are absent from the head's measured chunks; zero full root dictionaries remain there.

Totals also include compiler/layout and lazy-load differences. Base EN post loaded two extra chunks (1,218 + 93,104 raw bytes) compared with base JA post; head EN Home loaded two extra chunks (1,218 + 94,123) compared with head JA Home/post. The recovered JA Profile also loaded those head lazy chunks on its fresh hint fixture. Hint state changed during normal page reads. Those lazy differences are not attributed to this change. No per-language size or speed conclusion follows. Sign-in already lacked sentinels; its small byte change is not dictionary savings.

## Root provider messages, separate from JS

Hydrated message objects were serialized as JSON and gzip. This measures the root message content, excluding Flight framing/escaping; it is not total RSC wire transfer. Route-provider message objects/namespaces are recorded separately.

| Locale / scope | JSON bytes base → head | Gzip bytes base → head |
|---|---:|---:|
| en root-children | 1,635 → 1,635 | 751 → 751 |
| en root-overlays | 15,859 → 17,052 | 5,185 → 5,501 |
| ja root-children | 2,011 → 2,011 | 1,106 → 1,106 |
| ja root-overlays | 19,864 → 21,315 | 6,435 → 6,768 |

The overlay sibling provider gains the complete card namespace for PostOpenTransition → OutlineOverlay/ResultsCard. Table labels remain out of the root provider.

## Verification

- 75/75 final presentation tests: unchanged English sentences and PNG hashes; both-locale table goldens, unknown-ID identity, sort/fallback, database card reads, leftover histories and missing-key failure.
- 26/26 reading/format/wording tests; 53/53 worker, update, capture-presence, agent sign-in and hint safety tests. Groups overlap; no full-suite clean claim.
- Browser import guard: 108 roots clear; 9/9 tests. Red cases restore the old ResultsCard/card-data/table factory paths, JSON imports, re-exports, dynamic JSON and the server-reader re-export. Type-only imports are ignored; use-server action modules stop traversal. The base has 21 forbidden paths.
- Next's real boundary enforcement: a planted ResultsCard factory value import/use failed next build with server-only Client Component Browser/SSR traces. No marker loader was on that command. Mutation removed; clean production build passed.
- 10/10 route/capture namespace tests; all 25 route/layout entries have their namespaces. TypeScript, source lint/messages, tooling lint and build pass. Source lint retains 10 warnings, 0 errors.
- 20 reading cells: five pages × two locales × both engines, no page errors; post tables opened with translated Iron checked. Two browser key-removal cases produce MISSING_MESSAGE: card.consumed (en), with no fallback. Server missing-key tests throw in both locales.
- H1 camera/update, H4 frame timeout and H5 synthetic persisted page return pass. Six auth/text held/cleared/isolated update cases pass across engines. Fresh/seen camera, thumbs and thread hints pass in both engines.
- H1 and text checks reuse the original instrumented worker proxies. They are regressions, not the real-byte #1310 diagnostic. Synthetic cameras, Playwright WebKit and synthetic persisted events do not prove iPhone hardware or actual BFcache.

Strict console is RED and unfiltered. Normal reading cells retain 14 WebKit interactive-widget warnings (existing #1371) and 10 service-worker-blocked-by-Playwright messages per engine from the cold-context setup. No WebKit base console pair was run here; viewport source is unchanged. Intentional missing-key errors are retained separately.

## Node source-loading tools

Static traversal includes literal dynamic import/tsImport and type-only erasure. These tools were not run against production or real providers. Only worker-local reaches a server-only module: its usage names scripts/lib/server-only.mjs, the same marker loader preloaded by the disposable test runner. It substitutes the annotation only, never application code, and is never on the Next path. The other present graphs do not need the loader. SQL rematch/repair tools queue Next-worker jobs and are unaffected.

| Script | Reaches server-only |
|---|---|
| `scripts/build-tokens.mjs` | no |
| `scripts/feed-probe.mjs` | no |
| `scripts/numbers/cards.mjs` | no |
| `scripts/numbers/mismatch.mjs` | no |
| `scripts/numbers/read-photos.mjs` | no |
| `scripts/numbers/reanalyse.mjs` | no |
| `scripts/open-weights-trial.mjs` | no |
| `scripts/real-correction-smoke.mjs` | no |
| `scripts/real-food-match-smoke.mjs` | no |
| `scripts/real-identify-smoke.mjs` | no |
| `scripts/real-label-smoke.mjs` | no |
| `scripts/real-remainder-smoke.mjs` | no |
| `scripts/real-same-meal-smoke.mjs` | no |
| `scripts/real-vision-quality-smoke.mjs` | no |
| `scripts/trace-rollout-smoke.mjs` | no |
| `scripts/worker-local.mjs` | yes |

## Instrument corrections and cleanup

Initial failures remain in the evidence folder. The first marker resolver's data URL was treated as a filename by tsx; the shared empty CJS marker fixed that. Two behavior tests initially lacked the local environment; the final environment-backed group passes. Host WebKit lacked libicudata.so.74 and never launched; its cases ran in the existing Playwright container. The first hint fixture lacked its required analysis comment: camera cases passed, then only remaining Chromium feed/thread cases were rerun after fixture repair; WebKit passed all four.

The first head measurement printed all ten summaries but persisted only nine detailed records before a late response-body callback rejected after context close (exit 1). The runner now removes its response listener before draining pending bodies. Only missing JA Profile was recovered, on a fresh own disposable stack, and its final receipt is separately identified. Initial logs and the nine-record JSON are preserved.

Both runs' synthetic accounts, sessions, profiles, posts, drafts, jobs, comments, media and storage objects read back zero. Own app/proxies/backend/provider/gateway/PostgreSQL are stopped, containers removed, and private environments/cookie jars/stack directories deleted. Shared services were untouched. See cleanup-original.json, cleanup.json and process-cleanup.json.

Evidence: /home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/1365-client-dictionaries/. No production, model calls, rollout or owner ask.
