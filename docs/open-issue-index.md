# GitHub open-issue index

Observed November2, 2026 after the PM gap-closure order. #190/#198/#210/#211/#225 closed with evidence; #11/#22/#212 remain open. This is the live GitHub index, separate from the supplied08:26 WIB [BACKLOG.md](../BACKLOG.md). Tracked findings remain labelled and are not silently promoted into the PM backlog. Implementation does not establish acceptance.

| Issue | Title | Tracked finding |
| --- | --- | --- |
| #2 | App shell and navigation | no |
| #3 | Sign in and sign up | no |
| #4 | Schema with row-level security | no |
| #5 | Media upload | no |
| #6 | Capture screen | no |
| #7 | Job queue and worker | no |
| #8 | SAM 3.1 segmentation step | no |
| #9 | Item naming and portions | no |
| #10 | Nutrition lookup | no |
| #11 | Feed | no |
| #18 | Days | no |
| #20 | Profile | no |
| #22 | Push notifications | no |
| #23 | First-run hints | no |
| #26 | Demo video and submission | no |
| #28 | Design system from the designer's style sheet | no |
| #29 | Results card as a carousel slide | no |
| #44 | Dedicated test account for browser checks of signed-in production app | no |
| #60 | The public repository holds no personal names, account detail or internal history | no |
| #65 | The pipeline's tests run against an offline fake Meta Model API | no |
| #66 | The Meta Model API client sets its retries and timeout explicitly | no |
| #114 | Public sign-in with Facebook works in production mode | no |
| #115 | Dark mode renders every screen from the same tokens | no |
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
| #139 | Renewing the worker lease actually extends a lease its own holder still holds | no |
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
| #168 | Desktop browser layout is usable at 1280x800 and 1920x1080 | no |
| #169 | An MCP server and HTTP API let an agent log and read meals | no |
| #174 | A post can be deleted after confirmation | no |
| #175 | Days shows intake-only days | no |
| #180 | Household serving strings with parentheses or a leading weight parse to the right unit | yes |
| #181 | A food with several cup or piece portions uses the right one | yes |
| #182 | The servings stepper does not act on a stale value while the page refreshes | yes |
| #189 | A logged Japanese breakfast shows toast, ham and coffee weights the owner accepts | no |
| #192 | A processing post's photo loads once with no visible reload | no |
| #193 | Every screen is compared to designer frames and differences are listed | no |
| #212 | The regular camera reads a barcode and a nutrition label | no |
| #215 | Thumbs up and down respond at the tap | no |
| #216 | Sign out finishes | no |
| #217 | A smoothness audit of every screen | no |
| #218 | Hydration as a share of daily intake | no |
| #221 | Sign-in is kept on every phone | no |
| #222 | Photos and cards load fast | no |
| #223 | A user can edit a post caption | no |
| #224 | Times use the user's time zone | no |
| #226 | Japanese dishes match the right foods | no |
| #227 | A photo that does not upload never becomes a post without one | no |
| #228 | A meal summary's numbers are the calculated totals | no |
| #229 | Non-admin request to a trace page returns 200 with not-found content instead of 404. | no |
| #230 | Breakfast matches toast to dried persimmons and coffee null blanks the meal total | no |
