# Review captures

Captures are keyed by PR and exact reviewed head. Old-head captures remain historical and do not approve a changed head. This packet carries the original Gemini results, the same-reviewer confirmation of #203's removal, and the owner-requested additional Codex results on #205/#206. Those original findings were subsequently triaged and fixed. The merged #205 head ae1b2a4d062c5751ba8464a761fcb25b3a3359ae and #206 head d7e5d9341a4a315d22a41c6dfaf92d08e1297331 each have same-head Gemini and Codex receipts reading BLOCKERS: NONE. The final receipt links are in CLAUDE.md; the earlier captures remain historical and did not waive the findings.

Store new evidence separately when adding it to a reviewed feature branch would invalidate its exact-head receipt. Do not store credentials, private account identities, user health data or token-bearing links. Current delivery/hold status is in CLAUDE.md. A review document is not a merge order.

## Run 4 merged heads — 2026-10-31

The ten PRs below merged in ascending order. Gemini 3.8 Flash through PPLX independently reviewed the code; the original reviewer confirmed real fixes and conflict resolutions. A final disposition names the exact reviewed head after triage. Review and preview checks do not establish production acceptance. Earlier in-branch PPLX triage captures remain historical.

| PR | Final head | Merge commit | Same-head receipt or final disposition |
| --- | --- | --- | --- |
| [#236](https://github.com/aibraincoach/my-food-ai/pull/236) | `bf56728eee1e4e34d4e21131c27282f99acfb754` | `eb646a4e250e61840df2c8df13f693371095769a` | [BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/236#issuecomment-6539023754) |
| [#237](https://github.com/aibraincoach/my-food-ai/pull/237) | `8d00f4b62b95f0798e6d9d8f1d665ca2be0fe635` | `eb109d1f247a3c0f0964d7bf2a7abbec7c5d252b` | [BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/237#issuecomment-6540748543) |
| [#238](https://github.com/aibraincoach/my-food-ai/pull/238) | `e265978c4090040e5ed4bc44b8bca6b3d5016bcd` | `d8905512d0ab20dea161ce5714db735844d2b410` | [BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/238#issuecomment-6538994662) |
| [#239](https://github.com/aibraincoach/my-food-ai/pull/239) | `76aa7415f2547523ea3c7660a14aa28f1f8529a6` | `e75ad465e9d5f822897c0c46de2f3338a6ccfd66` | [BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/239#issuecomment-6538994953) |
| [#240](https://github.com/aibraincoach/my-food-ai/pull/240) | `4624d32c41a3b3bd9f2dabbd5d64385915799e3b` | `2fe8cb31c4f9b0cf5d60de6398c22b40f4c20ff2` | [BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/240#issuecomment-6540839989) |
| [#241](https://github.com/aibraincoach/my-food-ai/pull/241) | `3e4807125c0c9fcd3f596e2f8c73a163a8c19e55` | `c016e9681d9d8296d25dd8c579c810c4866978b2` | [BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/241#issuecomment-6540892692) |
| [#242](https://github.com/aibraincoach/my-food-ai/pull/242) | `e852c2aa350f04a1d5d9bb1da0a1c7de3ce0fdc4` | `d04129e77f57239d95d06cd47c73419cd8a30e79` | [BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/242#issuecomment-6538995759) |
| [#243](https://github.com/aibraincoach/my-food-ai/pull/243) | `8fef65c7d157df051dd2e64de94a561ae6201b75` | `71105c288cee20557a1b391e5d7a21907190d535` | [BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/243#issuecomment-6538996064) |
| [#244](https://github.com/aibraincoach/my-food-ai/pull/244) | `21f0c0c41278ee009dbe1c984585bf95aa596803` | `373ccb5d80d5ebf8b437ed7cfd21cfd5716bdb46` | [BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/244#issuecomment-6540840060) |
| [#245](https://github.com/aibraincoach/my-food-ai/pull/245) | `2b06b63207f8e8acb931e28928c4fa20315e8202` | `34d905161cd129b30b86d305a91cedf8a183ca27` | [BLOCKERS: NONE](https://github.com/aibraincoach/my-food-ai/pull/245#issuecomment-6540840025) |

## Runtime follow-ups — 2026-10-31

Both fixes received independent Gemini review through PPLX, followed by evidence-based triage. The two model-output failures are distinct. Real Meta smoke results and production acceptance are recorded separately.

| PR | Reviewed head | Merge commit | Same-head final triage |
| --- | --- | --- | --- |
| [#246](https://github.com/aibraincoach/my-food-ai/pull/246) | `144dbf336c7412618b72c2ff9a655f4278df04e3` | `3769e7888b785cca8fde5d1e7d2836f264aa2f4c` | [BLOCKERS: NONE after triage](https://github.com/aibraincoach/my-food-ai/pull/246#issuecomment-6540898054) |
| [#247](https://github.com/aibraincoach/my-food-ai/pull/247) | `b224e9ac89ca1cf14879266227bc2a82c1193aa0` | `b6fa1c278251421112b2db3a3d64c7bc51fde60b` | [BLOCKERS: NONE after triage](https://github.com/aibraincoach/my-food-ai/pull/247#issuecomment-6545317333) |
| [#248](https://github.com/aibraincoach/my-food-ai/pull/248) | `72fe5b02f00acc3d1086f4ac26ca2a37b6697b3b` | `fa491be094ae145a623d4416cb672ed101543dc5` | [BLOCKERS: NONE after triage](https://github.com/aibraincoach/my-food-ai/pull/248#issuecomment-6545597184) |
| [#249](https://github.com/aibraincoach/my-food-ai/pull/249) | `1ff60524e51d48285e09c4e097e113597009e2f2` | `edb56d42c8a2b1dad12434a9ae4b46f6820e7a32` | [BLOCKERS: NONE after triage](https://github.com/aibraincoach/my-food-ai/pull/249#issuecomment-6545822136) |
