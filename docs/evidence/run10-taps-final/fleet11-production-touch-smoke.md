# Production touch smoke after #491 merge

Production was tested on 2026-11-04T00:53:28.288Z following merge `4083f1a`, using designated account2, Chromium390×844 and CPU×4. All five controls—Home, Search, entry-fan opener, fan Text, and empty Search field—showed the deployed `data-tap-pressed` marker during an actual held touch. Contact feedback appeared in 5.2–10.6 ms; all five were below100 ms.

Four controls had no sampled selected-control movement. The Text fan entry moved while its fan dismissed and the composer opened, an expected transition. Actual rAF cadence was 49.2–76.5 Hz. **240 fps was not achieved**; full-viewport flicker and real-phone feel remain unverified.

No fixtures, storage objects, posts, or server mutations were created. Navigation, fan opening, and empty-field focus leave existing owner records untouched. The browser context closed after the probe. Raw private traces are in `/tmp/run11-tap-private-traces-production`; JSON receipts contain hashes, frame intervals, sampled marker state, and geometry. No other sweep was repeated.
