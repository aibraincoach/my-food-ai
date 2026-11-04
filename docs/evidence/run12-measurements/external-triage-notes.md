# Fleet12 external information triage

Read-only snapshot around2026-11-04T04:35:21Z. This is triage of externally raised claims, not an independent code review, receipt or merge authorization. No GitHub messages/reviews posted, no repository code edited, no heavy tests/provider calls run.

All22 Fleet12 code PRs502–507 and526–541 had zero literal `<!-- watch-review -->` comments and zero inline review threads. All queried comment/review/thread connections were complete (no remaining pages). #541 was absent on the first read, then read after creation at1d261526763b23a78a5b40315f995c6e083c513a; it held only deployment/in-progress-review comments and no findings. The other findings below come from owner-posted captures of Perplexity output (explicitly no model proof) and historical AGY receipts. Those PPLX comments are information only, never counting review authorization. Current AGY acceptance remains root's responsibility.

## Real issues to backlog after merge; no implementation/revert in this run

### PR504: keyboard Space intercepts Choose a file

Classification: Real. Current merged head651cfc2942d1d9e2cdcb09b54d5f3844cc867442. Latest external claim: https://github.com/aibraincoach/my-food-ai/pull/504#issuecomment-6622193794 (earlier same finding6622055854).

Pinned evidence: https://github.com/aibraincoach/my-food-ai/blob/651cfc2942d1d9e2cdcb09b54d5f3844cc867442/src/components/CaptureSheet.tsx#L446 excludes input/textarea/select/contenteditable from globalSpace, but does not exclude buttons; newChoosefile atL501 calls galleryRef. With no stream, takePhoto atL358 instead opens cameraRef. Thus focusedChoosefile's nativeSpace activation is prevented and routed through camera capture. Source-confirmed; this triage did not perform a fresh keyboard runtime probe.

Suggested issue title: Space on desktop Choose a file starts camera capture. Existing #470 is related file-picker work, but no exact duplicate found among508–525 or the all-issue title scan. #156 concerns feed-photo links, not this control.

### PR505: Post is acknowledged before its queued IndexedDB intent write finishes

Classification: Real. Current merged headf2b0f35becac7cfeb296f58b3fd0fde118b6324a. Latest external claim: https://github.com/aibraincoach/my-food-ai/pull/505#issuecomment-6622295714 (same finding on earlier heads6622066043/6622205631).

Pinned evidence: https://github.com/aibraincoach/my-food-ai/blob/f2b0f35becac7cfeb296f58b3fd0fde118b6324a/src/lib/posts/upload-manager.ts#L198 sets posted=true, fires voidpersist, notifies and startsrun synchronously. persist atL127 queues store.put behind entry.writing. Caller https://github.com/aibraincoach/my-food-ai/blob/f2b0f35becac7cfeb296f58b3fd0fde118b6324a/src/components/CaptureSheet.tsx#L413 closes/refreshes immediately. A quick successful close/reopen check does not prove the unresolved-write crash boundary. The previously persisted record may still say posted=false if tab termination precedes transaction commit. Source-confirmed race; no fresh destructive timing probe performed here.

Suggested issue title: Post closes before posted intent is durable in IndexedDB. Closed #370 is related camera latency, not a duplicate of this durable-acknowledgment requirement. No exact duplicate found among508–525 or the all-issue title scan.

### PR507: structured-format fallback gets a fresh75-second budget

Classification: Real. Current merged headf189b536649ac075f72731e382c8c15ea7a6ea2b. Latest external claim: https://github.com/aibraincoach/my-food-ai/pull/507#issuecomment-6622440790 (same finding on earlier heads6622150748/6622227139/6622317595).

Pinned evidence: https://github.com/aibraincoach/my-food-ai/blob/f189b536649ac075f72731e382c8c15ea7a6ea2b/src/lib/meta/open-weights.ts#L33 creates send() with75000 each call, then permits send(false) followed by send(true) for an eligible400/422. https://github.com/aibraincoach/my-food-ai/blob/f189b536649ac075f72731e382c8c15ea7a6ea2b/src/lib/meta/client.ts#L101 creates a freshAbortSignal.timeout per invocation. No operation-wide signal/deadline is passed by createOpenResponse. A delayed schema rejection followed by a hanging object response can exceed75seconds before Meta fallback. Root's single-hanging-request probe does not cover this two-request path. Source-confirmed; no additional provider calls made by this triage.

Suggested issue title: Muse Spark Open format fallback resets its75-second budget. #281 is related feature acceptance and #288 holds the key, neither is an exact timeout-budget duplicate. No matching508–525 title/all-issue title found.

## Other externally raised claims

- PR502, merged7338ea3c2e4d0fe08ed9c5760f424a26d95e7533: **Real, non-blocking test limitation**, not an observed production defect. https://github.com/aibraincoach/my-food-ai/pull/502#issuecomment-6622020792 says the index test checks only names. https://github.com/aibraincoach/my-food-ai/blob/7338ea3c2e4d0fe08ed9c5760f424a26d95e7533/tests/db/feed-indexes.test.mjs#L7 confirms that. Migration0048_feed_post_indexes.sql explicitly targets the right tables/post_id; production definition verification is separate. Record hardening suggestion, do not expand this run.
- PR504 historical AGYcalc-syntax claim6622088520: **Not real as stated**. The Tailwind compiler normalizes the arbitrary class; actual compiled CSS in a later Fleetbuild with the same class is `height:min(400px,100dvh - 300px)!important`. Source rawclass whitespace alone does not show browser rejection. Root's later exact-head geometry/AGY acceptance supersede the old warning. Current separate Space issue above remains real.
- PR506, mergede5bbc4730d85de019dff115019191937e91ea96d: historical AGY https://github.com/aibraincoach/my-food-ai/pull/506#issuecomment-6622118709 says Next supplies reset but not retry. **Not real for the installed Next16.4.3**. Local node_modules/next/dist/client/components/error-boundary.d.ts exposes retry (lines5–6) and error-boundary.js passes retry atL114. Error source deliberately uses retry; root already exercised actual retry paths. No new source change required for this version assumption.
- PR527, current626d9e1ffed471487a85a2ec0eb05750d0679157: https://github.com/aibraincoach/my-food-ai/pull/527#issuecomment-6622337618 (earlier6622249500), unsupportedAbortSignal.any/timeout: **Cannot tell supported-client impact**. https://github.com/aibraincoach/my-food-ai/blob/626d9e1ffed471487a85a2ec0eb05750d0679157/src/components/IntakeSheet.tsx#L52 really calls both synchronously before its promise chain, so a missing helper bypasses catch/finally. No repository minimum-browser policy found that establishes whether affected versions are supported; current native browser checks do not reproduce it. Compatibility risk remains, not a fabricated current-browser failure.
- PR528 owner-isolation finding6622260476 and AGY6622313624: **Fixed** at currentf265861a2b8ba691df31722bb5c35b0cc1929676. https://github.com/aibraincoach/my-food-ai/blob/f265861a2b8ba691df31722bb5c35b0cc1929676/src/components/Feed.tsx#L277 clears foreign state on identity change; L299 requires initialUserId===userId; cache reads/notifications/writes are owner-tagged. Existing access-data regression results are in earlier handoff; root handles externalconfirmation.
- PR528 failed-server-day-totals finding https://github.com/aibraincoach/my-food-ai/pull/528#issuecomment-6622347830: **Not real as stated** on currentf265861. The client explicitly requests refresh for post days absent from page.days (FeedL306). dayTotalRefreshDates returns a day absent from knownDays even for the same SSRpost/revision. Lightweight actual helper call with same readyfingerprint and an empty knownDays returned2026-11-04. The old getFeed path also read only post days; there is no demonstrated new loss for no-post days. The external comment is partial and gives no narrower failing case; do not infer one.
- PR529 expiry finding6622271243 and AGY6622294541: **Fixed** at currentfd752c1a17589cc8ff60b1b80b8c34c3660d5567. https://github.com/aibraincoach/my-food-ai/blob/fd752c1a17589cc8ff60b1b80b8c34c3660d5567/src/lib/posts/feed-cache.ts#L53 reevaluates slides on everyread, retaining stable objects unless removal changes a post; covers write-primed snapshots too. Root handles rebuilt-head externalconfirmation.
- PR530 current75eb0f012fe26b970f5156a60a00869aea290173: https://github.com/aibraincoach/my-food-ai/pull/530#issuecomment-6622282989 approves and suggests additional per100ml/dual-column evaluation coverage. **Real non-blocking coverage suggestion**, no correctness defect claimed. These extra cases are beyond the plan's named real-model gates; no added model calls or testexpansion in this triage.
- PR533 current15c8c0f909f511a866b7efea8496a9af6975ecbb, comment https://github.com/aibraincoach/my-food-ai/pull/533#issuecomment-6622379263: blanket herbal/etc exclusion even with espresso is **Not real as a violation of the owner's explicit rule**. The behavior is confirmed in alcohol.tsL4/L14, but item18/owner behavior explicitly require those named alcoholic drinks to record no caffeine. Do not silently narrow the regex or override the dispatched rule. Record this intentional model limitation.
- PR534 current1b5e8addad6b536a8d2ef94e64e9c78537df0061, comment https://github.com/aibraincoach/my-food-ai/pull/534#issuecomment-6622389719: out-of-range backdated uploads remain above newer sections is **Not real as a violation of the explicit item13 default**, but a confirmed remaining limitation. https://github.com/aibraincoach/my-food-ai/blob/1b5e8addad6b536a8d2ef94e64e9c78537df0061/src/components/Feed.tsx#L446 builds days only from non-upload groups and L451 deliberately renders out-of-range locals above. Plan blast radius expressly preserves this. Existing #522 already captures the broad symptom; do not create a duplicate or silently expand the implementation.
- PR537 current49a331822f596e40a56fe896353aaf3ed17d2e18, historical AGY https://github.com/aibraincoach/my-food-ai/pull/537#issuecomment-6622487768 sent-target/validation finding: **Fixed for the real validation-retry path**. https://github.com/aibraincoach/my-food-ai/blob/49a331822f596e40a56fe896353aaf3ed17d2e18/src/components/LogAgainSheet.tsx#L22 now validates before assigning sent atL24. Successful submission closes; reopening through SavedMealListeners constructs a new LogTarget object, so the reference equality guard does not permanently ban the same mealid. The report should not generalize the historical finding into an unresolved permanent meal lock.

PR503,526,531,532,535,536,538,539,540,541 have no externally raised actionable findings in the fetched comments/reviews/threads. No extra code search for unraised defects was performed.

## Raw snapshots and scope

/tmp/run12-muse-review-snapshot.json contains final complete GitHub metadata/comments/reviews/threads for all22PRs; /tmp/run12-muse-review-snapshot-first.json preserves the first read; /tmp/run12-muse-triage-additions.json records541creation and issue508–525 bodies. /tmp/run12-muse-triage-issues.json is the all-state issue-title scan used to avoid duplicates. This triage has not posted a review/receipt or changed merge status.

## Exact heads in final snapshot

|PR|State|Head|
|---|---|---|
|502|MERGED|7338ea3c2e4d0fe08ed9c5760f424a26d95e7533|
|503|MERGED|a5415aa4ea5570996603daeca8df75be2cb3d50f|
|504|MERGED|651cfc2942d1d9e2cdcb09b54d5f3844cc867442|
|505|MERGED|f2b0f35becac7cfeb296f58b3fd0fde118b6324a|
|506|MERGED|e5bbc4730d85de019dff115019191937e91ea96d|
|507|MERGED|f189b536649ac075f72731e382c8c15ea7a6ea2b|
|526|MERGED|5ce73f8e0079abe39b4863677411c9c9a138e5a2|
|527|OPEN|626d9e1ffed471487a85a2ec0eb05750d0679157|
|528|OPEN|f265861a2b8ba691df31722bb5c35b0cc1929676|
|529|OPEN|fd752c1a17589cc8ff60b1b80b8c34c3660d5567|
|530|OPEN|75eb0f012fe26b970f5156a60a00869aea290173|
|531|OPEN|110c1adfe902b29ac173ba16b7fd68689cd57c90|
|532|OPEN|d08f79c6e77f537bd4a5845201c8627930c6ffe4|
|533|OPEN|15c8c0f909f511a866b7efea8496a9af6975ecbb|
|534|OPEN|1b5e8addad6b536a8d2ef94e64e9c78537df0061|
|535|OPEN|e86240ba8e5fbd4733620c3b184b6b3cc1c3b823|
|536|OPEN|ee8ae308630bcf39bb289d5d1714bb132aea065e|
|537|OPEN|49a331822f596e40a56fe896353aaf3ed17d2e18|
|538|OPEN|15760578aaf49a89df669c38f62d998b4beac164|
|539|OPEN|c3c8d66b854114eb28dea31e21094ad0bd2fb776|
|540|OPEN|58f6b7742f351e6537d9bb9598cfcb5e5c3633b6|
|541|OPEN|1d261526763b23a78a5b40315f995c6e083c513a|
