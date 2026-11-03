# Auth protection — Run 8

CAPTCHA is built and **off** by the owner's ruling at 10:57 WIB on November 3, 2026. This run changes no Supabase Auth setting and sets no production site key. No new-account cap is added. The spending-cap lane separately limits each account to 40 new posts per clock hour.

## Observed configuration

The planner's filtered Management API observation at 04:00 UTC / 11:00 WIB recorded: `security_captcha_enabled=false`, provider `hcaptcha`, secret present, `hook_before_user_created_enabled=false`, `mailer_autoconfirm=true`, and `rate_limit_verify=30`. The secret stays only in Supabase Auth. This implementation does not fetch, print or store it. The coder independently confirmed the same filtered values through a read-only Management API request at 04:15:37 UTC on November 3; only secret presence, never its value, was returned in the receipt.

The hammer script rechecks only that auto-confirm is enabled before creating any sign-up probe, so it will refuse to run if sign-ups could send email. It creates random `run8-hammer-…@example.com` accounts, never uses the designated test/demo accounts, and deletes its own accounts in `finally`, including reconciliation after a timed-out signup. Password sign-in uses a wrong password against one separately created throwaway account. Expected `invalid_credentials` does not count as a rate-limit refusal.

## Hammer observation

Pending Part 2, **after all other production checks**: `node --env-file=.env.local scripts/auth-hammer.mjs --signups 35 --signins 35`. Record the first refusal's request number, status and error code for each flow, or `not refused within 35`, plus created/deleted totals. No production hammer run has been performed in Part 1. An isolated mocked-HTTP check passed independent sign-up/sign-in refusal handling, wrong-password continuation, cleanup of all three created fixtures and the auto-confirm safety guard. The original #279 enforcement condition remains open while CAPTCHA is off.

## Dormant frontend and server path

Both auth forms include the widget immediately above Submit. An empty `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` renders no widget and loads no hCaptcha script. When configured, the once-loaded SDK explicitly renders each mounted form and supplies `h-captcha-response`; the explicit readiness callback also supports client navigation between sign-in and sign-up. Auth actions pass a nonempty token as `options.captchaToken` and map CAPTCHA errors to “Complete the check and try again.”

All script password sign-ins now pass through the shared helper, including feed-probe and seed-week (preserving their client/tracing and output contracts). The test-session helper first tries password sign-in; only a CAPTCHA failure uses an admin-generated magic-link hash followed by `verifyOtp`. It sends no email, prints no hash/session, and is restricted to the two configured test accounts. The fallback while CAPTCHA is enabled remains an unverified premise until tested against an isolated CAPTCHA-enabled service; production CAPTCHA is not toggled for this check. A mocked-SDK-HTTP regression passed the CAPTCHA → generate-link → verify-OTP sequence, rejected invalid account selection, and confirmed ordinary credential errors do not trigger fallback.

## Preview and production acceptance

Local Chromium page looks at 390×844 with the public test key passed: one rendered checkbox and one SDK script on each auth page, 390px document width, 844px document height, no page exceptions; sign-up → sign-in client navigation rendered exactly one widget without an exception. Both layouts fit the viewport. The test widget displays its expected red testing notice, and sign-up is taller by one field. Screenshots remain in ignored local evidence. Pending: repeat these looks on the Vercel preview, solve its check and sign in, and confirm production has no widget and password sign-in remains successful. No production variable is changed to obtain preview evidence. Test-key responses require the matching hCaptcha test secret when actually verified; the production project's stored secret is not replaced for this run.

## Turn-on order for launch

CAPTCHA is built and off by the owner's ruling (10:57 WIB). To turn it on when the app goes public: set `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` in Vercel production, redeploy, then set `security_captcha_enabled true` in Supabase Auth. Never in the other order. Do not set the public test key in production and never put the secret in Vercel or the repository.

References: [hCaptcha readiness and explicit rendering](https://docs.hcaptcha.com/configuration), [test integration keys](https://docs.hcaptcha.com/#integration-testing-test-keys), [Supabase CAPTCHA token option](https://supabase.com/docs/guides/auth/auth-captcha).
