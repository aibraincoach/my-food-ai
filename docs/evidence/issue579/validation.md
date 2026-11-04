# Issue 579 validation

Exact head: `6d3d63b4088a72cb67803fe75f93b27d19151072`. PR: https://github.com/aibraincoach/my-food-ai/pull/581

The following final targeted commands passed, with 23 tests total, zero failures and zero skips:

```sh
node --import tsx --test tests/camera-frame.test.mjs tests/camera-flip.test.mjs tests/sharper-capture.test.mjs tests/detail-originals.test.mjs tests/feed-photo.test.mjs
# 16 passed
node --import tsx --test tests/sw-cache.test.mjs tests/media-session.test.mjs
# 7 passed
```

An earlier relevant focused run passed 45 tests. Its coverage overlaps the final commands; these counts must not be added or described as 68 unique tests. Its raw output is retained separately as earlier-overlapping-focused.log.

TypeScript, focused ESLint, git diff --check and the single local production build passed. No full suite was launched for this change. Vercel and Vercel Preview Comments passed on the exact head.

Local isolated-browser checks at 390 px/DPR3 and 1280 px loaded both initial and leftovers signed originals at 1280 pixels and navigated between them. The mobile leftovers screen was viewed directly with the image tool; no screenshot file was stored. Browser context was disposed; existing browser was preserved. These checks use local fixture photos, not physical phone captures.

Three fixture server transforms produced v2 responses of 178682, 257098 and 26428 bytes versus v1 responses of 21778, 39424 and 5758 bytes. The new responses preserve 1280-pixel source detail rather than 512-pixel derivatives and cost more transfer bytes. The 220 KB policy is a target, not a guaranteed ceiling. The benchmark uses Sharp-prepared source JPEGs and exact server transforms; it does not measure browser encoder bytes, mobile data or camera hardware. See byte-bench.json for measured transform times and dimensions.

Three physical phones and mobile-data timing remain owner acceptance. Previously captured low-resolution images cannot regain missing detail. PPLX and supplementary AGY both completed the exact19-file review with BLOCKERS:NONE.

These receipts were recorded locally for the final documentation batch; no separate docs deployment was requested.
