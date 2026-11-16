# Fleet 21 current PR status and evidence

The unchanged dispatched plan is [plan-fleet21.md](../../plan-fleet21.md). This table records current GitHub PR heads and observed merge commits; a merged commit SHA and a reviewed PR head are different identities. Review captures approve only the full head they name. A changed head requires a fresh independent read and its own PM order. No table entry or review grants merge authority.

Snapshot: 2026-11-16T03:37:49.215204+00:00. Read [review provenance](../../reviews/fleet21-review-index.md), [historical validation notes](validation-notes.md), [remediation report](remediation-report.md), [browser observations](browser-observations.md), and [local-check results](local-check-summary.md) with their stated head and scope.

| PR | Current PR head | Merge commit on main / state | Review evidence |
| --- | --- | --- | --- |
| [#909](https://github.com/aibraincoach/my-food-ai/pull/909) | `b0f1037a6947104f97d7cc2da803af9d3b3a01bb` | `5b132cce29801989e32f2e9038435affc4c749fe` | [Exact-head capture](../../reviews/mfa-pplx-pr909-b0f1037.md); read its triage and conditions |
| [#910](https://github.com/aibraincoach/my-food-ai/pull/910) | `a23b73bf319e8a61cdb2a0f36aadd23bc0c49d63` | `33d2c183c435867ca81d64ba82bd0b26e267a822` | [Exact-head capture](../../reviews/mfa-pplx-pr910-a23b73b.md); read its triage and conditions |
| [#911](https://github.com/aibraincoach/my-food-ai/pull/911) | `a151ef033c670613ccabbeb8fd6b39fc4e17b662` | Open; no merge authority implied | Fresh exact-head review and independent read pending |
| [#912](https://github.com/aibraincoach/my-food-ai/pull/912) | `50ea5f705075741b04c605b23fb7d4306dc3bfab` | `8914b3e69a2e461fee95bd24aedfa5d38d7d1ede` | [Exact-head capture](../../reviews/mfa-pplx-pr912-50ea5f7.md); read its triage and conditions |
| [#913](https://github.com/aibraincoach/my-food-ai/pull/913) | `c34f31826af004165ca0a3c8157ebb94679505c8` | `55395bf56bfed730fbb0186b82a40b23e50f4bde` | [Exact-head capture](../../reviews/mfa-pplx-pr913-c34f318.md); read its triage and conditions |
| [#914](https://github.com/aibraincoach/my-food-ai/pull/914) | `319797d4797c7db8ed046c9a4c6ffc8459d5dc0b` | Open; no merge authority implied | [Exact-head capture](../../reviews/mfa-pplx-pr914-319797d.md); read its triage and conditions |
| [#915](https://github.com/aibraincoach/my-food-ai/pull/915) | `90819a1fd24f5b92673eb9a9126184783b99002b` | Open; no merge authority implied | [Exact-head capture](../../reviews/mfa-pplx-pr915-90819a1.md); read its triage and conditions |
| [#916](https://github.com/aibraincoach/my-food-ai/pull/916) | `eadbdc83a9206ef8559a0ac33fbd911c49881862` | Open; no merge authority implied | [Exact-head capture](../../reviews/mfa-pplx-pr916-eadbdc8.md); read its triage and conditions |
| [#917](https://github.com/aibraincoach/my-food-ai/pull/917) | `022f1e55da6cd0b58e35aa77a0b98200d747c4f7` | `7224e953079703c486a7ee7a2edb9c59c854b461` | [Exact-head capture](../../reviews/mfa-pplx-pr917-022f1e5.md); read its triage and conditions |
| [#918](https://github.com/aibraincoach/my-food-ai/pull/918) | `58b02b13dc0f954d8f058c8a64299f605e53a578` | Open; no merge authority implied | [Exact-head capture](../../reviews/mfa-pplx-pr918-58b02b1.md); read its triage and conditions |
| [#919](https://github.com/aibraincoach/my-food-ai/pull/919) | `a4cf9ee8ad7505c5333a8bf6873693261bead42d` | `6710d8f757c6a88f6e02ea9ebc21a99838cc3cac` | [Exact-head capture](../../reviews/mfa-pplx-pr919-a4cf9ee.md); read its triage and conditions |
| [#920](https://github.com/aibraincoach/my-food-ai/pull/920) | `0a574a4604ff296fb1254e52e34d1fbc68f32e46` | `1a60a7a0822374e0b6a114ad1051c23b19651d29` | [Exact-head capture](../../reviews/mfa-pplx-pr920-0a574a4.md); read its triage and conditions |
| [#921](https://github.com/aibraincoach/my-food-ai/pull/921) | `0ea7acbddbc199137b2563abeec85a5d5b86070e` | `a1afa70ab2211b51b31919a5ad06c3fe26fee1ed` | [Exact-head capture](../../reviews/mfa-pplx-pr921-0ea7acb.md); read its triage and conditions |
| [#923](https://github.com/aibraincoach/my-food-ai/pull/923) | `03c0c909e499f876eea3829ddf34308e25932ad6` | Open; no merge authority implied | [Exact-head capture](../../reviews/mfa-pplx-pr923-03c0c90.md); read its triage and conditions |

The original independent-branch builds, page looks and local checks are historical receipts, not certification of later heads. The later combined run used the fourteen heads recorded in remediation/integration-source-check.json: 711 application tests (705 passed, zero failed, six skipped), 49 database tests passed, baseline lint three errors and fourteen warnings. Neither that combination nor those results are silently attributed to newer heads. See remediation-report.md for its explicit runtime limits.

PR #912's fixed-height clipping is repaired at 50ea5f705075741b04c605b23fb7d4306dc3bfab and it merged as 8914b3e69a2e461fee95bd24aedfa5d38d7d1ede. The retained Firefox receipt shows Remove and View contained and hit-testable at both390 and1280 widths, with durable removal verified after reload. This does not close the original upload-failure investigation or prove the chip never covers nutrition numbers. Production confirmation remains separate from the local receipt.

Remaining limits:

- #911's latest caption/drink-detection fix and every later changed head need their own independent read before a merge order. Real microphone/provider speech and the separate camera-caption runtime case remain unverified.
- #914 and #916 remain subject to the investigators' operational/correctness conditions. Existing receipts do not waive those conditions or authorize merges.
- The old #916 measurement removed rereads of the six visible finished cards but retained three requests for other seeded meals; that old run did not meet the absolute-zero done line.
- The two older #918 commands failed. Their [command results](pr11-command-results.json), [post-close](pr11-post-close.json) and [beer](pr11-beer.json) receipts remain historical failures. #615's beer mismatch was not established.
- The historical main auth-count check measured115,10 and18 /user calls for Home, Days and Profile, rather than one. The lost-photo check #708 did not establish its fixture.
- Production Done-when checks, CDN behavior, cold-photo timings and production reads have not been certified by these build/review records. Build and type-check passes after authorized merges do not establish those workflows.
- No migration has run in this remediation. Migration0063 remains a prerequisite immediately before an authorized #915 merge from its ordered head. #915, #918 and #923 are unchanged by this task.

The docs PR #922 remains unmerged. Its own current-head review is posted on the PR after the final documentation commit; ancestor captures are explicitly historical. Merge control remains a written rule; no GitHub setting, workflow or enforcement script is added.
