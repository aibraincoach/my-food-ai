# #450 acceptance on main

The owner requested a fresh check of main, not the pre-merge repair branch. The tested commit is `65ac905d95f71b3e9fa93de16ffcf67ef3614381` in a clean detached checkout. No source or assertion was edited for this run.

## Environment

A newly initialized disposable PostgreSQL 17 database named `postgres` runs at **127.0.0.1:55459**, data directory `/tmp/mfa450-main-fresh/pg`. This is neither production nor the older cloned test database. `scripts/test-stack.mjs` applies repository migrations except external worker-wake scheduling 0024; the local no-op cron adapter cannot wake external services.

Auth, REST and application routes run against that database. The built app is on 60360, Auth on 60368, REST on 60367, local gateway on 60366, and scripted Meta/USDA providers on 60365. Storage uses the documented local HTTP/metadata adapter. Test configuration is private and every backend/provider URL checked by the runner is loopback. The official USDA transport is redirected to the scripted fixture. No production database or live USDA service is used.

## Command and scope

README's unit row uses `npm test`. Its `scripts/test.mjs` invokes Node with `--import tsx`, so TypeScript application imports load. The false bare-Node failure list has been removed. `npm run test:db` uses the same guarded disposable environment.

The initial lint/build attempt in the long-lived main workspace included ignored `uploads/trash` investigation scripts and failed there (35 lint errors / 68 warnings and TypeScript errors in those scratch files). The acceptance run uses the same exact main SHA in a clean checkout, without moving or deleting those scratch files. Clean-checkout lint reports 0 errors / 6 warnings and the production build passes.

Commands:

```
TEST_STACK_DIR=/tmp/mfa450-main-fresh TEST_ENV_FILE=/tmp/mfa450-main-fresh.env TEST_PORT_BASE=60360 TEST_PG_PORT=55459 npm run test:stack
TEST_ENV_FILE=/tmp/mfa450-main-fresh.env npm run test:app -- build
TEST_ENV_FILE=/tmp/mfa450-main-fresh.env npm run test:app -- start
TEST_ENV_FILE=/tmp/mfa450-main-fresh.env npm test
TEST_ENV_FILE=/tmp/mfa450-main-fresh.env npm run test:db
npm run lint
```

The start command runs in a separate terminal. The fresh full suite and lint were compared programmatically against the README rows; they match exactly. Physical-phone acceptance and live food-provider availability remain outside this test receipt.

## Fresh result

| Gate | Result |
| --- | --- |
| Complete `npm test` | 573 tests: **567 passed, 0 failed, 6 existing skips**, 246,438.323779 ms |
| Database `npm run test:db` | **32 passed, 0 failed, 0 skipped**, 20,309.058358 ms |
| `npm run lint` | **0 errors, 6 warnings** |
| Production build (including TypeScript) | Passed |

The full-suite TAP SHA-256 is `6be3f775a6f092186ab1a82ec7882374ff97bf2f00e6987185bad130b8eb290a`. The lint output SHA-256 is `38c6f05177f74e1d88ef2c4c6fb0a846dff6ad7972c9c0c9469e131b6a9c116a`. Local logs are retained privately; no session, credential or fixture account detail is published.

The database-gate TAP SHA-256 is `05926b42be5be470503ea45fbbf9b1807200a67e6e6eed0ca1f57ab5f1deaae8`. All result counts match the current README. The done condition is met. [Issue #450 was closed with the evidence](https://github.com/aibraincoach/my-food-ai/issues/450#issuecomment-6608797873) under the owner’s explicit instruction.

Cleanup: the owned audit app and disposable backend were stopped after both runs. Private local database files remain preserved; the clean audit worktree can be removed after this receipt is pushed. Production configuration and the pre-existing untracked review note are unchanged.
