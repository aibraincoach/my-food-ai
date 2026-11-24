# Card presentation paths checked

- src/lib/posts/items.ts getPostDetail builds cardData at request time, then PostDetail passes it to OutlineOverlay. The detail source has no CardData write; OutlineOverlay localizes its structured wording payload. Without that payload it rebuilds from current items, rather than parsing old English.
- LiveNutritionCard builds from FeedPost/current items/drink or consumes its optional data prop. Its post/current-item paths use the one builder; its preformatted-data path uses the shared formatter. Optional carried footer remains stored data where it cannot be regenerated.
- StoryPlayer builds from current day totals/items, passes localized gap wording and locale to the same ResultsCard. Its other Days UI is outside slice 2.
- readCardData/readStoredCardData build presentation for the PNG renderer from owner-scoped current rows; renderResultsCard explicitly passes en until #1220. No stored PNG is rewritten by this slice.
- Checked feed-cache.ts/feed-cache-mutations.ts and FeedPost: the persisted feed cache stores FeedPost, not a preformatted CardData object. No persisted preformatted CardData row/JSON was found on the paths checked. This is scoped source evidence, not a production data audit.

One small structured payload carries numbers, gap nutrient identities, stored reason references, drink list and leftover amounts; one localizeCardData formatter renders its sentences. It carries no account data or extra lookup. Food labels, stored portion descriptions, reason sentences and quoted model details are data/holds, not parsed English. Old persisted text remains #1219's class and is not silently reinterpreted.

English goldens captured from merged main d5b86946: nine sentence cases cover water, drinks, alcohol/caffeine, partial/all missing nutrition and leftovers. All nine match. Two 1080px meal/coffee PNGs match the main-generated SHA256 hashes byte for byte. No real meals/photos/accounts were used.
