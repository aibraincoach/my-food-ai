Lane E — camera mode (#594)

Implementation: per-device localStorage preference; default app camera; Profile explanation; phone-photo mode suppresses live camera and explicitly dispatches shutter to capture input (including stale prior barcode stream); Save photo shares selected File when available, otherwise downloads meal.jpg. Camera-roll retention is explicitly phone-dependent.

Checks:
- npx tsc --noEmit: exit 0.
- targeted sharper-capture/camera-frame/camera-flip/upload-guard: 28 pass, 1 fails because disposable Supabase env was not supplied (supabaseUrl is required). No production integration test was run.
- npm run lint: exit 0, 0 errors, 14 inherited warnings; no E warnings.
- npm run build was interrupted before compilation to honor shared-memory scheduling; combined production build pending.
- M8 browser check pending combined validation runtime.

Owner phone checks P2/P3 remain required; no claim made about Save Image availability or camera-roll persistence.

Final targeted rerun with disposable loopback stack (/tmp/run16-test.env): ALL29 pass, 0 fail, including two-shot database publication guard. Source refreshed with Fleet15 #583/#584; the CaptureSheet merge retains #584's flexible desktop viewfinder and E's retired-stream guard.

M8 PASS on final combined local production build at http://127.0.0.1:60261, observed2026-11-04T14:30UTC, designated disposable test account2:
- Profile preference remains On across reload.
- Phone mode shows0 live video elements; one shutter tap dispatches1 native capture-input click.
- Default app camera capture yields meal.jpg image/jpeg40909 bytes; Save photo calls navigator.share once with that File when canShare is stubbed true.
- canShare=false fallback starts download named meal.jpg.
- Upload staging was intercepted with503 locally, no post published; context closed.
- Browser errors: none. Receipt /tmp/run16-egk-browser.json.
