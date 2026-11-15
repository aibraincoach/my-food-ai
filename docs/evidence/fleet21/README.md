# Fleet 21 evidence before the merge order

The unchanged dispatched plan is [plan-fleet21.md](../../plan-fleet21.md). The source plan's SHA-256 is `edafa1511afb9370ce49effdd0475a8fa5d12ad431d75fdad544aef33f9230b1`.

All fourteen code PRs were built and validated independently from main `96ecdcf7897035b3019d14c7f0af38ce2510f890`. The external-review receipts below correspond to their current full heads. All eleven prescribed page looks have comments. Local check entries K1–K18 are complete as observations, including failed or unverified steps. This is not a production-completion report. No merge or production migration has run.

Read [validation notes](validation-notes.md), [browser observations](browser-observations.md) and [local check summary](local-check-summary.md) first. The adjacent JSON files retain the measurements. The two older check commands both failed; their exact errors are in [command results](pr11-command-results.json), [post-close](pr11-post-close.json) and [beer](pr11-beer.json).

| PR | Current code head | External review | Page comment |
| --- | --- | --- | --- |
| [#909](https://github.com/aibraincoach/my-food-ai/pull/909) | `b0f1037a6947104f97d7cc2da803af9d3b3a01bb` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr909-b0f1037.md) | [observations](https://github.com/aibraincoach/my-food-ai/pull/909#issuecomment-6897612131) |
| [#910](https://github.com/aibraincoach/my-food-ai/pull/910) | `a23b73bf319e8a61cdb2a0f36aadd23bc0c49d63` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr910-a23b73b.md) | [observations](https://github.com/aibraincoach/my-food-ai/pull/910#issuecomment-6897631718) |
| [#911](https://github.com/aibraincoach/my-food-ai/pull/911) | `8b5d99e941273e4f3e439f4480cd097dc8583bf6` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr911-8b5d99e.md) | [observations](https://github.com/aibraincoach/my-food-ai/pull/911#issuecomment-6897709377) |
| [#912](https://github.com/aibraincoach/my-food-ai/pull/912) | `e403e35c7674ae610ee725ca0d03844e0ab00901` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr912-e403e35.md) | [observations](https://github.com/aibraincoach/my-food-ai/pull/912#issuecomment-6897733011) |
| [#913](https://github.com/aibraincoach/my-food-ai/pull/913) | `c34f31826af004165ca0a3c8157ebb94679505c8` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr913-c34f318.md) | [observations](https://github.com/aibraincoach/my-food-ai/pull/913#issuecomment-6897822887) |
| [#914](https://github.com/aibraincoach/my-food-ai/pull/914) | `319797d4797c7db8ed046c9a4c6ffc8459d5dc0b` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr914-319797d.md) | No page change |
| [#915](https://github.com/aibraincoach/my-food-ai/pull/915) | `5d1896c1af122b32de0914a4f3629ee539844339` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr915-5d1896c.md) | [observations](https://github.com/aibraincoach/my-food-ai/pull/915#issuecomment-6897862960) |
| [#916](https://github.com/aibraincoach/my-food-ai/pull/916) | `eadbdc83a9206ef8559a0ac33fbd911c49881862` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr916-eadbdc8.md) | [observations](https://github.com/aibraincoach/my-food-ai/pull/916#issuecomment-6897928622) |
| [#917](https://github.com/aibraincoach/my-food-ai/pull/917) | `022f1e55da6cd0b58e35aa77a0b98200d747c4f7` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr917-022f1e5.md) | [observations](https://github.com/aibraincoach/my-food-ai/pull/917#issuecomment-6897960348) |
| [#918](https://github.com/aibraincoach/my-food-ai/pull/918) | `58b02b13dc0f954d8f058c8a64299f605e53a578` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr918-58b02b1.md) | No page change |
| [#919](https://github.com/aibraincoach/my-food-ai/pull/919) | `a4cf9ee8ad7505c5333a8bf6873693261bead42d` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr919-a4cf9ee.md) | [observations](https://github.com/aibraincoach/my-food-ai/pull/919#issuecomment-6897985152) |
| [#920](https://github.com/aibraincoach/my-food-ai/pull/920) | `0a574a4604ff296fb1254e52e34d1fbc68f32e46` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr920-0a574a4.md) | No page change |
| [#921](https://github.com/aibraincoach/my-food-ai/pull/921) | `0ea7acbddbc199137b2563abeec85a5d5b86070e` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr921-0ea7acb.md) | [observations](https://github.com/aibraincoach/my-food-ai/pull/921#issuecomment-6898008114) |
| [#923](https://github.com/aibraincoach/my-food-ai/pull/923) | `03c0c909e499f876eea3829ddf34308e25932ad6` | [PPLX: 0 real findings](../../reviews/mfa-pplx-pr923-03c0c90.md) | [observations](https://github.com/aibraincoach/my-food-ai/pull/923#issuecomment-6897665323) |

The docs PR (#922) also requires PPLX review of its final evidence-bearing head. Its final receipt is posted on the PR after this commit; code heads do not change to add review captures.

Open results that the merge order must be able to assess:

- The new desktop Remove control in #912 is clipped by the sidebar chip. Phone removal works and persists after reload. It was reported without adding an undispatched fix.
- #916 eliminates requests for the six rendered cards in the measured window, but three residual feed-id requests remain. Its absolute zero-request line was not met.
- The two #918 commands still fail. The required error receipts were preserved. The beer mismatch check (#615) was not established.
- Main's auth-count check measured 115, 10 and 18 /user calls for Home, Days and Profile respectively, rather than one.
- The lost-photo check (#708) could not establish its new fixture, so its retake steps were not claimed.
- The mobile camera-caption mic, Home question heading and photo-detail question heading have explicitly limited visual evidence. Canned fixture nutrition is unavailable; numeric Today equality and literal first paint were not certified.
- Production Done when checks, CDN cache behavior, three production cold-photo measurements, and reads R1–R4 await the PM's full-head-SHA merge order. Speech input and real mobile-data timing remain for GrokBot as specified.

No new issue was created. The two contracts gain a written merge-control rule only; no GitHub setting, workflow or enforcement script was added. The docs PR is not merged unless the owner says so. Part 2 was not dispatched.
