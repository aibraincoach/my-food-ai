# Fleet 14 production desktop geometry

Observed 2026-11-04T08:41:42.440Z in Firefox through native WebDriver BiDi, using a separate designated test account 2 session. The root coder verified production main `a24587a1ec3b57a7b2bdfb5f69cce4e0e73602db` READY and aliased before this read. Its Git tree `501108d7d1af0cce724bcc5965cdfc9cf60139b6` matches the tested integration. This receipt measures rendered production layout; it does not independently re-query deployment identity.

| Viewport | Main | Today visible | Today width | Workspace margins, left / right | Note before first post |
| --- | --- | --- | --- | --- | --- |
| 1100 × 800 | 500 px | No | 0 px | 148 / 148 px | 0 |
| 1280 × 800 | 500 px | Yes | 280 px | 0 / 0 px | 0 |
| 1440 × 800 | 500 px | Yes | 280 px | 0 / 0 px | 0 |

All three ordinary `/` navigations rendered the network Home without an underscore bypass or the cached shell. Each contained a real first post. The feed is 500 px at each width, Today is hidden below 1148 px, the available workspace has balanced margins within 2 px, and no day-level “Known nutrition shown” note precedes the first post.

A live 1280 × 800 production view was displayed directly in the tool after scrolling the first post into view: the sidebar, 500 px feed and Today column matched the intended desktop frame. The focused-card outline extends beyond the feed as in the existing focus treatment. No image file was stored. Existing post content and Today values were not treated as nutrition or owner-phone acceptance.

The service-worker timeout premise P1 remains unproved; these successful production geometry checks do not establish the cause of the owner’s earlier screenshot. See [the numeric receipt](production-desktop-geometry.json).
