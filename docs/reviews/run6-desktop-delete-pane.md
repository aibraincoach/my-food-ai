# Desktop deletion contract check

After the external review of d500688247e38c22dd596f772f1dfdd5f6ecb0ac, a cross-feature audit found that deleting the selected post left its `?post=` parameter in the URL. The deletion action then refreshes the page, so the server could attempt to render a deleted detail and return a not-found page.

The workspace now handles the existing `post-deleted` event and the existing remote `post-unavailable` event with reason `deleted`. Matching events synchronously remove only the selected-post query parameter before the delete action refreshes. Other post IDs and other unavailability reasons preserve selection.

Validation on the production build at 1280×800 used the actual shared workspace on Search and a synthetic selected ID, with no post deletion or database write. Both local and remote events removed the query immediately and closed the pane; another query parameter survived. Unrelated IDs and the needs-input reason did nothing. Refresh retained Search without the selected-post parameter or a not-found page. TypeScript and the production build passed. This new code head requires its own external confirmation; the earlier zero-blocker receipt is historical.
