# Scripts that nothing runs on its own

Most files in this folder are run by `package.json`, by a test or by another script. The ones below are run only by hand. Each one stays for the reason given (#1002). A one-off script that has done its job is deleted, not kept here.

| Script | What it is for | Why it stays |
|---|---|---|
| `auth-hammer.mjs` | Sends sign-ups and sign-ins as fast as a script can | `docs/auth-protection.md` uses it, and #279 is done only when a hammer is refused |
| `feed-probe.mjs` | Repeated read-only feed and Home reads on the test accounts | The only tool that measures how often the feed fails to open (#222) |
| `font-codepoints.mjs` | Lists the characters the font subset must keep | `docs/media-loading.md` describes how the subset was built with it |
| `open-weights-trial.mjs` | The paid comparison of the open model against Muse Spark | `docs/open-weights.md` gives the command to rerun it |
| `trace-rollout-smoke.mjs` | Checks the trace tables through local REST | `docs/open-weights.md` lists it among the trace checks |
| `create-test-user.mjs` | Creates test account 1 or 2 from `.env.local` | The only way to recreate the test accounts the checks sign in with |
| `make-tone.mjs` | Writes `scripts/fixtures/tone.wav`, the non-speech audio fixture | The only way to regenerate that committed fixture |
| `record-fixtures.mjs` | Records the scripted model answers in `tests/fake-meta/fixtures/` | The only way to refresh the fixtures the offline tests replay |
| `real-identify-smoke.mjs` | Paid check of identification on a licensed photo with the real models | A release check that the offline suite cannot make |
| `real-food-match-smoke.mjs` | Paid check of USDA matching with the real model | As above |
| `real-correction-smoke.mjs` | Paid check of the correction answer's shape | As above |
| `real-remainder-smoke.mjs` | Paid check of the leftovers step | As above |
| `real-same-meal-smoke.mjs` | Paid check of the earlier-meal reuse decision | As above |
| `real-vision-quality-smoke.mjs` | Paid check on the ten licensed photos | As above |

The paid checks call the real model with the key in `.env.local`. Run one only when a change touches the step it checks.
