Triage by coder, head 774267e444a0041f928cc37fa1b56ab5a542ede5, model Gemini 4 Hydrogen (request proof and footer agree).
1. SHELL_CACHE pruning runs in install, before the new worker activates; an interrupted install can break lazy chunks for open tabs — Real (verified: keep-filter inside the install waitUntil).
2. Forced client.navigate() on all windows on update discards unsaved form/in-progress state without warning — Real (UX tradeoff, verified).
3. local- prefix timestamp can differ between processes in dev — Real (minor, verified).
4. Redundant same-origin check — Not real (defensive; matches the review's own concession).
Real findings: 3
