# Session persistence investigation — Run 4

A controlled test exercised the actual middleware and installed Supabase SSR SDK with an expired session and recorded refresh/user responses. No production account or session was changed.

Before the fix, refresh ran once and returned renewed cookies to the browser, but the request cookie still contained the expired session. The assertion that the current server render reads the renewed session failed. A redirect also discarded the cookie updates produced during failed-session cleanup.

The cookie bridge now updates the request cookie header, forwards that header to the server render, and applies every cookie update to either the continuing response or a redirect. Its tests cover successful refresh, reuse on the following visit without another refresh, failed refresh with a sign-in redirect, and multiple cookie chunks including deletion of an expired chunk.

These checks establish request/response propagation and renewal behavior only. No automated real-phone installation was available for this work. Installed-app close/reopen on two physical phones, offline reopening, and production acceptance remain unproven; issue #221 must stay open until that evidence exists.

PR #244 merged on 2026-10-31 after integrating the pre-stream admin gate from #238. The bridge's current response supplies the 404, so refreshed or cleared cookies survive denied requests as well. This integration does not prove physical-phone installation behavior.
