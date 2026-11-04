Combined Fleet16 validation
Tree: run16/validation ece91b2cf328bb6e453f0fa69159ed6a0d82bb04 (all lane code + current main)
App: http://127.0.0.1:60261 (parent-owned production build/server)
Backend: disposable loopback services only, /tmp/run16-test.env, /tmp/run16-test-stack.
Command: TEST_ENV_FILE=/tmp/run16-test.env APP_URL=http://127.0.0.1:60261 npm test
Log: /tmp/run16-combined-full-tests.log
Running; result pending.
First combined run exit1:661 tests,653 pass,2 fail,6 existing skips,300589ms. Both failures are missing imports in VM test harnesses introduced by D/J source imports: home-photo-preload and sharp-image-identity. Test harnesses fixed on respective branches using actual imported helpers. Targeted D3/3 and J4/4 pass. No runtime code changes.
D fixed head:51bed0e65436fd60623ac92bb6b2035575e3af04.
After both harness fixes, validation8c75ced4 began another suite. Root supplied G runtime correction e54697c2; intentionally stopped that suite via live handle (exit130), merged G, new combined tree af83e6b6a8c30dcc25461cef9c5c733bad319eae. Rebuild pending to ensure app and source match before final suite.
Final combined build PASS (exit0) at af83e6b6a8c30dcc25461cef9c5c733bad319eae using TEST_ENV_FILE=/tmp/run16-test.env APP_URL=http://127.0.0.1:60261 npm run test:app -- build. Log /tmp/run16-combined-final-build.log. Waiting for parent to restart60261 before final full suite.
Full combined suite at af83e6b6 PASS exit0:663 tests,657 passed,0 failures,6 existing optional/fixed-port skips,259234.9ms. Includes latest G runtime correction and both D/J harness fixes. Log/tmp/run16-combined-final-tests.log. After this baseline, C durable lifecycle fix774267e4 requires merge/rebuild plus scoped41 worker/media-session/push-lifecycle checks; a full-suite rerun is not needed for this isolated worker change per root scope.
Final tree e84ab8ae75630cb517a5215ca4b8e6ebd244b15d adds isolated C lifecycle durability fix to the full-suite baseline. Production build PASS exit0 using disposable test environment, log/tmp/run16-combined-durable-build.log. Scoped worker/media-session/push-lifecycle suite PASS41/41,0 skipped,0 failures,18.66s, log/tmp/run16-combined-worker-final-tests.log. Final combined lint pending.
Final combined lint first found three late Fleet15 script warnings (9 total); fixed in H head97389b13 and merged. Final validation tree9d7ada78e30957185e5d71b3920f37c1a6045a06 differs from last app build only in measurement script run15-page-checks.mjs. Targeted script eslint/syntax checks pass. Final complete lint pending.
Final combined lint PASS exit0 at9d7ada78e30957185e5d71b3920f37c1a6045a06:0 errors,6 warnings. Log/tmp/run16-combined-final-lint.log. Final coverage is: full combined663tests/657pass/0fail/6existing skips before isolated C lifecycle patch; final C worker/media-session/push-lifecycle41/41 pass; final app production build PASS; final measurement script targeted eslint/syntax PASS; final complete lint0errors/6warnings.
