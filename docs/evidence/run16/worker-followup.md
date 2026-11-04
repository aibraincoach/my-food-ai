Worker-update followup for production M3 failure (#598)
Branch run16/worker-update-followup, based on origin/main7e0c7898 after all ten Fleet16 merges.
Commit6109ab16: only next.config.ts and ServiceWorkerRegistration.tsx changed. register() completion now explicitly calls registration.update(), shared catch handles either failure. NEXT_PUBLIC_BUILD is `${VERCEL_GIT_COMMIT_SHA ?? "local"}-${Date.now()}`, one config value consumed by document and imported script, including same-commit redeploys.
Checks:
- Production npm run build PASS (includes TypeScript), /tmp/run16-followup-build.log.
- npm run lint PASS:0 errors/6 existing warnings, /tmp/run16-followup-lint.log.
- Scoped worker/media-session/push-lifecycle41/41 PASS,0 failed/skipped, /tmp/run16-followup-worker-tests.log. Initial run had40pass/1failure solely local DB refused connection after prior cleanup; restarted only existing disposable PostgreSQL, reran all41 clean, stopped it again.
- Focused actual-component lifecycle checks complete/loading/register-rejected/update-rejected PASS; same-commit config nonce difference PASS. /tmp/run16-followup-lifecycle.log, driver/tmp/run16-followup-check.mjs.
- Local production server60310 actual GET /build.js returned200,Cache-Control:no-store; body self.BUILD="local-1793804922912"; exactly matched live /shell data-build and stayed identical across three consecutive requests.
No production post created, no merge/deployment performed. Local server60310 and restarted disposable PostgreSQL stopped. Production M3 remains for root after reviewed deployments.
