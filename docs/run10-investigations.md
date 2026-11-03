# Fleet 10 investigations — in progress

Read-only production measurements and designated test-account actions only. Unknown means unproven; local tests never substitute for production acceptance.

## 7a. Sign-in addresses (#368)

**Method** — Ran the requested `auth.audit_log_entries` query and GET `https://api.ipify.org` at approximately08:52 UTC; no production sign-up or live form probe. At10:51–10:52 UTC queried the Management Logs API with explicit columns `timestamp,event_message,log_attributes`, each source separately, last24h. Follow-up filter: `log_attributes['path'] like '%token%' or log_attributes['path'] like '%verify%' or log_attributes['auth_audit_event.action']='login'`. Raw identifiers and addresses remain private.

**Result**

| Measurement | Result |
| --- | --- |
| Requested SQL audit rows | 0 |
| Latest Auth API log rows | 30; all GET /,8 distinct remote addresses |
| Filtered token/verify Auth API rows | 0 |
| Filtered audit login rows | 30, spanning10:38:59–10:52:16 UTC |
| Address fields on those audit login rows | 0 |
| Logs API status | 200; explicit-column queries accepted |

**Answer** — Existing audit login records are readable but omit the address, and the API samples are root requests rather than sign-ins. Neither proves whether app sign-ins share a Vercel address.

**Unknown** — The address-sharing/rate-limit hypothesis remains unproven. The available existing records cannot be correlated to sign-in IPs; no live form probe was added to fill that gap.

## 7b. Empty claims (#374)

**Method** — At09:04 UTC ran `git log --format='%h %ad %s' --date=iso origin/main -- src/lib/queue src/lib/jobs src/app/api/jobs`, `git show c8dd4ec:src/lib/queue/claim.ts`, `git show 7e73cd1 -- src/lib/queue/claim.ts`, `git show 1118e0f -- src/lib/queue/claim.ts`, `gh issue view222 --comments`, and GitHub commit→PR lookups. Management Logs API queried seven adjacent daily windows spanning2026-10-27T08:58:50.308Z–2026-11-03T08:58:50.308Z with SQL `select toDate(timestamp) as day,count(*) as calls from logs where source='edge_logs' and log_attributes['request.path'] like '%/rpc/claim_owned_job%' group by day order by day`. A single seven-day request truncates to its first24h; initial429 queries were retried sequentially until every daily query returned200.

**Result**

| UTC date | claim_owned_job calls in observed window |
| --- | ---: |
| 2026-10-28 | 7731 |
| 2026-10-29 | 2417 |
| 2026-10-30 | 9773 |
| 2026-10-31 | 6909 |
| 2026-11-01 | 43325 |
| 2026-11-02 | 66933 |
| 2026-11-03 | 24089 |

**Answer** — The truthy empty-composite handling is already in `c8dd4ec`, merged in #37 onOct27 at06:10:10 UTC; `7e73cd1`, merged in #86 onOct28 at08:19:23, changes the RPC name to claim_owned_job while retaining the same missing-ID check. #340 (`1118e0f`) fixes that check. Nov2 is the first fully observed UTC day near one call per second (66,933/86,400 ≈0.775/s); #222 reports failures fromOct29 andNov2, within the observed period, but daily traffic does not establish causality.

**Unknown** — The original claim_job traffic before the retained window is not measured by this RPC-name query. Exact first sustained one-per-second onset and why any particular feed request failed remain unproven. #222 was createdOct30 but describes anOct29 report; its datedNov2 observations precede the Run8 fix. Do not equate temporal overlap with diagnosis.

## 7c. Storage egress (#375)

**Method** — Read-only Management Logs API, the same seven daily windows as7b, completed by09:20 UTC. Query groups request.path into feed copy/card/original and user_agent into automation (headless/node/undici/curl/python) or browser; sums `toUInt64OrZero(log_attributes['response.headers.content_length'])` and counts zero/missing lengths. SQL window min/max timestamps were inspected. Initial429s were retried, all seven final queries200. No raw object paths or account addresses are published here.

**Result**

| File kind | Client class | Requests | Reported bytes | Missing/zero lengths |
| --- | --- | ---: | ---: | ---: |
| card | automation | 8596 | 108881189 | 1011 |
| card | browser | 1891 | 43678883 | 35 |
| feed copy | automation | 20134 | 2379064156 | 1027 |
| feed copy | browser | 4283 | 387772572 | 37 |
| original | automation | 47666 | 4296289493 | 299 |
| original | browser | 788 | 162825965 | 8 |

**Answer** — Browser-class feed copies are the largest browser-class source:387,772,572 reported bytes over seven days (55,396,082 bytes/day averaged across this window). Automation originals are larger overall at4,296,289,493 bytes. This changes the interpretation: automated acceptance/fixture activity is a major measured Storage source. The session-refresh cache change is #391; new feed/photo timing remains to be measured after it reaches production.

**Unknown** — User-agent classification is not identity and cannot prove that every browser-class request is a real user. Content-Length is a lower bound, not billed egress, and this week includes older code. Current-deploy savings cannot be inferred from the seven-day aggregate; no unconditional new compression is justified from this table alone.

## 7d. Billed log ingestion (#373)

**Method** — Read-only Management project `/usage` request at08:55 UTC; inspected the official Studio `org-usage-query.ts` and tried its organization usage route at10:46 UTC using the available Management token. Checked [Supabase Logs Ingest documentation](https://supabase.com/docs/guides/platform/manage-your-usage/logs-ingest), updated October29.

**Result**

| Measurement | Result |
| --- | --- |
| Management project /usage | 404 |
| Management organization /usage | 404 |
| Studio platform organization /usage | 401, Unsupported access token |
| Current published billing status | Not yet billed; grace period through the start of2027 |

**Answer** — The premise of current billed log-ingestion cost is false under the published grace period. Usage is measured by ingested bytes across services; source row counts do not establish those bytes. The available token cannot read the Studio usage endpoint.

**Unknown** — Current-cycle ingested bytes and their service breakdown remain unavailable. No source-byte or bill estimate is substituted for them.

## 7e. Connections and memory (#373)

**Method** — Read-only SQL at08:49:17 UTC: `pg_stat_activity` grouped by user/application/state, `show shared_buffers`, and `sum(pg_shmem_allocations)`. At10:45:59 UTC successfully scraped the [official Metrics API](https://supabase.com/docs/guides/observability/metrics/vendor-agnostic) (HTTP200); raw output remains private. Memory percentage below uses `(MemTotal-MemAvailable)/MemTotal`, not virtual memory or summed backend RSS.

**Result**

| Measurement | Result |
| --- | --- |
| PostgREST idle connections (08:49) | 17 |
| shared_buffers | 256 MB |
| Shared-memory allocations | 307 MB |
| Node MemTotal / MemAvailable (10:45) | 950,153,216 / 260,251,648 bytes |
| Used via available-memory calculation | 689,901,568 bytes;72.61% |
| Page cache / buffers | 252,702,720 / 3,842,048 bytes |
| Swap total / free | 1,073,737,728 / 763,342,848 bytes |
| Pooler waiting / active server connections | 0 / 0 at the scrape |

**Answer** — The approximately70% memory observation is reproducible by an available-memory calculation. The SQL sessions include PostgREST, Auth, Storage, Realtime, exporter, cron, pg_net and pooler services; idle sessions do not establish active-query load. Shared buffers, other shared allocations, the OS and service processes all contribute. The measured cache is substantial and cannot simply be treated as permanently unavailable memory.

**Unknown** — These snapshots do not attribute every byte to a process or prove a leak, and SQL and metrics snapshots were taken at different times. Exporter `process_resident_memory_bytes` is not the sum of all Postgres backend memory; it is not used as such. No configuration reduction is justified solely by these readings.

## 7f. Published summaries (#228)

**Method** — Read src/lib/pipeline/wording.ts:10–12 on current main.

**Result**

| Measurement | Result |
| --- | --- |
| safeSummary return expressions | 1 |

**Answer** — safeSummary ignores model text and returns plainConsumed(totals). A model900/actual600 discrepancy publishes600.

**Unknown** — No separate production model mismatch was injected; the formatting boundary is direct code evidence.

## 7g. Capture timing (#370)

**Method** — Chromium390×844 CPU4× simulated camera with recurring canvas video frames; production before and exact preview after #386; barcode fixture uses actual decode. Detailed private timing receipts uploads/run10-capture/.

**Result**

| Measurement | Result |
| --- | --- |
| After camera encode samples | 2154.1 ms; 1877 ms |

**Answer** — The camera encode outside addFiles dominates shutter timing. Composer state now precedes barcode work and a barcode photo still opens the scanned-product result.

**Unknown** — 300 ms shutter acceptance not met. Photo/barcode/food-search tap-to-close Fast4G tables and upload bytes still pending.

## 7h. Feed opening (#222/#372/#322/#323/#324)

**Method** — Not yet completed on the final production revision; prior Run8 tables remain historical.

**Result**

| Measurement | Result |
| --- | --- |
| New ten-opening series completed | 0 |

**Answer** — No new cold-open or cold-tick acceptance is claimed.

**Unknown** — Final READY-deploy cold/warm tick, first-card/photo bytes, server calls, auth/day-read counts and ten cold opens remain required.

## 7i. Last feed (#304)

**Method** — Actual installed Chrome PWA on production,10:48 UTC. Privileged CDP pipe installed/launched the app; standalone media query verified. Pages closed between trials, browser process/profile and caches primed. Official Slow4G562.5ms/180,000 B/s down/84,375 B/s up acknowledged by the existing app worker before launch; new pages throttled before debugger resume. Clock starts before PWA.launch and samples visible real articles/images at animation frames. This is a cold app window, not a full browser-process cold boot.

**Result**

| Measurement | Result |
| --- | --- |
| Installed opens1/2/3, first visible feed with image ready | 1477 /1944 /1367 ms |
| Source on ordinary opens | Fresh server/client,6 cards each |
| Additional deliberately held-root lifecycle | Cached feed2660ms→fresh replacement3842ms |
| Actual UI logout / logged-out reopen | /sign-in;0 old articles and0 mfa-feed keys |
| Same browser account2 | 4 own posts; account2-only cache;0 observed account1 IDs |
| Owned app/profile cleanup | Complete |
| Pre-#397 immutable installed baseline | Install failed; no timing |

**Answer** — Ordinary installed Slow4G opens met2s in all3 observed trials; cache-to-fresh replacement and logout/account separation also worked. The deliberately delayed root experiment proves that lifecycle separately and is not counted toward ordinary timing acceptance.

**Unknown** — The protected pre-#397 deployment loaded its authenticated feed but Chrome PWA.install could not fetch install info; protection as cause is an inference, and no tab timing substitutes for installed baseline. Final deployment repeat remains pending; this is not physical-phone or full-process cold-boot evidence. Raw summary `/tmp/run10-thumbs-pwa-acceptance.json` preserves each assertion separately.

## 7j. Drink backfill (#377)

**Method** — Exact ready-current-item name anti-join at08:49:17; npx tsx --env-file=.env.local scripts/backfill-item-drinks.ts, followed by the same count query at09:00:32.

**Result**

| Measurement | Result |
| --- | --- |
| Before unmatched item rows | 25 |
| Distinct posts synchronized | 24 |
| Remaining unmatched item rows | 10 |

**Answer** — The script synchronized sequentially and lists every remaining post with an explicit unresolved-match error. Remaining names include steak/chocolate, legacy Coffee tiles and Pepsi Zero; do not infer caffeine by name.

**Unknown** — Broad anti-join is not a drink classifier. Current classification and existing atomic tile rows require per-post interpretation; no guessed nutrients were added.

## 7k. Tap/smoothness audit (#306/#217)

**Method** — Not yet measured across all seven screens.

**Result**

| Measurement | Result |
| --- | --- |
| Complete control inventories measured | 0 |

**Answer** — No blanket immediate-feedback or smoothness acceptance is claimed.

**Unknown** — Per-control first visible change, pressed state, flicker and repeated-save behavior remain required.

## 7l. Refusals (#282)

**Method** — At10:54 UTC read current-main paths with `nl -ba` and `rg -n '429|400|Retry|p_retriable|requeue_rate_limited'`. Inspected `src/lib/meta/client.ts:17`,`:94`, `src/lib/worker/errors.ts:21`, `src/lib/worker/drain.ts:28`, `src/lib/fdc/client.ts:34`, `supabase/migrations/0007b_comment_corrections.sql:62`, `0034_renew_lease.sql:20`, `src/lib/worker/failure-message.ts:2`, and `src/components/PostCard.tsx:39`. Offline real local pipeline/retry tests ran through scripted responses using disposable Auth/REST/Postgres/Storage; production refusals were not injected.

**Result**

| Condition | Boundary and user-visible result | Retry control |
| --- | --- | --- |
| Meta HTTP400 | client throws without retry; worker classifies non-retriable and fail_job marks failed. Fixed public message: “The analysis service refused this request. Try again.” | “Try again” on failed card; POST /api/posts/id/retry |
| Meta HTTP429 | At most1 in-call retry when Retry-After≤10s (or absent); otherwise retriable job failure/requeue. Third retriable worker attempt is final; final failed card uses same fixed public message. | Automatic while queued; manual “Try again” once failed |
| USDA HTTP429 | At most1 in-call wait/retry when delay≤60s and deadline permits; otherwise requeue_rate_limited_job schedules durable retry without burning an analysis attempt. SQL stores fdc: rate limited; processing card says “The food database was busy. Retrying automatically.” | Automatic while processing; ordinary failed-state control exists if a different terminal failure occurs |
| Offline pipeline + client retry tests | 2 passed,0 failed | Short429 finishes inside one attempt;400 terminal path and longer requeue covered |

**Answer** — Provider bodies are not rendered to users; fixed public text explains failure or automatic retry. A terminal failed meal exposes “Try again”, while USDA rate limiting remains a scheduled processing state.

**Unknown** — These are current source paths plus disposable-local runtime checks, not an induced production outage. No customer or production provider refusal was created for this report.

## 7m. Secondary-account checks

**Method** — Designated test account2 on production at10:14–10:17 and10:26–10:28 UTC, before final Fleet10 deployment. Chromium390×844, CPU4×, actual DevTools Fast4G165ms/1,012,500 B/s down/168,750 B/s up. Explicit Asia/Tokyo timezone verified separately from geolocation. Real spaghetti fixture; synthetic camera used only for controls/hints. Stored instants, current item amounts and actual downloaded PNG rasters were inspected.

**Result**

| Check | Actual observation | Answer / remaining work |
|---|---|---|
| #175 Water tile | Water glass posted201, Edit time moved it to an otherwise empty Oct22. Days enabled that date, accessible label “2026-10-22, 1 post, 0 kcal”. | Exact plan date-visibility case passes. Dialog body was sampled before it appeared; no claim about its water total from that sample. Final runner now waits for the dialog. |
| #175 stronger standalone intake | Owner-scoped250ml water row on otherwise emptyOct19, no post. Days button disabled, no drank label. | Baseline failure of standalone intake handling before#400; distinct from Water tile, which creates a post. |
| #224 Tokyo clocks | Caption meal eaten_at08:57Z: feed/card/detail/Days5:57PM. Model comment created10:27:17Z: thread7:27PM. Each observed clock matched its own stored instant inTokyo. | Pass for these actual surfaces/instants. Initial run sampled clocks before hydration; that empty sample was a driver issue, not evidence of a clock defect. |
| #223 edited caption | PATCH200; reload; exact edited caption visible on feed, detail, actual meal slide inDays andSearch. | Pass. Initial falseDays result inspected the summary slide; follow-up selected the meal. |
| #29 caption-only | Actual CONSUMED129kcal card visible. | Pass. |
| #29 photo/carousel/correction | Real photo ready; carousel contained photo, live314kcal results card and add-leftovers slide. Real touch gesture changed scroll position. “I ate half the spaghetti.” correction changed current item200g→100g and downloadedPNG314→157kcal. | Card update verified from actual changed raster, not stable mediaID. Swipe overshot the card to the add slide; final driver will target one slide precisely. |
| #283 PNG | Actual signedStorage downloads were1080×1080. One-photo PNG55,276B, corrected55,408B, leftovers51,251B. Food/water/leftovers footer clipped horizontally beyond canvas in all three. | Real failure#421, fixPR#422. Before/after actual ImageResponse PNG and raster regression supplied. Final production download still required afterdeploy. |
| #23 capture/thread/thumbs | Each first appeared inviewport, dismissal persisted, revisits0. | Pass for these three. |
| #23 modes | Current deployed “Swipe to scan a barcode” tip appeared. Got it hid it, DBseenkeys never gainedmodes; revisitcount1. | Real failure#423. Migration0013 rejects modes;0042fixPR pending. Oldcopy mismatch initially hid this from driver. |


**Answer** — Caption propagation, tested clocks, results cards and three hint dismissals passed these baseline observations. Standalone intake dates, PNG clipping and modes-hint persistence exposed concrete defects addressed by #400, #422 and #425. The same spaghetti image marked as leftovers exercises footer mechanics only; it does not establish portion-estimation accuracy.

**Unknown** — Final production repeat after all fixes remains required. Initial premature hydration reads and a Days summary-slide selection were driver errors; corrected observations above supersede them. Both runs removed only their tracked fixture posts/media/intake, restored prior preferences/hints, and verified cleanup with no issues. Private receipts are retained under ignored `uploads/run10-coffee-acceptance/`.

## 7n. Real matcher (#272)

**Method** — Real Muse Spark1.3→USDA calls through imported matchFood with in-memory USDA cache and trace sink; no production DB writes. Read actual receipts at10:59 UTC from `docs/evidence/run10-272/real-matcher.json` on #424. Original baseline head b7b2b118b0176cdf09f9cabad3d59c3005c55f8a; exact-wording follow-up code3d8dfca3ea3304cac424c9dbf8d29ebe2cd07ad2. A persisted conservative per-request cost reservation bounded all experiments; cached input discounted by0. Official rates and source commits are retained in the receipt.

**Result**

| Series | Input | Trial | USDA fdcId | Provider decision reason |
| --- | --- | --- | --- | --- |
| Before | cheeseburger with lettuce, tomato, onion and pickle | 1 | unavailable | All candidates incompatible for cheeseburger with lettuce, tomato, onion and pickle: Burger King Cheeseburger/Whopper/Double records are identifiable proprietary chain recipes, not generic collection settings and cannot proxy; veggie/soy burgers are different food category, turkey/chicken burgers are different species, branded BURGER hits are condiment/other meats. New search seeks unbranded whole-dish cheeseburger reference with compatible components. |
| Before | cheeseburger with lettuce, tomato, onion and pickle | 2 | unavailable | All candidates are incompatible: bread/bun records, pickle relish/sauce, and hamburger (no cheese) records including named-chain proprietary hamburgers, all missing cheese and thus missing a named substantial component of the cheeseburger with lettuce, tomato, onion and pickle; no generic whole-dish cheeseburger covering patty+cheese+bun+vegetables was retrieved by 'hamburger'. |
| Before | cheeseburger with lettuce, tomato, onion and pickle | 3 | unavailable | All candidates incompatible for cheeseburger with lettuce, tomato, onion and pickle. Branded BURGER records are sauce/other meats, veggie/soy records are different food category, turkey/chicken burgers are different species. All Burger King Cheeseburger/Whopper/Hamburger/Double records in Survey FNDDS and SR Legacy are identifiable proprietary chain recipes, not merely a collection setting, and cannot proxy the generic dish. No unbranded generic whole-dish cheeseburger reference present. New search for generic whole-dish reference. |
| Before | cheeseburger with lettuce, tomato, onion and pickle | 4 | unavailable | All candidates incompatible with beef cheeseburger with lettuce, tomato, onion and pickle. All BURGER KING / Burger King items are identifiable proprietary chain recipes, not generic collection setting, and cannot proxy the target. Veggie/soy burgers and turkey/chicken burgers are different food category/species. Branded BURGER ketchup/sauce is a condiment, not the dish. Fries, onion rings, chicken strips, fish/chicken sandwiches, croissants etc. are different foods. No generic unbranded whole-dish beef cheeseburger reference present. New search for generic whole-dish form. |
| Before | cheeseburger with lettuce, tomato, onion and pickle | 5 | 2706888 | Selected Survey (FNDDS) Cheeseburger, NFS as a generic reference for the assembled whole dish; it covers bun, beef patty, and cheese as main components with typical toppings, compatible with known lettuce, tomato, onion, and pickle, with no explicit exclusion or incompatible proprietary recipe. |
| Before | dipping sauce | 1 | 2705618 | Target is unspecified 'dipping sauce' with no known ingredients or preparation. 'Dip, NFS - NS as to kind of dip' is the compatible generic Survey (FNDDS) reference as a broader version of the target dip/dipping sauce, without assuming a specific flavor. |
| Before | dipping sauce | 2 | 2705618 | Target is unspecified 'dipping sauce' with no ingredients or preparation given. Dip, NFS (NS as to kind of dip) is a generic Survey reference for an unspecified dip, compatible as a generic reference for the unknown kind. |
| Before | dipping sauce | 3 | 2705618 | Target is unspecified 'dipping sauce' with no known ingredients or preparation. Selected Dip, NFS as a generic reference for an unspecified dip/dipping sauce, which is compatible in physical form with no conflicting components. |
| Before | dipping sauce | 4 | 2705618 | Target is unspecified dipping sauce with no known components. Selected Dip, NFS is a compatible generic Survey (FNDDS) reference for dip NS as to kind, which covers the generic target. |
| Before | dipping sauce | 5 | 2705618 | Target is unspecified dipping sauce with no known components. Selected Dip, NFS as generic reference covering any kind of dip per NS as to kind. |
| After exact wording | cheeseburger with lettuce, tomato, onion and pickle | 1 | 2706888 | Generic Survey FNDDS whole-dish reference Cheeseburger, NFS is a broader generic version of the target assembled cooked burger, covering bun, beef patty, and cheese with typical vegetable toppings including lettuce, tomato, onion and pickle in the same physical form. |
| After exact wording | cheeseburger with lettuce, tomato, onion and pickle | 2 | 2706888 | Selected generic Survey (FNDDS) Cheeseburger, NFS as compatible whole-dish reference. It is a generic reference for the broader cheeseburger category with same assembled form (beef patty, cheese, bun) and can cover the known substantial vegetable additions lettuce, tomato, onion and pickle; absence of topping words in NFS title is not an explicit exclusion. Named-chain recipes (McDonalds, Burger King) rejected as identifiable proprietary recipes. |
| After exact wording | cheeseburger with lettuce, tomato, onion and pickle | 3 | 2706888 | Selected generic Survey (FNDDS) whole-dish reference 'Cheeseburger, NFS' in burgers category. It is a generic reference for the same assembled food and preparation (beef patty + cheese on bun, cooked), covering the main components including bun, meat, cheese with typical lettuce/tomato/onion/pickle toppings; absence of topping words is not an explicit exclusion and there is no 'without' conflict. |
| After exact wording | cheeseburger with lettuce, tomato, onion and pickle | 4 | 2706888 | Target is assembled cheeseburger with bun, beef patty, cheese, lettuce, tomato, onion, pickle. Cheeseburger, NFS is a Survey (FNDDS) generic whole-dish burgers reference with compatible base, cooking process and assembled form; absence of topping words is not an explicit exclusion, so it serves as a broader generic reference covering the burger including vegetables. Named-chain McDonalds/Burger King recipes rejected as proprietary. |
| After exact wording | cheeseburger with lettuce, tomato, onion and pickle | 5 | 2706888 | Selected Cheeseburger, NFS as generic reference for the assembled whole dish: bun + beef patty + cheese with lettuce, tomato, onion and pickle. It is a generic broader version with compatible known ingredients, cooked beef patty and assembled burger form; absence of topping words from NFS description is not an explicit exclusion. Preferred over identifiable named-chain proprietary recipes. |
| After sauce | dipping sauce | 1 | 2705618 | Target is unspecified 'dipping sauce' with no flavor, ingredients, or preparation given. Dip, NFS (NS as to kind of dip) is a compatible generic Survey reference for an unspecified dip, acceptable as a broader generic version of the target. |
| After sauce | dipping sauce | 2 | 2705618 | Target is unspecified dipping sauce with no flavor, base, or preparation given. Dip, NFS NS as to kind of dip is a compatible generic reference as a broader version of the target dip category with no incompatible ingredients or preparation. |
| After sauce | dipping sauce | 3 | 2705618 | Target is unspecified dipping sauce with no flavor or composition given. Dip, NFS, NS as to kind of dip, is a generic reference in dips, gravies, other sauces category and is acceptable as a broader generic version of the target; specific-flavor dips would assume undeclared ingredients. |
| After sauce | dipping sauce | 4 | 2705618 | Target is unspecified 'dipping sauce' with no flavor/type given. Candidate 2705618 'Dip, NFS' NS as to kind of dip is the generic Survey reference for an unspecified dip in category dips, gravies, other sauces, compatible in form and use as a generic reference for the unknown kind. |
| After sauce | dipping sauce | 5 | 2705618 | Target is unspecified 'dipping sauce' with no known components or preparation. Dip, NFS NS as to kind of dip is a generic Survey (FNDDS) reference for any dip, compatible as a broader generic reference with no incompatible ingredients or exclusions. |
| Synthetic exclusion control | cheeseburger with lettuce, tomato, onion and pickle | 1 | unavailable | Only candidate 900001 is 'Hamburger on bun, without cheese' which explicitly excludes cheese and therefore conflicts with target cheeseburger with lettuce, tomato, onion and pickle; it is not a whole-dish cheeseburger reference covering cheese plus toppings. |

| Additional measurement | Result |
| --- | --- |
| Baseline chosen references | Burger1/5; dipping sauce5/5 |
| Exact-wording follow-up | Burger5/5; dipping sauce5/5 |
| Existing real reference gate | 16/16 |
| Explicit no-cheese synthetic foil rejected | 3/3; foil is test-only, never a production reference |
| Combined upper model cost | US$0.62730425, below US$1 |
| Focused tests | 32 passed |

**Answer** — A supplied compatible generic reference was discarded across searches and a distinct retry refinement ignored; #424 retains eligible candidates and honors that refinement. Separately portionable steak/butter and spinach/corn now resolve as separate estimated components with genuine USDA references, preserving the rule against guessing missing nutrients.

**Unknown** — Five consistent repeats do not guarantee deterministic future model decisions. Final designated-account production meals after #424 remain required; the real in-memory experiments do not establish that acceptance.

## 7o. Terms (#294)

**Method** — #398 replaces the exact old leftovers label throughout current src files and runs wording tests. Full requested term listing pending.

**Result**

| Measurement | Result |
| --- | --- |
| Wording tests passed | 2 |
| Failed/skipped | 0 |

**Answer** — The instructed leftovers label change is built; other term recommendations remain with RT.

**Unknown** — The requested file/line term inventory and empty Recommended column still need publication.

## 7p. Visual reconciliation (#193/#353–#367)

**Method** — At11:01 UTC inspected `gh issue list --state all --limit200 --json number,title,state`, file lists for Fleet9 PRs345/346/347/352, and `git show origin/run9/docs:docs/design/visual-pass.md`. The latter is explicitly a partial pre-Fleet9 rendered comparison; changed paths below do not prove a rendered fix. Each Fleet10 fix/reconciliation has its own PR with reference/current evidence.

**Result**

| Issue | Title | Issue state | Fleet9 screen/path change | Fleet10 PR |
| --- | --- | --- | --- | --- |
| #353 | Reconcile auth screen differences with rounds 1–4 | open | No auth-screen file changed | #432 |
| #354 | Reconcile feed notices and week strip with rounds 1–4 | open | Yes — #346 PostCard/summary | #431 |
| #355 | Normalize post-detail nutrient rows and reconcile attribution/servings | open | Yes — #347 PostDetail/Thread | #412 |
| #356 | Show drink volume and caffeine in saved meals | open | Data paths only — #347 saved filtering; no Saved layout fix | #410 |
| #357 | Reconcile Days nutrition notice and story entry labels | open | Yes — #347 Days data filtering | #417 |
| #358 | Reconcile additional Profile settings with the design | open | Yes — #347 Profile/Recently deleted | #430 |
| #359 | Reconcile agent capability copy and desktop presentation | open | No agent-screen file changed; #347 agent operations changed | #416 |
| #360 | Use screen-specific desktop shortcut legends | open | No Sidebar change | #415 |
| #361 | Fix desktop drink search summaries and reconcile result composition | open | Shared summary helper changed by #346; no SearchBox layout change | #411 |
| #362 | Reconcile composer photo grouping and upload states with rounds 3–4 | open | Yes — #345 capture hints/modes | #418 |
| #363 | Reconcile desktop webcam and file-upload geometry with round 4 | open | Yes — #345 CaptureSheet, not desktop geometry | #404 |
| #364 | Reconcile plus fan controls and pill treatment with round 2 | open | No plus-menu change | #405 |
| #365 | Reconcile Log again picker layout with round 2 | open | No LogAgainSheet change | #406 |
| #366 | Reconcile clarification sheet close and navigation treatment | open | No clarification presentation change | #403 |
| #367 | Reconcile barcode and label result layouts with round 3 | open | Yes — #345 CaptureSheet hints/modes, not result layouts | #408 |

**Answer** — All15 visual issues have individual Fleet10 fix or reconciliation PRs. Fleet9 touched several shared screen/data paths but did not establish final visual acceptance.

**Unknown** — Final production rendered checks and issue closures remain pending. Newer owner issue #413 refers to Round6 desktop frames unavailable in the supplied reference archives; no Round6 match is claimed. The original plan's rounds1–4 comparison remains the documented reference scope.
