# Local identity and Today checks

Default Turbopack production build at source 3c5d55a9f6e134f29273413e166addebcea6021a, real disposable PostgreSQL/Auth/REST backend; native Firefox WebDriver BiDi. Three pre-seeded local ready meals, not production accounts. No image capture stored.

At 390×844 and 1280×844, Home, Days and Profile each made zero browser `/auth/v1/user` requests. Home made zero `/api/days` requests; desktop Today showed three meals and their 300 kcal total. All unsigned direct Home and standalone-post requests redirected to sign-in.

With the cookie matching the browser's America/Edmonton zone, Home made zero first-page `/api/feed` reads, but one (phone) or two (desktop) `ids=` refresh reads; those are recorded in the JSON and are not claimed as zero API traffic. Earlier trials with a forced UTC cookie mismatched the detected browser zone and caused extra first-page reads; they are rejected as the known-zone case. They do not prove the requested first-ever-visit case.

Server logs include middleware verification on document requests, server actions and Next Link prefetches. The source reuses the per-request verified header in page and hint readers; one document log line cannot prove only one verification over all network activity. The `homeDayTotals` query still reads today's current nutrition separately from the feed query. Therefore these checks do not establish #323/#324's broad single-read done conditions, and production per-navigation counts remain required.

Focused access/data/current-desktop tests: 24 passed, zero failed/skipped. TypeScript, default build and focused lint passed. The combined fleet suite is still required.
