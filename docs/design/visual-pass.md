# Rounds 1–4 design comparison — partial observation

Observed 2026-11-03, initially approximately 13:50–14:00 WIB, with direct visual follow-up of agent, saved-meal, capture, upload, barcode, label and core mobile/desktop flows through 14:55 WIB, before Fleet 9 code merges, against `https://my-food-ai-ten.vercel.app` using designated test account 1. Reference: the uploaded `My Food AI.dc.html`, extracted under ignored `uploads/design-round5/`.

This remains a **partial comparison**. The major unobserved page state is the genuine empty feed1-02. Available frame families now have direct rendered-page views; the remaining data, motion and substate limits are stated per section below. Native Chromium was used through direct CDP, without Playwright, stored images, layout tests or wording tests. The follow-up used transient in-memory page images for literal visual inspection of the agent/fan/saved-meal, capture/composer/upload, barcode/label, auth, feed/detail/outlines, Days/story, Profile and desktop flows; no image file was created. Real token text was masked before each live-token image. The designer HTML was rendered and its frame content inspected; production screens were opened at 390×844 and desktop screens at 1280×800. Observations here come from rendered DOM, visible text, computed styles and a few dimensions. Outside the explicitly named direct visual follow-up, they do not establish literal visual matching for type, colour or spacing. No customer was contacted or existing post/settings changed. The bookmark follow-up also created and then unsaved one temporary saved-meal snapshot without changing the source post/items. The follow-up created one designated-test-account token, never used/copied it, then revoked it. Upload observation created one temporary private draft and one temporary test post; both records and their10 storage objects were removed and verified absent. Barcode/label inspection created three unpublished drafts and one label stage/reading; all four stages, eight storage objects and the reading were removed and verified absent. Delayed idempotent media-cleanup jobs remain for signed-capability expiry. The synthetic camera and synthetic label input are explicitly disclosed in the relevant sections; no model response was fabricated.

Common observed styling: live body ink is `rgb(26,25,23)` and light header surface is `rgb(250,250,249)`, consistent with the reference palette. The computed font uses Next’s local-font alias; that alias alone is not a font mismatch. Available screens were compared visually for layout, colour, type, spacing and copy. Exact animation timing, intermediate byte-fill behavior and physical-camera quality were not tested; those are not substituted for a missing page look. The empty-feed state remains explicitly unverified. Different account names, dates, totals and food contents are sample-data differences rather than defects.

Each exported frame has its own section below. The HTML contains duplicate exports for 1-04c and 1-04d; they are retained explicitly. States not safely available in the current test-account browsing session are marked unverified instead of being inferred from source code. No fixes belong to this document.

## 4a — 4a Desktop feed with detail beside

Directly viewed the populated desktop feed and an existing rice post opened beside it at1280×800. The470px feed and440px rounded white detail panel are present, with independent scrolling, Post header and Esc/close control. The sidebar says “open”/“close” rather than Open beside/Close detail and adds slide-arrow keys. The caption-only numbers hero repeats across both columns and pushes Comments below the detail fold; this is different post content from the reference photo, not a missing-photo claim.

## 4b — 4b Desktop capture webcam

First observed the no-camera environment choosing Upload a file, as the documented fallback. Then opened a separate owned native Chromium instance with --use-fake-device-for-media-stream and --use-fake-ui-for-media-stream; actually viewed the built webcam UI with a synthetic green video backdrop. This verifies the real UI layout with synthetic media, not physical-camera image quality. Viewfinder400px tall exists. Live camera picker sits bottom-left; reference positions it top-left. Live shutter is larger, and Space hint sits below the shutter; reference puts the hint to its right. Live modal is taller and positioned higher (about760×662 versus reference760×614). Close control is circled in live versus bare× in reference. Header/tab text looks lighter than reference. No synthetic photo was taken.

## 4c — 4c Desktop capture file upload

Actually viewed production Upload a file state and reference4c. Centered760px modal, source tabs, dashed zone, icon, Choose files and caption-only action exist. Live zone is400px high versus reference480px, making live modal about760×526 versus reference760×614. Live close× has a circle; reference does not. Reference title and drop-zone heading are visibly heavier. Main sidebar/background differences are shared with the other desktop frames, rather than a separate upload-flow result.

## 4d — 4d Desktop Days

Directly viewed desktop Days and selected November2 beside the calendar. The right card contains date, consumed total, post count, thumbnail, caption/time/kcal and Open the day. The calendar scrolls independently. The sidebar retains the global feed shortcut list instead of day/week navigation/Open day. The long unavailable-nutrition note precedes October’s grid and is absent from the reference. Different dates/totals reflect account history.

## 4e — 4e Desktop Search

Directly viewed the settled desktop coffee search with13 results. Rows contain140px neutral numbers-card thumbnails, caption/date, muted item names and a summary. Multiple rows visibly say “Drank: unavailable ml” while their thumbnails say240ml. Individual item grams/kcal from4e are absent. The sidebar retains global feed shortcuts instead of search-specific keys. A temporary failed-upload chip appeared during the separate owned upload observation; it is not asserted to be a permanent Search defect.

## 4f — 4f Desktop Profile

Directly viewed desktop Profile. Its760px main column contains a round avatar/handle, Connect an agent, model-selection row/explanation and three-column grid. The model-selection row is absent from4f. The sidebar retains global feed keys instead of Profile arrows/Open post. One separately owned temporary visual-upload draft appeared in the grid during observation and was subsequently removed; that test image is excluded from permanent-state conclusions.

## 4g — 4g Profile connect an agent row

Directly viewed the reference and production mobile Profile as transient images. The Connect an agent row is present, but its live subtitle wraps to two lines while the frame keeps one line. Live Profile adds the Muse Spark Open setting above the grid. The live grid includes actual photos and generated cards; the reference uses placeholders. Simulated reference status-bar space is excluded from spacing judgments.

## 4h — 4h Create agent token

Directly viewed both create-token screens. Production uses smaller/lighter muted paragraph text and a lighter screen title than the frame; its capability list adds a correction permission and uses different wording (Post a meal you tell it about / Read the meals you have posted / Add a correction to a meal / Nothing else: no weight, no exercise, no targets). The frame lists Post meals as you, Read your posts and Days, and Cannot change your account or see your password. The default live name is Agent 1, selected on opening. Desktop DOM observation remains: the route is 390 px rather than the referenced centered 480 px sheet.

## 4i — 4i Agent token shown once

Created one token named Run9 visual validation 20261103 on the designated test account and directly viewed the one-time page against the frame. The real token was replaced with [redacted] in the rendered textarea before viewing; it was never copied, logged or saved in an image. The live explanatory paragraph and heading are lighter/smaller than the reference; token field, dark Copy token button and bottom outlined Done button follow the same overall arrangement. Done without copying opened the expected Leave/Stay warning, which was also viewed. Copy/Copied and clipboard behavior were not exercised. The temporary token was then revoked.

## 4j — 4j Connected agent

Directly viewed a newly connected test agent and the reference. Production groups Activity and Revoke token inside the bordered agent card, whereas the reference places its activity list and separate revoke row beneath the small identity card. Connect another agent is a rounded bordered button in production, versus the reference’s plus-icon row. The fresh token has no Last used or activity events, so populated activity-row content remains unverified. After the visual check the token was revoked and the live card showed Revoked.

## 4k — 4k Revoke agent token

Opened and directly viewed the revoke confirmation, then revoked only the newly created designated-test-account token. Both screens show the explanatory copy, dark-red destructive primary action and Cancel. The live body and title use lighter text and the live sheet is shorter, with less bottom space than the reference (after allowing for its simulated status bar). The temporary agent name wraps over two lines. After confirmation the DOM showed Revoked and no active Revoke token button. No customer token was touched.

## 4l — 4l Composer while photo uploads

Observed actual composer with four selected photos while its own staging POST/api/posts request was held through CDP Fetch. “Uploading 4 photos…” and preview-edge bars appeared; Post remained enabled and clicking it closed the sheet while the local upload continued. This establishes the pending layout and plural copy. The reference is a single-photo example with “Uploading photo…”; shared composer differences from3d/e/f remain. The four-photo carousel/panel produces more vertical content than reference. Did not verify intermediate byte-based fill amounts or the one-second “Uploaded” fade: the initial one-photo transfer completed before observation, and the later deliberate hold was at staging, before new storage bytes were sent.

## 4m — 4m Feed card while photo uploads

Actually viewed the local pending feed card after Post, then again after Try again returned it to uploading. Photo preview, edge bar, disabled/faded action row, caption, “Uploading photo…” and Just now appeared. Local preview is340px high at390px viewport, matching the reference's pending-photo height. The live caption is prefixed with the account handle; test data and preceding clarification strips differ. The live status stays singular “Uploading photo…” even for this four-image draft. Intermediate byte-fill and a real moving transfer were not verified.

## 4n — 4n Failed upload

Failed the owned staging request with CDP Fetch and actually viewed the failed feed card: light opaque overlay, cloud/error icon, Upload failed, “The server didn't respond.”, Try again, coral bottom bar, and “Not posted yet. The photo is kept on this phone.” Reference uses the connection-dropped variant and a partial red bar; live failure bar spans the preview width. Try again was clicked and the real UI returned to the pending state; its new staging request was seen paused. Successful network retry UI was not isolated: the app's same-origin persisted upload also resumed in another open test-account tab, completing one owned post which reached needs_input. That post was subsequently cleaned up. Thus this records the actual retry transition, without claiming an isolated successful retry experiment.

## 4o — 4o Upload continues on another screen

Actually navigated from pending feed to Search and viewed the floating chip: thumbnail, owned caption, “Uploading photo…”, View, bottom bar, above the mobile pill. After the deliberate failure the chip stayed with “Upload failed · Try again” and coral bar. Its56px height/position broadly match the reference. Reference shows populated ribs search results; live inspection used the empty Search screen, so result contents differ. The full-width bar seen during held staging and failure differs from the frame's partially filled example. Several simultaneous uploads collapsed into one chip and OS-background continuation were not exercised.

## 3a — 3a Feed post structure

Directly viewed the populated feed, including the caption-only rice post and existing photographed posts. Handle rows, day headers, generated numbers cards, action rows and macro summaries are present. Clarification notices above the strip add content absent from3a. Caption-only cards naturally differ from the reference’s photo example; several earlier-round differences are later accepted features.

## 3b — 3b Post detail

Directly viewed rice detail and the existing roast-lamb photograph. The photo and colored outlines are visible; live outlines add colored name/portion pills absent from3b. The model-attribution text and Servings control add rows before Comments; replies are labelled AI rather than My Food AI. The caption-only hero needs scrolling to expose comments. These are actual page looks, not only DOM inspection.

## 3c — 3c Nutrition expanded

Expanded and directly viewed all nutrients on the rice post. Friendly Calories/Protein/Carbs/Fat/Fibre/Sugar/Sodium rows precede raw USDA rows, including repeated Protein/Energy and technical names such as Total lipid (fat). Raw units are uppercase G/MG/UG/KCAL. The expanded list is longer than the reference’s compact normalized table and includes the editable item row/Add another item before the nutrient rows.

## 3d — 3d New post composer

Observed the actual single-photo composer and reference3d. Live preview is220×276 and carries1/1, but adds a remove-photo× at top-left that the frame lacks. Live adds an explicit account handle above a two-line caption field; the reference's single-photo frame shows a simpler caption line. Another photo/Search foods pills exist. Live leftovers row starts lowercase and says “Add a photo of what remained”; reference uses “Leftovers (not eaten)” and “Mark photos of the plate after the meal”. Live Location shows a switch and “Only you see it”; reference shows a place value. Live title/button typography is lighter than the reference. Save as meal switch and bottom Post are present.

## 3e — 3e Leftovers toggle off

Observed a later photo with its switch off. The live light panel title is simply “leftovers (not eaten)”, rather than reference “This photo shows leftovers (not eaten)”. Live explanation is “Off: this photo shows the meal. On: this photo shows leftovers, subtracted once from the meal.” Reference instead explains first-photo meal/second-photo remained and their difference. Photo carousel and Off row state are present. Live keeps the extra caption field and photo/search pills, increasing vertical content so lower rows require scrolling in the four-photo state.

## 3f — 3f Leftovers toggle on

Observed the same later photo switched on: actual dark panel, coral switch, and photo badge. Live title remains the shorter lowercase label. Live copy says “The photographed leftovers are subtracted from the meal. Each marked photo is recorded.” Reference says “Consumed = photo 1 minus photo 2. The card will say so.” Live summary row uses plural “Photos 2” for one marked photo, versus reference “Photo 2”. Badge casing is lowercase in live versus the frame's capitalized “Leftovers”.

## 3g — 3g Card leftovers slide

Directly viewed an existing leftovers slide in the Roast lamb Search result. The black lower-left badge is lowercase “leftovers (not eaten)”, whereas the reference capitalizes Leftovers. The existing photo menu is an additional control. On that result the feed-photo area appeared white although the image reported loaded1080px content; the matching post-detail original photo was visible. The cause is not established, so this is a rendered discrepancy rather than a diagnosis.

## 3h — 3h Carousel end add leftovers

Navigated and directly viewed the end slide of that existing carousel. Live shows a dashed-square plus, Add a photo, and a separate lowercase leftovers (not eaten) label. The reference combines “Add a leftovers (not eaten) photo” and adds “The record becomes this meal minus what remained.” That explanatory sentence is absent. No attachment was added.

## 3q — 3q Two plates leftovers on each

Observed four actual selected files and marked photos2 and4 independently; the summary displayed “Photos 2, 4” and both selected slide badges were present. The major difference is layout: reference presents two named Plate1/Plate2 rows with paired before/after thumbnails in a2×2 grid. Live retains the same horizontal carousel and per-slide switch panel; it provides no Plate1/Plate2 grouping or simultaneous paired thumbnail grid. Caption/photo/search/location/save rows follow the ordinary composer.

## 3i — 3i Bookmark saved and post menu

Directly saved a snapshot of the existing unsaved rice post, viewed the filled bookmark and actual52px “Saved as …”/Rename toast, opened Rename without changing the name, then opened the post menu and unsaved the newly created snapshot. The original post/items were not edited. The live toast omits the reference’s small bookmark glyph. Menu rows include Add photo (extra to3i), Log again, Save meal, Edit caption, Edit time and muted Delete. The menu still says Save meal while the filled bookmark separately says Unsave meal; that label behavior is recorded as observed, not inferred from the snapshot state. The native Rename sheet retains the pill; no name was saved. Cleanup verifies the temporary snapshot is absent.

## 3j — 3j Nutrition label read

From the actual 3k Photograph the nutrition label action, selected a canvas-generated, clearly marked synthetic Nutrition Facts image held in memory. The label specified 100 g serving, 42 kcal, 2 g protein, 8 g carbs, 1 g fat, 1 g fibre, 2 g sugar and 50 mg sodium. One genuine upload/signing flow and one genuine POST /api/label/read returned 200; the model recognized the label and the actual Label read UI appeared. This does not prove arbitrary real-world label recognition or Photo-mode automatic label detection: the label action deliberately selected the dedicated reader path.

The actual UI showed Label read · per serving 100 g, a focused empty Name this food input, the label thumbnail, 1 serving / 2 servings / ½ serving / Other chips, a consumed summary, the model-attribution copy and Post · 1 serving. No Post was pressed.

Differences from frame 3j: close is a light circular button; Photo and Barcode are separated controls rather than a joined capsule; the amount chip row wraps after two chips; the nutrient line lists calories/macros only rather than the frame's fibre, sugar and sodium details. The accent outline is broad across the photo viewport around the synthetic panel rather than the frame's narrower portrait outline. Serving values and selected amount differ intentionally because a real synthetic 100 g label was read and the default one serving was retained.

## 3k — 3k Barcode not found

Selected EAN13 0999999999986 through the same real file input; the decoder returned UPC 999999999986, and the actual lookup returned Not in the database. The viewfinder and card both showed those digits. The actual card contained the specified explanation and Photograph the nutrition label, Type it instead and Try the code again actions.

Differences: close/mode controls as above; digits are ungrouped rather than spaced into readable groups; the primary Photograph button lacks the frame's camera icon. The real camera-unavailable warning/library action remains under the result and causes vertical scrolling. The pack thumbnail is the generated barcode rather than a pack photo. The result card also has a dismiss X. The missing-state text/actions otherwise matched the frame.

One premise was disproved: all-zero code 0000000000000 returned a real USDA Maola chocolate milk product instead of a missing result, so it was not used as missing-state evidence. Several early selections while the tab was backgrounded exceeded the app's 900 ms decode deadline and became draft photos; bringing the tab to the front allowed genuine decode. These were real observations, not simulated result states.

## 3l — 3l Correct scanned product

Opened and directly viewed Correct this product on an existing scanned post without saving. The live sheet reaches the viewport top, uses a boxed close× and an explicit Unit dropdown below Pack/Serving, and its Save action is below the initial viewport/pill. The reference uses a bare×, units at the right of the amount fields and a visible Save action. Undo and the shared correction-consensus footnote are present. Numeric differences reflect the stored product; no values were edited.

## 3m — 3m Water post card

Directly viewed an existing330ml Water result using the full mobile feed-card composition, plus its detail page. DRANK/ml/Water, day total, drinks/food splits, comment/log-again/bookmark actions, caption, Drank summary and date are visible and broadly match3m. The330ml/zero-food figures reflect stored data, not a design issue. Detail adds the read-only nutrition/comments section and is not mistaken for the feed composition.

## 3n — 3n Coffee post card

Directly viewed the existing240ml/95mg Coffee detail and mobile/desktop Search cards. The drink hero and day hydration/caffeine split are present. Stored2kcal differs from the reference5kcal; this is recorded nutrition data. Desktop rows separately show “Drank: unavailable ml” despite the240ml thumbnail; see4e. Mobile uses full action/caption/summary cards.

## 3o — 3o Food post with hydration

Directly viewed a food post’s numbers slide and detail. Consumed macros, food names/amounts, Water in this meal and Consumed today are present; the feed summary appends ml water. The observed roast-lamb meal differs from the reference soup, so food contents/totals are sample data. No cross-card total-consistency test was performed.

## 3p — 3p Way home from every screen

Feed, Search, Days, Profile, post detail, agent pages and entry sheets were actually opened. Mobile pill navigation, Feed/Profile back links, confirmation close and a partial story swipe were viewed. The underlying pill remains available in the observed non-confirmation sheets. This does not assert every nested fallback route or OS gesture was exercised.

## 2a — 2a Feed day separators

Opened the populated feed. Day headers with Today/Yesterday, dates and consumed totals are present. The week strip uses kcal totals with weekday/date labels, unlike the bare day-number/weekday strip in this round. Live clarification notices add content above it.

## 2b — 2b Feed scrolled one-post day and empty day

Directly scrolled the populated feed past the one-post November2 day. The Yesterday/date/consumed strip stays below the app header while the caption/action row passes it, and the next day header follows. The reference’s one-post-day/pinned composition is represented. Empty Today appears only in the week strip before the first Yesterday post; no separate No posts day section was observed. No shadow/animation timing assertion was run.

## 2c — 2c Plus opening

Directly viewed the frame and one opening moment in production, requested about 120 ms after clicking +. This is a single visual observation, not a timing/animation test. The live intermediate fan expands above the still-visible pill, whereas the reference’s small rotating entries surround a standalone dark +/× without the full pill. Exact spring/stagger timing remains unverified.

## 2d — 2d Plus open

Directly viewed the settled fan against the reference. Camera, Text, Drink, Coffee and Saved labels are present in the same order. Production keeps the pill behind the fan and uses a white outlined × in its center; the reference shows a standalone dark ×. The live Saved entry uses a plus glyph inside a dashed circle, while the reference shows a bookmark in a light circle. Existing clarification notices and week records remain visible through the scrim. No motion measurements were made.

## 2j — 2j Saved meals sheet

Directly viewed Saved meals against the frame. Production has a boxed small × rather than the reference’s unboxed close glyph, and its search field reads Search saved meals without the reference’s search icon. The one saved Coffee row says Coffee 240 g; the reference drink subtitle is in ml with caffeine and kcal. The live sheet has more space below its single row; the reference has four example meals. The pill remains visible behind the sheet in production. No Log now button was pressed.

## 2k — 2k Log again time picker

Opened the saved Coffee row, directly viewed Log again and selected Earlier today without posting. Now is initially selected; the live primary button reads Post · Coffee. Production uses a boxed ×, lighter title and a native time input under Other time, unlike the frame’s text-like custom row. In the observed just-after-midnight browser time, there was only a 00:00 half-hour chip (the reference’s six morning chips are illustrative data). The earlier-time sheet grew upward and its lower input/button area reached behind the persistent pill, requiring scrolling; the frame fits its controls above the bottom. No meal was submitted.

## 2e — 2e Days two months

Directly viewed mobile Days. Stacked month headings and the year control are present. A long known-nutrition/unavailable-items note occupies roughly250px above October’s grid, unlike the compact reference. Posted cells are neutral cream rather than the earlier photo-striped example. Dates/counts/totals differ with account history.

## 2f — 2f Day story entry

Directly viewed the existing November2 day story: month back control, date, consumed macros, one post tile and previous/next-day controls. Its caption-only tile is titled “97 kcal” rather than a food name. The large summary is left-aligned; this one-post day leaves substantial upper blank space, whereas the reference shows six photo tiles. Different post counts and totals are data differences.

## 2g — 2g Day story exit

Actually dragged the story downward85px and viewed the partial-dismiss state before releasing. The underlying Days calendar and scrim are visible; the dark story becomes inset with rounded corners, scales down and retains its content. Its full-height lower content extends below the viewport during the drag. Releasing before dismissal reset the story. No animation timing or layout assertion was run.

## 2h — 2h Intake control

Directly viewed the production Drink sheet: Water/Coffee/Other tabs, six volume choices, Other amount field, Drank today and Post · Water330ml are present. The live selected Water state is black; header close is a boxed× and the main pill remains visible across the lower sheet, whereas the reference has a bare×/edge action arrangement. This account has no drinks on the current local day, so the list is empty; reference row contents are sample data, not evidence of a missing list. Nothing was posted. Fleet9’s replacement is not yet production.

## 2i — 2i Barcode scanner

Selected an in-memory standards-encoded EAN13 0999999999993 through the actual capture file input. The real decoder and lookup returned the test account's existing stored correction “Packaged food”. The actual Found panel showed Per 100 g · 418 kcal · 5 g protein · 67 g carbs · 15 g fat, amount chips 100 g / 55 g / 110 g, and a real Post button. No Post was pressed.

Differences from the frame: header close is a light circular button rather than a plain X; the mode strip has Photo / Barcode / Text as separate controls instead of the frame's two-mode capsule. The Found panel adds a Correct link. The unavailable physical camera introduces the real explanatory warning and library link above the Found contents, making the panel scroll and placing the consumed line below the initial visible viewport. The input barcode image is the thumbnail rather than a real pack photo. The different product/units/chips reflect the actual selected product, so missing Pack · 1 l is not evidence that whole-pack chips are absent generally.

## 1-01 — 01 Sign in

Directly viewed Sign in in an isolated signed-out native browser context. Logo/title, email/password, primary button and account-switch link are present. The Facebook button is disabled and muted, and production adds “Facebook sign-in is coming soon.” absent from the reference. The extra line shifts the centered group; the reference’s fake system status/home bars are excluded from spacing conclusions. No CAPTCHA appeared; no sign-in was submitted in this context.

## 1-01b — 01b Sign up

Directly viewed Sign up in the same isolated context. Email/Handle/Password, primary button and account-switch link are present. The Facebook button is disabled/muted and has the extra coming-soon explanation. No CAPTCHA appeared, and no account was created.

## 1-02 — 02 Empty feed

Unverified state: read-only counts confirm designated account1 has147 posts and account2 has5. Neither can show a genuine empty feed. Existing posts were not removed or hidden to force this state. A populated or empty-search screen is not substituted as evidence of1-02.

## 1-03 — 03 Capture sheet

Directly viewed production Photo capture without taking a shot. The live header uses a circular paper back arrow rather than the old bare×. Photo/Barcode selection and the swipe hint add controls absent from this oldest frame; Text remains another capture mode. The current UI includes When/Now and the later composer flow. The physical camera is unavailable here, so the viewfinder shows a camera placeholder; the actual webcam layout was separately viewed with disclosed synthetic media in4b. The caption field/Post and gallery control are present. No new photo was submitted in this look.

## 1-04 — 04 Feed

Opened production feed. Later day headers, handle rows, macros and “more” links are present; this round-1 frame is materially simpler. The live test account also has clarification/no-food notices above the week strip. Processing-state copy was not reproduced.

## 1-04c — 04c Feed states

The actual Home feed was paginated using native scrolling. It eventually contained 144 article nodes, including the existing failed post `6412ecc9-1ea9-4e14-8b94-43f829d4cb9c`. This is a feed observation at `/`, not an inference from post detail or Search.

Directly viewed against reference 1-04c: the failed card has the real toast/eggs photo, the caption “Acceptance check with a real meal photo”, “This photo could not be analysed.” and “Try again”. The failed-state copy matches the reference; Try again was not pressed. Production adds the later handle/menu row and action-icon row, puts the timestamp below the state, and uses the persistent floating pill rather than the reference's older full-width bottom bar. The reference's caption/time share a row; production puts the handle and caption together and the time beneath the state.

Also directly viewed existing no-food post `f708466e-01b7-4b55-8529-4b01fcfab080` in the Home feed. It shows an empty plate, “Test plate”, “No food found in this photo.” and “Add a caption to log it”. Those state strings also match the reference. Production again includes the later handle/action rows and pill. A horizontal scrollbar was visible under this card's carousel in this native browser; the reference does not show one.

The duplicate exported reference 1-04c-dup represents the same two states, so this single comparison covers that duplicate without inventing another state.

Initial DOM-only scrolling encountered the small initial feed while hydration/pagination settled. A Search fallback returned “Search could not be completed.” That failed attempt is not the final evidence: native scrolling subsequently loaded the actual Home cards above.

## 1-04d — 04d Caption only

Directly viewed the existing caption-only rice post. Its generated numbers card, caption and consumed summary are present. A handle row, action row, macros and “more” link from later rounds add content absent from this older composition. Meal name/amount differences are data, not defects.

## 1-04c-dup — 04c Feed states

Duplicate exported reference of1-04c. The actual failed and no-food Home cards were directly viewed; the comparison and evidence in1-04c apply to both exported frames.

## 1-04d-dup — 04d Caption only

Duplicate exported reference of 1-04d. Same observed comparison and limits apply; it is not a second distinct live state.

## 1-04b — 04b Feed expanded

Directly viewed reference 1-04b's expanded feed card and the production feed's ready rice post. Then used an actual native pointer click on the feed's “Consumed: 97 kcal · 2 g protein · 21 g carbs · 0 g fat more” link. The browser navigated from `/` to `/posts/07a4304e-ce11-4830-80a4-bad685db7fb2`, with “Feed” back navigation and “Post” title. The resulting page was directly viewed.

Thus current “more” opens full post detail rather than expanding the item list inline beneath the feed card as shown in 1-04b. The live detail contains macro boxes, “Consumed · all nutrients / Show all 72”, model attribution and Servings. Those are later detail-page content, not the reference's inline expanded state. No item or serving was changed.

## 1-05 — 05 Clarification sheet

Directly viewed an existing multiple-choice clarification and a No food found sheet without answering. The choice sheet has a thumbnail, three-line question, time, three full-width options, free-text field and disabled Done. Live adds a boxed close× and retains the pill; those controls are not shown in this older clarification reference. Choice text/count varies with the question. The No food case omits choices and asks for free text. No correction was submitted.

## 1-06 — 06 Post detail

Directly viewed both caption-only and photographed post detail. The photo example has colored outlines and name/portion pills; the caption-only example uses a numbers hero. Later additions include macro grid, collapsible nutrients, model attribution, Servings and Comments. The reference’s earlier outline/item-list composition differs; see3b/3c for the current-state differences.

## 1-06b — 06b Edit item

Directly opened Edit cooked white rice without saving. The live sheet has a boxed close×, Name and Portion, unit chooser g/oz/piece/cup, four portion chips, Save, Remove this item and Add another item. The unit chooser is additional to the reference’s g-only field. It retains the underlying navigation pill, and the large selected numeric field/chip differ with the actual75g portion. No item was edited or removed.

## 1-07 — 07 Thread

Directly viewed the existing rice and roast-lamb threads. Replies use the shorter AI author label; Comments heading, current input and microphone/send controls are present. The model-attribution and Servings rows above the thread are later additions. No new comment was submitted.

## 1-08 — 08 Day story

Directly viewed November2’s story and its partial-dismiss gesture. Totals, macro records, entry time and previous/next-day controls are present. The caption-only tile says “97 kcal” instead of a meal name. The observed one-post day differs from the reference’s multiple-photo contents.

## 1-08b — 08b Days month

Directly viewed mobile Days. Production has Feed/Days/year controls and stacked months from later rounds. The long known-nutrition note before October’s grid is absent from this older photo-cell reference. Different dates/counts/totals reflect test data.

## 1-09 — 09 Search

Opened Search and submitted coffee through its form. See the shared Search observation below; a settled result comparison is recorded only if returned. No conclusion is drawn from an empty query.

## 1-10 — 10 Profile

Directly viewed mobile Profile. Connect an agent and the Identify food with Muse Spark Open switch/explanation add rows between the handle and grid. The grid includes generated numbers cards alongside photos; the reference has neither settings row and uses simpler photo contents.

## Shared Search observation

Search was opened at both widths, the coffee query was entered using native Chrome input and the form submitted. The settled desktop result showed 13 posts. Mobile results use full feed cards with handle/menu, generated image, action controls and “more” summaries; round 1’s Search reference shows a simpler photo/caption/date/item-summary composition. Desktop rows list item names without the individual gram/calorie figures shown in 4e. Several desktop drink results read “Drank: unavailable ml”, while the matching mobile Coffee cards show 240 ml and 95 mg caffeine. This is a concrete cross-surface discrepancy. The initial `/search?q=coffee` navigation did not populate the controlled field and is not treated as a defect or empty-result evidence.

## Follow-up grouping

File one issue per affected screen, linking the relevant sections: auth coming-soon copy (1-01/01b); feed notices/week-strip evolution (1-04, 2a, 3a); post-detail nutrient normalization and attribution/servings composition (1-06/07, 3b/3c); Saved meals drink units (2j); Days nutrition notice/day-story entry labels (1-08/08b, 2e/2f, 4d); Profile additional settings (1-10, 4f/4g); agent capability copy/desktop presentation (4h); desktop shortcut legends (4a/4d/4e/4f); and Search mobile/desktop result composition and unavailable drink volume (1-09/4e). These are differences to reconcile with the owner, not all regressions: several come from later accepted features.

The unverified states above need follow-up observation rather than fabricated defect issues. Fleet 9’s separately specified drink/capture/remove changes should be evaluated against round 5 after deployment; this pre-merge production comparison does not claim they shipped.

## Follow-up completion and cleanup

Available frame families above received direct native page looks, without treating different sample-data states as proof of every reference substate. Frame1-02 remains unverified because the two designated accounts contain147 and5 posts; existing records were not removed or hidden to manufacture an empty feed. No third account was created. This is a definite frame-level gap; the other per-section limits also remain explicit, so item5 is not claimed complete.

The follow-up issues are #362 composer/paired photos/uploads, #363 desktop capture, #364 plus fan, #365 Log again, #366 clarification and #367 barcode/label/correction results, in addition to #353–#361. Some capture/drink differences are intentionally superseded by pending Fleet9 changes; recheck after deployment before treating them as regressions.

Cleanup was independently re-read from production: six exact temporary stage/post prefixes have zero posts/drafts/storage objects, the temporary label reading is absent, the newly saved rice snapshot was unsaved and is absent, and the visual token is revoked. See `../evidence/run9-visual-followup/cleanup.json`. Delayed idempotent cleanup jobs remain to cover signed-capability expiry. Test post and nutrition data were preserved. No feature PR head or production deployment changed.
