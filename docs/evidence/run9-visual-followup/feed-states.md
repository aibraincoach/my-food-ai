# Feed-state visual follow-up

Native Chrome, direct CDP at 390×844, production designated test account 1, 2026-11-03 follow-up completed by 14:47 WIB. Literal reference and production page images were viewed transiently in memory. No image file, test, Playwright run, retry request, post edit, account change or data mutation was made.

## 1-04c and 1-04c-dup — actual failed and no-food feed cards

The actual Home feed was paginated using native scrolling. It eventually contained 144 article nodes, including the existing failed post `6412ecc9-1ea9-4e14-8b94-43f829d4cb9c`. This is a feed observation at `/`, not an inference from post detail or Search.

Directly viewed against reference 1-04c: the failed card has the real toast/eggs photo, the caption “Acceptance check with a real meal photo”, “This photo could not be analysed.” and “Try again”. The failed-state copy matches the reference; Try again was not pressed. Production adds the later handle/menu row and action-icon row, puts the timestamp below the state, and uses the persistent floating pill rather than the reference's older full-width bottom bar. The reference's caption/time share a row; production puts the handle and caption together and the time beneath the state.

Also directly viewed existing no-food post `f708466e-01b7-4b55-8529-4b01fcfab080` in the Home feed. It shows an empty plate, “Test plate”, “No food found in this photo.” and “Add a caption to log it”. Those state strings also match the reference. Production again includes the later handle/action rows and pill. A horizontal scrollbar was visible under this card's carousel in this native browser; the reference does not show one.

The duplicate exported reference 1-04c-dup represents the same two states, so this single comparison covers that duplicate without inventing another state.

Initial DOM-only scrolling encountered the small initial feed while hydration/pagination settled. A Search fallback returned “Search could not be completed.” That failed attempt is not the final evidence: native scrolling subsequently loaded the actual Home cards above.

## 1-04b — inline expansion differs from current navigation

Directly viewed reference 1-04b's expanded feed card and the production feed's ready rice post. Then used an actual native pointer click on the feed's “Consumed: 97 kcal · 2 g protein · 21 g carbs · 0 g fat more” link. The browser navigated from `/` to `/posts/07a4304e-ce11-4830-80a4-bad685db7fb2`, with “Feed” back navigation and “Post” title. The resulting page was directly viewed.

Thus current “more” opens full post detail rather than expanding the item list inline beneath the feed card as shown in 1-04b. The live detail contains macro boxes, “Consumed · all nutrients / Show all 72”, model attribution and Servings. Those are later detail-page content, not the reference's inline expanded state. No item or serving was changed.

## Limits and cleanup

No empty feed was forced. Both existing test accounts retain their posts. The reference's simulated status bar was not treated as live-app padding. Only the two tabs created for this follow-up were closed; root's Chrome and other tabs were left running.
