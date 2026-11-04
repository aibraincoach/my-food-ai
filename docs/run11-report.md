# Fleet 11 execution report

Plan: [plan-run11.md](plan-run11.md). Baseline `e9bea0aed7cd12dd9093d2e30212c85eb57382a2`. PR #475 remains open and unmerged. This report distinguishes shipped code, observed acceptance, and owner-only or unavailable evidence.

## Items 0–18

| Item | Result and evidence |
|---|---|
| 0 | Done: verbatim plan and this report on the open docs PR #475. |
| 1 | Done: #476; eight genuine production uploads reached ready, with eight correctly scoped names-before-total observations. [Session and cleanup](evidence/run11-eight-photos/session.json). |
| 2 | Done: #477; migration0046 applied and [read back](evidence/run11/0046-production-readback.txt). Eight-photo session had zero cap messages. Two additional real drink photos deliberately awaited identify200, proving independent drink_identify2 versus post26 buckets. [Additional session](evidence/run11-drink-bucket/session.json). |
| 3 | Verified: #490 repairs model/evidence tables, links, uploads lint ignore and stale cap/cache fixtures. [Final checks](evidence/run11-final-checks/verification.json): product build passed, full suite573passed/0failed/6existing skips, database34passed/0failed/0skips, lint0errors/6warnings. README counts updated and exact-head independently cleared; #490 merged. README private-string search found159hits/49files, all contextualized in PR body; no actual credentials identified. Owner keep-list/read remains RT. |
| 4 | Done in emulation on production: #480, codes7622300761363 and8992760221028, OFF product/nutrition and attribution links in capture and expanded detail. [Receipt](evidence/run11-barcodes/checks.json). Owner three-phone/shelf acceptance remains#379. |
| 5 | Code and replacement-fixture production acceptance done: #478. Genuine Indonesian and English reads became cards with printed values. [Cards and cleanup](evidence/run11-labels/cards.json), [before/after responses](evidence/run11-labels/responses.json). Original Goldfish photo unavailable; exact original failure and owner phones remain unverified, so#452 stays open. |
| 6 | Done: #479, production busy-camera white prompt on rgba(26,25,23,.7) rounded22 scrim. [Screenshot](evidence/run11-barcodes/prompt-busy.png). Owner phones remain#379. |
| 7 | Done: #482, production61 continuous dates, month markers, visible today, October jump and Oct27 deep link. [Production geometry](evidence/run11-phone-production/checks.json). |
| 8 | Done code: #485; six shared PNG renderer outputs and actual production drink cards. [PNG receipts](evidence/run11-drink-png/receipts.json). Alcohol summary follow-up#493 is merged and production-proved. |
| 9 | Done code/repair: #481; tiki source1057 really15.4mg, repaired caffeine0. [Final tiki projection](evidence/run11/tiki-repair.json). Settled production wine has0caffeine; see [typed proof](evidence/run11-typed-alcohol-settled/session.json). |
| 10 | #486 shipped; migration0047 applied and [read back](evidence/run11/0047-production-readback.txt). Cocktail photo showed15g alcohol/1.1standards and0water. [Session](evidence/run11-alcohol-photo/session.json). #493 fixes a discovered feed summary disagreement. Settled typed [Bintang/wine](evidence/run11-typed-alcohol-settled/session.json) show13g/16g,29g Today, correct beer/wine glyphs and perfixture water0. Final [cocktail card and summary](evidence/run11-alcohol-photo-final/session.json) agree15g/1.1standards after reload. |
| 11 | Done: #483; production450px viewport shows focused captiony170–212,72px thumbnail, Posty370–420 without overlap. [Production check](evidence/run11-phone-production/checks.json). Physical keyboard checks remain RT. |
| 12 | #487 and offline follow-up#492 shipped. Ten Slow4G Log-again trials closed/inserted before response; ten copies persisted. [Timings](evidence/run11-saving/timings.json). Bookmark/menu/caption each changed before response and persisted reload: [trials](evidence/run11-saving/other-saves.json). Menu/caption visibly failed offline. Matched settled old build hard-navigated offline; fixed build retained failed card/Tryagain: [old](evidence/run11-saving/offline-before-settled.json), [fixed](evidence/run11-saving/offline-settled.json). [Final production offline](evidence/run11-saving/offline-production.json) passes; [settled Bookmark](evidence/run11-saving/bookmark-settled.json) also displays offline failure. |
| 13 | Measurements recorded below; unavailable attribution/usage and240fps limits are not claimed complete. |
| 14 | Done: #488 scripted Meta refusal→failed card→owner Tryagain→ready; USDA429 requeued with RetryAfter120 and attempts0. [Integration](evidence/run11-recovery/integration.txt), [actual local UI](evidence/run11-recovery/ui.json). Scripted providers were isolated locally; no live provider was fault-injected. |
| 15 | Evidence-backed closures listed below; RT-only issues stay open. |
| 16 | Reviews and merge records below. Done: final checks, exact-head reviews, merges and cleanup verified. |
| 17 | Done at exact#462head905b47414efd119ba27b22782af647aa2059619f: Today right1068≤1100, no horizontal overflow or overflowing children. [Geometry](evidence/run11-today/geometry.json). No LaneN needed. |
| 18 | Done code and two scoped repairs, owner UI acceptance incomplete: #484. All ten inspected; PepsiZero now330ml/32mg, Evian500ml beside espresso30ml/64mg. [Before](evidence/run11/drink-gaps-before.json), [repair](evidence/run11/drink-gaps-repair.json), [after](evidence/run11/drink-gaps-after.json). Owners are neither designated test account, so no impersonation;#377 remains open. |

## Premises

| Premise | Finding |
|---|---|
| P1 | Supported for the two tested products; insufficient to establish “most Indonesian packs.” Both real codes returned usable OFF products. |
| P2 | True: tiki USDA2710626, categoryliquor and cocktails, nutrient1057=15.400000000000002mg, previously stored15mg caffeine. |
| P3 | Unproven: original Goldfish fixture/response unavailable. Unchanged Indonesian replacement succeeded both before and after, so it does not establish the original cause. |
| P4 | True: minute-filtered Management Logs queries work. Attribution to one browser opening remains unresolved because global traffic overlaps. |
| P5 | False at card-data.ts boundary: hydration recognized complete linked drink items, but standalone builder trusted supplied kind/drink. #485 adds recognition and retains hydrated drink metadata. |

## Measurements and practical limits

- 13a/#368: [management summary](evidence/run11-measurements/management-summary.json). Address fields present.24h query:419token records,337password logins,3actors,6addresses. Logs do not distinguish direct SDK probes from server actions; shared-rate-limit causality unknown. No production sign-in/sign-up form submitted.
- 13b/#372: [media-loading.md](media-loading.md). Matched strip bytes497591→63720 (87.19% reduction). Natural-feed cache0-byte reopen used different images/path and is not a controlled compression comparison. Real phone/mobile-data acceptance remains RT.
- 13c/13e/#373/#375: usage API404; dashboard Usage required an authenticated dashboard session. [Dashboard receipt](evidence/run11-measurements/dashboard-usage.json). Log-ingestion bytes/storage egress attribution unavailable; issues stay open.
- 13d/#374: empty-claim loop began37c8dd4ec (Oct27), subsequently replaced by retained7e73cd1. This history does not prove#222causality. Issue closed with pinned history.
- 13f/#322: [tick-cold.md](tick-cold.md). Eager0.809013/0.230098/0.164041s; lazy0.531299/0.256762/0.178981s, all200. These are first observed fresh-preview requests, not platform-instrumented cold-process distributions. Throwaway#489closed without merge; both branches/worktrees removed.
- 13g/13h/#323/#324: [isolated browser minutes](evidence/run11-measurements/page-open-counts.json). Browser auth1 per Home/Days/Profile; browser direct daytotals0. Global auth35/18/20 and daytotals4/0/0 include unrelated traffic; combined per-opening counts unproved. Forged unsigned verified-user header307→sign-in. Issues remain open.
- 13i/#217: [144-row extension](evidence/run10-taps-final/fleet11-control-table-extension.md), [method](evidence/run10-taps-final/fleet11-runtime-method.md).129 distinct valid targets showed pressed feedback0.8–46.6ms at390×844 CPU4.19 historical rows had observed movement, including expected dismissal/navigation. #491 adds12lines of shared pressed feedback. [Production smoke](evidence/run10-taps-final/fleet11-production-touch-smoke.md): five controls5.2–10.6ms. Actual rAF7.2–108.2Hz (median52); requested240fps was not achieved. Whole-viewport subframe flicker and physical-phone feel remain unverified. Exact three posts/one object removed and preferences restored. No further product defects established by sweep.

## Review and merge ledger

All merged product heads have successful checks and an independent non-OpenAI zero-blocker verdict for the exact SHA. Final #490 used the authorized AGY Gemini3.8Flash-high fallback after PPLX hit its weekly quota; the invalid OpenAI fallback output is explicitly excluded. The completed review chain covers the prior source/test review, unique429fixture delta, and final count-only README head. Receipts distinguish preliminary/incomplete captures from actual clearances; see [review ledger](reviews/run11-review-ledger.json) and PR comments. Each merge was followed by merging current main into remaining open Fleet11 code branches.

| PR | Reviewed head | Merge commit/state |
|---|---|---|
| #476 | `ed4904e300c780cd8efbdb9e92da204bddc0bd10` | `153e83b56b07382cb1d96eca43746b667c1debfd` |
| #477 | `1822af0c76888e745c52c807dfdb78d63f8c1a50` | `c4a2e0f112faaa592ab248cb7773e1cbb9081aca` |
| #478 | `765eb4751e7103464d826626bf281013c427d571` | `eca1a5de84768961b658fb6a7e760454e4690662` |
| #479 | `8d8e92cb013bf6c29c9976bba4bc39eaac8431bb` | `a22ffade4f0e138c1f30380c6c3bf7c15b2263d5` |
| #480 | `321d5de102241a1a99fd04de28d9b6c2c2d9f4ef` | `cfb86aa72c671b11cb77a836a499b210335b771b` |
| #481 | `86281731c68bd517a6b2ff6bfd216c8adf176632` | `db73ad2b4953005d165d8a4ae9ed7c05ce4d7c27` |
| #482 | `8911dc11ba5d75c055e232c718a59daf91306e3c` | `cf18bd6b69453751431fa2915fac5ca3dd5d5075` |
| #483 | `7e53660bbf9cfd1f9d006913d3d868dcc798032b` | `a005f7a02c618e0cf37861bf325759af5778ad6c` |
| #484 | `b1454d9291acef9e5478816c4a645178f0b948ac` | `f81987f9ffccd09cc701acbdd40ccf87732dd48a` |
| #485 | `0f0b11b8ef21d92119ef02efdfaba64d0f48a4f0` | `2224eeb1313fd1677cc0b6aba77947f9bb05b8e3` |
| #486 | `722bf3e76e6c22e0f0b658da0ff5709fab9d5422` | `373864093db4d538dad282bd3d6f0403ab7697a3` |
| #487 | `1d74990b882fe6726cd4c8f1cff51703cb413a05` | `a6ccc853463e3bd1307e65f6be404a414d8d8b4e` |
| #488 | `900d2890a0845fe2c6b442b366f59f00ecf69058` | `55dc564f53f91cdde1d4ec188e656b439137011f` |
| #490 | `89840003183bff259a10fa40587c1a6e0421b3aa` | `ca07be7014431d492039dafdda80186a2c697fb7` |
| #491 | `9cb34b7749bd62d8790416d0dec2da2d8ce9ccd8` | `4083f1a57138ce2b98a060339363b810894e4540` |
| #492 | `82eef7d97d72c6b25f12c3d0b840fe83c97094b9` | `504de467557692530e6a11b9b4b2e3e89f991ac6` |
| #493 | `1fd7327626ae096ff7d0c4fadd82c626aa554236` | `6614fe29a8d2cf78b701e23f163a5acab2362988` |

## Closures and remaining owner work

Closed with evidence: #374,#413,#360,#363,#449,#307,#451,#453,#454,#458,#322,#455,#456,#457,#306,#282,#450,#369,#287. #193 was already closed. #379 holds real-phone/mobile-data acceptance, camera dismissal#370 and owner three-phone checks. README closures#450/#369/#287 completed after final checks/merge; owner reading stays#318. #306 closed with final production save proof. #282 closed after the final isolated regression run. #455/#456/#457 closed with settled alcohol evidence. #452 remains for original Goldfish fixture/phones; #377 remains for actual-owner card/day totals. #368/#372/#373/#375/#323/#324 retain stated evidence gaps.

RT-only scope preserved: #285,#318,#26,#379,#281,#348,#351,#294,#60 keep list. CAPTCHA/Auth settings,#114Facebook,#115dark mode,#218hydration share were untouched. No recording hold was received.

## Cleanup

Original main untracked `docs/reviews/mfa-pplx-pr311-e7ece5c.md` preserved. Each runtime receipt counts its exact fixtures. [Draft cleanup](evidence/run11/fixture-draft-cleanup.json) additionally removed13 scoped published upload receipts, followed by [one final cocktail receipt](evidence/run11/fixture-draft-cleanup-final.json); zero matching drafts remain. Historical production repairs were limited to the three authorized posts. Existing backfill script has no scoped ID arguments, so its same syncItemDrinks helper was invoked directly for those exact IDs; no broad backfill ran.

Preview bypass revokedHTTP200 ([receipt](evidence/run11/preview-bypass-revoked.json)); no automation bypass remains. Only the main checkout remains. Local stack and generated test build stopped/removed; disposable credentials/data removed. Final cleanup.sh completed. [Final cleanup receipt](evidence/run11-final-checks/cleanup.json) verifies only the main checkout, only the original untracked file, no Fleet11 local branches, and no listening disposable ports. This final evidence commit was created using a separate temporary Git index after worktree removal, so no new checkout was introduced. Private credentials/raw logs remain outside tracked artifacts. Report PR475 and pre-existing owner docs PR474 stay open.
