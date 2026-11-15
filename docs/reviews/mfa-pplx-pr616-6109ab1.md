Head at submission: 6109ab1688d68f77e33743ac56ec60f1afd05148
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 18.5s
Elapsed since tab open: 21.9s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/616

Answer
Links
Images
Share
11:05 AM

code review 
 aibraincoach/my-food-ai#616

Finished
9s

Pull request 
 aibraincoach/my-food-ai#616 (fix: explicitly refresh workers and stamp every rebuild) is a focused, low-risk change (+7 / -3 across 2 files) that is already merged. Both changes directly address stale service worker retention without introducing regressions.

Build ID stamping in next.config.ts

What changed: NEXT_PUBLIC_BUILD now always appends -${Date.now()} to process.env.VERCEL_GIT_COMMIT_SHA ?? "local", rather than only using a timestamp for local builds.

Why it works: Redeploying the same commit on Vercel previously produced an identical NEXT_PUBLIC_BUILD, so the worker import URL did not change. Including the build timestamp ensures every rebuild produces a distinct identifier.

Minor note: Because Date.now() is evaluated when next.config.ts is loaded, any separate process that re-evaluates the config independently would get a different timestamp. Your PR description notes that /build.js matched /shell data-build and stayed identical across requests, which confirms Next.js evaluates it once per build in your setup.

Explicit worker update in ServiceWorkerRegistration.tsx

What changed: navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }) now chains .then(registration => registration.update()) before the existing .catch(() => {}).

Why it works: Chaining registration.update() forces the browser to check /sw.js (and its importScripts dependencies, which carry the new build ID) on every normal page load rather than waiting on the browser's background update schedule.

Error handling: Returning registration.update() inside .then(...) keeps any rejected update promise inside the same .catch() handler, preserving nonfatal behavior when offline or when service workers are blocked.

Overall assessment

No blockers, security issues, or correctness bugs are present in the diff. The change is minimal, well-scoped, and matches the stated root cause.

Show me how to test this service worker update locally
What edge cases could still cause stale workers here
Are there any performance trade-offs with updateViaCache none
How can I monitor service worker updates in production
Generate a release note summary for this fix
Sources
⠋
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen