# Rounds 1–4 design comparison — partial observation

Observed 2026-11-03, approximately 13:50–14:00 WIB, before Fleet 9 code merges, against `https://my-food-ai-ten.vercel.app` using designated test account 1. Reference: the uploaded `My Food AI.dc.html`, extracted under ignored `uploads/design-round5/`.

This is a **partial comparison, not completion of the requested full visual pass**. Native Chromium was used through direct CDP, without Playwright, image capture, stored images, layout tests or wording tests. The designer HTML was rendered and its frame content inspected; production screens were opened at 390×844 and desktop screens at 1280×800. Observations here come from rendered DOM, visible text, computed styles and a few dimensions. They do not establish literal visual matching for type, colour or spacing. No customer was contacted and no post, token or settings change was submitted.

Common observed styling: live body ink is `rgb(26,25,23)` and light header surface is `rgb(250,250,249)`, consistent with the reference palette. The computed font uses Next’s local-font alias; that alias alone is not a font mismatch. Fine typography, colour, spacing, photo treatment, motion and states explicitly marked unverified still require the requested direct page look. Different account names, dates, totals and food contents are sample-data differences rather than defects.

Each exported frame has its own section below. The HTML contains duplicate exports for 1-04c and 1-04d; they are retained explicitly. States not safely available in the current test-account browsing session are marked unverified instead of being inferred from source code. No fixes belong to this document.

## 4a — 4a Desktop feed with detail beside

Opened desktop feed at 1280×800. The sidebar is about 191 px and the feed column 470 px. The shortcuts say “open” and “close”, rather than the frame’s Open beside/Close detail, and include slide arrows. The post-beside-feed state itself was not opened.

## 4b — 4b Desktop capture webcam

Opened desktop capture. This environment did not provide a usable webcam, so the camera-live state, device picker and Space behavior remain unverified. The fallback upload view is covered by 4c.

## 4c — 4c Desktop capture file upload

Opened desktop capture’s upload fallback. The drop-zone copy matches: Drop meal photos here, or paste one with ⌘V, Choose files, and or write a caption without a photo. No file was selected, pasted or dropped, and the post-file composer is unverified.

## 4d — 4d Desktop Days

Opened desktop Days. The sidebar shortcut legend remains the global feed list (J/K, Enter open, Esc close, N, /, slide arrows), whereas the frame specifies day/week arrow keys and Open day. The long unavailable-nutrition note precedes October’s grid. The day-beside-calendar arrangement was not opened.

## 4e — 4e Desktop Search

Opened desktop Search. Its sidebar keeps the global feed shortcut legend, unlike the reference’s search-specific focus/results/open/clear list. Search result content is covered in the shared observation below; the blank initial query is not treated as missing results.

## 4f — 4f Desktop Profile

Opened desktop Profile. The main column is 760 px, consistent with the frame. It adds the Muse Spark Open switch and explanation above the grid. The sidebar retains the global feed key legend rather than Profile-specific arrows/Open post.

## 4g — 4g Profile connect an agent row

Opened mobile Profile. The Connect an agent label and explanatory subtitle are present. The additional model-selection row between this card and the grid is absent from the frame. No connected-agent count was available on this test account.

## 4h — 4h Create agent token

Opened Connect an agent at both sizes without submitting. Production capabilities read Post a meal you tell it about, Read the meals you have posted, Add a correction to a meal, and Nothing else: no weight, no exercise, no targets. The frame instead says Post meals as you, Read your posts and Days, and Cannot change your account or see your password. At desktop this route remains 390 px, rather than the referenced centered 480 px sheet.

## 4i — 4i Agent token shown once

Unverified state: no new token was created. Token display, Copy/Copied, one-time warning and leave-without-copy behavior remain unchecked.

## 4j — 4j Connected agent

Opened Agents; the designated account has no connected agent card and offers Connect another agent. Last-used/activity presentation, token suffix and revoked state cannot be compared from this empty list.

## 4k — 4k Revoke agent token

Unverified: no existing token was revoked, and no revoke confirmation was opened. Destructive accent and confirmation text remain unchecked.

## 4l — 4l Composer while photo uploads

Unverified transient state: no upload was initiated. Composer byte-progress bars and uploading copy were not inspected.

## 4m — 4m Feed card while photo uploads

Unverified transient state: no upload was initiated. Optimistic local-photo card, media progress bar and upload summary were not inspected.

## 4n — 4n Failed upload

Unverified transient state: no upload failure was induced. Retry overlay, failed progress color and retained-photo copy were not inspected.

## 4o — 4o Upload continues on another screen

Unverified transient state: no background upload was initiated or carried to Search. Floating upload chip size, position and View behavior remain unchecked.

## 3a — 3a Feed post structure

Opened the current feed. Handle rows, day headers, generated numbers cards and consumed macro summaries are present. Several caption-only test posts render long food-name strings; they are not substitutes for the frame’s photo/carousel example. The clarification notices above the strip are additional live content.

## 3b — 3b Post detail

Opened post detail. The main macro summary and Comments section are present, but production inserts model attribution and a Servings control before Comments. The observed reply author is AI rather than My Food AI. A photographed-outline state was not available in the opened post.

## 3c — 3c Nutrition expanded

Expanded all nutrients on production. Friendly Calories/Protein/Carbs/Fat/Fibre/Sugar/Sodium rows are followed by raw USDA rows, including repeated Protein/Energy and technical labels such as Total lipid (fat). Raw units display uppercase G/MG/UG/KCAL. This is longer and less normalized than the frame’s single compact nutrient table.

## 3d — 3d New post composer

Unverified: a photo composer was not created because this comparison took no shot or upload. Camera shell inspection does not establish the light composer’s preview, row spacing or caption state.

## 3e — 3e Leftovers toggle off

Unverified: no two-photo draft was created. Off-state leftovers copy and toggle geometry were not observed.

## 3f — 3f Leftovers toggle on

Unverified: no leftovers draft was created. On-state contrast, badge and photo-2 row were not observed.

## 3g — 3g Card leftovers slide

The live feed shows Add a photo/leftovers (not eaten) affordances on caption-only posts. An existing leftovers photo slide was not opened, so its badge, summary and media layout remain unverified.

## 3h — 3h Carousel end add leftovers

The live feed exposes an Add a photo/leftovers (not eaten) slide on observed posts. The reference’s exact end-of-carousel explanatory copy was not established by this observation; no attachment was added.

## 3q — 3q Two plates leftovers on each

Unverified: no four-photo/two-plate draft was assembled. Plate grouping and leftovers pairing were not evaluated.

## 3i — 3i Bookmark saved and post menu

Opened the current Meal menu: Add photo, Log again, Save meal, Edit caption, Edit time and Delete are present. Add photo is an extra row compared with this frame. The saved toast/Rename state was not triggered.

## 3j — 3j Nutrition label read

Unverified: a nutrition-label photo was not taken or uploaded. The label result, accent box and serving/name fields were not observed.

## 3k — 3k Barcode not found

Unverified: no barcode lookup was triggered. Not-found result and the pack-photo-preserving fallback were not observed.

## 3l — 3l Correct scanned product

Unverified: no scanned product correction sheet was opened. Name Undo, edited-cell borders and per-100 table remain unchecked.

## 3m — 3m Water post card

The live Profile grid contains generated Water drink cards with DRANK, ml, consumed-today and drinks/food splits. A full Water feed card was not separately opened, so its action row and summary spacing remain unverified.

## 3n — 3n Coffee post card

Coffee cards were observed in Profile and mobile Search. The mobile result includes Coffee, cup, 240 ml, 95 mg caffeine, day hydration/caffeine figures and the corresponding Drank summary. Some older posts are labelled Coffee. Desktop Search renders those drink summaries as “Drank: unavailable ml”; see the Search comparison. Calorie differences are recorded data, not a layout defect.

## 3o — 3o Food post with hydration

Observed food numbers cards show Water in this meal and Consumed today lines, and their summaries append ml water. A soup photo/carousel like the frame was not separately inspected. Threshold and across-card total consistency were not tested in this docs pass.

## 3p — 3p Way home from every screen

Feed, Search, Days, Profile and post detail were opened; mobile pill navigation and Feed back links are present on the tab/detail surfaces. Agent pages use Profile back navigation. Bottom-sheet pill-through-scrim tapping, swipe dismissals and every nested fallback route were not exhaustively inspected.

## 2a — 2a Feed day separators

Opened the populated feed. Day headers with Today/Yesterday, dates and consumed totals are present. The week strip uses kcal totals with weekday/date labels, unlike the bare day-number/weekday strip in this round. Live clarification notices add content above it.

## 2b — 2b Feed scrolled one-post day and empty day

Opened the populated feed but did not perform a separate pinned-header/empty-day scroll observation. The one-post day exists. Sticky-shadow behavior, push-off and the empty-day line remain unverified.

## 2c — 2c Plus opening

Unverified transient state: the approximately 120 ms fan opening was not captured or timed. No animation test or image was made.

## 2d — 2d Plus open

The fan was opened through the production control. Camera, Text, Drink, Coffee and Saved entries are present. Its spring, stagger and intermediate rotations were not measured; no timing/layout test was run.

## 2j — 2j Saved meals sheet

Opened Saved meals. The live saved Coffee row says “Coffee 240 g” and Last logged, with Log now. This differs from the reference drink subtitle in ml with caffeine and kcal. Only one saved meal is present; the four reference meals are illustrative data.

## 2k — 2k Log again time picker

Unverified: the earlier-time Log again sheet was not opened. No post was logged. The Now/default, half-hour chips and primary-button text therefore have no current visual evidence.

## 2e — 2e Days two months

Opened Days at 390×844. Stacked month headings and year control are present. The unavailable-nutrition note pushes the October grid down; the reference has no corresponding note. The observed months/days posted differ with account history.

## 2f — 2f Day story entry

Opened a day from the current Days calendar. The summary story has month back control, date, consumed macros, per-post entry and previous/next-day controls with Swipe down to close. The caption-only entry uses kcal as its title instead of the food labels in the frame.

## 2g — 2g Day story exit

Unverified transient state: the story opened, but its half-dismissed swipe-down geometry and scrim were not captured or tested.

## 2h — 2h Intake control

Opened Drink. Water/Coffee/Other, fixed volume choices, ml input and Post · Water 330 ml are present as in this earlier design. The current-day Drank today list was empty for this test account at the observed local day; populated row styling is unverified. Fleet 9’s replacement sheet is not yet production.

## 2i — 2i Barcode scanner

The current camera shell can be opened; no live product barcode was scanned in this pass. Found product, amount chips and pack/result layout are unverified. The current production strip has a third Text mode beyond this frame’s Photo/Barcode pair.

## 1-01 — 01 Sign in

Opened production Sign in. The form, account-switch link and Facebook button are present. Production adds “Facebook sign-in is coming soon.” beneath the button; the frame does not show that line. No CAPTCHA appeared.

## 1-01b — 01b Sign up

Opened production Sign up. Email, Handle and Password controls are present. Production adds the Facebook coming-soon explanation absent from the frame. No sign-up was submitted.

## 1-02 — 02 Empty feed

Unverified state: the designated larger test account has existing posts. Its populated feed cannot prove the empty-feed composition or first-meal prompt. No account or post was removed to force this state.

## 1-03 — 03 Capture sheet

Opened the production camera sheet without taking a shot. Production includes Photo · Barcode · Text, the older swipe hint, When/Now and Search foods in addition to the caption/location controls. These controls are absent from this older frame. The camera image itself was not verified on this machine.

## 1-04 — 04 Feed

Opened production feed. Later day headers, handle rows, macros and “more” links are present; this round-1 frame is materially simpler. The live test account also has clarification/no-food notices above the week strip. Processing-state copy was not reproduced.

## 1-04c — 04c Feed states

The live feed has a No food found notice with Add a caption to log it. The reference places the state inside a photo card; this observation instead found it in the feed notice area. A failed-analysis photo card and retry state were not reproduced.

## 1-04d — 04d Caption only

A caption-only rice post was opened. Its generated numbers card, caption and consumed summary are present. The current card also includes a handle row, macro summary and “more” link from later designs. Amounts and meal names differ because this is test data.

## 1-04c-dup — 04c Feed states

Duplicate exported reference of 1-04c. Same observed comparison and limits apply; it is not a second distinct live state.

## 1-04d-dup — 04d Caption only

Duplicate exported reference of 1-04d. Same observed comparison and limits apply; it is not a second distinct live state.

## 1-04b — 04b Feed expanded

The live summary opens post detail; the observed expanded nutrition is on that detail surface, with a separate nutrient disclosure and item list. The frame instead shows the item analysis expanded inline below the feed summary.

## 1-05 — 05 Clarification sheet

Clarification notices exist in the live feed. The multiple-choice sheet in this frame was not opened, so its choice layout, copy, spacing and Done state are unverified.

## 1-06 — 06 Post detail

Opened current post detail for a caption-only post. It has Feed/Post navigation, handle/date row, generated card, macro summary, collapsible all-nutrients section, model attribution, servings and Comments. This is a later composition than the outline-and-item-list arrangement here. Photo outlines were not verified on this post.

## 1-06b — 06b Edit item

Opened Edit cooked white rice without saving. Production has a unit chooser (g, oz, piece, cup) in addition to Name, Portion and the four portion chips. The frame shows only g. Save, Remove this item and Add another item are present.

## 1-07 — 07 Thread

Opened the existing thread. The live model reply is labelled AI and follows a Comments heading and a Comment or correct input; the reference shows the fuller My Food AI author label. A user correction/revised-reply pair was not present in this observed post.

## 1-08 — 08 Day story

Opened the November 2 day story. Totals, macro records, an entry time and previous/next-day controls are present. A caption-only entry is labelled “97 kcal” rather than a meal name; the frame uses food labels such as sausages and muffin. Its photo-story state was not inspected.

## 1-08b — 08b Days month

Opened Days. Production now has Feed/Days/year controls and stacked months from later rounds. The October section includes a long known-nutrition/unavailable-items note before the calendar, absent from the reference. Different dates and totals reflect test data.

## 1-09 — 09 Search

Opened Search and submitted coffee through its form. See the shared Search observation below; a settled result comparison is recorded only if returned. No conclusion is drawn from an empty query.

## 1-10 — 10 Profile

Opened Profile. Current production adds Connect an agent and an Identify food with Muse Spark Open switch/explanation between the handle and grid. The frame has neither. The grid includes generated numbers cards for caption-only/drink posts, so its contents differ from the photo-only example.

## Shared Search observation

Search was opened at both widths, the coffee query was entered using native Chrome input and the form submitted. The settled desktop result showed 13 posts. Mobile results use full feed cards with handle/menu, generated image, action controls and “more” summaries; round 1’s Search reference shows a simpler photo/caption/date/item-summary composition. Desktop rows list item names without the individual gram/calorie figures shown in 4e. Several desktop drink results read “Drank: unavailable ml”, while the matching mobile Coffee cards show 240 ml and 95 mg caffeine. This is a concrete cross-surface discrepancy. The initial `/search?q=coffee` navigation did not populate the controlled field and is not treated as a defect or empty-result evidence.

## Follow-up grouping

File one issue per affected screen, linking the relevant sections: auth coming-soon copy (1-01/01b); feed notices/week-strip evolution (1-04, 2a, 3a); post-detail nutrient normalization and attribution/servings composition (1-06/07, 3b/3c); Saved meals drink units (2j); Days nutrition notice/day-story entry labels (1-08/08b, 2e/2f, 4d); Profile additional settings (1-10, 4f/4g); agent capability copy/desktop presentation (4h); desktop shortcut legends (4a/4d/4e/4f); and Search mobile/desktop result composition and unavailable drink volume (1-09/4e). These are differences to reconcile with the owner, not all regressions: several come from later accepted features.

The unverified states above need follow-up observation rather than fabricated defect issues. Fleet 9’s separately specified drink/capture/remove changes should be evaluated against round 5 after deployment; this pre-merge production comparison does not claim they shipped.
