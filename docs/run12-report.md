# Fleet 12 execution report

Execution started 2026-11-04 10:39 WIB from `origin/main` `6fd863e3348dfad7b6ddb16d6216a5006e82f8bf`. This is an interim report; pending work remains. The original untracked `docs/reviews/mfa-pplx-pr311-e7ece5c.md` in the main checkout is preserved.

0. done — unchanged plan committed; terminology ruling recorded; docs PR [#501](https://github.com/aibraincoach/my-food-ai/pull/501) opened. It remains unmerged pending PM dispatch naming its head.
1. not done — pending execution and verification.
2. not done — pending execution and verification.
3. not done — pending execution and verification.
4. not done — pending execution and verification.
5. not done — migration and rollback built. P1 confirmed by read-only production query: only post_media_pkey, post_media_one_card (partial), and post_comments_pkey exist. Before EXPLAIN: sequential scans, media 0.360 ms / 24 buffer hits, comments 0.371 ms / 19 hits. Local migrated DB gate passes; production application waits for review.
6. not done — pending execution and verification.
7. not done — pending execution and verification.
8. not done — pending execution and verification.
9. not done — migration/RPC/rollback built. Local isolated regression passes: byte-identical revisions for two owned posts, other owner excluded, authenticated/service_role grants and anon denial. The plan test needed a pre-existing post; replaced with transaction-local fixtures and rollback so fresh disposable stacks pass.
10. not done — pending execution and verification.
11. not done — pending execution and verification.
12. not done — pending execution and verification.
13. not done — pending execution and verification.
14. not done — pending execution and verification.
15. not done — pending execution and verification.
16. not done — pending execution and verification.
17. not done — pending execution and verification.
18. not done — pending execution and verification.
19. not done — pending execution and verification.
20. not done — pending execution and verification.
21. not done — pending execution and verification.
22. not done — pending execution and verification.
23. done — not used by the dispatched plan.
24. done — not used by the dispatched plan.
25. done — not used by the dispatched plan.
26. done — not used by the dispatched plan.
27. not done — production authenticated measurement unavailable: existing Firefox profile navigated to /sign-in, with password input present. No sign-in/sign-up submitted. 27c: Claude in Chrome tools absent from this harness; required separate Usage window cannot be opened through them. P2–P4 remain unmeasured.
28. not done — no existing authenticated production session; production sign-in is explicitly forbidden. Local checks continue.
29. not done — pending execution and verification.
30. not done — pending execution and verification.

## Current validation evidence

- Index lane production build passes; lint passes with existing warnings.
- Index lane `npm run test:db`: 35/35 pass after starting the built app. Earlier attempt failed five HTTP checks because the app was not started; corrected run above supersedes it.
- Detail, number-format, revision-batch and drink-rules production builds pass. Remaining per-lane checks in progress.
- Targeted number formatting 4/4, comment labels 3/3, Open identify 4/4, OFF mapper 3/3 and drink rules 15/15 pass.
- Parallel validation reached mem-guard load gates (12.3 and 12.51 vs maximum12); remaining validation is serialized, without overriding the guard.

## Plan corrections within requested behavior

- Item1: remove an additional nested formatCalories locale argument in card-data.ts, required by the changed signature.
- Item19: count the model call after the second finished-reading cache lookup; cached results spend no cap hit. Add existing integration-test assertions for reuse, duplicate and claim cases.
- Item22: assign sent after timestamp validation, so a user can correct an invalid timestamp.
- Item14: docs/testing.md contains no real-label gate; the referenced gate is a false fact. Real-provider verification remains not done.

## Left unfixed

No unrelated fixes made.
