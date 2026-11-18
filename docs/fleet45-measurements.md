# Fleet45 local results

Option A only; no production access. Frozen response-end time can precede actual display when duplicate requests exist. Supplementary displayed-image observations were applied identically to both builds. Bytes below count completed other responses before the first resource completion; in-flight response bytes are excluded.

| Run | First resource ms | 640 shown ms | 1200 shown ms | FCP ms | Other completed bytes | 640 GETs | 1200 GETs |
|---|---:|---:|---:|---:|---:|---:|---:|
| main-01 | 3482.9 | — | 3539.6 | 536 | 402411 | 0 | 1 |
| main-02 | 3482.4 | — | 3528.9 | 540 | 402414 | 0 | 1 |
| main-03 | 3468.9 | — | 3535.0 | 600 | 402413 | 0 | 1 |
| main-04 | 3464.6 | — | 3508.9 | 612 | 405021 | 0 | 1 |
| main-05 | 3498.0 | — | 3617.0 | 584 | 402413 | 0 | 1 |
| a-01 | 2336.3 | 2451.2 | 6828.9 | 704 | 245636 | 2 | 1 |
| a-02 | 1915.0 | 2666.2 | 6377.5 | 672 | 145420 | 2 | 1 |
| a-03 | 2043.6 | 2289.0 | 6455.9 | 508 | 145424 | 2 | 1 |
| a-04 | 2297.4 | 2798.2 | 6812.2 | 740 | 245510 | 2 | 1 |
| a-05 | 1994.4 | 2297.1 | 6546.3 | 624 | 157492 | 2 | 1 |

Main median 3482.4ms, worst 3498.0ms. Option A median 2043.6ms, worst 2336.3ms.

NOT MET: the median must be at most2000ms, no run over2300ms, and the 640 request count exactly1. No optionB was built.

Main-only baseline827passed/6skipped/0failed; DB58/58. Targeted42/42; typecheck, scopedlint and build pass. No branch full suites. Same seven local meals and real photo, sequential builds; source/profile/build identities in the private evidence. No production access or CPU-utilization claim.
