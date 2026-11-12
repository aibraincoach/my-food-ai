# PM brief — earn trust before buying reach

## Recommendation
Treat reliability as My Food AI's product, not post-demo polish. Prove a short, repeatable meal-log → correction → recall loop before promoting it. Then test whether an intentionally shared, truthful result helps another person understand and try the product.

**Interpretation:** RT's phrase about being ready for the road and vitality is taken to mean launch readiness/reliability and virality. No separate health/vitality feature is inferred. All recommendations below are ours unless explicitly attributed to the article.

## The product we are actually applying this to
At inspected main `96ecdcf7897035b3019d14c7f0af38ce2510f890`, README describes private meal history from photos/captions and spoken corrections; SAM outlines, Muse Spark identification/correction, voice transcription, USDA references, packaged-food fallback, saved meals and optional open-model identification. It explicitly rules out advice, targets and health claims. It is not a generic chatbot.

There is already substantial evidence machinery: ten-photo eval, provenance and portion caveats, real-model gates, production timing reports, hardware acceptance checklist, review policy, durable job traces and many existing issues. **Reuse these; do not open a new generic “make it reliable” lane.** These documents also distinguish merged fixes from missing physical-device or production proof.

## Ten article lessons, triaged for this product
| Article section | My Food AI application | Disposition |
|---|---|---|
| 1 — prototype versus reliability | End-to-end meal tasks must work repeatedly after upload, retry, correction and reopen; a green model response is not the user outcome. | Adopt; consolidate existing proof. |
| 2 — choose your lane | Make one promise: an inspectable record of what was consumed. Do not chase agent-of-everything scope. | Adopt; already anchored by README. |
| 3 — behavior scorecard | Name failure conditions before release; one privacy/data-integrity failure cannot be averaged away by many easy passes. | Adopt/adapt; 40-row proposed pack, not Meta's actual sheet. |
| 4 — one point of view | One accountable product acceptance voice and one consistent result/correction language; no feature committee. | Adapt; do not copy Meta's headcount or management ratio. |
| 5 — screenshot as distribution | An opt-in, redacted result or before/after correction story can explain value. A private meal feed is not automatically a share feature. | Experiment only after trust/privacy gates. |
| 6 — meme growth | Specific, approved examples may be worth sharing; mascot/meme cadence is not evidence of acquisition or retention. | Defer a mascot/meme program. |
| 7 — trust ladder | First task: log. Second: correct. Third: reopen/reuse accurately. Asking for notifications/access should follow demonstrated value. | Adopt as onboarding hypothesis. |
| 8 — agency/ambition | Reduce the effort of keeping an honest food record; do not promise health outcomes or life transformation. | Adapt, tightly scoped. |
| 9 — diamond mine versus skyscraper | Explore share formats as reversible hypotheses; run integrity/reliability as disciplined repeatable operations. | Separate exploratory experiments from release gates. |
| 10 — high talent density | Clear evidence ownership and handoff beat adding process/people. | Adapt; no team restructuring or staffing recommendation. |

## Decision 1: readiness scorecard
Candidate hard-stop classes: cross-user access, lost/duplicated meals, wrong consumed-versus-leftover accounting, stale corrections, unsupported/hidden estimates and broken core paths on supported phones. Keep latency, source coverage and product-quality targets visible separately. The accompanying thresholds are proposed, with named denominators and evidence requirements; no row is pre-marked green.

A test saying `ready` is not accuracy. The current ten-photo documentation explicitly distinguishes name matching from hallucination, visual portions from weighed ground truth, and fresh calls from reused nutrition. Preserve those distinctions. Later code can invalidate older green receipts.

## Decision 2: first three tasks
Proposed trust ladder: **log one meal → correct one detail → find and reuse the corrected result**. Validate on supported devices and realistic meals, without clearing state between steps. A missing push, vanished beer, inaccessible corrected total or repeat sign-in can break the ladder even if a model answered correctly. See the journey artifact; it is not an unsolicited coder order.

## Decision 3: shareability, not forced sharing
Test an optional result that shows the benefit within one glance: original photo where consented, food outline/reference, explicit estimate label, and visible effect of a correction. No automatic public posting, contacts upload, medical framing, calorie competition or notification pressure. Exact model/mascot branding is secondary to explaining what the user achieved.

## Decision 4: priority and scope
**First:** reconcile existing defects and acceptance evidence with the scorecard; preserve open issue ownership. **Next:** validate the complete trust ladder. **Then:** a small, reversible sharing-format experiment if approved. Do not turn this article into 40 feature tickets or override the current backlog's priority/order.

## PM decisions to record
- Which release/audience is being gated, and which device/network conditions are supported?
- Which rows are core blockers versus explicitly excluded optional capabilities?
- What numeric latency/reliability targets and sample sizes are acceptable before a wider release?
- Is a share artifact in scope at all, and what privacy-safe default is acceptable?
- Who owns each acceptance record, and where is its immutable evidence?

## Not claimed
No new tests, model calls, customer outreach or experiments were run. No current production outage/accuracy rate is inferred from historical docs. Source interview statistics are not independently verified. Existing issue closure is evidence about workflow state, not fresh confirmation of behavior.
