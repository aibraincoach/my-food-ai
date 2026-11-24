# Local freeze-report checks

These scripts require `MFA_TEST_DISPOSABLE=1`, loopback `APP_URL` and Supabase URL, optional `TEST_ENV_FILE`, and `FREEZE_CHECK_OUT`. The output directory must contain a synthetic `fixture-ledger.json` (`user`, `post`, `handle`, `email`) and SSR `session.json` cookie entries (`name`, `value`). Never use an owner account. Supply `MFA_PLAYWRIGHT_MODULE` and `TEST_CHROMIUM_EXECUTABLE` if browsers are installed separately.

Run `freeze-report.mjs` with one `ONLY_ENGINE` (`chromium` or `webkit`) and one `ONLY_LOCALE` (`en` or `ja`). The host must clear only that owned account's reports between cases. The first case exercises the real IndexedDB ring in an isolated page; set `SKIP_RING=1` in the second locale. Contexts persist under the output directory so the close/reopen check uses the same storage.

`freeze-report-faults.mjs` covers both locales, native offline failure and a scripted500. Only WebKit's500 context blocks the worker, because interception does not see requests from a controlled page. `freeze-report-admin.mjs` requires `TEST_FIXTURE_MANAGED=1`: on the host first promote the synthetic account and seed its report, then demote it and delete/read back the report afterwards. This keeps PostgreSQL setup out of the browser container. `freeze-report-final-api.mjs` tests concurrent200/429 and invalid-date400; clear the owned reports before each engine.

Finally revoke the synthetic session, delete the owned account and associated meals/media/drafts/reports, check each is gone, and remove the persistent-context directories. Never print or commit session cookies. Each script exits nonzero on failure; retain its receipt and diagnose the instrument before deciding to rerun.
