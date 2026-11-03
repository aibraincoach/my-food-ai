# Run 7 reviewer-route audit

PPLX is the preferred external route. Request metadata and actual answer model are checked separately.

The original authenticated Firefox was reachable and accepted submissions. The following later attempts requested `model_preference=gemini38flash`, but their completed answer footer identified **GPT-6.1 Sol**, which is ineligible to review this OpenAI-authored code:

- PR311, head `8f814f54fbfef039aa48e9626cdca53a910db8f1`: two initial attempts; captures [attempt1](mfa-pplx-pr311-8f814f5-invalid-model-1.md) and [attempt2](mfa-pplx-pr311-8f814f5-invalid-model-2.md). Their mistakenly posted reviewer signatures were corrected to INVALID REVIEW ATTEMPT. Explicit invalidation: https://github.com/aibraincoach/my-food-ai/pull/311#issuecomment-6592608301 .
- PR312, head `9e5877b1ac67c5d195bf5f6887dde7ec66fb6519`: final confirmation attempt; [invalid capture](mfa-pplx-pr312-9e5877b-invalid-model.md), exit4, exact error `WRONG ANSWER MODEL: GPT-6.1 Sol`.
- PR310, head `2d4142bc87c650dea35fca10c7deeb89ed0714b0`: final CORS confirmation attempt; [invalid capture](mfa-pplx-pr310-2d4142b-invalid-model.md), exit4, same exact error.

These captures are failed model-verification attempts, not approvals. No quota or usage-limit claim is made. The temporary runner now checks the actual answer footer before posting a successful receipt, in addition to the original request preference check.

Available-route checks: there was no Cloudflare challenge or authentication failure, so the cookie-refresh trigger did not apply. The owner’s Chrome route is unavailable to the Codex harness under repository policy. Inspection found no SSH configuration/private key or callable remote-server/browser connector for the alternate OCI route. Another authenticated profile was not copied or created for Perplexity.

The owner authorized the documented AGY fallback after this audit. `agy models` listed the configured eligible `gemini-3.8-flash-high`; the local AGY packet/coverage verifier passed6/6 tests. Full exact-head AGY reviews completed with BLOCKERS: NONE and verified complete coverage: [PR310, 9/9 paths and parts](https://github.com/aibraincoach/my-food-ai/pull/310#issuecomment-6592792566), [PR312, 12/12 paths and parts](https://github.com/aibraincoach/my-food-ai/pull/312#issuecomment-6592807543). The exact source heads remain those named above; no source change followed these clean reviews.

Earlier valid Gemini PPLX approvals on unchanged heads are retained. A failed capture deadline for PR313 was superseded by a completed exit0 Gemini confirmation; the incomplete attempt is not the accepted receipt.

The owner subsequently assigned all new PPLX requests and monitoring to a separate runner. The coder stopped launching reviews; both previously active AGY processes completed and were terminal. Current review comments and any new source heads are monitored on GitHub, with real defects returned to their feature owners.
