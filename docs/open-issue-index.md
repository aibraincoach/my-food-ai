# Issue index retained from main

The previous flat BACKLOG.md index is retained here so restoring the owner’s ordered backlog does not discard any issue reference from main. Titles below are the original main labels; states were freshly read on 2026-11-01T02:11:31+00:00. This is an index, not newly invented backlog problem/context text or proof that an issue is done. It includes historical closed references explicitly labelled CLOSED. The ordered working list is [BACKLOG.md](../BACKLOG.md).

| Issue | Prior main label | Live state at reconciliation |
| --- | --- | --- |
| #2 | App shell and navigation | OPEN |
| #3 | Sign in and sign up | OPEN |
| #4 | Schema with row-level security | OPEN |
| #5 | Media upload | OPEN |
| #6 | Capture screen | OPEN |
| #7 | Job queue and worker | OPEN |
| #8 | SAM 3.1 segmentation step | OPEN |
| #9 | Item naming and portions | OPEN |
| #10 | Nutrition lookup | OPEN |
| #18 | Days | OPEN |
| #20 | Profile | OPEN |
| #23 | First-run hints | OPEN |
| #26 | Demo video and submission | OPEN |
| #28 | Design system from the designer's style sheet | OPEN |
| #29 | Results card as a carousel slide | OPEN |
| #44 | Dedicated test account for browser checks of signed-in production app | OPEN |
| #60 | The public repository holds no personal names, account detail or internal history | OPEN |
| #65 | The pipeline's tests run against an offline fake Meta Model API | OPEN |
| #66 | The Meta Model API client sets its retries and timeout explicitly | OPEN |
| #67 | Each post keeps a trace of its model calls, readable on the admin page | OPEN |
| #114 | Public sign-in with Facebook works in production mode | OPEN |
| #115 | Dark mode renders every screen from the same tokens | OPEN |
| #116 | An abandoned job on a meal recovers within ten minutes even when no page is open | OPEN |
| #117 | Meal detail refreshes when the thread's first load already sees a completed correction | OPEN |
| #118 | A UTC browser's first Home visit saves its detected time zone so day links carry it | OPEN |
| #119 | A time zone merely carried in a Days link does not stop the browser's zone from correcting it after travel | OPEN |
| #120 | Days and stories refresh without re-reading every meal's items, nutrition and photos each minute | OPEN |
| #121 | The search migration backfills search_tsv in batches instead of one table-wide update | OPEN |
| #122 | Search cards are hydrated in a few bulk queries instead of several reads per result | OPEN |
| #123 | A feedback vote is rejected while the meal is queued or processing, even from an older card | OPEN |
| #124 | A slow initial feedback read never overwrites a newer successful vote | OPEN |
| #125 | A meal at the same place with no caption or photo match never becomes a prior-meal hint | OPEN |
| #126 | A rejected prior-meal confirmation falls through to the next ranked candidate | OPEN |
| #127 | The prior-meal confirmation tests serve distinct current and past photos by post | OPEN |
| #128 | An answered clarification stays hidden when an older refresh finishes late | OPEN |
| #129 | The thumbs hint is claimed only by a card the reader can actually see | OPEN |
| #130 | A hint dismissal that fails to save is retried instead of lost until reload | OPEN |
| #131 | Flipping the camera requires the requested facing, so a flip can never silently keep the same camera | OPEN |
| #134 | After a failed card regeneration the meal never shows an outdated card beside new nutrition | OPEN |
| #138 | The pipeline integration tests run against a dedicated test Supabase project, not the shared database | OPEN |
| #139 | Renewing the worker lease actually extends a lease its own holder still holds | OPEN |
| #140 | The SAM caller keeps terminal transport causes terminal instead of turning them into a retryable 500 | OPEN |
| #141 | A voice recording that the worklet never acknowledges stops itself and unlocks the composer | OPEN |
| #142 | Dictated text is never silently cut at the 4,000-character comment limit | OPEN |
| #143 | A model-call trace shows how many provider attempts a retried call took and the statuses in between | OPEN |
| #145 | A registration in flight at sign-out cannot recreate the old account's push subscription | OPEN |
| #146 | sendPostPush rejects a postId that is not a UUID before querying | OPEN |
| #147 | Apple push endpoints on regional push.apple.com hosts are accepted | OPEN |
| #148 | A user can register only a small number of push devices | OPEN |
| #149 | push_subscriptions has an index on user_id | OPEN |
| #153 | Changing a meal's eaten time in another tab reorders an already-open feed | OPEN |
| #155 | A drag that comes back to where it started is never taken for a tap on a photo | OPEN |
| #156 | The photo on a card is a real link for keyboard and assistive technology | OPEN |
| #158 | The installed app keeps controls out of the notch area in landscape | OPEN |
| #162 | Home's intake totals roll over at local midnight and when the page becomes visible again | OPEN |
| #163 | Home's intake total is exact however many rows the day has | OPEN |
| #164 | A failed intake read in the day story shows as unavailable, not as zero | OPEN |
| #166 | A barcode FDC does not hold costs up to nine sequential FDC requests | OPEN |
| #167 | Successful barcode lookups are cached by GTIN | OPEN |
| #168 | Desktop browser layout is usable at 1280x800 and 1920x1080 | OPEN |
| #169 | An MCP server and HTTP API let an agent log and read meals | OPEN |
| #172 | Meals can be saved and logged again | OPEN |
| #173 | A photo can be added to an existing post | OPEN |
| #174 | A post can be deleted after confirmation | OPEN |
| #175 | Days shows intake-only days | OPEN |
| #177 | Queued meals keep being analysed after the first worker run, with no one polling | CLOSED |
| #180 | Household serving strings with parentheses or a leading weight parse to the right unit | OPEN |
| #181 | A food with several cup or piece portions uses the right one | OPEN |
| #182 | The servings stepper does not act on a stale value while the page refreshes | OPEN |
| #185 | The feed has day separators in designer frames at 390×844 | OPEN |
| #186 | The + spin-out has designer frames and motion at 390×844 | OPEN |
| #187 | The Days screen has designer frames for navigation and story exit at 390×844 | OPEN |
| #188 | Intake control and barcode scanner have designer frames at 390×844 | OPEN |
| #189 | A logged Japanese breakfast shows toast, ham and coffee weights the owner accepts | OPEN |
| #190 | docs/eval.md records production results for ten licensed meal photos | OPEN |
| #191 | The + sheet opens camera, text, drink, coffee and a user-defined fifth entry | OPEN |
| #192 | A processing post's photo loads once with no visible reload | OPEN |
| #193 | Every screen is compared to designer frames and differences are listed | OPEN |
| #195 | Designer frames show a second photo marked Not eaten at 390×844 | OPEN |
| #198 | Saved meals and Log again have designer frames at 390×844 | OPEN |
| #210 | Frames for a nutrition label and for correcting a scanned product | OPEN |
| #211 | Frames for the day's hydration on a drink post's card | OPEN |
| #212 | The regular camera reads a barcode and a nutrition label | OPEN |
| #213 | Corrections to a barcode's product are kept | OPEN |
| #214 | A drink post's card shows the day's hydration, including water from food | OPEN |
| #215 | Thumbs up and down respond at the tap | OPEN |
| #216 | Sign out finishes | OPEN |
| #217 | A smoothness audit of every screen | OPEN |
| #218 | Hydration as a share of daily intake | OPEN |
| #219 | Every screen has a visible way home | OPEN |
| #220 | Every meal has a short nutrition summary | OPEN |
| #221 | Sign-in is kept on every phone | OPEN |
| #222 | Photos and cards load fast | OPEN |
| #223 | A user can edit a post caption | OPEN |
| #224 | Times use the user's time zone | OPEN |
| #225 | One unmatched food does not blank a meal's totals | OPEN |
| #226 | Japanese dishes match the right foods | OPEN |
| #227 | A photo that does not upload never becomes a post without one | OPEN |
| #228 | A meal summary's numbers are the calculated totals | OPEN |
| #229 | Non-admin request to a trace page returns 200 with not-found content instead of 404. | OPEN |
| #230 | Breakfast matches toast to dried persimmons and coffee null blanks the meal total | OPEN |
