Triage by coder, head e28aae131ef00432568aff24447462928dd2f2ad, model Gemini 4 Hydrogen (request proof and footer agree).
1. Stale keyboard.current flag when Tab is pressed inside a dialog/input and focus later moves programmatically — Real (minor, verified code path: set on Tab, cleared only on pointerdown).
2. Guard ordering (Tab check before viewport/input guard) — Not real (harmless, as the review concedes).
Real findings: 1
