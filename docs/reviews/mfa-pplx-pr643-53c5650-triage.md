Triage by coder, head 53c565017d00aad727475832ebea1fd918634fe9, model Gemini 4 Hydrogen (request proof and footer agree).
1. Invalid <p> nesting (open editor renders div inside <p> via span) — Real.
2. 52px fixed header overflows with two-row editor + chips — Real (minor, structural).
3. onBlur apply applies draft and sets busyRef, blocking the subsequent button onClick — Real.
4. "1 x2 x2" chains to 4 via recursive parse — Real (minor).
5. "1.5 1/2" accepted — Not real (harmless; inRange still applies).
Real findings: 4
