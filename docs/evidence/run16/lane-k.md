Lane K — typed fractional servings

Implementation: decimal input accepts 0.5/1.5 and decimal commas, validates 0.25–50 before rounding to quarters, rejects blank/arbitrary text, and restores invalid text. Existing server route handles nutrition scaling. The confirmed saved count is retained locally during router refresh, so a second invalid blur or immediate step uses the successful count rather than a stale prop.

Checks:
- node --import tsx --test tests/servings-input.test.mjs: 3 pass, 0 fail, including requested cases and bounds/stepping.
- npx tsc --noEmit: exit 0 before final saved-state race fix; combined build will recheck.
- npm run lint: exit 0, 0 errors,14 inherited warnings, no K warnings.
- M11 browser check pending combined validation runtime at phone and desktop widths.

Review correction: confirmed saved state is updated only after response.ok, never optimistically on blur; failure restores the saved draft. The M11 driver also exercises a failed save followed by + to verify the step still starts at the last confirmed count.

Additional disposable stack verification: node --env-file=/tmp/run16-test.env --import tsx --test tests/servings-input.test.mjs tests/servings.test.mjs tests/servings-sql.test.mjs: ALL10 pass,0fail. SQL checks verify item rescaling, version history, queued recompute, stored servings, thread note, owner isolation and range rejection.

M11 PASS on final combined local production build at http://127.0.0.1:60261, both390x844 and1280x800, designated disposable test account2:
- Typed1.5 then0.5 produce exact POST bodies {"servings":1.5}, {"servings":0.5}, both200.
- Typedabc twice restores0.5 each time, shows validation message, no request.
- Additional failure check: intercepted503 save2 restores0.5; + then POSTs1 rather than stepping from failed2.
- Fixture restored to servings1 after each viewport, browser context closed, browser errors none.
- Receipt /tmp/run16-egk-browser.json. The servings endpoint was exercised for real only against disposable local fixture ea954332-6edb-4411-8aeb-2aabe5062bf8; production data untouched.
