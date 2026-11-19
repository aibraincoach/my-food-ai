# Fleet 57 targeted recheck finding

Code #1172 at a4735208; deployed main b01f3fe6.

| Measure | Count |
|---|---:|
| Meals listed | 11 |
| Meals rechecked | 10 |
| Rechecks kept | 9 |
| Meals restored | 1 |
| Meals skipped | 1 |
| Tool-reported model calls | 22 |
| Public record IDs fetched once | 8 |
| Failed public record lookups | 0 |
| Food deletions | 0 |
| Retired nutrient entries on kept rechecks | 81 |
| Retirements reversed by restoration | 58 |

| Meal prefix | Disposition |
|---|---|
| 2b585085 | Kept |
| 47913b69 | Kept |
| 0d10c312 | Kept |
| 816869a5 | Restored |
| 18de398f | Kept |
| 2f892793 | Skipped |
| 3501b261 | Kept |
| 494a2c3a | Kept |
| 38de279e | Kept |
| 46f49283 | Kept |
| ccf70daa | Kept |

Known limitation requested by the PM: 46f49283 retains 16 kcal for a salad with dressing. Dressing is not quantified and is undercounted. Later work could compose the salad and dressing as two portions.

The detailed records, captions, nutrient values and restoration evidence remain private. #694 and #990 remain open.
