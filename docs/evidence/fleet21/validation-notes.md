# Fleet 21 measured validation

All 14 code branches and the docs branch were built independently from origin/main `96ecdcf7897035b3019d14c7f0af38ce2510f890`. Each received npm ci, lint, TypeScript, a production build and the complete application test suite against the disposable local stack. The final code heads match their external-review receipts.

The measured baseline was 694 tests: 662 passed, 26 failed, 6 skipped. The planner's 692/28 count was not reproduced: the two local-time cases pass in this environment. Every final failing case was in the plan's baseline list; there were no new failing identities. Lint retained the same three baseline errors and fourteen warnings.

PR 6's branch passed its repaired cases and the additional saved-failed-meal case. Disabling the failed-meal guard produced three failures in seven cases; restoring it produced seven passes. PR 13 passed its three additional cases and repaired upload-guard count. PR 14 repaired its own nineteen failures and passed all 49 database tests with the app running, including today-summary.

PR 8's unauthenticated photo-access test passed, including wrong secret, wrong photo id, unsupported width, query string and deleted-meal refusals. Its Home read-once and fallback cases passed. Migration 0063 was applied to the disposable database only. No production migration or merge was authorized or performed at this stage.

The worker kill/restart measurement used the actual local job flow, briefly pausing only the disposable model to hold the first job. After killing the app during that job and restarting it, the second job began after 59.98714 seconds and one explicit worker wake. The model was resumed, owned app groups stopped and measurement fixtures removed. Killed-job recovery still uses the existing 360-second rule.

One intermediate corrected-hint run hit a worker-lease fixture refusal after the database-test phase. That run was preserved externally. After confirming the prior app groups had stopped and the lease had expired, a fresh full run of the unchanged head passed its relative gate. No assertion or product behavior was changed for this transient failure.

The two PR 11 check commands ran against their own local branch build and failed. Their JSON receipts and exact errors are adjacent to this note. Post-close completed no batch because Page.navigate timed out. Beer completed no batch because the scripted model produced a ready meal instead of the required question; the temporary meal and fake subscription were removed. These commands are not reported as passing.

All local page looks use Firefox over native WebDriver BiDi and the same disposable account. Screenshots are examined in memory and never saved. No Playwright is used. The page's data-build marker is compared with the compiled branch HTML before relying on a look; .next/BUILD_ID is a separate Next identifier and is not used for that comparison.
