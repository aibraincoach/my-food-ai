# Fleet 9 — pre-merge report

Status: implementation and review preparation, **not deployed**. The original supplied plan is preserved unchanged in `docs/plan-run9.md`, docs PR#344, which stays open for RT. The subsequent owner/PM instructions supersede its autonomous merge permission: **no merge or production0036 apply until a PM order names the PR and full head SHA**. Production remains Fleet8 commit`6996817cec6aaf865357e9fee6550abf27cdfd0f`.

## Owner changes applied

- Both pasted plan and designer zip were found. HTML/support.js extracted into ignored`uploads/design-round5/`; no exported frame images were extracted.
- No Playwright was used. Native Chromium was controlled directly through CDP; root viewed pages transiently in memory. No image files were generated or saved.
- No layout tests were added or run. A/B had already completed the old required wording command before the PM override arrived; no wording command ran afterward. C/D ran none.
- B PR#345 opened before C PR#347. All feature branches start from Fleet8 main; none is stacked.
- PM cut preference is preserved as supplied: D first, then soft delete/Recently deleted, then A; keep C. No cut has been needed. The original lane table names soft delete as C, so this instruction contains a naming ambiguity that has no effect while all lanes remain viable.
- Closed requested issues#326,#327,#328,#329,#330,#331,#2,#3,#6,#11,#18,#20.

## Items0–6

| Item | Current evidence and remaining work |
|---|---|
|0|Done: unchanged plan committed in#344; design HTML and support.js available. Report added here; docs PR remains unmerged.|
|1 / A|#346,`fd3925a1f0ed3c5a358d1319d3539de213cdedb8`. Drink summaries/list, bounded cola fallback/disclosure, item identity passthrough and category-null cola names. TypeScript/ESLint/build all0;13 data tests passed. Native390×844 built-card look and differences in PR. Exact-head external watch review BLOCKERS:NONE. Production check pending merge order/deploy.|
|2 / B|#345,`d8d97cb1c656046c728102e22cc017c94452110a`. Mode order/glyph/dot, scan target/line, hint/buttons/shot dismissal. TypeScript/ESLint/build all0. Native390×844 look of Photo/hint/Barcode, including Try Barcode, and differences in PR; camera unavailable on this host. Exact-head external watch review BLOCKERS:NONE. Production check pending merge order/deploy.|
|3 / C|#347; final accent-follow-up head/checks/review recorded below when ready. Soft delete/Undo/Recently deleted/30-day purge, rollback, RLS/admin reader and intake filtering. Full disposable DB21/21, zero skips; rollback/reapply passed. Native delete/Undo/Recently deleted/Restore, correction menu and leftovers menu/removal notice observed. Mobile menu overflow fixed. Edited marker omitted under P4 fallback. Production migration/apply/check pending PM order.|
|4 / D|#352,`21cbf2cc691069f1c71140b63a1990ef8d018247`. Six fixed tiles, per-drink nutrition source, caption/camera, persistent4s Undo after close, legacy API accepted. TypeScript/ESLint/build0;7/7 data/real-local-route tests, zero skips, including tile4=330ml32mg and tile9=400. Local nutrition caches explicitly synthetic. Native Coffee quick tap/toast/Undo observed. Extra parent-navigation file keeps toast mounted; unavailable hold instruction omitted. Exact-head external watch review BLOCKERS:NONE. Production check pending merge order/deploy.|
|5 / E|**Not done:**`docs/design/visual-pass.md` records all61 exported frame sections but is explicitly partial. Native production DOM/styles were inspected; unavailable upload/scan/token/motion states remain unverified. No claim of complete visual matching. Observed screen differences filed as issues below.|
|6|Issues and requested closures done. No merge or production mutation performed. Final merge/deploy checks and timed production receipts remain pending PM exact-head order.|

## Verified stale premises

- Planner main/open-PR snapshot is historical. Fleet8 code#334–#343 is merged; current main is`6996817...`. Fleet8 docs#333 stays open separately.
- P1: latest three stored Cola items carry nutrient1057 portion29.7mg. Two are current ready items; all three have null food_category, and none has an intake_logs row linked by post_item_id. Thus caffeine had not reached itemDrinks as assumed. There is no item_drinks table; item drinks are intake_logs source=item. A accepts exact cola names with missing categories on the next sync/reanalysis and keeps stored nutrient values (29.7 rounds30), rather than overwriting them with the32mg missing-nutrient fallback. Existing posts are not backfilled in this run.
- ItemDrinkRecord previously omitted post_item_id, so A minimally retains it through hydration.ts to make all-items identity matching possible. C independently filters the same service’s deleted records; neither PR imports the other.
- P2: kept existing hints storage and RPC behavior, per scope. B changes only modes hint appearance/copy/interactions.
- P3: posts had an owner FOR ALL policy, so C splits policies rather than adding a SELECT policy that the permissive ALL policy could bypass. Intake rows need their own hiding and admin hydration filtering; hiding posts alone would retain drink totals. Admin readers were explicitly filtered.
- P4 is false: no posts.updated_at column/feed field, and removal updates status only. The plan explicitly says not to build edited in that case.
- Drink service assumed all caffeinated input was coffee. D selects tea/espresso/cola nutrition separately. NavigationControls conditionally unmounted IntakeSheet; D keeps it mounted so Undo survives closing.

## Follow-up issues

Deferred round5 work: #348 composer drink cards5b–5d; #349 Unmark/Replace photo; #350 Undo after photo/correction removal; #351 usage ordering/hold-for-sizes.

Observed rounds1–4 differences: #353 auth; #354 feed; #355 detail/nutrients; #356 saved drinks; #357 Days; #358 Profile; #359 agents; #360 desktop shortcut legends; #361 Search/desktop unavailable drink volume. Several differences reflect later approved features, so issues request reconciliation rather than assume regressions.

## Production preflight and hold

Read-only preflight: pg_cron is installed; no purge-deleted-posts cron exists; posts.deleted_at is absent; Fleet8 user_hit is present. Migration0036 has **not** been applied. Disposable local pg_cron scheduling uses an explicit schedule/unschedule stub because the host lacks the extension; the actual purge function/permissions/retention and rollback were tested. Real cron scheduling must be verified after authorized production apply.

No post/photo/token/account setting was changed in production. Production observations used designated test account1; local UI/data checks used disposable accounts. Future production cola check must distinguish preserved stored USDA caffeine from the fallback32mg case.

Before merging, re-fetch main and each named head, confirm exact-head review/checks and PM authorization, resolve any actual conflicts without stacking, apply reviewed0036 immediately before its authorized merge, and run the plan’s production checks after READY. Branch deletion/final production receipts follow those merges; docs stays open.
