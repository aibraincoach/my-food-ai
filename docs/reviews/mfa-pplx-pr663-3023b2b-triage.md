Triage by coder, head 3023b2bcc487017c821f54615f21ae0fd398b740, model Gemini 4 Hydrogen (request proof and footer agree).
1. slowTimer not cleared when load() succeeds; it fires setSlow(true) at 3s even after data arrived (harmless: render gates the message on missing day) — Real (minor, verified).
Real findings: 1
