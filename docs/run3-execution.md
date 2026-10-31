# Run 3 execution evidence

This records the implementation and pre-merge validation of the supplied Run 3 plan. Production acceptance remains pending the plan’s explicit merge orders. No PR has been merged and no production migration has been applied during this run.

The supplied plan was committed byte-for-byte in PR #199 at `9bc89450ec5a891a839278146e05fc2eb38a2fd4`. It is separate so item 0 stays a two-file tokens-only PR.

## Items and exact heads

| Item | Status | PR | Head | Implementation / acceptance |
| --- | --- | --- | --- | --- |
| 0 | Done locally; unmerged | #200 | `ba6f55f5c73d48abe36ee0c84addcb851a117d65` | Ten shared tokens and generated CSS; build passed. |
| 1 | Done locally; unmerged | #201 | `1cffcfe63559b31394195bc56dd103862675b7ef` | Local day grouping, full daily totals, empty dates and sticky headers implemented and checked. |
| 2 | Done locally; unmerged | #202 | `b6e3010dd47ed9b04c8484cbcdaf040f8b71438c` | Five-entry fan, entry event contract, focus handling and independent control mounting implemented and checked. |
| 3 | Not done; implementation or proof status follows | #205 | `132031d7d7c47d94fa26837ea92d231a42bbf730` | Drink sheet, ready drink posts, hydration cards and 0019 implemented; live route proof waits for migration. |
| 4 | Not done; implementation or proof status follows | #206 | `f94d12f4b2f9e6a13e308d8d9cadfb897875aaac` | Text and barcode capture, barcode-first photos, pack-photo ready posts and 0020 implemented; live route posting waits for migration. |
| 5 | Done locally; unmerged | #204 | `b0ea369c8a6bba978ed7cb2714bbcb785c3b5f5b` | Month list, lazy loading, month chooser and story overlay with three exits implemented and checked. |
| 6 | Not done; implementation or proof status follows | #203 | `d3335e3ace0139ad14519ec679cc8cb4903d6d4c` | Production ordinary sign-in passed; cookie and generated-link modes passed locally. Production caption-only posting remains pending the merge phase. |
| 7 | Not done; implementation or proof status follows | #197 | `8890033ecd9587fc50977befbba4d23298a01e00` | Portion count/size rules and explicit-soymilk matching regression fixed. Production re-log and owner acceptance remain pending. |
| 8 | Not done; implementation or proof status follows | none | none | Not done: three real-photo production proofs run after the merge phase. |
| 9 | Not done; implementation or proof status follows | none | none | Not done: production trace/admin and non-admin proofs run after items 6 and 8. Schema premise checked; admin account configuration is missing. |
| 10 | Not done; implementation or proof status follows | none | none | Not done: production eaten-at display/reordering proof runs after the merge phase. |

Items 1–5 are stacked on item 0, PR #200 at `ba6f55f5c73d48abe36ee0c84addcb851a117d65`. They add no tokens themselves. The open-entry window event connects the independent menu, intake and capture implementations.

## Final integrated checks

The final local integration is `57561a33d7d2c0df832a09fbcff0fcac513938d4`. It includes all exact code heads above and was built after the last code change. It is an unpublished verification branch, not a deployment.

- Standard `npm run build`: passed.
- Changed-source ESLint and `git diff --check`: passed.
- Relevant existing/new regression, database and access suite: 64 tests; 62 passed, 0 failed, 2 skipped. The skips are the live drink/barcode HTTP posting proofs because migrations 0019/0020 have not been ordered. They are not passes.
- Database migration/constraint/access checks used real database transactions ending in rollback. The barcode transaction covered five-argument compatibility, ready/no-job creation, photo ownership, second-user isolation, 27 g nutrition and 250 ml portion text with no invented gram weight.
- Native Chromium device emulation used a 390 by 844 viewport, including a full 390 px layout viewport, with the existing real project and test accounts. No Playwright and no screenshot files.
- Five temporary model-free ready meal fixtures were removed and their absence verified after browser checks. The fixtures supplied known daily totals, empty days and older months.

## Frame comparisons and functional checks

Frames 2a/2b: Today/Yesterday labels, 100 kcal per fixture day, empty intervening dates, 12 px header/card gap, sticky title at 0 and day header at 48 px with stuck shadow passed.

Frames 2c/2d: five 52 px circles measured radius 150 px from the actual button centre; Saved was dashed. Tab remained inside the fan and Escape restored the toggle. Drink and Coffee opened their matching tabs; Text and Saved opened focused empty text capture without video or the Photo/Barcode toggle.

Frame 2h: six 56 px water presets, 20 px title, Other amount placeholder, matching default Post labels, and 34 px below the button passed. The shared Sheet handle top padding is 12 px versus the drawing’s 10 px. Drink history currently reports a read error because 0019 is not deployed; live history, posting and hydrated card proofs remain pending.

Frame 2i: native live-camera emulation decoded the UPC-A fixture through live FDC; Photo-mode library and shutter paths reached the same lower card without a post/model request. Text/Saved requested no camera. The same camera stream survived mode changes; a dismissed still-visible code remained suppressed. Unknown-code, denied-camera/library and retained multi-selection fallback paths passed. Measured frame was x55/y95/280x140 in a 330 px viewfinder; chips 40 px, Post 48 px and card padding 18/34 px. Differences: actual product data is in grams versus the sample drink’s ml; the added close target reserves 44 px and moves the thumbnail left; metadata uses normal line spacing rather than the canvas’s 3 px gaps.

Frames 2e/2f/2g: two 44 px-cell month grids, month counts, month chooser, initial totals slide and all three exits passed. A native 150 px drag reached scale 0.86, radius 40 and the specified story shadow, then closed. Scrolling already-scrolled content did not dismiss. August and July loaded through actual signed-in month API requests returning 200; June appeared as a name-only end marker. Token radius 10 replaces the frame’s 9 as the plan requires.

All frame comparisons use actual dates and neutral test data rather than designer sample personal content. Native operating-system status/navigation chrome was not faked.

## Production evidence and checked premises

Item 6 / P10: ordinary production email/password form sign-in completed at 390 px; no password-entry refusal occurred, and the authenticated feed rendered. On the final local production build, cookie mode preserved every SSR chunk and generated-link mode established the callback session. No mail was sent and no credentials, cookies or generated links were published. The production caption-only meal remains unposted pending the merge phase.

Item 7: no production re-log was performed. Its production grams, kcal and FDC IDs, plus owner acceptance, remain outstanding.

Item 8: no three-photo production acceptance run was performed. No issue was closed on unverified evidence.

Item 9 / P3: `psql` inspection of `public.model_calls` confirmed the existing schema and admin-only select policy; 0014 was already present. P9 is false in this environment: `ADMIN_EMAIL` is absent. No unspecified account was used or granted an admin role. The trace and second-user production checks remain outstanding.

Item 10: the production eaten-at/reordering check remains outstanding; the closed issue was not represented as re-proven.

P7: nutrient 1051 was already retained by nutrition scaling, so no keep-set change or backfill was needed.

The old signed-upload route required an existing post, so item 4 added owner-scoped staging to the same route to implement upload-before-ready-post creation. The old authentication callback accepted only PKCE codes, so item 6 added token-hash verification for its generated-link fallback. No new dependency or environment variable was added.

## Reviews

Review receipts and triage are recorded separately from code heads, so storing evidence does not invalidate the exact-head receipts. PPLX attempts whose selected-model or answer footer identified an authoring model were rejected and do not count. Labelled AGY fallback uses verified Gemini 3.8 Flash (High), with enforced changed-file/diff coverage. Final per-PR results are filled only from completed authentic external reviews.

| PR | Reviewer | Verdict on exact head | Real findings |
| --- | --- | --- | --- |
| #197 | Gemini 3.8 Flash via PPLX | BLOCKERS: NONE on `8890033ecd9587fc50977befbba4d23298a01e00` | 0 |
| #200 | Gemini 3.8 Flash (High) via AGY fallback | BLOCKERS: NONE on `ba6f55f5c73d48abe36ee0c84addcb851a117d65` | 0 |
| #201 | Gemini 3.8 Flash (High) via AGY fallback | BLOCKERS: NONE on `1cffcfe63559b31394195bc56dd103862675b7ef` | 0 |
| #202 | Gemini 3.8 Flash (High) via AGY fallback | BLOCKERS: NONE on `b6e3010dd47ed9b04c8484cbcdaf040f8b71438c` | 0 |
| #203 | Gemini 3.8 Flash (High) via AGY fallback | BLOCKERS: NONE on `d3335e3ace0139ad14519ec679cc8cb4903d6d4c` | 0 |
| #204 | Gemini 3.8 Flash (High) via AGY fallback | BLOCKERS: NONE on `b0ea369c8a6bba978ed7cb2714bbcb785c3b5f5b` | 0 |
| #205 | Gemini 3.8 Flash (High) via AGY fallback | BLOCKERS: NONE on `132031d7d7c47d94fa26837ea92d231a42bbf730` | 0 |
| #206 | Gemini 3.8 Flash (High) via AGY fallback | BLOCKERS: NONE on `f94d12f4b2f9e6a13e308d8d9cadfb897875aaac` | 0 |

At the final GitHub audit every code PR was open, mergeable against its current base, with green checks including Vercel and an eligible zero-blocker receipt on the exact head. PPLX’s clean conclusion on #197 is normalized to the required receipt wording in its triage. Documentation-only PRs have no independent code-review requirement.

## Merge phase and remaining work

No merge order has been issued in this run. The plan requires one order per PR naming its exact head, a matching zero-blocker receipt, a clean mergeable state and green checks including Vercel. Item 0 merges first; the remaining PRs then follow ascending number. Migrations 0019 and 0020 apply in numeric order when their respective merge orders arrive and before those merges.

The plan’s claim that only token files overlap is false: items 1 and 5 also extend `days.ts`. Their combination required an import/append conflict resolution in the unpublished local integration. When the corresponding GitHub merge becomes conflicting, the branch needs a merge from main, a new exact head and the plan’s scoped confirmation receipt; an older receipt cannot authorize it.

After the merge phase: run item 6’s production post, item 7’s production re-log and owner acceptance, then production checks 8–10 (and any defect PR/review loops). Resolve the missing item 9 admin configuration before its admin check. No pending production acceptance is marked done here.


PRs awaiting merge orders, ascending by number: #197, #199, #200, #201, #202, #203, #204, #205, #206, #207. The actual first merge remains item 0 / #200.
