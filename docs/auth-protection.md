# Auth protection — Run 8

## Fleet14 identity-read scope — November 4, 2026

The server now sets a browser-readable UI identity hint after verification. Browser identity reuse never authorizes data; real session/RLS boundaries remain. Final local/prod request counts distinguish a document from prefetch and refresh requests. Browser Auth round trips were removed, but local navigation windows still observed7/9/14 server verifications due prefetch/refresh traffic; #323 stays open. This run does not change CAPTCHA or perform another signup hammer.

CAPTCHA is built and **off** by the owner's ruling at 10:57 WIB on November 3, 2026. This run changes no Supabase Auth setting and sets no production site key. No new-account cap is added. The spending-cap lane separately limits each account to 40 new posts per clock hour.

## Observed configuration

The planner's filtered Management API observation at 04:00 UTC / 11:00 WIB recorded: `security_captcha_enabled=false`, provider `hcaptcha`, secret present, `hook_before_user_created_enabled=false`, `mailer_autoconfirm=true`, and `rate_limit_verify=30`. The secret stays only in Supabase Auth. This implementation does not fetch, print or store it. The coder independently confirmed the same filtered values through a read-only Management API request at 04:15:37 UTC on November 3; only secret presence, never its value, was returned in the receipt.

The hammer script rechecks only that auto-confirm is enabled before creating any sign-up probe, so it will refuse to run if sign-ups could send email. It creates random `run8-hammer-…@example.com` accounts, never uses the designated test/demo accounts, and deletes its own accounts in `finally`, including reconciliation after a timed-out signup. Password sign-in uses a wrong password against one separately created throwaway account. Expected `invalid_credentials` does not count as a rate-limit refusal.

## Hammer observation

Completed in Part 2 **after all other production checks** (results below): `node --env-file=.env.local scripts/auth-hammer.mjs --signups 35 --signins 35`. Record the first refusal's request number, status and error code for each flow, or `not refused within 35`, plus created/deleted totals. No production hammer run was performed in Part 1; final observations are recorded below. An isolated mocked-HTTP check passed independent sign-up/sign-in refusal handling, wrong-password continuation, cleanup of all three created fixtures and the auto-confirm safety guard. The original #279 enforcement condition remains open while CAPTCHA is off.

## Dormant frontend and server path

An empty `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` renders no widget and loads no hCaptcha script. When configured, the once-loaded SDK explicitly renders an invisible widget for each auth form. A valid form submit executes its challenge; only a successful token hands that same submitter to React's form action. The SDK supplies `h-captcha-response`. A failed or unavailable check shows a visible banner and sends no auth request; another user submit is required, with no application retry loop. The readiness callback supports navigation between auth screens; unmount removes the widget and submit listener and prevents late completion from submitting a departed form. The old visible-checkbox path is removed. Auth actions pass a nonempty token as `options.captchaToken` and retain the server's CAPTCHA failure message.

Checked 2026-11-22: [hCaptcha invisible mode](https://docs.hcaptcha.com/invisible) is available to all users; fully passive mode is Enterprise, while 99.9% passive is Pro/Enterprise. These are different from invisible-on-submit, which may still present a challenge. [The API](https://docs.hcaptcha.com/configuration) documents async execute and reset. The provider's privacy/terms disclosure is shown only when a key is configured. This implementation does not enable CAPTCHA or change any production key or Auth setting.

All script password sign-ins use the shared helper, including feed-probe and seed-week (preserving their client/tracing and output contracts). The helper makes one password sign-in attempt for test account 1 or 2 and fails visibly on an authentication error. A CAPTCHA refusal says the project requires a CAPTCHA and this helper uses a password only. It never creates an admin client, generates a magic link or verifies an OTP, and it prints no credential or session. Any future explicit CAPTCHA-enabled test mode needs a separate ruling; no production CAPTCHA setting is changed here. The current method and local-only check are documented once in [Agent sign-in](../scripts/README.md#agent-sign-in).

## Preview and production acceptance

Local Chromium page looks at 390×844 with the public test key passed: one rendered checkbox and one SDK script on each auth page, 390px document width, 844px document height, no page exceptions; sign-up → sign-in client navigation rendered exactly one widget without an exception. Both layouts fit the viewport. The test widget displays its expected red testing notice, and sign-up is taller by one field. Screenshots remain in ignored local evidence. Part 2 repeated the preview looks, solved its check and signed in, and confirmed production has no widget and password sign-in remains successful; see final observations below. No production variable is changed to obtain preview evidence. Test-key responses require the matching hCaptcha test secret when actually verified; the production project's stored secret is not replaced for this run.

## Turn-on order for launch

CAPTCHA is built and off by the owner's ruling (10:57 WIB). To turn it on when the app goes public: set `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` in Vercel production, redeploy, then set `security_captcha_enabled true` in Supabase Auth. Never in the other order. Do not set the public test key in production and never put the secret in Vercel or the repository.

References: [hCaptcha readiness and explicit rendering](https://docs.hcaptcha.com/configuration), [test integration keys](https://docs.hcaptcha.com/#integration-testing-test-keys), [Supabase CAPTCHA token option](https://supabase.com/docs/guides/auth/auth-captcha).

## Final production hammer observation

Run last after all other production checks: `node --env-file=.env.local scripts/auth-hammer.mjs --signups 35 --signins 35`, exit 0. Sign-up first hit a rate refusal at request **31**, HTTP **429**, code **over_request_rate_limit**. Wrong-password sign-in first hit a rate refusal at request **32**, HTTP **429**, same code; preceding invalid_credentials responses were expected wrong-password failures, not counted as rate-limit refusals. The script stopped each series at that refusal, as specified.

Exactly **31** throwaway accounts were created and **31** deleted, with **zero cleanup failures**. No test/demo account was used for hammering and no email was sent. Production settings were independently rechecked before this final test: CAPTCHA false, hcaptcha provider, secret present (boolean only), auto-confirm true, before-user-created hook false. Preview alone has the public test site key; production has no site key or widget. The dormant preview checkbox/token sign-in and ordinary production no-widget sign-in both passed.

These observations show what the current per-IP protection refused from this machine; they are not a global account-creation cap or proof of CAPTCHA enforcement while disabled. Each account's post cap is 40 per clock hour. The CAPTCHA-on portion of #279 remains deliberately open by the owner's ruling. [Final execution report](run8-final-report.md).
