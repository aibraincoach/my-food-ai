# Fleet 54 — #999: a phone's Photo screen never stays black and silent: a stopped camera is opened again once, and a camera that did not open says so (2026-11-18)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. **Nothing here touches production.** Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's order of 2026-11-18 18:02Z (`qitem-20261118180243-10117ae89e72522c`), item 6, issue #999.

**Shape:**
- one code PR and one docs PR;
- local checks, one stop before the merges, and no production section;
- **the acceptance is on the owner's iPhone,** because the fault is in how iOS handles the camera stream, which a desktop browser cannot reproduce. The PM arranges that check after the merge.

**Base:** main `3f41e22da49fcfc8df1f614d54632b6217fc9c84`.

**Files:** `src/components/CaptureSheet.tsx` and a new `tests/camera-recovery.test.mjs`. Fleets 49 to 53 touch neither.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: one**, before the merges (section 4). The only other halts are:
- a review tool that is unavailable when its review is reached (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer.

## 1. What the code does now

**The barcode reader does not run on the Photo screen.**
- The once-a-frame scan runs only in Barcode mode (`CaptureSheet.tsx:246-247`, `if (mode !== "barcode" || !stream) return`).
- In Photo mode the app only does two things:
  - it loads the decoder's code in advance (`:175`), which opens no camera;
  - it reads each **finished** photo once for a barcode, within 900 ms (`:337-341`). That is the owner's #212 ruling: a pack photographed in Photo mode is still read.
- The decoder knows UPC and EAN codes only, not QR (`BarcodeScanner.tsx:26`). A "QR reader" the owner saw was probably iOS's own camera.
- **The planner reads #999's done line, "the barcode reader does not run until the person opens the Barcode screen", as the live scan.** That already holds. The one-shot read of a finished photo stays, under #212. If the PM reads the line otherwise, that read moves to the Barcode screen only, which undoes #212. That is a ruling for the owner, not this fleet.

**Two gaps can leave the picture black:**
- **(a) Silent failure on phones.** When the camera fails to open, or its picture fails to play, a phone in Photo mode shows only the camera icon on black. The "Allow camera" retry is desktop only (`:514`, `desktop&&(cameraUnavailable…)`). Barcode mode does say "Camera unavailable" (`:575-576`).
- **(b) Nothing reopens a stopped camera.** iOS can end the camera track, or pause the picture, when:
  - the app goes to the background;
  - another app takes the camera;
  - the app is killed and reopened from the home screen.

  No code listens for the track's `ended`, or for `visibilitychange` or `pageshow` (checked in `CaptureSheet.tsx` and `src/lib/media/camera.ts`).

## 2. The change (patch `fleet54-999-camera.patch`)

1. **Recovery, one effect on `stream`:**
   - **A track `ended`:** close the camera and open it again (the existing open effect, through `cameraAttempt`).
   - **A return to the page** (`visibilitychange` to visible, or `pageshow`):
     - if a track is no longer live, reopen;
     - else if the picture is paused, play it again. A failed play shows the unavailable state, as the existing play handler does.
   - **At most one reopen per return to the app** (rule 5: no retry loop). A ref is set on the reopen and cleared only when the page goes hidden, or when the person taps Allow camera. A second end before then shows the unavailable state instead of reopening.
   - **There is no timer.**
2. **Visible failure on phones:**
   - The unavailable overlay shows on phones too.
   - In Photo mode it says **"The camera could not be opened."** above the existing **Allow camera** button. AGY rules on the words; they are the opening of Barcode mode's existing sentence.
   - The desktop drop area (forPost) stays desktop only.
3. **Unchanged:**
   - the Profile setting "Use the phone's camera app", which shows no live picture by design, with its own line;
   - the decoder's advance load;
   - the finished-photo barcode read.

**Tests** (new `tests/camera-recovery.test.mjs`, source checks, 3 tests):
- **The recovery effect:**
  - it listens for `ended`, `visibilitychange` and `pageshow`;
  - it reopens at most once, showing the unavailable state on the second end;
  - a hidden page clears the once-flag;
  - it plays a paused picture;
  - it holds no timer.
- **The phone overlay:** its condition is no longer desktop only, it shows the Photo-mode sentence, and Allow camera clears the once-flag.
- **The live scan** still runs only in Barcode mode.

Two fail on main; the live-scan test passes on both.

## 3. Facts the planner checked

**Attached** (`/home/opc/.claude/plans/`). Check the hash; a file that does not match voids the PR.

| Patch | sha256 | Files |
|---|---|---|
| `fleet54-999-camera.patch` | `959cc69cf4bc54661d53881ec061478f0401c284ffd25731c3fa75d4b394f658` | `src/components/CaptureSheet.tsx`; new `tests/camera-recovery.test.mjs` |

**Verified on the planner's worktree** (main `3f41e22d` with the patch):
- `npx tsc --noEmit` is clean, and `npx eslint` on both files is clean.
- The new test passes 3 of 3; on main, 1 passes and 2 fail.
- **The 28 test files** that mention capture, barcode or camera: 96 passed, 7 failed, 9 skipped with the patch, against 93 / 7 / 9 on main. The same 7 fail in both runs, and each needs a database or app address (HTTP publishing, composer identify, drink intents, leftovers, not-eaten revision, card pointers, the photo reservation).

**Not run by the planner:** the suites against a stack, and any browser.

## 4. How it runs, and the stop

1. **Worktree** `/tmp/mfa-f54` from `origin/main`, with `npm ci`. Branch `fix54/camera-recovery` from `origin/main`, with the patch applied by `git apply`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=63560 TEST_PG_PORT=57849 TEST_STACK_DIR=/tmp/mfa-f54s TEST_ENV_FILE=.env.test.fleet54`.
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on both files;
   - the tests above;
   - both suites once, with the built app started (10 minutes each), compared with main's counts.
4. **L1, local, in Chromium with phone emulation (390 × 844, touch), using a fake camera** (`--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`). Run each with main and with the patch. **Met when all of these hold:**
   - **Ended:** open New post in Photo mode, then end the track from page script (`stream.getVideoTracks()[0].stop()` and `dispatchEvent(new Event('ended'))` on it). The patch shows a live picture again within 3 seconds; main stays black.
   - **Second end before a return:** the patch shows "The camera could not be opened." with Allow camera, and makes no third open (count `getUserMedia` calls through a page-script wrapper). Allow camera opens it again.
   - **Paused:** pause the video from page script, then emulate a hidden-then-visible page (CDP `Emulation.setFocusEmulationEnabled`, or `Page.setWebLifecycleState` frozen then active). The picture plays again.
   - **Refused:** with `--deny-permission-prompts` and without the fake UI flag, open Photo mode. The patch shows the sentence and Allow camera; main shows a black area with the camera icon.
   - **Live scan:** in Photo mode, no barcode scan runs (wrap the decoder's `decodeBarcode` and count 0 calls over 10 seconds with a live picture).

   One screenshot per state, main and patch.
5. **Review:** one PPLX review on the final head (AGY if PPLX is unavailable). AGY rules on the sentence in any case.
6. **Docs PR:** branch `docs/fleet54`, with this plan unchanged as `docs/plan-fleet54.md`.
7. **Stop** when the code PR and the docs PR are open, the code PR is reviewed or reported "written, not reviewed", and L1 is reported. Report to the PM in one message:
   - the PR's number, branch, final head (40 characters), checks and review, with AGY's ruling on the sentence;
   - the suites' counts against main;
   - L1 with its screenshots and the `getUserMedia` counts;
   - anything void;
   - the merge order: **the code PR, then the docs PR**.

**There is no production check by the coder.** #999's done line needs a phone:
- on a first open, New post in Photo mode shows the live picture within a few seconds, and the shutter takes a photo;
- the same holds after the app is killed and reopened.

That is the owner's iPhone, or GrokBot's: the PM arranges it after the merge. Emulation proves the code paths, not iOS's behaviour.
