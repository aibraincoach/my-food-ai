# Needs-input strip thumbnail bytes (#372 / #375)

The actual 390×844 production diagnostic at f8b0324 identified three visible needs-input strip images requesting signed `.feed.jpg` files: 133353 +142579 +221659 = **497591 bytes**. These requests came from the strip, not desktop elements or router prefetch. The existing strip selects the first photo by position.

The strip now selects that photo's immutable media ID and uses the existing owner-authorized `/api/media/feed/<owner>/<post>/<media>/v1.webp` helper. It keeps all questions and photos, owner switching fences, and bounded retries for failed/missing auxiliary media. No direct Storage signatures are needed for these thumbnails. The existing endpoint keeps its ownership checks, original-source recovery and private cache policy.

A fresh actual phone browser context against the production-built local application, reading the **same unchanged production designated-account fixtures**, rendered all three images at44×44 CSS pixels. All three returned200, decoded successfully and used the owner-scoped WebP route:20656 +21286 +21778 = **63720 bytes**, an **87.19%** reduction. Zero signed `.feed.jpg` image requests occurred. [Actual page](after.png) and [raw receipt](receipt.json). No model calls, posts or settings changes were made. Browser/context closed after the read-only measurement.

Eight focused strip/media tests, TypeScript, changed-file ESLint, production build and diff check passed. Three existing media-test assertions were stale after earlier merged owner-URL/cache changes; they now assert those actual approved semantics (all media identities use the route, immutable responses avoid Cookie variation while conditional reads still authenticate and authorize ownership).

This bounded fix cuts a proven phone bandwidth source. It does not by itself establish the separate first-feed-photo two-second acceptance, aggregate Storage attribution, or log-ingestion-byte accounting in the wider issues.
