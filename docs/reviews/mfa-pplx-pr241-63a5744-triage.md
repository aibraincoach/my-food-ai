# PR #241 Gemini triage

Reviewer: Gemini 3.8 Flash via Perplexity. Reviewed head: `63a57441fb2179e033b900c8c47d09923537848f`. Verdict: approved with minor suggestions. This triage identifies one concrete side effect to fix; same-reviewer confirmation is required on the updated head.

| Finding | Decision | Evidence |
|---|---|---|
| Caption draft initialized only at mount can be stale | Not real | `PostMenu.edit()` calls `setValue(caption)` on every opening, using the current prop. Synchronizing an open editor automatically would overwrite an intentional draft. |
| A menu click could bubble into card navigation | Not real | Feed and Search render `PostCard` within non-clickable containers; the card is an article, with media/detail links as siblings of the menu. Detail's TopBar likewise places the menu beside its navigation link. No enclosing navigation handler exists. |
| Reusing `post-created` may have unwanted effects | Real | `PushPrompt` listens to `post-created` and can display notification enrollment or register an installed device. A caption edit must refresh the existing meal without announcing a new post. |
| Native details does not dismiss on outside click | Not a correctness blocker | This behavior is present, but the same native summary toggles the menu closed, selecting Edit closes it, and the edit sheet supports Cancel/Escape/backdrop dismissal. No inaccessible or blocked flow was demonstrated; the optional outside-click enhancement remains unchanged. |

Fix: caption requests dispatch `post-updated` only after a successful response. Feed subscribes and unsubscribes that event for the existing card refresh path. Notification enrollment, readiness watchers and empty-feed listeners continue to receive only actual `post-created` events.

Validation: six caption data/client tests passed; success updates refresh listeners without notification/readiness enrollment, failed/invalid/transport-error saves emit no success event. Existing caption-only ownership and field-update tests remain passing. TypeScript, changed-file ESLint and whitespace checks passed. No production write, migration or merge was performed.

Real findings: 1
