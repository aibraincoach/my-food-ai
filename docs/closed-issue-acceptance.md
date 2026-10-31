# Closed-issue acceptance audit

Baseline read-only audit captured 2026-10-31T17:03:25.118592+00:00. Main: `edb56d42c8a2b1dad12434a9ae4b46f6820e7a32`. Preserved deployment record: `edb56d42c8a2b1dad12434a9ae4b46f6820e7a32`, `READY` at 2026-10-31T16:33:52.853Z.

The initial baseline used GitHub closure metadata, source and authenticated read-only queries. Later sections explicitly add real production UI writes on runtime `4f51b7afec2ded63374a9615dd6ad5d3b9508bad` and the two demonstration flows through `4598a0ea51f9478ed6fc49d069ef6b5ff7eb7f81`. The baseline read-only limitation does not describe those later tests.

Status reflects the written acceptance condition. Unproven means current production evidence still needs the stated check. Historical closure and implemented code are recorded separately.

| Issue | Actual closure | Implementation merge | Current acceptance | Evidence / remaining gap |
|---|---|---|---|---|
| [#24](https://github.com/aibraincoach/my-food-ai/issues/24) | Direct/manual API, 2026-10-28T23:35:26Z | #80 MERGED `fe7bd84606a66aa3407a084ad11a3931ada49ff8`; #178 MERGED `1fa0af0000ea384fd7e8b1e92ba41984ac28fef3` | **FAILED** | The latest passing20-post numbers are still outside the repository; main docs/load-test.md publishes the earlier7ready/2failed/11queued report and unknown deployed concurrency. The issue was finally closed after that failed run. Current operational drain evidence is positive:20/20ready on attempt1,113.119s creation span, no recorded job errors; this does not repair the published evidence. |
| [#106](https://github.com/aibraincoach/my-food-ai/issues/106) | PR #152, 2026-10-28T13:47:27Z | #152 MERGED `9aeb9ae4856c38f44c5b096735b52810e11f93ac` | **UNPROVEN** | Historical production acceptance exists on cd21e6be; latest main retains capture When/library flow and detail Time eaten, which was present in the current read-only detail response. The create-at08:30/edit-time/order sequence has not been rerun on the current deployed head. |
| [#107](https://github.com/aibraincoach/my-food-ai/issues/107) | PR #154, 2026-10-28T14:00:47Z | #154 MERGED `56f9d554f763dde528f36352e7eb84953e7f4dcb` | **UNPROVEN** | Main renders a Details control unconditionally, photo links via DoubleTap and expanded analysis via a details link. Current existing owned detail GET returned200. A native current-production navigation/affordance check across card states and the new-user done condition is not recorded. |
| [#109](https://github.com/aibraincoach/my-food-ai/issues/109) | PR #159, 2026-10-28T14:11:10Z | #159 MERGED `c7fb17b587f5e581366556f65aa2831dff48e7bf` | **MET** | Current production Home HTTP200 rendered seven day bubbles. In Asia/Tokyo, today2026-11-01 had owned posts and the today circle contained border-2 border-text bg-text text-surface. Main explicitly preserves a logged-day marker even if the feed is empty. |
| [#13](https://github.com/aibraincoach/my-food-ai/issues/13) | PR #82, 2026-10-28T05:13:04Z | #82 MERGED `a557a4b8bdc43f095a9d895b84b7e55cfc1e8e7f` | **UNPROVEN** | Current owned photo detail HTTP200 exposes Outlines,an item edit control,Add another item,Time eaten,nutrition and comments. Main generates outline PNGs and implements immutable supersede/edit SQL. Current-production portion mutation,updated totals and retained original thread were not exercised in this read-only audit. |
| [#14](https://github.com/aibraincoach/my-food-ai/issues/14) | PR #86, 2026-10-28T08:19:24Z | #86 MERGED `26e4445fd2d61b9d8f1a68453bab77e3c76b0235` | **UNPROVEN** | Main has comment composer,append-only correction RPC,worker correction commit and a thread subscription/poll fallback. Current read-only detail renders the comments section. No current production correction→new model reply with preserved original/revision and measured wait is recorded. |
| [#15](https://github.com/aibraincoach/my-food-ai/issues/15) | PR #90, 2026-10-28T08:40:04Z | #90 MERGED `5fb8bea0dcd621a63c5438fb5956820417e61e04` | **UNPROVEN** | Merged feedback implementation and current optimistic revision guards exist. DoubleTap delegates up-votes; down-vote navigates to reply=1 and the thread marks the accepted model revision. Current production gesture→stored row→focus→reload behavior was not exercised because these are writes. |
| [#11](https://github.com/aibraincoach/my-food-ai/issues/11) | Direct/manual API, 2026-10-28T09:41:15Z | #83 MERGED `a0c1502031bdd99f50771552b1b0016b71ad4b44` | **UNPROVEN** | Main contains local post-created handling,Realtime/per-card updates and bounded discovery polling. A successful API load run proves jobs complete,not that a newly posted card appears/updates in a live browser. docs/demo.md still marks the full production sequence not run. |
| [#108](https://github.com/aibraincoach/my-food-ai/issues/108) | PR #157, 2026-10-28T14:03:40Z | #157 MERGED `b70458efeffc0817fd7c5bf9a2be3af8c6aafa0f` | **UNPROVEN** | Main declares viewport-fit=cover and safe-area utilities on header,bar and sheets; current Home/detail HTML includes viewport-fit=cover. Server emulation and CSS presence do not demonstrate installed-iPhone clock/notch/home-indicator clearance at both requested sizes. |
| [#22](https://github.com/aibraincoach/my-food-ai/issues/22) | Direct/manual API, 2026-10-28T12:21:25Z | #94 MERGED `5801ec87abad64ca0d72e8bc40143cc3e3237d43` | **UNPROVEN** | PR94 was merged and main wires installed-only first-post prompting,subscription storage,worker delivery and notification-click navigation. Its final PR body explicitly leaves physical delivery pending. Generic-title-only payload was an accepted privacy waiver; the stale backlog claim that94is unmerged is false. No actual backgrounded installed-device delivery/open evidence is recorded. |

All recorded implementation merges above are ancestors of current main. None of these ten issues is supported solely by an unmerged implementation PR. Direct closures have no attached closing PR in GitHub’s ClosedEvent; associated merged work is identified from the contemporaneous closure comment/cross-reference.
#24 history: direct close 2026-10-28T09:41:20Z, reopen 10:24:45Z, final direct close 23:35:26Z. Its final closure comment explicitly records the failed run.
#22 correction: #94 merged at2026-10-28T12:21:19Z; direct issue close followed at12:21:25Z. The earlier STOPPED comment describes an older head and is superseded by the merged head and its tracked waivers.

Read-only current production proof: Home HTTP200,seven day bubbles,today’s owned-post marker filled;owned photo detail HTTP200with outlines/edit/add/time/nutrition/comments controls. See the preserved private read-only-production artifact. No UI mutation was performed.

The Oct30 #106 production PASS is retained as historical acceptance evidence: https://github.com/aibraincoach/my-food-ai/issues/106#issuecomment-6522508021 . It is not a fresh full time-flow test on current main.

At that baseline cutoff, additional UI checks were still pending; later authorized checks and their runtime boundaries appear below.


Fresh production UI supplement (Oct31,18:02–18:07UTC)

Deployment:4f51b7afec2ded63374a9615dd6ad5d3b9508bad, READY. Original Firefox at390×844 in America/Edmonton; configured test account2 only. Notifications were denied, subscriptions count was zero, and no manual tick or retry occurred.

| Issue | Fresh result | Limit |
|---|---|---|
| #11 | MET: real photo appeared within2.874seconds of publication; ready event after59.129seconds. Caption ready after43.523seconds. Existing feed updated without a user reload or navigation. | Later matcher changes require their own evaluation; this evidence is bound to4f51. |
| #106 | MET using historical exact08:30story proof plus fresh actual08:30capture/detail,07:30edit persistence and feed reorder against08:00reference. Fresh Today story showed07:30/08:00and Search showed07:30coffee. | Exact08:30story was not captured fresh before editing. |
| #15 | MET: feedback initially absent; real photo double-tap stored up on the current revision. Visible down stored down and focused comment-field. Visible up stored up; Accepted survived full navigation. | No fabricated model revision or feedback row was used. |
| #109 | MET: Today's marker filled for two genuine posts; six preceding empty days stayed unmarked. | Device-local date recorded. |
| #107 | Visible controls and actual navigation all passed: Details on queued/processing/ready photo and caption cards, photo single-tap and expanded-analysis link. | Overall unfamiliar-user condition remains UNPROVEN without an independent novice participant. |
| #13/#14 | Subsequent actual production outline/portion and thread demonstrations are recorded below and in demo.md. | Baseline did not exercise these writes. |
| #108/#22 | UNPROVEN. | No installed-iPhone hardware or real background notification-delivery test. Desktop CSS and denied notifications do not establish these conditions. |

Authorization: account2's request for account1's demo post rendered only404/not-found, with zero images and no meal editing. The ordinary post HTTP response was200because not-found streamed; it is not claimed as transport404. The admin trace request returned actualHTTP404,9bytes and no trace.

See test2-ui/README.md and acceptance-summary.json for exact identifiers, timestamps and evidence filenames. The temporary context, user context, BiDi session and controller were closed. Original authenticated Firefox remains available for independent reviews. Test-owned posts remain as evidence pending root's cleanup coordination. No application code changed.


Worker production demonstration update

#13 MET: actual account1 outline/photo-region click opened Edit meal item. The initial automatic unavailable match remains a recorded failure. A deliberate manual Pasta,cooked reference at200g gave314kcal; a separate actual outline→portion edit to100g gave157kcal. Three immutable item-lineage rows retained the original model row; original thread text remained and the stored card PNG hash changed. This proves the user-edit workflow,not automatic matching correctness.

#14 MET: actual plain-language correction to150grams produced user and model thread entries4.367seconds apart,150g/235.5kcal(displayed236),four lineage rows,preserved original analysis and another changed card hash. The real UI showed original,user and new-model texts.

Evidence: demo/run1/before-edit.json,after-manual-reference.json,after-portion.json,after-thread.json,ui-evidence.json. Audit totals now6MET,1FAILED(publication pending252merge),3UNPROVEN(#107independentnovice,#108physicaliPhone,#22physicalpush).


Issue/backlog description mismatch

The actual closed GitHub #11 is Feed,whose instant-insertion/analysis-update condition passed. The pasted backlog row labelled #11 describes Home frame restyling across all states. That different acceptance remains UNPROVEN here: passing a new-post feed transition does not prove every Home state matches the designer frames. The issue number is not used to silently close the separate design claim.


## Publication and final demonstration reconciliation

The historical #24 drain evidence is now published in [load-test.md](load-test.md): twenty posts within two minutes, concurrency 1, all ready on attempt 1, durable automatic wake independently observed. It is no longer only an external artifact. #13 and #14 actual edits, retained history and changed stored cards were also repeated on the final runtime as recorded in [demo.md](demo.md).

Final acceptance disposition: #24, #106, #109, #13, #14, #15 and the actual live-feed condition of #11 have production evidence. #107 unfamiliar-human discoverability, #108 installed-iPhone hardware and #22 physical background push remain unproven. Do not equate the live GitHub #11 Feed condition with every Home-frame state described in the backlog. All initial baseline failures and subsequent repairs above remain visible as history.
