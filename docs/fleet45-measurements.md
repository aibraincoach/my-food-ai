# Fleet45 cache-enabled local comparison

PM acceptance at12:27Z: optionA is accepted on the realistic setting. The1793.3ms median passes; the first2359.1ms run is59.1ms above the original2300ms worst-run bound, the other four are inside, and each photo transfers once. This is an explicit PM exception to the worst-run bound. No optionB; reviewer verdict and an exact-head merge order are still required.

PM order of12:22Z: fresh empty profiles, cache enabled, same photo and slow profile, five sequential opens per build. Only the initial Network.setCacheDisabled argument changes from true to false in a separate instrument copy; the original frozen file stays byte-identical. No production access or source-code change.

| Run | First resource ms | 640 shown ms | 1200 shown ms | FCP ms | 640 CDP entries / bytes each | 1200 CDP entries / bytes each |
|---|---:|---:|---:|---:|---|---|
| main-01 | 3771.4 | — | 3902.5 | 916 | 0 / — | 1 / 207051 |
| main-02 | 3383.8 | — | 3642.6 | 604 | 0 / — | 1 / 207051 |
| main-03 | 3518.6 | — | 3634.4 | 612 | 0 / — | 1 / 207051 |
| main-04 | 3489.1 | — | 3577.2 | 556 | 0 / — | 1 / 207051 |
| main-05 | 3528.7 | — | 3609.7 | 660 | 0 / — | 1 / 207051 |
| a-01 | 2359.1 | 2366.6 | 6466.4 | 992 | 2 / 65168, 0 | 1 / 207051 |
| a-02 | 1881.0 | 1898.6 | 6202.1 | 724 | 2 / 65168, 0 | 1 / 207051 |
| a-03 | 1793.3 | 1807.0 | 6189.3 | 628 | 2 / 65168, 0 | 1 / 207051 |
| a-04 | 1792.9 | 1811.4 | 6243.9 | 648 | 2 / 65168, 0 | 1 / 207051 |
| a-05 | 1789.0 | 1800.4 | 6153.7 | 652 | 2 / 65168, 0 | 1 / 207051 |

Main median 3518.6ms; worst 3771.4ms. Candidate median 1793.3ms; worst 2359.1ms.

NOT MET on the PM-ordered realistic setting.

Each candidate640 URL has two CDP request entries, one with65,168 transferred bytes and one with0bytes. This is one network transfer plus cache reuse, not two transfers. Each1200 URL has one207,051-byte transfer. Bytes are CDP encodedDataLength, including response overhead. Request counts are not silently renamed as transfer counts.

Cache-disabled results remain separately recorded: main median3482.4ms/worst3498.0ms; candidate median2043.6ms/worst2336.3ms, with two65,168-byte640transfers and one207,051-byte1200transfer in each candidate run. That profile fails the2000/2300ms thresholds.

Source stays at4472641498bac6f7af355a9452102718e9b5cb8b; no optionB, production run, merge or issue closure. Reviewer-seat verdict pending; AGY cancelled on PM order.


# Fleet45 cache-disabled local results

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
