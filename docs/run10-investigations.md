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

**Answer** — Browser-class feed copies are the largest browser-class source:387,772,572 reported bytes over seven days (55,396,082 bytes/day averaged across this window). Automation originals are larger overall at4,296,289,493 bytes. This changes the interpretation: automated acceptance/fixture activity is a major measured Storage source. The session-refresh cache change is #391; current-production #439 strip-photo repeat confirms497591→63720B for the same3photos, with no project-wide billed-savings claim.

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

**Method** — Baseline three each actual production Photo Post, Barcode Post and food-search result taps, account1, Chromium131390×844 CPU4×, genuine Fast4G165ms/1,012,500 B/s down/168,750 B/s up. Capture-phase click clock through next animation frame after CaptureDialog removal; Blob upload bodies measured without altering requests. Canvas MediaStream supplied meal JPEG or synthetic UPC016000275683; no physical camera claim. Photo baseline10:49UTC atade5269; barcode10:52UTC atad8bf79; search10:54UTC atadf3d71, last search crossed deployment to6f6fe5f. Each actual trial's before/after full SHA is retained privately. Separately, #409 isolated shutter→visible frozen-pixel comparison used custom150ms/200000/93750network CPU4 with identical1280×960 source frames; Post publication blocked to isolate rendering.

Final production follow-up used stable READY789c2b7 with before/after guards on every trial. Posting browser156; actual compositor camera browser131. GenuineFast4G+CPU4; allownedfixtures/receipts removed and prefs restored. [Final receipts, five real compositor PNGs and limits](evidence/run10-final7g/README.md).

**Result**

| Measurement | Result |
| --- | --- |
| Photo Post→close,3 trials | 48.4 /810.7 /238.7 ms |
| Photo successful upload bytes per trial | 234,533 original+152,525 feed=387,058;2 bodies |
| Barcode Post→close,3 trials | 4653.7 /3766.0 /3700.7 ms |
| Barcode successful upload bytes per trial | 39,940;4 bodies(normal photo stage and pack stage) |
| Food-search result→close,3 trials | 2606.7 /3735.8 /3763.2 ms;0 image upload bytes |
| All nine created posts | Ready; all removed |
| Baseline cleanup audit including diagnostics | 16 tracked roots;0 remaining posts/jobs;0 cleanup issues |
| Isolated before#409 frozen pixels,5 trials | 222.2 /258.7 /290.3 /413.4 /1045.9 ms |
| Isolated after#409 frozen pixels,5 trials | 91.3 /63.9 /58.5 /76.7 /69.9 ms |
| Final production PhotoPost close | 154.9 /46.3 /126.8ms;387058B/trial |
| Final production BarcodePost close | 128.3 /151.8 /1136.6ms;19970B/trial,2PUTs |
| Final production Foodsearch close | 169.1 /164.8 /135.1ms;0B |
| Final actual shutter first-meal raster | 104.54 /87.21 /88.19 /91.27 /94.97ms,5/5<=300 |
| Separately JPEG encoded | 551.2 /251.8 /415 /360.5 /412.9ms |
| Real barcode panel / Found-product | 315.1ms /1154.7ms, genuinecachedlookup200 |
| Final cleanup | 9posts+6foodreceipts absent; separatebarcode1stage absent;0issues |

**Answer** — The actual compositor showed meal pixels before JPEG encoding completed, passing #370’s300ms first-photo condition5/5. All nine actual production posts reached ready and cleaned successfully. Barcode upload bodies fell from39940B/fourPUTs to19970B/twoPUTs; final Post-close ranges are photo46–155ms, barcode128–1137ms and search135–169ms.

**Unknown** — The1136.6ms barcode-close outlier is retained and unexplained; no every-Post-below300ms claim. Item6’s explicit300ms threshold concerns first photo pixels, not Post-close. Posting156 and camera131 differ, and baseline-versus-final comparisons are descriptive rather than a same-browser causal benchmark. Physical cameras remain unproven. Product resolution latency is separate from panel opening. Baseline search crossed a deployment and is not substituted for stable-head final acceptance.

## 7h. Feed opening (#222/#372/#322/#323/#324)

**Method** — Account1, Chromium131390×844 Asia/Jakarta, CPU1, Fast4G165ms/1,012,500 B/s down/168,750 B/s up. Ten fresh contexts with browser cache cleared; workers allowed; jobs/tick alone intercepted with a no-work200 to isolate openings. All10 runs recorded stable READY424bf0e5260be9527b66118571b441fb6f994bfd. Session preparation outside clock. Corrected `uploads/run10-performance/baseline-fast4g-v2/cold-open.json` is authoritative; v1 missed `.feed.jpg` and its photo metrics are discarded. Deliberate scroll starts5s after first card. Explicit later workerCDP observer distinguishes worker network from page transfer0. Vercel runtime endpoint `/v1/observability/events` attempted for the actual deployment/window.

**Result**

| Measurement | Result |
| --- | --- |
| Real first-card latency,10 opens | 405.5–1333.1ms; upper median717.5ms |
| Blank feeds / page errors / photo failures | 0 /0 /0 |
| Initial visible photo | None: top card caption/drink only |
| First visible photo after deliberate5s-later scroll | 5708.9–6630.9ms from navigation |
| First5 distinct JPEG bodies | 142087 /133353 /142579 /221659 /161312 bytes; total800990 |
| Browser verified Auth reads | 6 on every baseline opening |
| Direct repeated day-total read windows | 2 on every baseline opening; later same-time control2/0/2 |
| Worker network hidden by page transfer0 in separate observer check | 134017 /143247 /222331 bytes, plus true diskcache0 repeats |
| Vercel runtime access | 403 Forbidden |
| Exact pre-#391 API-image probe at11:45UTC, bf6d7f6 | Actual access token rotated;3 API photos each memorycache0bytes at genuineFast4G |
| Exact pre-#391 natural Home repeat, bf6d7f6 | Actual photos were legacy signed JPEGs; after token rotation3network200 bodies142754/161981/305103B (609838Btotal) |
| Separate actual GET tick pair,11:09:48UTC, READYe074235 | HTTP200,0.612575s then0.218436s |
| Natural production session refresh,12:42UTC, READY66f7f8e | Actual token rotated;3 natural rendered photos each memorycache0bytes, genuineFast4G |
| Phone NeedsInputStrip origin diagnostic, READYf8b0324 | 3 actual40px thumbnails used signed JPEGs totaling497591B; source confirmed NeedsInputStrip, not prefetch |
| Final natural10opens, READY6f857ac,12:48:57–12:50:42UTC | Firstcard443.2–894.6ms, median754.55;10/10 pass,0intercepts/pageerrors |
| Final natural per-open browser reads | 1 Auth,0direct day reads each |
| Final first5 actual natural feed bodies | 116762B; NeedsInputStrip separate63720B; actual worker wire separately accounted |
| Final tickpair firstobserved47s afterREADY | HTTP200,0.178652s/0.297646s; no cold-instance claim |
| Exact Auth-only preview | 1 Auth request/page in3 opens |
| Exact day-read preview | 0 direct day reads,1 document/0RSC refreshes in5 opens;20 regressions pass |

**Answer** — Controlled opening was reliable, but it repeated identity/day reads and used about801KB of first-five JPEG body data. #414 fixes legacy photo routing, #428 shares verified browser Auth reads, and #429 reuses verified per-post day contributions while preserving mutation/readiness refreshes.

**Unknown** — Photo body bytes are not total billed egress; page transfer0 does not establish zero worker traffic, and the worker observer can miss pre-attach traffic. Browser cold cache does not prove a cold function instance; runtime correlation was refused. The separate tick pair was not immediate post-READY and does not prove a cold instance. Final natural repeat is preserved in [the production receipt](evidence/run10-final-7h/README.md). Initial viewport is text-only, so it does not prove initial-photo latency; firstphoto5762.9–5973.6ms includes intentional5s wait before scrolling. Tick pair was first observed47s afterREADY and does not prove a cold function. The separate12:42 natural session-refresh check passed3/3 memorycache0bytes. The baseline intercepted tick and must not be represented as an unmodified production opening.

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
| Post-#437 production, stable READYafbb18e, ~12:46UTC | Cached1880/1860/1770ms→fresh2996/2855/2737ms; all3 same-node/top/height/nav, no gap |
| Post-#437 production privacy/cleanup | Real Auth without bridge; UIlogout and account2 isolation pass; own app/profile removed |

**Answer** — Ordinary fresh-feed opens were below2s, and logout/account separation passed, but the cached last-feed path first appeared at2660ms under held-root conditions. That does not satisfy the literal last-feed-within2s condition; #437 startup/in-place reconciliation fix has merged; local installed Slow4G cached1721/1716/1700ms→fresh2302/2290/2285ms passes deadline and actual compositor no-gap/no-jump checks. Production repeat passed on stable READYafbb18efe317d6a0981b45a160dc9dc015642bbe; #304 closed.

**Unknown** — The protected pre-#397 deployment loaded its authenticated feed but Chrome PWA.install could not fetch install info; protection as cause is an inference, and no tab timing substitutes for installed baseline. Production repeat is preserved in [the receipt](evidence/run10-fix304-production/README.md); this is not physical-phone or full-process cold-boot evidence. Raw summary `/tmp/run10-thumbs-pwa-acceptance.json` preserves each assertion separately.

## 7j. Drink backfill (#377)

**Method** — Exact ready-current-item name anti-join at08:49:17; npx tsx --env-file=.env.local scripts/backfill-item-drinks.ts, followed by the same count query at09:00:32.

**Result**

| Measurement | Result |
| --- | --- |
| Before unmatched item rows | 25 |
| Distinct posts synchronized | 24 |
| Remaining unmatched item rows | 10 |

**Answer** — The script synchronized sequentially and lists every remaining post with an explicit unresolved-match error. #377 was closed under item13’s explicit residual-ID/error completion condition, with all10 residual IDs included in the closing evidence. Remaining names include steak/chocolate, legacy Coffee tiles and Pepsi Zero; do not infer caffeine by name.

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

**Method** — Designated account2, Chromium156ARM390×844, CPU4×, Fast4G165ms/1,012,500B/s down/168,750B/s up. Browser and CDP explicitly set Asia/Tokyo plus Tokyo geolocation. Real production responses; no sign-up or auth-form probe. Initial baseline10:14–10:28UTC is retained below. Follow-up12:57–12:59 and13:01–13:02 ran on READY6f857ac; affected copy/phone checks13:18–13:21 ran on final READY789c2b7db3ac5a75f7c2b7271419a8a3176c9702. Later code changed durable copy/drink saves and contrast; unaffected cases are not presented as a fresh full rerun. Original hints/provider restored exactly after all same-fixture checks.

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

Final production follow-up (same columns; baseline failures above remain visible):

|#23 four hints|Reset designated account2 hints only. Thumbs12:57:04–07; capture+modes12:57:07–09; thread12:57:30–37. All four visible in viewport and persisted. Revisit counts thumbs/capture/modes/thread all0; stored array contains exactly allfour keys. Modes copy is current “Swipe to scan a barcode.” Original array restored at cleanup.| Final production check passed; fixture cleanup0issues.|
|#224 Tokyo|Caption meal eaten_at11:27:00Z: card/detail/Days8:27PM; thread model comment created12:57:25Z renders9:57PM. Intl resolvesAsia/Tokyo; rendered time values independently converted from their own ISO. Meal clock and comment clock are correctly different.| Final production check passed; fixture cleanup0issues.|
|#223 caption|Edited through actual sheet/PATCH200, reloaded; exact new caption found on Feed, post detail, selected Days story and Search12:57:42–48.| Final production check passed; fixture cleanup0issues.|
|#175 Water date|Water tile then Edit time→Oct22 12:34Tokyo on a date with no other post: Days enabled, label1post/0kcal, story Water250ml. Stronger standalone intake-only Oct19:0posts, enabled calendar label “drank”.| Final production check passed; fixture cleanup0issues.|
|#29 caption card|Caption-only rice displays CONSUMED card with129kcal/3gprotein/28gcarb/0gfat.| Final production check passed; fixture cleanup0issues.|
|#29 photo/card/correction|Real repository spaghetti photo produced photo then card then leftovers-add slide. Genuine CDP touch swipe selected slide1 atscrollLeft390/width390. Actual “I ate half the spaghetti.” correction changed current portion200→100g. Immutable card PNG hashes differ before/after.| Final production check passed; fixture cleanup0issues.|
|#283 exported PNGs|Downloaded actual owner-authorized Storage PNGs,1080×1080. Onephoto65181B SHA7650c49cd704c28b460fce76f3b25c51356a31abc7f39db630a5382ba2ec8067; corrected64670B SHA55d22ee9303a98044c4faf1e251d2373594b867686a5d9b6346338e6ad492fb4; leftovers56584B SHAbe6972b01d3ef8b61ad91b6a64440aa67d90acf877a5ee5fa619cd35a0f408c1. Onephoto and leftovers PNGs literally viewed: complete footer, not DOM-only.| Final production check passed; fixture cleanup0issues.|
|15 Replace|New leftovers attachment POST13:01:29.040; response13:01:29.808; oldphoto DELETE first13:01:29.913, bounded ready retries followed. Newphoto remains, oldphoto removed after attachment. Same image intentionally tests mechanics, not physical portion accuracy.| Final production check passed; fixture cleanup0issues.|
|15 Unmark|Same replacement photo retained; not_eaten becomesfalse; actual reanalysis changed currentitem0g eaten/100g leftover→100g eaten/not_eaten null, ready13:02:30.| Final production check passed; fixture cleanup0issues.|
|16 photo Undo|Remove→Undo418ms, waited beyond6sec; no DELETE, exact photo rows unchanged.| Final production check passed; fixture cleanup0issues.|
|16 correction Undo|Remove→Undo154ms, waited beyond6sec; no revertHTTP, comment still active.| Final production check passed; fixture cleanup0issues.|

**Answer** — Caption propagation, independent Tokyo clocks, water-only calendar dates, actual photo/card swipe and changed correction cards now pass. Actual downloaded one-photo and leftovers PNGs were viewed with complete footers; all four hints appeared once and persisted. Same-fixture Replace/Unmark and both six-second Undo paths passed; final copy and named optimistic saving controls also passed their held/failure/reload cases. Full receipts/images and precise instants are retained with the production evidence.

**Unknown** — Desktop Chrome emulation is not physical-phone acceptance. Identical spaghetti leftovers inputs test mechanics rather than portion-estimation accuracy. #307 remains unproven here: the first observer matched caption text, so its screenshot is excluded; replacement Processing-only samples do not prove original identification streaming. Driver selector/schema mistakes were corrected before the affected checks. Final cleanup13:21:24.866UTC removed9exact owner-bound post/stage IDs,1standalone intake,4copy receipts,1saved snapshot and exact-prefix objects, with no running owned job removed; preferences restored and verified,0issues. No nonfixture records were removed.

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

**Unknown** — Five consistent repeats do not guarantee deterministic future model decisions. Exact designated-account production meals passed12:51–12:53UTC on READY6f857ac: steak180g2705841+butter10g2710154 and spinach90g2709618+corn40g2709917, every component has an actual reference. [Receipt and actual detail images](evidence/run10-matcher-production/README.md). Fixtures cleaned with0issues; #272closed. This does not guarantee future model decisions.

## 7o. Terms (#294)

**Method** — At11:05 UTC ran `git grep -n -F <term> origin/main -- src` for every requested term, the new leftovers label, fixed needs-input question/notices and Days names at e07423537d1bc0f54f1997845e86f014c885ef93. Full file/line/source inventory is [run10-terms.md](run10-terms.md); Recommended cells are deliberately empty.

**Result**

| Measurement | Result |
| --- | --- |
| Published inventory rows | 139 |
| Old exact leftovers label | 0 hits |
| Wording tests | 2 passed,0 failed/skipped |

**Answer** — The instructed leftovers wording is implemented, and all matches at the recorded commit are listed for RT. Generated needs-input questions and localized month/weekday names are identified as dynamic rather than presented as missing fixed strings.

**Unknown** — Final code-merge repeat remains required. No additional terminology recommendation or owner ruling is inferred.

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

**Unknown** — Final phone production checks and eligible closures remain pending. Latest user instruction explicitly excludes #413/Round6 and all superseded desktop-frame differences in #353–#367; those belong to the next design fleet. #360 and #363 are desktop-only and receive no further work here. The table retains historical Fleet9/merged Fleet10 changes for handoff; it is not authorization for more desktop work.
