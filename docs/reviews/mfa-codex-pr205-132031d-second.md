Reviewer: Codex gpt-6.1-sol (additional second review requested by the PM); version reviewed: 132031d7d7c47d94fa26837ea92d231a42bbf730

Receipt SHA: 132031d7d7c47d94fa26837ea92d231a42bbf730
Scope: origin/main...HEAD in a clean clone, sandbox read-only. Exactly one Codex pass. The earlier Gemini receipt is unchanged and remains on this head. No code was changed.

The replacement removes the only reachable intake controls without connecting the new sheet to a trigger. Linked drink data also becomes inconsistent when users exercise existing time and item editing functionality.

Full review comments:

- [P1] Connect the replacement intake sheet to a visible trigger — /tmp/mfa-second-codex-205-c8bt7ge3/repo/src/components/IntakeBar.tsx:3-4
  Home still mounts `<IntakeBar />`, but this replacement renders a closed sheet that only opens on an `open-entry` event. Nothing in the repository dispatches that event; the existing + button opens CaptureSheet instead. Consequently, users lose the existing water/caffeine controls and cannot open the new drink UI. Wire up an opening control before replacing the working intake bar.

- [P2] Keep linked drink timestamps consistent when changing post time — /tmp/mfa-second-codex-205-c8bt7ge3/repo/src/lib/intake/hydration.ts:85-88
  The existing `/api/posts/[id]/eaten-at` endpoint changes only `posts.eaten_at`, while hydration assigns drinks to days and applies cutoffs using the unchanged `intake_logs.logged_at`. Moving a drink earlier therefore excludes its own volume from its card; moving it to yesterday leaves its volume counted today instead. Synchronize linked intake timestamps when the post time changes, or consistently derive linked drink times from the post.

- [P2] Reconcile drink metadata with supported item edits — /tmp/mfa-second-codex-205-c8bt7ge3/repo/src/lib/intake/hydration.ts:118-119
  Drink posts still expose ItemRows and ItemEditSheet, and the existing item-edit endpoint allows changing or removing their items. However, this card always reads volume, label, and caffeine from the original intake row, which those edits never update. Changing a 330 ml water item's portion to 500 therefore leaves the drink card and subsequent hydration totals at 330, even after recomputation. Synchronize the linked intake data or explicitly prevent incompatible edits on drink posts.