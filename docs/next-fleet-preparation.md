# Next fleet preparation

This is the handoff after the owner's ordered merges on November 3, 2026. It prepares the next fleet's documentation; it does not start a fleet or assign an execution scope. The owner is supplying a newer backlog. BACKLOG.md now holds the owner-supplied historical 22:48 WIB snapshot, copied without editing its wording or inserting issue numbers. The owner will supply a newer version later; this snapshot is not an execution order.

## Confirmed repository and production baseline

| PR | Result | Exact authorized head | Merge commit |
| --- | --- | --- | --- |
| #461 Test/lint and desktop review repairs | Merged first | `2dbd3bf7df1a46a203fedee1082a4253a1cb287b` | `124a89b2b7b4290d036497b1b84dd8fcd5a68a8e` |
| #462 Desktop follow-up | Conflicts resolved and pushed; open for fresh review | `905b47414efd119ba27b22782af647aa2059619f` | None |
| #459 PM backlog snapshot | Merged | `ad498adab28d6e8171b76f7aa4db2d6bba0a1f2e` | `65ac905d95f71b3e9fa93de16ffcf67ef3614381` |

GitHub reported no configured required checks for #461 or #462; both reported preview checks passed. After #461 merged, #462's head remained unchanged. GitHub's UNKNOWN state was re-read and resolved to DIRTY/CONFLICTING. The coder initially left that head untouched. A later owner order authorized conflict resolution and pushing, explicitly without merging. Main was merged into #462; its new head is `905b47414efd119ba27b22782af647aa2059619f`. Eleven focused tests, lint and production build passed; fresh head review is required.

Production deployment `dpl_4PcCexAaa5eRo4agNPWDHKnDE1yL` is READY for main `65ac905d95f71b3e9fa93de16ffcf67ef3614381`. Vercel reports alias assignment complete; the alias API confirms `my-food-ai-ten.vercel.app` points at that deployment. This verifies deployment identity, not physical-phone acceptance.

Neither merged PR automatically closed any issues: their GitHub closing-issue references are empty. After a separate owner instruction, #450 was verified on main and manually closed with fresh-run evidence. #413 remains open.

## Evidence available to the next fleet

#461 records 567 passing tests, zero failures and six existing optional integration skips; the separate database gate passes 32/32 and the SQL batch passes 38/38. Lint has zero errors and six warnings. The SQL database identity, historical failing check and all changed test names/assertions are preserved in [the test repair audit](evidence/test-lint-repairs/README.md). Production build and TypeScript passed before merge.

#462 contains the owner's desktop kcal grouping, narrow Home, short capture window, no-webcam attachment picker and Profile preservation fixes. Its browser evidence is on its branch in `docs/evidence/desktop-followup/`; these fixes are not on deployed main. Conflict resolution is pushed at the new head above; it requires fresh review and an order naming that head before it can merge.

The older #460 layout, phone comparison and keyboard evidence is [on main](evidence/desktop-round6/README.md). It does not turn emulated checks into physical-phone acceptance.

## Inputs required before execution

The owner will supply the latest backlog. Reconcile that supplied text against GitHub issues, retain its title/two-paragraph item format, file genuinely missing issues, and return their numbers for the PM. Do not treat the older snapshot as the new fleet's scope or close an issue because code alone merged.

The next fleet needs an explicit scope and stop time against the November 5, 09:00 WIB submission deadline before it starts. Record both here with the supplied backlog and execution order. Report progress every 30 seconds as requested. Physical-phone acceptance remains with the owner and does not block independent work. Report a test-driver check that fails twice, including time spent, and move to the next item rather than repeating completed acceptance.

No fleet has started from this document. No new deadline, design revision or excluded desktop work is inferred from the historical backlog. CAPTCHA remains outside the authorized scope.

## Historical snapshot issue mapping

BACKLOG.md preserves the supplied text, including four unnumbered headings and stale completion claims. Its UTF-8 bytes were compared against the supplied message body (backlog heading through the final backlog paragraph, with a terminal newline): exact match. SHA-256: `2b51c1029979950352dfb49d72760d481319e8b943bda047aab63974df249e2d`. Issue numbers are recorded here so its text is not altered.

| Supplied unnumbered title | Issue |
| --- | --- |
| Big numbers lose their thousands separator on the desktop Days and Today | #464 |
| The desktop Home and New post are likely to break below 1280 by 800 | #465 |
| On desktop, adding a photo to an existing post has no file picker | #466 |
| The recording account can hit the hourly model cap on camera | #467 |

The first three relate to unmerged #462 and remain open. The recording-cap issue is recorded for planning; no production limit was changed. Existing #348/#351 and other historical entries were not reopened or treated as new execution orders. The fresh-main #450 acceptance result is [recorded separately](evidence/issue450-main/README.md): 567 passed / 0 failed / 6 existing skips, DB 32/32 and lint 0 errors / 6 warnings, all matching README. #450 is now closed. Its historical backlog text remains verbatim as the owner requested.
