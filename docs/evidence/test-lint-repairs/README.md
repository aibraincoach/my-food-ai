# Test and lint repair audit (#450)

Base: merged main `618cf7e8bbadf4e020b9590eeb66e6368591f8db`. Repairs are separate from merged PR #460.

## Database identity and the 38-check batch

The earlier SQL batch ran against database **postgres on 127.0.0.1:55439**, a disposable copy of the previously stopped `/tmp/run8-b-infra/pg`, stored at `/tmp/mfa460-tests/pg`. It was not production. Its PostgreSQL grants differed from a clean application of the repository migrations. The initial 38-check run had 35 passes and three failures: card-cleanup's incomplete fake query chain, retry-policy's SSL-required connection to a local server without SSL, and supersede permissions. After the first two were addressed, the remaining check was **#38, “edits preserve immutable history, ownership and atomic readiness”**, in `tests/supersede.test.mjs`: that clone denied an owner's `UPDATE superseded_at` allowed by migration 0007. Changing a test to require that cloned grant state was incorrect; the final assertion follows the migration instead.

Final SQL and complete-suite measurements use **postgres on 127.0.0.1:55449**, freshly initialized at `/tmp/mfa460-fresh2/pg` by `scripts/test-stack.mjs`. Auth runs on 60268, REST on 60267, the local gateway on 60266, scripted providers on 60265, and the built app on 60260. All migrations apply except external worker-wake scheduling 0024; a no-op cron fixture prevents external wakes. No production database or credentials are used. [Reproduction and limits](../../testing.md).

## Every changed test and assertion

[Before/after names](test-names.md) lists all 18 changed existing test files and every test-name expression before and after. [Complete before/after sources](test-before-after.json) preserve every assertion and SQL exception check, including unchanged ones. [Exact patch](test-changes.patch) shows every assertion delta. No tests are deleted and no skip is added.

The changes are not all mere fake plumbing. Facebook assertions replace obsolete environment gating with disabled/inert shared-control behavior; unsupported drink sizes now assert rejection instead of silent fallback; hydration asserts no double count for linked drinks; publication expects drink synchronization before ready; soft-delete filters are explicitly checked. Supersede still checks immutable names/nutrition, RPC access, owner boundaries, atomic readiness and preservation of superseded history. These expectation changes are visible in full in the linked patch.

The three new desktop regressions exercise actual component handlers/effects for configured zones and stale responses, rich calendar controls, and dialog pointer origin. Their names have no predecessor. Perplexity findings and responses are [recorded separately](../../reviews/desktop-round6-followup.md).

## Final receipts

[Final results](results.json): complete suite 567 passed / 0 failed / 6 existing skips; database gate 32/32; the same 38-check SQL batch rerun on the fresh database **38 passed / 0 failed / 0 skipped**. No one of those 38 checks still fails. Lint has 0 errors / 6 warnings and TypeScript passes. The six existing skipped cases have optional database or legacy fixed-port gates; they are not physical-phone acceptance. Lint warnings remain visible. The original #460 evidence remains historical rather than being relabeled as a fresh pass.
