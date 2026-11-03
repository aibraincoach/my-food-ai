# PR #315 initial external review triage

Reviewer: Gemini 3.8 Flash via PPLX. Reviewed head `7072cc10be9706634cd7c5456798f0518869ce43`; capture: [review](mfa-pplx-pr315-7072cc1.md). External verdict: Recommend Approve.

1. Dynamic admin import on the detail path — **Not real as a defect.** Node caches the module; the optional metadata read is bounded, occurs after the caller's authorized meal read and exposes only model/host. Moving the import is optional organization, not a correctness fix.
2. Preference switch can retain stale server props on client navigation — **Real, fixed.** A successful PATCH now calls `router.refresh()` after the immediately optimistic local state change. This refreshes server-rendered preference props for subsequent client navigation; failed writes still revert and show their error.
3. Hypothetical upstream generic 400 skips JSON-object mode — **Not real as a current defect.** Both live strict-schema image probes succeeded. Only a format-specific 400/422 warrants another Baseten request; arbitrary failures still take the explicitly documented Meta fallback. Retrying every generic 400 would hide unrelated request defects and add spend.

The new UI-only fix does not change model requests, adapter mapping, migration or trial outcomes. Same-reviewer exact-head confirmation follows on the updated head.

Real findings: 1 (fixed)
