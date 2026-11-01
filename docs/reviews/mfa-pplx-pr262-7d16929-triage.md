Triage by Codex of PPLX review on head 7d1692924ddf14d5249a854ab1a3e21bd1912b2e

1. Real: internal whitespace split equivalent corrected names into different consensus groups. The parser now collapses whitespace before length validation. SQL normalizes existing names using the same whitespace rule. The three-author fixture includes repeated spaces and a tab.
2. Not real as stated: the effect's listener captures only stable React state setters; the router is used by the freshly rendered save callback outside that effect. Payload types were nevertheless checked before lookup, and a sequence guard now prevents an older lookup response from replacing a later selection.
3. Real: an authenticated caller could repeatedly request a paid label read. A database-backed owner counter now admits at most six reads per sixty-second window, atomically across serverless instances. Browser roles cannot read or reset it or invoke its service-only function. The route fails closed if the quota cannot be checked and returns 429 with Retry-After when exhausted.
4. Not a blocker: the existing DOM focus calls do not expose data or leak an identifier outside the page; the label field also uses autoFocus. No observed focus defect was established by this style recommendation.

Validation: TypeScript check passed. The correction tests passed 3/3, including owner isolation, whitespace consensus, six admitted reads, quota refusal, independent owner allowances, window renewal and browser-role denial. Database changes ran in a transaction ending in rollback; no migration was installed.

Real findings: 2
