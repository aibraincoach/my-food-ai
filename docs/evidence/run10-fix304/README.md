# Installed phone last feed: #304 / #217

The matched latest-main baseline (`ab3aff3b3127c509bbd3785b18a78db0a7b020de`) showed the cached last feed at **2368 /1659 /1643ms** on installed Chrome with genuine Slow4G. The first fallback missed2s because its client bundle had never been loaded. A separate compositor diagnostic of the unchanged hard-navigation path also showed a cached card, then a blank/loading frame, then the fresh page; the first card moved from y53 to y187.390625.

The fix pre-caches the anonymous public shell's same-origin public immutable assets, including Flight references. It retains the1500ms network-first window. The fallback mounts the existing Home phone chrome/navigation and the normal cache-first Feed, which revalidates through its owner-authorized HTTP API in place. It no longer replaces the document after50ms. Whole-day rings stay neutral until a verified owner receives an authoritative fresh snapshot; they never sum a partial cached feed into a daily total. Readiness, visibility and minute reconciliation use that API reader only while the fallback is mounted. Normal server Home and other tabs keep their existing refresh behavior. No desktop design work is included.

Final runtime source: `b734f88b29e3e863f51e3add3d310e0dbb2ca8d7`.

| Trial | Cached last feed | Fresh API data |
| --- | --- | --- |
| 1 |1721ms|2302ms|
| 2 |1716ms|2290ms|
| 3 |1700ms|2285ms|

All first samples were actual cached articles in standalone installed windows, with visible images ready. In the compositor run the same article node remained mounted at y187.390625, height555.765625, scrollY0, with navigation present. Its states were initial no-card1575ms → cached1761ms → fresh2299ms, with **no intervening gap**, including an actual verified-readiness pass and a dispatched visibility refresh. The local GoTrue verified200 for the owner and the week strip subsequently displayed its genuine whole-day2kcal value; one browser GET plus its OPTIONS preflight was observed in that app document.

Actual hydrated UI Sign out cleared all feed-cache keys and rendered articles. A logged-out reopen stayed on Sign in. Fresh helper cookies for local account2 in the same browser produced only its cache key and no account1 IDs in the frame/mutation observer. Every installed test app was uninstalled and every owned browser profile removed.

The test uses local disposable infrastructure. Its GoTrue proxy omits CORS headers, so owner-verification checks transparently forward genuine GoTrue responses through a test-only CDP CORS bridge (unchanged status/body, plus562.5ms delay when throttled). This is disclosed in `receipt.json`; it supplies no fake user or nutrient data. No production model/data mutation was performed. Production acceptance remains pending the reviewed merge, stable deployment and account release; these local results do not close the issues.

Validation:23 service-worker tests and25 related feed/cache/auth/rings/readiness tests passed; TypeScript, changed-file ESLint, production build and diff check passed. The new cases cover public/private/foreign asset separation, cached-shell logout races, neutral owner-gated whole-day totals and fallback-only reconciliation. Public cache version advances tov4; private media/logout gates remain intact.

[Slow4G primary preset](https://chromium.googlesource.com/devtools/devtools-frontend/+/HEAD/front_end/core/sdk/NetworkManager.ts):562.5ms latency,180000B/s down,84375B/s up. [Chromium installed-PWA protocol](https://chromium.googlesource.com/chromium/src/+/refs/tags/141.0.7390.132/docs/webapps/cdp-integration.md).

Compositor frames (actual captures, no image alterations):

- Before: [cached](before-cached.jpg), [blank/loading gap](before-gap.jpg), [fresh](before-fresh.jpg).
- After: [cached with Home chrome](after-cached.jpg), [verified fresh data](after-verified-fresh.jpg).
