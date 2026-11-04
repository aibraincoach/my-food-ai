# Auth protection — Run 8

## Current evidence scope — November 4, 2026

The production CAPTCHA-off state below was observed during Run 8; this reconciliation does not re-read or change Auth settings. The owner's app-path sign-up probe #368 was withdrawn in Fleet 12, so do not run it from this handover. #279 remains open for authorized public-launch CAPTCHA activation and enforcement. Earlier direct-machine rate-limit refusals do not prove isolation across two app clients.

CAPTCHA is built and **off** by the owner's ruling at 10:57 WIB on November 3, 2026. This run changes no Supabase Auth setting and sets no production site key. No new-account cap is added. The spending-cap lane separately limits each account to 40 new posts per clock hour.

## Observed configuration

The planner's filtered Management API observation at 04:00 UTC / 11:00 WIB recorded: `security_captcha_enabled=false`, provider `hcaptcha`, secret present, `hook_before_user_created_enabled=false`, `mailer_autoconfirm=true`, and `rate_limit_verify=30`. The secret stays only in Supabase Auth. This implementation does not fetch, print or store it. The coder independently confirmed the same filtered values through a read-only Management API request at 04:15:37 UTC on November 3; only secret presence, never its value, was returned in the receipt.

The hammer script rechecks only that auto-confirm is enabled before creating any sign-up probe, so it will refuse to run if sign-ups could send email. It creates random `run8-hammer-…@example.com` accounts, never uses the designated test/demo accounts, and deletes its own accounts in `finally`, including reconciliation after a timed-out signup. Password sign-in uses a wrong password against one separately created throwaway account. Expected `invalid_credentials` does not count as a rate-limit refusal.

## Hammer observation

Completed in Part 2 **after all other production checks** (results below): `node --env-file=.env.local scripts/auth-hammer.mjs --signups 35 --signins 35`. Record the first refusal's request number, status and error code for each flow, or `not refused within 35`, plus created/deleted totals. No production hammer run was performed in Part 1; final observations are recorded below. An isolated mocked-HTTP check passed independent sign-up/sign-in refusal handling, wrong-password continuation, cleanup of all three created fixtures and the auto-confirm safety guard. The original #279 enforcement condition remains open while CAPTCHA is off.

## Dormant frontend and server path

Both auth forms include the widget immediately above Submit. An empty `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` renders no widget and loads no hCaptcha script. When configured, the once-loaded SDK explicitly renders each mounted form and supplies `h-captcha-response`; the explicit readiness callback also supports client navigation between sign-in and sign-up. Auth actions pass a nonempty token as `options.captchaToken` and map CAPTCHA errors to “Complete the check and try again.”

All script password sign-ins now pass through the shared helper, including feed-probe and seed-week (preserving their client/tracing and output contracts). The test-session helper first tries password sign-in; only a CAPTCHA failure uses an admin-generated magic-link hash followed by `verifyOtp`. It sends no email, prints no hash/session, and is restricted to the two configured test accounts. The fallback while CAPTCHA is enabled remains an unverified premise until tested against an isolated CAPTCHA-enabled service; production CAPTCHA is not toggled for this check. A mocked-SDK-HTTP regression passed the CAPTCHA → generate-link → verify-OTP sequence, rejected invalid account selection, and confirmed ordinary credential errors do not trigger fallback.

## Preview and production acceptance

Local Chromium page looks at 390×844 with the public test key passed: one rendered checkbox and one SDK script on each auth page, 390px document width, 844px document height, no page exceptions; sign-up → sign-in client navigation rendered exactly one widget without an exception. Both layouts fit the viewport. The test widget displays its expected red testing notice, and sign-up is taller by one field. Screenshots remain in ignored local evidence. Part 2 repeated the preview looks, solved its check and signed in, and confirmed production has no widget and password sign-in remains successful; see final observations below. No production variable is changed to obtain preview evidence. Test-key responses require the matching hCaptcha test secret when actually verified; the production project's stored secret is not replaced for this run.

## Turn-on order for launch

CAPTCHA is built and off by the owner's ruling (10:57 WIB). To turn it on when the app goes public: set `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` in Vercel production, redeploy, then set `security_captcha_enabled true` in Supabase Auth. Never in the other order. Do not set the public test key in production and never put the secret in Vercel or the repository.

References: [hCaptcha readiness and explicit rendering](https://docs.hcaptcha.com/configuration), [test integration keys](https://docs.hcaptcha.com/#integration-testing-test-keys), [Supabase CAPTCHA token option](https://supabase.com/docs/guides/auth/auth-captcha).

## Final production hammer observation

Run last after all other production checks: `node --env-file=.env.local scripts/auth-hammer.mjs --signups 35 --signins 35`, exit 0. Sign-up first hit a rate refusal at request **31**, HTTP **429**, code **over_request_rate_limit**. Wrong-password sign-in first hit a rate refusal at request **32**, HTTP **429**, same code; preceding invalid_credentials responses were expected wrong-password failures, not counted as rate-limit refusals. The script stopped each series at that refusal, as specified.

Exactly **31** throwaway accounts were created and **31** deleted, with **zero cleanup failures**. No test/demo account was used for hammering and no email was sent. Production settings were independently rechecked before this final test: CAPTCHA false, hcaptcha provider, secret present (boolean only), auto-confirm true, before-user-created hook false. Preview alone has the public test site key; production has no site key or widget. The dormant preview checkbox/token sign-in and ordinary production no-widget sign-in both passed.

These observations show what the current per-IP protection refused from this machine; they are not a global account-creation cap or proof of CAPTCHA enforcement while disabled. Each account's post cap is 40 per clock hour. The CAPTCHA-on portion of #279 remains deliberately open by the owner's ruling. [Final execution report](run8-final-report.md).
