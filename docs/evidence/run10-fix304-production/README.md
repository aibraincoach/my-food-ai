# Installed phone production acceptance (#304 / #217)

Actual installed standalone Chrome at390×844, with the primary Slow4G preset (562.5ms latency,180000B/s down,84375B/s up), showed the cached last feed in **1880 /1860 /1770ms**. Fresh data replaced it at2996 /2855 /2737ms. All three launches retained the same article DOM node, y187.390625, height537.578125 and navigation, with no intervening blank/loading frame. [Cached actual page](cached.png), [fresh actual page](fresh.png), [sanitized raw receipt](receipt.json).

Production was READY at `afbb18efe317d6a0981b45a160dc9dc015642bbe`; independent before/after deployment API reads confirmed the same SHA and deployment ID. Network throttling was applied to the existing worker before navigation and the autoattached app page before resume. The original root response was held until an actual cached article appeared, then released, so fresh-first results could not substitute for cached-feed timing.

Real production Auth was used with no CORS bridge. Actual hydrated UI Sign out cleared feed keys/articles; reopening while signed out stayed on Sign in with no old feed. Fresh designated-account2 helper cookies in the same browser showed no account1 articles or cache keys, including frame/mutation observation. No posts, settings or model calls were made. The installed test app was uninstalled and its private browser profile removed.

These are installed app-window cold opens in a primed browser profile, with app windows closed between trials; they do not represent a physical phone or a full browser-process cold boot. The1500ms network-first deadline remains unchanged.
