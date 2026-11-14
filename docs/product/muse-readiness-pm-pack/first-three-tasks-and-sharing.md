# First three tasks, trust ladder and privacy-safe shareability

Status: proposed product/experiment artifacts; no UI implementation, events, contact or live experiment launched.

## Task 1 — “Record the meal I actually ate”
Input: one ordinary photo or caption, a visible meal card with honest progress, food identification, portion estimate and a traceable nutrient basis.
Success: the exact meal remains visible and reaches a truthful stable outcome without a manual agent repair. A needed question is understandable and separate; the meal must not appear lost.
Trust earned: the app can keep a record. Do not ask for wide permissions, contacts, public sharing or notifications merely to make the first result appear.
Measure: time to acknowledged/pending card, time to stable meal, success and abandonment, whether a help/retry was needed. Split photo/caption, fresh/reused, new/returning and device/network.

## Task 2 — “Fix what the app got wrong”
Input: “I ate half the rice” or an equivalent portion correction; voice only with transcript confirmation.
Success: the intended item changes, prior version remains inspectable, totals agree across feed/detail/Days and no unrelated food is changed.
Trust earned: the user remains in control and the system is correctable. Label model estimates and reference proxies; do not pretend a photo supplies measured food mass.
Measure: correction success without rescue, edits per stable result, time to consistent totals, wrong-item/unconfirmed mutations (hard stops), confidence as optional qualitative feedback—not fabricated from a smile or retention.

## Task 3 — “Find it again and save effort”
Input: reopen installed app, find the corrected meal in Days/Search, optionally save and Log again.
Success: session persists, corrected result—not the old version—is shown; a repeated meal copies the correct values with lineage and doesn't change the original.
Trust earned: the product is useful tomorrow, not just impressive today.
Measure: all-three completion and time; later voluntary return only in separately approved observation. A synthetic same-session run cannot establish day-7 retention.

## Proposed minimal instrumentation (not implemented)
Use aggregate, consent-appropriate events such as meal_started, meal_acknowledged, meal_settled, clarification_requested/answered, correction_confirmed/applied, prior_meal_found, log_again_created, share_previewed/exported, referral_opened and referred_first_meal_settled. Correlate anonymous session/task identifiers without photo/caption content, raw food/health detail or account identifiers in third-party analytics. Make retries/idempotency explicit; count failed tasks. Review retention/deletion before implementation. Event names are suggestions, not evidence they exist today.

## Screenshot-worthiness experiment
Hypothesis: a short, redacted correction/result artifact helps a recipient understand My Food AI better than a feature list, without exposing private history.
- A: feature description only (control).
- B: consented synthetic/sample meal result, food outline, explicit estimate/reference note and one concise correction outcome. Any original photo must be licensed/consented and location/EXIF/identity stripped.
- C (later): same useful content with restrained recognizable branding. Do not assume a mascot improves conversion.
Primary readout: recipient can accurately state what the product does and its estimate limitation. Downstream hypothesis: referred visitor completes a first meal, not merely taps a link. Guardrails: zero unconsented disclosure, no implied precision/medical promise, no worse first-three-task completion, explicit opt-in only.

Proposed first learning batch: ten consented recipients and >=80% correct comprehension; below 70% redesign rather than buy traffic. This is directional learning, not a statistically powered conversion claim. No batch has been authorized or run. A larger acquisition experiment needs its own audience/baseline, denominator, cost allowance and decision rule.

Sharing rate = eligible users choosing share / eligible users shown an optional opportunity. Referral activation = referred users reaching truthful stable first meal / attributed new referred visitors. Report unknown attribution instead of crediting every download to a meme. Neither metric alone proves retained users, revenue or a viral loop.

## Privacy is part of the output
No default public meal links; no sharing another account's content; no private account IDs, timestamps, body-weight/goal info, lock-screen meal text or location. Prefer explicit download/preview and optional revocation/expiry if links are later built. A real user's result requires their consent independent of agreeing to use the app. No automatic Facebook/Instagram posting and no customer contact by an agent.
