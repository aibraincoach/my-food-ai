# Fleet9 external watch review receipts

Each receipt clears an exact source head; none authorizes a merge. PM exact-head order is still required.

## PR#345

Head: d8d97cb1c656046c728102e22cc017c94452110a

<!-- watch-review -->
Watch review of head d8d97cb1c656046c728102e22cc017c94452110a:

Scope check: Fleet 9 Lane B (#290, plan-run9 item 2, frames 5h–5j). Exactly the lane's files: ModeStrip.tsx, CaptureSheet.tsx, FirstRunHint.tsx. No migration, no other lanes' files.

Findings (spec vs implementation, all read): mode order is now Text·Photo·Barcode with labels unchanged (ModeStrip.tsx:6) and Photo still the default via untouched initialMode; selected tab semibold full-white with centred 4 px accent dot, others 60% white, Barcode alone carries an icon — inline 14 px five-bar SVG in currentColor (BarcodeGlyph); swipe path untouched. Scan view is a centred 240×160 bracket with 24 px white corners, 2 px accent scan line animating top-to-bottom over 1.6 s with a static reduced-motion fallback, and the exact 15 px copy "Point at the barcode. It reads on its own." above the target; the shutter shows the same glyph at 50% and still takes a photo; Found/not-found results unchanged apart from rendering the missing line only when missing (behavior-equivalent). Hint 5j uses the plan's verbatim title/body/buttons, "Try Barcode" switches mode and dismisses, any shot dismisses via the new capture-shot event, hint storage untouched. Supporting CaptureSheet refactors (resumed ref→state, operationId state sync, closeDraft effect form) keep identical stage/post call arguments. New strings are claims-clean (neutral instruction copy, no tense/target/goal/ring/percentage, no "left" for an amount). No secrets, no scope creep.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.


## PR#346

Head: f5ad36d566c041bb8340154f1ac020ca0985205a

<!-- watch-review -->
Watch review of head f5ad36d566c041bb8340154f1ac020ca0985205a:

Scope check: refresh delta since reviewed head fd3925a1f0ed3c5a358d1319d3539de213cdedb8 — tests/drinks-from-items.test.mjs only, 10 lines removed, no product-code change. Everything else from the prior BLOCKERS: NONE review stands unchanged.

Findings: the removed test ('photo drink summary uses matching item identities, kcal, and optional caffeine') was the only pin for the plan step-1 line shapes — all-drink `Drank: ml · caffeine · kcal`, the no-caffeine `Drank: 1,000 ml · 0 kcal` form, the multi-drink aggregate, and the mixed-meal `Consumed: kcal · ml drank · mg caffeine` prefix. The behavior it pinned is unchanged in summary-line.ts, and the plan-mandated fallback data tests (cola 32/16, water 0, 1057-keeps-34 incl. zero-wins) all remain, so the plan's Test section is still satisfied and the suite should stay green. But the headline feature's output format is now unpinned: a future edit could change the Drank line with no test failing. Recommend restoring the test or stating why it was removed. No new strings, no secrets, no scope creep.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.


## PR#347

Head: 577a75e031fe8d4e77d633bb37cdab3f3e3a9d70

<!-- watch-review -->
Watch review of head 577a75e031fe8d4e77d633bb37cdab3f3e3a9d70:

Scope check: refresh delta since reviewed head ab079df82c0ef9e6c8109bbf810f72f863adbfbd — two one-line style changes, Carousel.tsx and Thread.tsx. Everything else from the prior BLOCKERS: NONE review stands unchanged.

Findings: "Remove this photo" and "Remove correction" change from text-muted to the destructive darker accent oklch(0.52 0.17 25) — the exact token the plan names in its global round-5 note ("Destructive actions use the darker accent... the existing oklch(0.52 0.17 25) in DeletePostSheet.tsx"). The delta moves the PR closer to the frames, not away. No copy, behavior, migration, or test change; no new strings; no secrets; no scope creep.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.


## PR#352

Head: 21cbf2cc691069f1c71140b63a1990ef8d018247

<!-- watch-review -->
Watch review of head 21cbf2cc691069f1c71140b63a1990ef8d018247:

Scope check: Fleet 9 Lane D (#289 drink sheet + quick tap, plan-run9 item 4, frames 5f/5g). Files: IntakeSheet.tsx, intake.ts (DRINK_TILES), post-drink.ts, intake/post route, drink-post tests, plus NavigationControls.tsx (removes the old Sheet wrapper since the sheet is now self-opening on the open-entry event — IntakeBar is a re-export of IntakeSheet).

Findings (spec vs implementation, all read): six tiles in plan order with exact ml/caffeine; header "Drink" with "Today: ml · mg caffeine", caffeine omitted at 0; tile taps post {tile} server-side (index-validated, tile 9/-1/"4" refused, extra ml/caffeine fields ignored), close the sheet, dispatch post-created, and show a 4 s "Posted {label}" toast whose Undo DELETEs the post; caption field posts via caption post; camera button opens capture in Photo mode; old {kind,ml} body still accepted. Tile caffeine is server-authored into nutrient 1057 (route-level test: cola tile → 330 ml, 32 mg, 138.6 kcal). post-drink picks per-drink FDC sources (cola/tea/espresso/coffee) with the error renamed to "Drink nutrition could not be found." Notes (non-blocking): the sheet renders "Tap to post." while the plan's step-3 line still says "Tap to post. Hold to change the size." — the implementation matches the cut scope (no hold), the plan text is stale; the now-unused optional initialKind prop remains declared; caption posts get no Undo toast; pre-#347-merge Undo would hard-delete (ascending merge order covers this). New strings are claims-clean past-tense records with no targets/goals/rings/percentages and no "left" for an amount. No secrets, no scope creep.

WATCH VERDICT: BLOCKERS: NONE

This is a continuous-watch review, not the repo-policy review-lane receipt and not a merge authorization.

