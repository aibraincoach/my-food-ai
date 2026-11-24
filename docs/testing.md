# Tests

`npm test` runs every top-level test file, including SQL, HTTP, worker and scripted-model integration tests, serially with TypeScript loading. It refuses non-loopback backend/provider URLs and requires an explicitly disposable stack. It never loads `.env.local` or grants permission to hold the production worker lease. Do not point the integration suite at production.

## Local disposable stack

Requires Node 22, PostgreSQL 17 CLI tools, `psql`, Podman and the project dependencies. Set `PG_BIN` if PostgreSQL binaries live somewhere other than `/usr/pgsql-17/bin`.

1. Run `npm run test:stack`. It creates a new database under ignored `uploads/test-stack`, two local GoTrue users, GoTrue/PostgREST containers, a local Storage HTTP adapter and scripted Meta/USDA providers. It writes private local settings to ignored `.env.test.local`; it refuses to overwrite an existing test environment or data directory.
2. Build the app with the test environment loaded before Next starts: `npm run test:app -- build`.
3. Start it in another terminal: `npm run test:app -- start`.
4. Run `npm test`.
5. Stop that app, then run `npm run test:stack -- down`. Database files and private local credentials remain available for inspection; they are not silently deleted. Use a fresh `TEST_STACK_DIR` and `TEST_ENV_FILE` for a fresh stack.

`TEST_PORT_BASE` changes the default app port 60260 and backend ports +5 through +8; `TEST_PG_PORT` changes 55449. The app launcher reads the matching port from APP_URL. `TEST_ENV_FILE` selects another test environment for both the stack setup and test runner. Environment files, JWT keys, local account passwords and storage objects must remain ignored.

On deployed main, the SQL schema applies the repository's migrations except external worker-wake scheduling (`0024_worker_wake.sql`). Pending #588 also excludes activation-only0055 from bootstrap; its rollout and rollback tests drive activation explicitly. A no-op `cron.schedule` stands in for the managed scheduler so tests cannot wake external services. PostgreSQL, Auth, PostgREST, RLS and application routes execute for real; Storage is a local HTTP/metadata fixture and Meta/USDA answers are scripted. These tests verify behavior and transport contracts, not provider availability, food accuracy, physical cameras, managed cron delivery or production latency. The adapter includes prefix ownership checks, signed upload capabilities and directory listings required by cleanup tests.

`tests/fixtures/local-providers.mjs` redirects only the USDA endpoint to the loopback fixture while retaining the real FDC client/parser code. It refuses activation outside the disposable environment. Barcode fixture results are deliberately named scripted products and are not observations from live USDA. Test doubles for component effects import the actual data helpers and model response/abort races explicitly.

Six existing optional integration cases retain their opt-in or fixed-port gates (servings, food/label HTTP routes, drink edits/HTTP, and leftovers emergency pause). No new skips are used to make the default integration run pass. `npm run test:db` selects the database gate with the same disposable environment checks.

### Capture translation acceptance

The capture browser scripts use CAPTURE_CHECK_OUT, APP_URL, ONLY_ENGINE,
MFA_PLAYWRIGHT_MODULE, and, for Chromium, TEST_CHROMIUM_EXECUTABLE. The food
flow also needs the loopback LOCAL_MODEL_FIXTURE URL. Use the normal service
worker and the scripted local providers described above. Set TEST_OFF_FIXTURE_MISS=1\non the local app for the unknown-barcode case; Open Food Facts then returns a\nscripted 404 without contacting that service.

Create a fresh account for each independent group of checks. Reusing one account
across many camera runs can hit the real hourly cap. Reusing one image after
changing a scripted identify reply can correctly reuse the app's cached result.
Use a distinct synthetic drink image and a new unknown barcode for each label
case; the flow script does this automatically.

    CAPTURE_CHECK_OUT=/tmp/capture-check node --env-file=.env.test.local \
      tests/fixtures/capture-acceptance.mjs setup

The helper requires loopback app, Auth and database URLs and
MFA_TEST_DISPOSABLE=1. It creates one synthetic account, a ready meal and a
scripted model comment, plus a known EAN image. Its private output directory must
be outside the checkout: the temporary session and fixture password are mode
600, and are never printed. Run the selected tests/browser/capture-*.mjs
script with the same output directory. The retry script additionally
needs a local HTTP fault proxy that refuses PUT /api/posts with a known
message_code until explicitly released; do not replace the real transport with
a browser route mock.

Always clean up before starting the next independent group:

    CAPTURE_CHECK_OUT=/tmp/capture-check node --env-file=.env.test.local \
      tests/fixtures/capture-acceptance.mjs cleanup

Cleanup signs out the fixture's own session, removes its rows and media, verifies
zero accounts, sessions, meals, drafts, jobs, comments and storage objects, then
deletes temporary session files and redacts the fixture password. Keep failure
receipts and screenshots. The first-hint script saves the failing page before
closing its context. Playwright WebKit and synthetic camera/microphone streams
do not prove Safari or real-device behavior.
