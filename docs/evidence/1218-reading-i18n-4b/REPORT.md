# Reading screens: Japanese and English, slice 4b

Days/calendar/story, desktop Days/Today/navigation, Search, Profile, Agents, deleted meals and the two admin pages now use the selected language. Base is unmodified main `5a99d435d43cc212522135118349a03b9b26e3cd`, after the separate #1345 provider hotfix (#1346). Its built tree equals the baseline app's tree; no repaired baseline is used.

188 keys added, 1,090 per locale. The PM drafted nine batches (192 draft entries; four duplicate navigation entries reuse existing keys). The reviewer independently double-read every batch, and the accepted corrections are installed. Batches 1–8 cover Days/navigation, desktop/Search/Profile, Agents and Deleted/admin; batch 9 supplies `admin.seconds`. The PM ruled `{amount}秒` without a space; kcal/ms/g retain their spaces. Japanese has not been reviewed by a native speaker.

## Scope and providers

34 files leave the deferred lint scope and enter enforced reading targets. A planted visible literal is rejected in each target. `HELD_FOR_OWNER_WORDING` is unchanged. Root siblings carry the complete feed/post/postMenu/hints/navigation/shortcuts/search namespaces. Exactly eight previously drafted desktop-chrome keys move unchanged from days to shortcuts; Days stays on routes that render it. The root omission guard is red without shortcuts. Agents extends the single hotfix layout provider with agents + postMenu; no duplicate nesting.

Minified UTF-8 JSON bytes for the two root provider objects (not network transfer, RSC serialization or timing):

| Locale | Root siblings | Children provider | Sum, including repeated navigation |
|---|---:|---:|---:|
| en | 13,255 | 1,795 | 15,050 |
| ja | 16,726 | 2,207 | 18,933 |

Date/number formatting moves to the active locale in DaysView, MonthGrid, PhoneCalendar, StoryPlayer, DesktopDays, DesktopToday and AgentList. AgentList previously used the device locale; its output matches under the English acceptance browser. Time zones remain unchanged. All seven newly added plural messages have 0/1/2 goldens in both locales, including the calendar sentence; its six flag branches are covered too. Calendar first-of-month tokens localize (Nov 1 → 11月1日). Unused postedLabel/formatDayKcal paths are removed.

## Browser evidence

All tests use disposable loopback accounts and scripted local providers. Mobile is 390×844; desktop Days/Today/Search is 1280px wide. Playwright WebKit is not Safari or a real phone.

| Check | Result |
|---|---|
| Chromium English text/visible aria/input parity | All 21 states identical to unmodified main |
| Chromium Japanese | 19 reading states plus the two admin states pass; zero application errors in final receipts |
| WebKit English | All states functionally covered; earlier 18 retained, Agents/Deleted transition repeated on base/head with refresh waits; head admin/admin-trace pass fixed English goldens |
| WebKit Japanese | All 21 text/flow/Latin audits pass; three RSC access-control errors remain, so runtime is not clean |
| First-use hints / #1320 | Four functional cases pass in each engine; WebKit records seven background access-control/Load failed errors, including sw.js, disclosed in #1343 |
| Comment send | English/Japanese pass in each engine, including double-tap; one request per action; all four exact IDs/bodies/author fields verified in DB |
| Voice post and rendered result | Both locales/engines pass; scripted native transcription reaches the app route; rendered 200 kcal equals API/item 200 kcal; synthetic microphone in WebKit |
| #1283 worker update under camera | Pass: draft survives, API 200, no reload under capture; activation 40ms in this local run |
| #1285 failed frame | WebKit recovery passes; synthetic video/frame failure, not hardware proof |
| #1284 page return | WebKit synthetic persisted pagehide/pageshow passes, not actual BFcache proof |
| #1287 auth/cleared text/isolated tab | Three cases pass in each engine; WebKit clear-text records five access-control errors (the other five runs record zero), retained in the receipt |

English snapshots acknowledge Realtime subscriptions with no data events, because the local stack has no Realtime server. The PM approved the same transport for Japanese while keeping its normal service worker. This is wording/flow proof, not Realtime-event correctness. Initial Japanese handshake 404s are retained as setup failures.

Only named per-minute clock nodes and the oldest-job age are normalized for Chromium admin parity. Each original value and the number of masked nodes per side are recorded; job counts are retained. An extra WebKit comparison crossed a minute boundary and moved live job counts between bins. That receipt is retained without a WebKit cross-build stats-equality claim. WebKit head admin checks fixed English headings/labels/row names instead; counts are excluded only from that label golden. Trace labels and controlled fixture values also match fixed English goldens.

The initial Days snapshot sampled different effect phases. The planner approved an identical bounded geometry-to-heading wait on both sides, with rects/scrollTop/computed month recorded. Both settle on October while November 24 is visible; this existing main defect is #1347 and is not fixed here. The English snapshots then match, including identical geometry.

Initial WebKit Revoke/Restore transitions navigated while router.refresh was pending. The approved setup awaits the corresponding RSC response finishing, then the existing two-frame settle, identically on base/head. Agents' earlier cause is inferred from timing, not proved. The rerun had zero application errors on English base/head. The full Japanese run still records three Agents-link RSC access-control errors at 20:08:37.016Z, after a 200 refresh, with closing=false and last navigation to /profile/agents at 20:08:36.875Z. No exclusion, fix or rerun was made. They are attached to #1343, now titled “WebKit local access-control errors around worker and RSC navigation”; cancelled prefetches are a lead, not a cause claim. The WebKit viewport warning is recorded separately. #1338 and #1340 remain open; no repeated observation-window claim is made.

Overflow candidates are retained: screen-reader-only Search headings, a long scrollable search input and existing ellipsized stored handles. The Japanese sign-out label narrows the handle slot (178px versus 208.5px in the English fixture); truncation already exists on main. No new translated-prose clipping was found at 390px, and no layout was redesigned.

## Exact Japanese audit exceptions

Application prose, aria labels and placeholders are audited. The following exceptions are explicit:

- Stored/model/server wording: `[data-i18n-stored]`, `[data-i18n-server-wording]`, `[data-nutrition-disclosure]`, `[data-day-nutrition-disclosure]`; Search's held server summary `main p[class="mt-[6px] text-detail"]`.
- Admin stored technical data: `main pre`, `main a[href^="/admin/posts/"]`, `main > p.break-all`, `main > ol > li > h2`. `main time[datetime]` is excepted only when its text exactly equals its persisted ISO timestamp attribute (including offset form).
- One-time token values: `textarea[readonly]`; their translated accessible labels remain audited and screenshots mask the value.
- Stored handle initials: `span[aria-hidden="true"].rounded-circle`, only when the text exactly equals the fixture's stored-handle initial. Other handle occurrences remove only that exact stored handle.
- Keyboard glyphs, PM ruling 19:59Z: `aside button kbd`; `dialog[aria-labelledby="shortcuts-title"] kbd`; `aside nav a[href="/days"] > span:last-child`; `main form label > kbd`; `main .desktop-days button > kbd`. Only N, D, ?, J / K, Enter, Esc, /, ← → and ↑ ↓ are allowed. Key labels are not translated.
- Brand/proper names and units: My Food AI, Muse Spark Open, Muse Spark 1.3, Muse Voice Transcribe 1.0, SAM 3.1, Meta, Baseten, Claude, Open Food Facts, AI; kcal/ml/mg/g/ms/UTC/FDC/ID. Fixed UI wording outside these exceptions must be Japanese.

## Checks and cleanup

Fresh guarded production build (explicit exit 0), 1,090-key message/namespace gates, TypeScript and scoped lint pass. The all-route guard covers 25 entries / 235 source files. 109 existing reading/import-consumer/planted-literal tests pass; 15 namespace/new-message tests passed after rebase, with final counted-message goldens extended to include calendar 0/1/2. The 24 original tests in six adapted harness files retain all 79 assertions; one supplied-scope expression changes while its missing-capture expectation stays the same. See assertions.md. No full-suite green claim is made.

All fourteen owned fixture ledgers have zero cleanup readbacks for users, profiles, posts, drafts, jobs, media, comments, storage and sessions; extended token/activity/search-trace readbacks are zero. Both comment pairs were verified before deletion. Owned app/model/proxy services stopped; shared local stack retained. No production role/schema/data change is part of this PR. No external model/review calls were made. Server strings and stored text remain for slice 5/#1219. Final plan pin: `92b265e2eadf3014aca2d0fce086eb79680ab1677e74efc398d219a9bc33183f`.

Private raw receipts and batch corrections: state/build/1218-slice4b/ under the rig's shared-docs root. Native speaker, real-device camera/microphone/keyboard and regional nuance remain unproved.
