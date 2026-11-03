# Post–Run 7 backlog reconciliation

Observed against `origin/main` `58d127b999163bfb8212fa8145482ae875ed2276` and live GitHub issue states on November 3, 2026. This report supersedes the pre-merge status in [the Part 1 report](run7-part1-report.md) and [verification](run7-verification.md); their measurements remain historical evidence.

## Source and actual merge state

The Claude artifact at https://claude.ai/artifact/GLGKcBQJCtDa11MFhCGtjk could not be read: the web tool returned an inaccessible-page error. `BACKLOG.md` uses the complete **11:03 WIB text supplied in the owner's message**, not a claimed live artifact fetch. The updated Pro-plan paragraph replaces the 10:42 free-quota paragraph. The only reconciliation removal from that supplied snapshot is #139, already closed by merged #312. Other open items remain until their GitHub issues close; implementation alone does not remove them.

PRs #309, #311, #312, #313, #314, #315 and #308 merged. **#310 closed unmerged**, superseded by #311. [Final execution receipt](https://github.com/aibraincoach/my-food-ai/pull/308#issuecomment-6595115026) records migrations 0034, 0033 and 0032 applied, provider environment names configured, and production READY at the revision above. Both designated accounts opened their feeds. One caption post used Baseten and displayed its committed Open model identity; the account switch was restored Off. This was a small smoke check, not the remaining full acceptance matrix.

## Run 7 issues: actual state and missing check

Only **#139** of the eleven requested issues closed with these merges. All ten others below are still GitHub OPEN.

| Issue | Merged work | Exact outstanding acceptance or reconciliation |
| --- | --- | --- |
| [#222](https://github.com/aibraincoach/my-food-ai/issues/222) | #311 | Run 100 controlled **browser openings** on the largest account with zero failed/blank feeds. Existing 100/100 API and Home HTTP repetitions do not establish this. On a physical phone over mobile data, show a feed within 2 s and the first decoded photo within 2 s, with before/after sizes and times. Final local cold photo was 2,096.9 ms; original production failure was not isolated. |
| [#304](https://github.com/aibraincoach/my-food-ai/issues/304) | #311 | Open the installed app on a throttled connection: retained signed-in feed appears within 2 s, fresh posts replace it without jumping, and controls remain usable during refresh. Local delayed-server/cache checks passed; installed-phone acceptance is absent. |
| [#305](https://github.com/aibraincoach/my-food-ai/issues/305) | #311 | Physical mobile-data first photo within 2 s, lower photos demonstrably do not delay it, and a second visit serves the same photos from the phone cache. Local cold photo missed at 2,096.9 ms; warm 620.4 ms and 21,610-byte WebP are local observations. Final private-image logout/new-tab/browser-restart behavior has unit coverage, but its actual-browser matrix was not rerun on that final route. |
| [#281](https://github.com/aibraincoach/my-food-ai/issues/281) | #315 | The owner must see the Open path work on production. Coder production smoke, switch, committed model ID and eleven-case trial are recorded; the receipt does not establish owner observation. No implementation gap is inferred from the still-open issue. |
| [#316](https://github.com/aibraincoach/my-food-ai/issues/316) | #309 | Record a production check on **both sign-in and sign-up**: Facebook is gray, tapping causes no action/request/navigation, and no error appears. Built-app checks passed. The final production receipt does not record this check, so production acceptance is unconfirmed. |
| [#306](https://github.com/aibraincoach/my-food-ai/issues/306) | #314 | On throttled production, verify thumbs, bookmark, Save meal, Log again and Edit caption change visibly before the response; successful states survive reload; failed saves show an error and revert. Local immediate-state/mocked-failure evidence is not this complete production matrix. |
| [#307](https://github.com/aibraincoach/my-food-ai/issues/307) | #313 | Observe a production post during processing: names appear before nutrition finishes, foods fill in incrementally, and no total appears before all food calculations complete. The production Open caption reached ready, but the receipt does not record those intermediate transitions. |
| [#139](https://github.com/aibraincoach/my-food-ai/issues/139) | #312; CLOSED | No missing closure check. Local database gates cover renewal/ownership and the issue closed with #312. See the SQL correction below. |
| [#282](https://github.com/aibraincoach/my-food-ai/issues/282) | #312 | Exercise a Meta refusal and a USDA 429 through the deployed flow: readable message, usable retry/recovery, and actual deferral according to Retry-After. Unit/local SQL coverage exists; production failure-path acceptance is not recorded. |
| [#287](https://github.com/aibraincoach/my-food-ai/issues/287) | #308 | README is written and merged. Finish the claim/link audit against each scoring criterion and current deployed behavior, then record closure. The model/provenance, evaluation, tests, timing, history and limits links exist; explicit criterion coverage still needs sign-off. Its statement that Run 7 deployment is unproven is superseded by the final execution receipt and needs updating. Owner reading is separately #318. |
| [#60](https://github.com/aibraincoach/my-food-ai/issues/60) | #308 | Start-here README is merged. Complete the post-feature search of main for host names, account identifiers and billing detail and record which occurrences the owner chose to retain. No complete owner-approved disposition is recorded. Keep contracts, Wall, review policy and tools. |

Performance source: [Part 1 report](run7-part1-report.md), [media measurements](media-loading.md). Trial: [Open model evaluation](open-weights.md). Production boundary: [final execution receipt](https://github.com/aibraincoach/my-food-ai/pull/308#issuecomment-6595115026). Missing checks above describe absent evidence; they are not claims that deployed features fail.

## Early items: implementation is separate from acceptance

All eleven requested early issues remain GitHub OPEN. A screen's existence does not prove its entire frame/audit condition.

| Issue | Built and merged, or not built? | Remaining scope |
| --- | --- | --- |
| #2 | Built and merged: #33 shell, #55 themed shell/PWA; later navigation refinements. | Full current 390px frame comparison and physical-phone installation acceptance. Do not call the existing shell unstyled. |
| #3 | Built and merged: #34 auth, #71 styled auth; #309 inert Facebook. | Current designer-frame comparison of both auth pages and working sign-in/sign-up acceptance. |
| #6 | Built and merged: #36 capture, #56 styled capture/event; #206/#298 later capture modes. | Complete current 390px frame acceptance and successful posting, including revised capture states. |
| #11 | Built and merged: #68 Home styling, #83 live Feed, #311 opening changes. | Full Home-state comparison against the designer frames. Historical production new-card/update acceptance passed; it does not cover every frame state. |
| #18 | Built and merged: #87 calendar/stories, #204 month list and dismissible stories. | Exact requested week with three logged days, matching bubbles, story navigation and final consumed totals. |
| #20 | Built and merged: #81 Profile grid; current `ProfileGrid.tsx` has three columns and post-detail links. | Current account grid/order/navigation and no-progress-language acceptance. Profile now also has explicitly added agent/provider controls; reconcile the old “nothing else” scope rather than claiming an exact match. |
| #23 | Built and merged: #92 original three hints; #298 adds a separate capture-modes hint. | Fresh-account once-only persistence test. The current implementation has **four hint keys**, so “exactly three tooltips across its first session” needs scope reconciliation with the authorized modes hint. |
| #107 | Built and merged: #154 Details/photo/analysis entrypoints. | An unfamiliar new user opens detail without instruction. Historical production navigation passed; novice discovery remains unproven. |
| #175 | **Not built** for intake-only days. | `src/lib/posts/days.ts` creates day groups from posts, then attaches intake only to existing groups. Add and verify water/caffeine-only days. Having hydration totals does not satisfy this item. |
| #193 | **Not complete** as an all-screen production comparison. | Partial actual-frame comparisons exist, especially Run 6. Complete the 390×844 production screen inventory, differences, wording review and merged fixes. |
| #217 | **Not complete** as an every-control smoothness audit. | Produce the per-control four-field table under CPU throttling and fix/file each slow or dead control. #314 fixes selected saves; it is not an exhaustive audit. |

Sources: merged PR history on main; [closed-issue acceptance](closed-issue-acceptance.md); [Run 6 copy audit](run6-copy-audit.md); [Run 7 deferred scope](plan-run7.md). No early issue is closed by this implementation inventory.

## Lease correction and migration 0034

The original claim that renewal never extended the lease was **false**. In `0007b_comment_corrections.sql`, `try_acquire_worker_lease` already extends a live lease for the same holder to the current time plus its TTL. It refuses another holder while live. That code is preserved historical evidence.

Migration `0034_renew_lease.sql` adds a dedicated service-only `renew_worker_lease` RPC. It renews only a matching, **still-live** lease, validates holder/TTL, returns false on loss, and cannot acquire an expired lease or trigger abandoned-job recovery. The TypeScript renewal now calls this RPC, with failure/lost-ownership handling and regression/database tests. It separates renewal from acquisition rather than inventing extension for the first time.

The same migration adds service-only `requeue_rate_limited_job`: post/job ownership fencing, superseded-job handling, fixed safe waiting text, queued status with a provider-directed `run_after`, and refunding the attempt consumed by claim. That is the durable USDA retry change, not a lease-only migration. The final execution receipt records its production application at 03:42:18 UTC / 10:42:18 WIB.

## Owner closure order and #325

The explicit owner order has been executed: **#189, #226, #230, #273, #221, #22, #192, #216, #317, #319, #320 and #321 are CLOSED**, confirmed by the GitHub update responses. These are owner dispositions, not new physical-device or accuracy tests performed in this docs pass. None was present in the supplied 11:03 open-work snapshot.

**#325 remains OPEN.** Its title is “The Vercel and Supabase regions may be far from Jakarta (part of #222)”. It asks for both actual regions to be reported and for the repository to declare the production regions/timeouts. It notes that `vercel.json` has only an ignore rule and only tick declares a 300-second route limit. The checked main still has that minimal `vercel.json`.

There is **no recorded reason to close #325**: its issue has no comments, and no completion evidence or rationale was supplied with the close-list reference. The planner's carry-over naming regions/timeouts as open is consistent with the issue. I cannot establish why it was on the earlier close list. It is absent from the supplied Doc, so this pass does not invent a PM backlog entry or silently close it. Report both configured regions and compare repository declarations with production before deciding its disposition.

## Validation

Read live issue states, merged PR history, the final execution receipt and the referenced implementation. Checked the Markdown diff and local report links. This PR changes documentation only; no app test suite, paid model call, production post, migration, deployment or merge was run in this pass.
