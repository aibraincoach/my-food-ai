Triage by coder, head 525d8e47e806c4adc151ac180b40affbbf2d6b1e, model Gemini 4 Hydrogen (request proof and footer agree).
1. Ultra-wide images collapse the record column (grid height follows --photo-box-h; ~64px at 10:1) — Real (minor, verified CSS math).
2. No unit tests for photoBoxStyle/desktopPhotoVars edge cases (null, 0, extreme ratios); test only updates the mock — Real (minor, verified).
Real findings: 2
