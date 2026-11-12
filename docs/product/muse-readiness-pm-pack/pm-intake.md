# PM intake — candidate decisions, not dispatched work

This is prose for the PM. It is not a coder prompt, issue creation/closure, reprioritization of the owner backlog or an execution plan. Existing implementation, issue state and live acceptance are different records. Reconcile them before any dispatch. Each candidate below describes a product problem; implementation choices remain with the coder under the normal planner/review/merge process.

## Candidate A — one evidence-led readiness view
The product has many partial/historical receipts but no readiness conclusion should be inferred from a demo, an old test count or a merged PR. Map adopted scorecard rows to existing issues and exact-build evidence. Expected PM artifact: a release decision record with scope, evidence ownership, missing proof and explicitly excluded capabilities. No duplicate generic reliability issue.

## Candidate B — preserve the user's record through uncertainty
A disappearing meal or stale correction feels like data loss even when the backend has rows. Use the existing beer/question, progress and correction lanes to assess the complete user journey. Relevant current-open references: #615, #449; historical Fleet 19 report also says #628's end-to-end proof remained partial. Do not assert that code is still unfixed without a new observation.

## Candidate C — actual-device first value
Blur, waiting after Post, slow first photos, safe areas and barcode discovery can break the first task before model quality matters. Relevant current-open references: #579, #372, #370, #108, #212. Reconcile documented implementation with physical-device evidence; desktop emulation does not close hardware acceptance. No long soak or repeated test run is authorized here.

## Candidate D — honest, interpretable nutrition
A fast answer is not enough if the reference, uncertainty or consumed-vs-leftover basis is hidden. Preserve the existing eval-method caveats. Review closest-match and missing-data presentation (#572) against the deployed policy and reconcile stale README wording (#657, state not checked in this capture). Separate photo identification, true portion accuracy and exact label arithmetic.

## Candidate E — a reliable first-three-task loop
The first experience should teach log → correct → find/reuse. Map onboarding checks onto existing flows, not a new onboarding feature stack. #568 is a related current-open explanation/judge-page item, not evidence of a general onboarding implementation. #22 (push) and #221 (session) are closed at capture; do not duplicate/reopen based on old documents alone.

## Candidate F — optional, privacy-safe result distribution
The product has private meal history, not a verified public share flow. Evaluate a sample/redacted output against comprehension and truthfulness before committing to a mascot or referral system. This candidate is a research proposal. It is not authorization to publish meals, notify/contact customers, add tracking or build public links.

## Project scope guardrails
Keep the product as a food record: no medical advice, targets, diagnosis or health claims. No covert surveillance. No changing optional model providers or spending limits. No 200-person organization or 100-row framework copied as a staffing mandate. No current backlog, contract, Wall, issues or closed acceptance conditions rewritten by this pack.

## Live issue-state crosswalk (capture only)
| Issue | State | Title | Updated |
|---|---|---|---|
| [#579](https://github.com/aibraincoach/my-food-ai/issues/579) | open | Photos are captured at 480 × 640 and look blurry on high-density phones | 2026-11-04T10:03:37Z |
| [#372](https://github.com/aibraincoach/my-food-ai/issues/372) | open | Feed photos are too large for a phone on mobile data | 2026-11-04T14:36:10Z |
| [#370](https://github.com/aibraincoach/my-food-ai/issues/370) | open | The camera view stays open for a long time after a photo is taken | 2026-11-04T16:30:06Z |
| [#615](https://github.com/aibraincoach/my-food-ai/issues/615) | open | A posted beer disappears and a clarification card takes its place | 2026-11-04T16:30:07Z |
| [#449](https://github.com/aibraincoach/my-food-ai/issues/449) | open | New-upload food names were not observed before totals (#307) | 2026-11-04T09:29:26Z |
| [#568](https://github.com/aibraincoach/my-food-ai/issues/568) | open | Judges have no page that shows how the app works | 2026-11-04T08:43:10Z |
| [#22](https://github.com/aibraincoach/my-food-ai/issues/22) | closed | Web Push when an analysis is ready or a question is waiting | 2026-11-03T03:14:37Z |
| [#221](https://github.com/aibraincoach/my-food-ai/issues/221) | closed | The installed app keeps its sign-in on every phone | 2026-11-03T03:14:36Z |
| [#212](https://github.com/aibraincoach/my-food-ai/issues/212) | open | The regular camera reads a barcode and a nutrition label | 2026-11-02T14:35:07Z |
| [#108](https://github.com/aibraincoach/my-food-ai/issues/108) | open | The app fits an iPhone screen when installed to the home screen | 2026-11-02T13:56:28Z |
| [#572](https://github.com/aibraincoach/my-food-ai/issues/572) | open | The closest-food fallback never runs when the model stops after one search | 2026-11-04T08:43:13Z |
| [#567](https://github.com/aibraincoach/my-food-ai/issues/567) | open | The owner has no admin surface | 2026-11-04T08:43:10Z |

The current repo-doc snapshot contains older statements and incomplete proof. These issue states were freshly read; none has been transitioned by this task. Product behavior still requires its own current evidence.
