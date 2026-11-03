# Barcode and label native visual observations

Observed production https://my-food-ai-ten.vercel.app on 2026-11-03 approximately 07:31–07:36 UTC (14:31–14:36 WIB), designated test account 1, native Chromium via raw CDP, 390×844. Design frames 2i, 3j and 3k opened from the supplied HTML. Actual page and design captures were viewed only in memory; no image files, Playwright, layout/wording tests, mocked responses, posts submitted, or existing posts changed.

## 2i — Found (observed)

Selected an in-memory standards-encoded EAN13 0999999999993 through the actual capture file input. The real decoder and lookup returned the test account's existing stored correction “Packaged food”. The actual Found panel showed Per 100 g · 418 kcal · 5 g protein · 67 g carbs · 15 g fat, amount chips 100 g / 55 g / 110 g, and a real Post button. No Post was pressed.

Differences from the frame: header close is a light circular button rather than a plain X; the mode strip has Photo / Barcode / Text as separate controls instead of the frame's two-mode capsule. The Found panel adds a Correct link. The unavailable physical camera introduces the real explanatory warning and library link above the Found contents, making the panel scroll and placing the consumed line below the initial visible viewport. The input barcode image is the thumbnail rather than a real pack photo. The different product/units/chips reflect the actual selected product, so missing Pack · 1 l is not evidence that whole-pack chips are absent generally.

## 3k — Not in the database (observed)

Selected EAN13 0999999999986 through the same real file input; the decoder returned UPC 999999999986, and the actual lookup returned Not in the database. The viewfinder and card both showed those digits. The actual card contained the specified explanation and Photograph the nutrition label, Type it instead and Try the code again actions.

Differences: close/mode controls as above; digits are ungrouped rather than spaced into readable groups; the primary Photograph button lacks the frame's camera icon. The real camera-unavailable warning/library action remains under the result and causes vertical scrolling. The pack thumbnail is the generated barcode rather than a pack photo. The result card also has a dismiss X. The missing-state text/actions otherwise matched the frame.

One premise was disproved: all-zero code 0000000000000 returned a real USDA Maola chocolate milk product instead of a missing result, so it was not used as missing-state evidence. Several early selections while the tab was backgrounded exceeded the app's 900 ms decode deadline and became draft photos; bringing the tab to the front allowed genuine decode. These were real observations, not simulated result states.

## 3j — Label read (observed, synthetic input, real model response)

From the actual 3k Photograph the nutrition label action, selected a canvas-generated, clearly marked synthetic Nutrition Facts image held in memory. The label specified 100 g serving, 42 kcal, 2 g protein, 8 g carbs, 1 g fat, 1 g fibre, 2 g sugar and 50 mg sodium. One genuine upload/signing flow and one genuine POST /api/label/read returned 200; the model recognized the label and the actual Label read UI appeared. This does not prove arbitrary real-world label recognition or Photo-mode automatic label detection: the label action deliberately selected the dedicated reader path.

The actual UI showed Label read · per serving 100 g, a focused empty Name this food input, the label thumbnail, 1 serving / 2 servings / ½ serving / Other chips, a consumed summary, the model-attribution copy and Post · 1 serving. No Post was pressed.

Differences from frame 3j: close is a light circular button; Photo and Barcode are separated controls rather than a joined capsule; the amount chip row wraps after two chips; the nutrient line lists calories/macros only rather than the frame's fibre, sugar and sodium details. The accent outline is broad across the photo viewport around the synthetic panel rather than the frame's narrower portrait outline. Serving values and selected amount differ intentionally because a real synthetic 100 g label was read and the default one serving was retained.

## Cleanup evidence

Removed the local draft photos using the actual Remove photo UI before subsequent selection. Verified and removed the three owned unpublished 600×320 barcode draft stages plus the one owned label stage, after confirming none was claimed by posts or post_media. Eight temporary storage objects removed; all four exact stage prefixes list zero objects and all draft IDs select zero rows. The one label_readings row was removed and verified absent. No test post was created (latest account post remained the pre-existing Nov 3 03:59 UTC post). The existing delayed media_cleanup jobs remain as idempotent safety cleanup for still-expiring signed upload capabilities; no process was started for them. Own production/design tabs closed; shared native browser retained.
