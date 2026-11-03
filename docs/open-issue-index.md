# GitHub open-issue index

Observed 2026-11-03 00:15:07 UTC: 102 open GitHub issues. Separate from the owner-worded [BACKLOG.md](../BACKLOG.md), which contains open work only and no status section.

The index records current GitHub state; historical issue filing and closure receipts remain on GitHub. No GitHub issue was changed during this handover.

| Issue | Title | Tracked finding |
| --- | --- | --- |
| #2 | Shell screen matches the designer's frame and installs as a PWA | no |
| #3 | Sign-in and sign-up screens match the designer's frames | no |
| #4 | Schema with row-level security | no |
| #5 | Media upload | no |
| #6 | Capture screen matches the designer's frame | no |
| #7 | Job queue and worker | no |
| #8 | SAM 3.1 segmentation step | no |
| #9 | Item naming and portions | no |
| #10 | Nutrition lookup | no |
| #11 | Home screen matches the designer's frames | no |
| #18 | Days stories row and month grid of past posts | no |
| #20 | Profile grid of the user's post thumbnails with sign out | no |
| #22 | Web Push when an analysis is ready or a question is waiting | no |
| #23 | One-time hint tooltips for the + sheet, the thread and the thumbs | no |
| #26 | The demo video and the submission | no |
| #28 | Design system from the designer's style sheet | no |
| #29 | Rendered results-card image added to each post's carousel | no |
| #44 | Dedicated test account for browser checks of signed-in production app | no |
| #60 | A judge-facing pass makes the public repository start-here ready | no |
| #65 | The pipeline's tests run against an offline fake Meta Model API | no |
| #66 | The Meta Model API client sets its retries and timeout explicitly | no |
| #107 | Every card has a visible way to open post detail | no |
| #108 | The app fits an iPhone screen when installed to the home screen | no |
| #114 | Facebook Login in production mode | no |
| #115 | Dark mode | no |
| #116 | An abandoned job on a meal recovers within ten minutes even when no page is open | yes |
| #117 | Meal detail refreshes when the thread's first load already sees a completed correction | yes |
| #118 | A UTC browser's first Home visit saves its detected time zone so day links carry it | yes |
| #119 | A time zone merely carried in a Days link does not stop the browser's zone from correcting it after travel | yes |
| #120 | Days and stories refresh without re-reading every meal's items, nutrition and photos each minute | yes |
| #121 | The search migration backfills search_tsv in batches instead of one table-wide update | yes |
| #122 | Search cards are hydrated in a few bulk queries instead of several reads per result | yes |
| #123 | A feedback vote is rejected while the meal is queued or processing, even from an older card | yes |
| #124 | A slow initial feedback read never overwrites a newer successful vote | yes |
| #125 | A meal at the same place with no caption or photo match never becomes a prior-meal hint | yes |
| #126 | A rejected prior-meal confirmation falls through to the next ranked candidate | yes |
| #127 | The prior-meal confirmation tests serve distinct current and past photos by post | yes |
| #128 | An answered clarification stays hidden when an older refresh finishes late | yes |
| #129 | The thumbs hint is claimed only by a card the reader can actually see | yes |
| #130 | A hint dismissal that fails to save is retried instead of lost until reload | yes |
| #131 | Flipping the camera requires the requested facing, so a flip can never silently keep the same camera | yes |
| #134 | After a failed card regeneration the meal never shows an outdated card beside new nutrition | yes |
| #138 | The pipeline integration tests run against a dedicated test Supabase project, not the shared database | yes |
| #139 | A held worker lease renews for its full time | no |
| #140 | The SAM caller keeps terminal transport causes terminal instead of turning them into a retryable 500 | yes |
| #141 | A voice recording that the worklet never acknowledges stops itself and unlocks the composer | yes |
| #142 | Dictated text is never silently cut at the 4,000-character comment limit | yes |
| #143 | A model-call trace shows how many provider attempts a retried call took and the statuses in between | yes |
| #145 | A registration in flight at sign-out cannot recreate the old account's push subscription | yes |
| #146 | sendPostPush rejects a postId that is not a UUID before querying | yes |
| #147 | Apple push endpoints on regional push.apple.com hosts are accepted | yes |
| #148 | A user can register only a small number of push devices | yes |
| #149 | push_subscriptions has an index on user_id | yes |
| #153 | Changing a meal's eaten time in another tab reorders an already-open feed | yes |
| #155 | A drag that comes back to where it started is never taken for a tap on a photo | yes |
| #156 | The photo on a card is a real link for keyboard and assistive technology | yes |
| #158 | The installed app keeps controls out of the notch area in landscape | yes |
| #162 | Home's intake totals roll over at local midnight and when the page becomes visible again | yes |
| #163 | Home's intake total is exact however many rows the day has | yes |
| #164 | A failed intake read in the day story shows as unavailable, not as zero | yes |
| #166 | A barcode FDC does not hold costs up to nine sequential FDC requests | yes |
| #167 | Successful barcode lookups are cached by GTIN | yes |
| #175 | Days shows days that hold only water or caffeine | no |
| #180 | Household serving strings with parentheses or a leading weight parse to the right unit | yes |
| #181 | A food with several cup or piece portions uses the right one | yes |
| #182 | The servings stepper does not act on a stale value while the page refreshes | yes |
| #189 | A meal's estimate matches what was eaten | no |
| #192 | The photo does not reload while a post is being processed | no |
| #193 | Page looks for every screen against the designer's frames | no |
| #212 | The regular camera reads a barcode and a nutrition label | no |
| #215 | Thumbs up and down respond at the tap | no |
| #216 | Sign out finishes | no |
| #217 | A smoothness audit of every screen | no |
| #218 | Hydration as a share of daily intake | no |
| #221 | The installed app keeps its sign-in on every phone | no |
| #222 | Photos and cards load fast | no |
| #223 | A post's caption can be edited | no |
| #224 | Times on a card are in the user's own time zone | no |
| #226 | Japanese dishes match the right foods in the food database | no |
| #228 | A meal summary's numbers are the calculated totals | no |
| #229 | Non-admin request to a trace page returns 200 with not-found content instead of 404. | no |
| #230 | A coffee with no nutrition does not blank a breakfast, and toast does not match persimmons | no |
| #272 | The food matcher gives the same answer for the same words | no |
| #273 | Meals logged on production show zero calories | no |
| #279 | Sign-up and sign-in resist being hammered | no |
| #280 | The installed app is accepted on two real phones | no |
| #281 | A Meta open-weight model identifies the food (hackathon bonus) | no |
| #282 | The live app keeps working while judges use it | no |
| #283 | A saved card image shows its whole footer | no |
| #285 | The owner's own checks before the recording | no |
| #286 | Rulings waiting on the owner | no |
| #287 | The README shows judges the three Meta models, the technical depth and what the app does not do | no |
| #288 | The open-weights trial (#281) has a Baseten key | no |
| #289 | Frames for logging a drink by photo, by tap or by caption | no |
| #290 | Frames for the capture sheet's modes with Barcode as an obvious choice | no |
| #291 | Frames for removing and redoing | no |
| #294 | The app's words read naturally everywhere | no |
| #303 | Three things only the owner can do that sit inside other items | no |
| #304 | The app opens on the last feed it showed and updates behind it | no |
| #305 | The first card's photo loads first and the photos below it wait | no |
| #306 | Every tap that saves shows its result at once | no |
| #307 | A card shows the foods the app has found while the numbers are still being worked out | no |
