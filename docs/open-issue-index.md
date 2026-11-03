# GitHub open-issue index

Observed 2026-11-03 during PM handover. 96 open issues in the fetched issue snapshot; this is issue state, not an active-fleet dispatch. Completed #450 and duplicate #464–#467 are closed. No issues were changed for this handover.

| Issue | Title |
| --- | --- |
| #4 | Schema with row-level security |
| #5 | Media upload |
| #7 | Job queue and worker |
| #8 | SAM 3.1 segmentation step |
| #9 | Item naming and portions |
| #10 | Nutrition lookup |
| #26 | The demo video and the submission |
| #28 | Design system from the designer's style sheet |
| #44 | Dedicated test account for browser checks of signed-in production app |
| #108 | The app fits an iPhone screen when installed to the home screen |
| #114 | Facebook Login in production mode |
| #115 | Dark mode |
| #116 | An abandoned job on a meal recovers within ten minutes even when no page is open |
| #117 | Meal detail refreshes when the thread's first load already sees a completed correction |
| #118 | A UTC browser's first Home visit saves its detected time zone so day links carry it |
| #119 | A time zone merely carried in a Days link does not stop the browser's zone from correcting it after travel |
| #120 | Days and stories refresh without re-reading every meal's items, nutrition and photos each minute |
| #121 | The search migration backfills search_tsv in batches instead of one table-wide update |
| #122 | Search cards are hydrated in a few bulk queries instead of several reads per result |
| #123 | A feedback vote is rejected while the meal is queued or processing, even from an older card |
| #124 | A slow initial feedback read never overwrites a newer successful vote |
| #125 | A meal at the same place with no caption or photo match never becomes a prior-meal hint |
| #126 | A rejected prior-meal confirmation falls through to the next ranked candidate |
| #127 | The prior-meal confirmation tests serve distinct current and past photos by post |
| #128 | An answered clarification stays hidden when an older refresh finishes late |
| #129 | The thumbs hint is claimed only by a card the reader can actually see |
| #130 | A hint dismissal that fails to save is retried instead of lost until reload |
| #131 | Flipping the camera requires the requested facing, so a flip can never silently keep the same camera |
| #134 | After a failed card regeneration the meal never shows an outdated card beside new nutrition |
| #138 | The pipeline integration tests run against a dedicated test Supabase project, not the shared database |
| #140 | The SAM caller keeps terminal transport causes terminal instead of turning them into a retryable 500 |
| #141 | A voice recording that the worklet never acknowledges stops itself and unlocks the composer |
| #142 | Dictated text is never silently cut at the 4,000-character comment limit |
| #143 | A model-call trace shows how many provider attempts a retried call took and the statuses in between |
| #145 | A registration in flight at sign-out cannot recreate the old account's push subscription |
| #146 | sendPostPush rejects a postId that is not a UUID before querying |
| #147 | Apple push endpoints on regional push.apple.com hosts are accepted |
| #148 | A user can register only a small number of push devices |
| #149 | push_subscriptions has an index on user_id |
| #153 | Changing a meal's eaten time in another tab reorders an already-open feed |
| #155 | A drag that comes back to where it started is never taken for a tap on a photo |
| #156 | The photo on a card is a real link for keyboard and assistive technology |
| #158 | The installed app keeps controls out of the notch area in landscape |
| #162 | Home's intake totals roll over at local midnight and when the page becomes visible again |
| #163 | Home's intake total is exact however many rows the day has |
| #164 | A failed intake read in the day story shows as unavailable, not as zero |
| #166 | A barcode FDC does not hold costs up to nine sequential FDC requests |
| #167 | Successful barcode lookups are cached by GTIN |
| #180 | Household serving strings with parentheses or a leading weight parse to the right unit |
| #181 | A food with several cup or piece portions uses the right one |
| #182 | The servings stepper does not act on a stale value while the page refreshes |
| #212 | The regular camera reads a barcode and a nutrition label |
| #217 | A smoothness audit of every screen |
| #218 | Hydration as a share of daily intake |
| #222 | Photos and cards load fast |
| #229 | Non-admin request to a trace page returns 200 with not-found content instead of 404. |
| #279 | Sign-up and sign-in resist being hammered |
| #280 | The installed app is accepted on three real phones |
| #281 | A Meta open-weight model identifies the food (hackathon bonus) |
| #282 | The live app keeps working while judges use it |
| #285 | The owner's own checks before the recording |
| #286 | Rulings waiting on the owner |
| #288 | The open-weights trial (#281) has a Baseten key |
| #289 | Frames for logging a drink by photo, by tap or by caption |
| #290 | Frames for the capture sheet's modes with Barcode as an obvious choice |
| #291 | Frames for removing and redoing |
| #303 | Three things only the owner can do that sit inside other items |
| #306 | Every tap that saves shows its result at once |
| #307 | A card shows the foods the app has found while the numbers are still being worked out |
| #318 | Read the README before recording |
| #322 | The tick function loads the whole worker before it answers (part of #222) |
| #323 | Every protected page checks sign-in twice (part of #222) |
| #324 | Home computes the day totals twice on every open (part of #222) |
| #360 | Use screen-specific desktop shortcut legends |
| #363 | Reconcile desktop webcam and file-upload geometry with round 4 |
| #368 | Sign-ins through the app may share one rate limit across every user |
| #372 | Feed photos are too large for a phone on mobile data |
| #373 | The app reads more from the production database than it needs |
| #374 | Find when the worker's empty-claim loop started and whether it caused the feed failures |
| #375 | Storage egress is the largest source and was not cut |
| #379 | Phone checks of the installed app over mobile data |
| #413 | The desktop layout is rebuilt to the new frames 6a to 6f |
| #449 | New-upload food names were not observed before totals (#307) |
| #451 | Every barcode scan comes back as not in the database |
| #452 | A plainly visible nutrition label is reported as not found |
| #453 | The barcode prompt is printed over the live camera picture |
| #454 | The Days page is not one continuous calendar |
| #455 | The card you swipe to on a drink's photo shows a number and not what the drink is |
| #456 | A rum cocktail is logged with 15 mg caffeine |
| #457 | An alcoholic drink shows its alcohol, not its liquid |
| #458 | The text box on New post is hidden behind the keyboard |
| #468 | Big numbers lose their thousands separator on the desktop Days and Today |
| #469 | The desktop Home and New post are likely to break below 1280 by 800 |
| #470 | On desktop, adding a photo to an existing post has no file picker |
| #471 | The recording account can hit the hourly model cap on camera |
| #473 | The desktop Today column may not shrink at 1100 px wide |
