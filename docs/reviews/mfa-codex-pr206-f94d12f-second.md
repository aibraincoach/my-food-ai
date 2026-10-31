Reviewer: Codex gpt-6.1-sol (additional second review requested by the PM); version reviewed: f94d12f4b2f9e6a13e308d8d9cadfb897875aaac

Receipt SHA: f94d12f4b2f9e6a13e308d8d9cadfb897875aaac
Scope: origin/main...HEAD in a clean clone, sandbox read-only. Exactly one Codex pass. The earlier Gemini receipt is unchanged and remains on this head. No code was changed.

Volume-based barcode posts lose their saved nutrition when servings change. Failed barcode saves also leave staged photos permanently orphaned, with additional copies created on retries.

Full review comments:

- [P2] Preserve volume portions through servings recomputation — /tmp/mfa-second-codex-206-etw11msw/repo/supabase/migrations/0020_food_post_photo.sql:34-35
  For barcode products measured in ml, storing only a null `portion_grams` breaks the existing servings workflow. `set_post_servings` leaves these items' portions unchanged, and `resolvePortionNutrition` treats the missing grams as unresolved, fetching the food again and calling `scaleNutrition` with null. Changing servings therefore replaces the successfully saved drink nutrition with unknown values. Persist a usable volume amount and teach the servings/recompute path to scale it without assuming a mass.

- [P2] Clean up staged uploads when saving the product fails — /tmp/mfa-second-codex-206-etw11msw/repo/src/components/CaptureSheet.tsx:296-297
  If the uploads succeed but `/api/posts/food` fails—for example, because its fresh FDC lookup is unavailable—the uploaded JPEGs have no post or durable cleanup record. Retrying allocates another stage and uploads both files again, permanently orphaning the previous pair. Track and remove failed staged uploads, or add durable expiration cleanup for unclaimed stages.