# Run 8 Days review triage

Reviewed head `68b11a8c170838b27aa5be4d21d7f78222ba7b04`, [owner review](https://github.com/aibraincoach/my-food-ai/pull/338#pullrequestreview-5747257477).

1. **Not real: embedded media filter drops photo-less parent posts.** The query does not specify `!inner`. PostgREST embedded filters only filter the embedded array by default. [Official resource-embedding documentation](https://docs.postgrest.org/en/stable/references/api/resource_embedding.html#top-level-filtering). A real disposable PostgreSQL/Auth/PostgREST check created a ready caption-only meal, read it through both the original main `getDays` and this PR, and retained it with `photoUrl: null`. `isDeepStrictEqual` reported true for both its full post and the complete day result. The fixture was deleted in finally. A permanent regression also asserts that photo-less meals retain their nutrition/day and make no signing call.
2. **Not real: NULL not-eaten calories lose the legacy ancestor fallback.** The original `getCurrentItems` checks `item.not_eaten_calories !== undefined`, so explicit SQL NULL is returned unchanged. Its ancestor lookup does not replace NULL. `mapCurrentItems` has the same condition. The new regression gives both readers a superseded leftover item with NULL calories, 100 g not eaten and a known 200-kcal ancestor; both return NULL and identical item fields. Replacing NULL with an inferred value would change the existing uncertainty semantics. A schema predating the calories column is a separate rolling-deployment case; Run 8 starts after migrations 0028–0034 are applied.

The runtime implementation is unchanged. Additional regressions cover the two reported cases; same-reviewer confirmation is requested on the new full head.

Real findings: 0
