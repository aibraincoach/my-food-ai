# Plan: #413, rebuild the desktop layout to Round 6 frames 6a–6f

## Context
At 1280×800 the desktop app (`desktop:` variant, ≥1024px) still follows Round 4 frames 4a–4f. The designer replaced those frames with Round 6, in archive `My_Food_AI_app_design_3.zip`. The frames are in `My Food AI.dc.html` as `#6a`–`#6f`; I rendered them to the scratchpad and viewed them. Done when the app at 1280×800 matches 6a–6f and the phone layout (<1024px) is unchanged.

**Out of scope:** #279 CAPTCHA is rejected. The owner keeps it off during building and testing. No CAPTCHA code, script, environment or Supabase change is part of this plan.

## Setup
- Branch `run10/desktop-round6` from `origin/main` (a worktree, so the current `run9/docs` checkout and its untracked file are left alone).
- Copy the extracted archive to ignored `uploads/design-round6/` for later comparison.
- Every change sits behind `desktop:` classes or `useDesktop()` (`src/lib/ui/use-desktop.ts`), so the phone layout cannot change.

## Frame specs and changes

**Shell (all frames): `src/components/Sidebar.tsx`, `src/app/(tabs)/layout.tsx`, `src/app/globals.css`**
- Sidebar becomes 240px (currently 232px): "My Food AI" title, the only dark button "+ New post" with an `N` key chip, then Home, Search `/` and Days `D` rows. The active row gets a filled `bg-hairline` pill.
- Footer: an avatar, name and "Profile" row (filled when on /profile), then "? Keyboard shortcuts".
- Remove the KEYS list. Add a `D` key that goes to /days and a `?` key that opens a new `ShortcutsDialog`. It is a centred modal over the scrim listing J/K, Enter, Esc, N, /, D, ← →, ↑ ↓; no frame draws it, so it follows 6b's window styling.
- Move `SavedMealsButton` and `#desktop-upload-slot` so they still exist without the KEYS block. Saved meals stays next to the title as it is now, unless the frame shows otherwise, in which case I'll flag it.
- Update the layout offset from 232px to 240px, and the `[data-desktop-workspace]` width calculation in `globals.css`.

**6a Home: `src/app/(tabs)/page.tsx`, `src/components/Feed.tsx`**
- A 500px feed and a 280px Today column, centred together. The Today column is sticky and does not scroll with the feed.
- Today column: "Today · <weekday, date>", a large kcal figure with "kcal consumed", a protein/carbs/fat row between hairlines, then "Posted today" with thumbnail, caption, time and kcal rows. It reuses the existing day-total helpers that DaysView and DayRings already use.
- On desktop, a dated rule between days ("Monday, Oct 26 ——— Consumed: 2,118 kcal") replaces the phone's day row.
- The focused card gets the ink outline.

**6b Post open: `src/components/DesktopWorkspace.tsx`, plus a desktop variant of PostDetail**
- Replace the 440px sticky side panel with a centred window over the dimmed feed (`--color-scrim-32`). The feed keeps its full width behind it.
- The window has a 640px square photo with detection outlines on the left. The right is a 360px column with:
  - the header and "…" menu
  - the caption, date and time
  - a four-total box (kcal, protein, carbs, fat)
  - item rows with outline-colour dots, grams and kcal
  - "All N nutrients"
  - the comment thread
  - the action row and the "Comment or correct…" field pinned at the bottom
- ‹ › buttons sit outside the window, × is at the top right, and clicking the scrim closes it.
- Keep the `?post=` URL, J/K stepping, ← → slides, Esc, and the delete/unavailable handling already in `DesktopWorkspace`. The same modal is used by Home, Search and Profile.
- Tapping an outline opens the existing ItemEditSheet ("6b Edit item" in the design).

**6c New post: `src/components/CaptureSheet.tsx`, `.desktop-capture*` in `globals.css`**
- One 960×620 window. The left 600px is a dark webcam area with the camera picker at the top left, a Text · Photo · Barcode strip (Barcode keeps its icon), the shutter, and a "Space takes the photo" hint to its right.
- The right 360px has "New post" with a bare × and a dashed drop zone ("Or drop photos here", "paste one with ⌘V", "Choose files"), with the note "Several photos become slides in one post, in the order chosen."
- Remove the Webcam/Upload switch.
- Without a camera or permission, the left side shows "Allow camera" and the drop zone stays.
- After a photo or files are chosen, the same window becomes the composer: slides on the left, rows on the right.
- The existing window-level drop and paste handling in `NavigationControls.tsx` is kept.

**6d Days: `src/components/DaysView.tsx`, `MonthGrid.tsx`**
- The month fills the space beside the sidebar with 100px cells showing the date and kcal. Today has an ink outline and the chosen day is filled in ink.
- Header: "October 2026", ‹ ›, and "N days posted"; footer note "kcal consumed per day".
- A full-height 340px right panel shows the chosen day: title, "Consumed: X kcal · N posts", post rows, and "Open the day" with an Enter chip at the bottom.
- Arrow keys move the chosen day, Enter opens the day view, Esc returns.
- The long nutrition notice is hidden on desktop to match the frame.

**6e Search: `src/app/(tabs)/search/page.tsx`, `src/components/SearchBox.tsx`**
- A 720px centred column. The large field has an `Esc` chip; below it, "N posts".
- Rows: a 128px photo, the caption with the date on the right, items as "name · g · kcal" joined by " · ", and "Consumed: …".
- ↑ ↓ move between results and Enter opens the 6b modal. The first Esc clears the field; a second Esc leaves it.

**6f Profile: `src/app/(tabs)/profile/page.tsx`, `ProfileGrid.tsx`, `ConnectAgentRow.tsx`**
- An 820px centred column: an 88px avatar, the name, then "Connect an agent" (plug icon) and "Sign out" buttons under the name, a hairline, and a three-across grid.
- On desktop, the Connect an agent row and the model setting row are replaced by the button. If the model setting must stay, it moves below the buttons; I'll flag this in the PR for the owner.
- The agent steps (4h–4k) open as a centred 480px window.
- Arrow keys move through the grid and Enter opens 6b.

## Issue housekeeping
After the PR is opened, comment on #353–#367 to say their desktop parts are superseded by #413 and Round 6. Phone parts stay open; nothing is closed without an owner order.

## Verification
- `npm run lint`, `npm run build`, `npm test`: all pass with no new skips.
- Local `next dev` signed in as designated test account 1, using Playwright/Chromium:
  - capture each screen (Home, post open, New post, Days with a day chosen, Search "ribs" or a real query, Profile) at 1280×800 and compare it side by side with the rendered 6a–6f frames
  - capture the same routes at 390×844 on `origin/main` and on the branch to show the phone is unchanged
- Keyboard checks: N, /, D, ?, J/K, Enter, Esc, ← →, ↑ ↓.
- The fake camera flag covers the 6c webcam side and its no-camera fallback.
- Any test posts I create are deleted, and their storage objects are confirmed removed.
- Open one PR referencing #413 and wait for green Vercel preview checks. Reviews follow the owner's current rule. Nothing is merged or deployed without a named-PR, full-head order. Finish with `scripts/cleanup.sh`.