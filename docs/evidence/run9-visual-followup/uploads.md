# Fleet 9 additional visual observations: composer, leftovers and uploads

Inspected the actual production app at https://my-food-ai-ten.vercel.app using designated test account 1. Native Chromium 1148 through direct CDP only; no Playwright, stored image files, layout tests, wording tests, code changes or merges. Reference frames were opened from the supplied HTML and individually viewed through transient Page.captureScreenshot JPEG responses sent directly to functions.image. Live states were likewise actually viewed, not inferred only from source/DOM. Mobile viewport390×844; desktop1280×800. Browser chrome/system status area is absent in the live app, so the reference's fake9:41/status strip is excluded from positional conclusions.

The supplied ZIP image uploads/IMG_3240.JPG was read in memory and delivered as File/DataTransfer objects. It is itself a screenshot; its visible content differs from the meal-photo placeholders. A four-image draft used copies of that file to observe independent photo marking. Only owned test data was created and subsequently removed.

## 3d — New post composer

Observed the actual single-photo composer and reference3d. Live preview is220×276 and carries1/1, but adds a remove-photo× at top-left that the frame lacks. Live adds an explicit account handle above a two-line caption field; the reference's single-photo frame shows a simpler caption line. Another photo/Search foods pills exist. Live leftovers row starts lowercase and says “Add a photo of what remained”; reference uses “Leftovers (not eaten)” and “Mark photos of the plate after the meal”. Live Location shows a switch and “Only you see it”; reference shows a place value. Live title/button typography is lighter than the reference. Save as meal switch and bottom Post are present.

## 3e — Leftovers toggle off

Observed a later photo with its switch off. The live light panel title is simply “leftovers (not eaten)”, rather than reference “This photo shows leftovers (not eaten)”. Live explanation is “Off: this photo shows the meal. On: this photo shows leftovers, subtracted once from the meal.” Reference instead explains first-photo meal/second-photo remained and their difference. Photo carousel and Off row state are present. Live keeps the extra caption field and photo/search pills, increasing vertical content so lower rows require scrolling in the four-photo state.

## 3f — Leftovers toggle on

Observed the same later photo switched on: actual dark panel, coral switch, and photo badge. Live title remains the shorter lowercase label. Live copy says “The photographed leftovers are subtracted from the meal. Each marked photo is recorded.” Reference says “Consumed = photo 1 minus photo 2. The card will say so.” Live summary row uses plural “Photos 2” for one marked photo, versus reference “Photo 2”. Badge casing is lowercase in live versus the frame's capitalized “Leftovers”.

## 3q — Two plates with leftovers on each

Observed four actual selected files and marked photos2 and4 independently; the summary displayed “Photos 2, 4” and both selected slide badges were present. The major difference is layout: reference presents two named Plate1/Plate2 rows with paired before/after thumbnails in a2×2 grid. Live retains the same horizontal carousel and per-slide switch panel; it provides no Plate1/Plate2 grouping or simultaneous paired thumbnail grid. Caption/photo/search/location/save rows follow the ordinary composer.

## 4b — Desktop webcam

First observed the no-camera environment choosing Upload a file, as the documented fallback. Then opened a separate owned native Chromium instance with --use-fake-device-for-media-stream and --use-fake-ui-for-media-stream; actually viewed the built webcam UI with a synthetic green video backdrop. This verifies the real UI layout with synthetic media, not physical-camera image quality. Viewfinder400px tall exists. Live camera picker sits bottom-left; reference positions it top-left. Live shutter is larger, and Space hint sits below the shutter; reference puts the hint to its right. Live modal is taller and positioned higher (about760×662 versus reference760×614). Close control is circled in live versus bare× in reference. Header/tab text looks lighter than reference. No synthetic photo was taken.

## 4c — Desktop file upload

Actually viewed production Upload a file state and reference4c. Centered760px modal, source tabs, dashed zone, icon, Choose files and caption-only action exist. Live zone is400px high versus reference480px, making live modal about760×526 versus reference760×614. Live close× has a circle; reference does not. Reference title and drop-zone heading are visibly heavier. Main sidebar/background differences are shared with the other desktop frames, rather than a separate upload-flow result.

## 4l — Composer while uploading

Observed actual composer with four selected photos while its own staging POST/api/posts request was held through CDP Fetch. “Uploading 4 photos…” and preview-edge bars appeared; Post remained enabled and clicking it closed the sheet while the local upload continued. This establishes the pending layout and plural copy. The reference is a single-photo example with “Uploading photo…”; shared composer differences from3d/e/f remain. The four-photo carousel/panel produces more vertical content than reference. Did not verify intermediate byte-based fill amounts or the one-second “Uploaded” fade: the initial one-photo transfer completed before observation, and the later deliberate hold was at staging, before new storage bytes were sent.

## 4m — Feed card while uploading

Actually viewed the local pending feed card after Post, then again after Try again returned it to uploading. Photo preview, edge bar, disabled/faded action row, caption, “Uploading photo…” and Just now appeared. Local preview is340px high at390px viewport, matching the reference's pending-photo height. The live caption is prefixed with the account handle; test data and preceding clarification strips differ. The live status stays singular “Uploading photo…” even for this four-image draft. Intermediate byte-fill and a real moving transfer were not verified.

## 4n — Failed upload

Failed the owned staging request with CDP Fetch and actually viewed the failed feed card: light opaque overlay, cloud/error icon, Upload failed, “The server didn't respond.”, Try again, coral bottom bar, and “Not posted yet. The photo is kept on this phone.” Reference uses the connection-dropped variant and a partial red bar; live failure bar spans the preview width. Try again was clicked and the real UI returned to the pending state; its new staging request was seen paused. Successful network retry UI was not isolated: the app's same-origin persisted upload also resumed in another open test-account tab, completing one owned post which reached needs_input. That post was subsequently cleaned up. Thus this records the actual retry transition, without claiming an isolated successful retry experiment.

## 4o — Upload continues on another screen

Actually navigated from pending feed to Search and viewed the floating chip: thumbnail, owned caption, “Uploading photo…”, View, bottom bar, above the mobile pill. After the deliberate failure the chip stayed with “Upload failed · Try again” and coral bar. Its56px height/position broadly match the reference. Reference shows populated ribs search results; live inspection used the empty Search screen, so result contents differ. The full-width bar seen during held staging and failure differs from the frame's partially filled example. Several simultaneous uploads collapsed into one chip and OS-background continuation were not exercised.

## Cleanup and limits

Owned original unpublished draft863773ac-8762-4cda-a1ed-74e76bc16b59: removed2 storage objects,0 remaining posts/drafts/storage entries. Owned published test post9f12d801-b006-435e-b1d5-af6a90b1961a: removed8 storage objects,0 remaining posts/drafts/storage entries. Removed the owned failed local upload through its Delete menu. Cleanup receipt: /tmp/run9-upload-cleanup-receipt.json. No existing posts/customer data were changed.

Closed own production/reference tabs and stopped own observer. Closed synthetic-camera tab and stopped its owned browser on9394. Root-owned Chrome9392 remains untouched. No image files were extracted or saved.
