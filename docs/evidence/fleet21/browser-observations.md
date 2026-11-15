# Fleet 21 browser observations before merge

These are measured local observations, not production completion claims. Every completed PR page look has a corresponding GitHub comment with the full source head, viewport and limitations. No images were saved.

- PR 909: Home loaded 80 meal elements during the mobile scroll and sent no POST to `/`. A requested 700 px scroll coincided with a jump from scrollY 11173 to 15456 while older meals loaded. The no-jump line is not certified; causation was not established.
- PR 910: About shows Your meals and the Profile-style grid at both widths. All 81 distinct meal links belong to the disposable viewer; zero belong to another owner.
- PR 923: Home/detail menus and the repeat-meal sheet show Eat this again at both widths. The cola-only scripted fixture has a drink slide, so it cannot demonstrate the mixed-meal Drinks with this meal sentence. The relevant existing wording test passes. F5 is needs_input in the database but Home's question strip did not appear, so that heading is not visually certified. A native mobile swipe attempt did not advance F1's rail; desktop Next slide did. The mobile second slide was inspected after setting the scroll position through script.evaluate.
- PR 911: text-composer, Search, drink-description and comment mics were visible at both widths. Missing-device errors appeared below the Search/drink controls. The desktop photo composer also showed its mic. The mobile camera-caption look was not certified because the local provider routed the photo into drink-can confirmation. No speech transcription was attempted and no meal was posted by these layout checks.
- PR 912: offline added leftovers reached failure. Phone Remove discarded the failed chip and overlay, and both stayed gone on reload. A confirmed desktop defect remains: an overflow-hidden 183 × 56 px sidebar chip ends at y=364 while Remove starts at y=374.13 and is clipped. Retry text wraps outside the row too. No fix was added, following the dispatch's rule that newly found defects go to the owner for the backlog.

Production test account 2 Search for the exact caption Fleet 17 post-close 2 returned No meals found. No other meal was touched and no deletion was claimed. A draft in the original posting browser cannot be reached from this browser.

Remaining PR looks and local checks are still in progress. Production checks and merges await the required PM order naming each PR and its full head SHA.
