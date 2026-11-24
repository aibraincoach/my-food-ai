# #1249: release the Forgot password link

Adds the approved Forgot password? link directly under Password and extends the wrong-credentials sentence to offer reset. Only those English/Japanese strings change; existing reset actions/callback/new-password route remain unchanged. The reset screens and local end-to-end recovery were already merged in #1269.

## Gate evidence

PM orders qitem-20261124111116-c38f6b41a822167c and qitem-20261124111639-7a881e90666dc4ef; approved Fleet64S6 pin042d8ee06a599ff18158f64015b8abdabf3941ab7c334fe817dbf6adfde005ed.

- First authorized production reset through the real form to configuredjudge2,11:14:52–11:14:55Z: exactly1submission, visiblefailure The reset email could not be sent. Try again. No retry. No delivery claim.
- PM authorized a separate attempt using delivered@resend.dev, Resend's test sink.11:18:48.909–11:18:54.277Z: normalproduction signup1POST created the newfixture; real resetform1POST showed **Check your email** and **If an account uses that email, you will receive a link to choose a new password.** No error or retry. No password was changed.
- PM independently reported a direct Resend200 from hello@updates.aibraintrust.io to that sink (id01a20d45-737f-70fb-a217-119da9615cae) and the owner's successful SMTPconnection-save. The PM explicitly accepts these plus the sent-screen as this release's delivery gate. This builder did not inspect the provider's send record independently.
- **Real inbox delivery to a person remains unproved.** The sink discards mail; the production email link/password-change path was not exercised. The earlier localAuth/SMTP recovery proof in state/build/fleet64/S6/PROOF.md stands.
- Configured sender name still reads **AI Fitness Coach**, per the owner's saved-setting readback. The owner will change it to My Food AI; this change does not wait for that or change any Supabase setting. Sign-up confirmation behavior depends on whether Supabase email confirmation is enabled (#1306); the one fixture was automatically confirmed in this run.
- Cleanup used an ordinary psql transaction guarded by the exact newlycreated fixtureid, fixedsinkemail and creationwindow after verifying the address was absent before signup. Only that Authfixture was deleted; profile cascade. Auth/profile/posts/reports/sessions/storage readback0; ownsessionrevoked. No other Authuser or productionrole was changed. No key/password/cookie was printed or stored in evidence.

## Validation

- Updated email-signin tests red on base:2expected failures (missinglink/oldsentence),1pass. All9 signin/reset tests pass on fix.
-26 focused signin/reset/i18n/document tests pass; tsc, scopedlint,210-key message check and productionbuild pass. Fullsuite not rerun.
- Chromium/WebKit iPhone13emulation390x844, en/ja: link belowPassword reaches existing Resetpage, exactlocalized wrong-credential banner, no horizontal overflow. Browser tests make0resetPOSTs and use invalidcredentials only on disposableloopbackAuth.
- Initial browser fixture matched both visible and retainedhiddenEmailfields after NextBack. Visible selectors fixed Chromium. WebKit's Back-path fill still timed out despite a visible-input screenshot; cause unconfirmed, no productfix. Final WebKit proof starts the separate wrong-credential check on a freshSignindocument; it proves the feature and banner, not that retainedBack path. Initial receipts are preserved, not presented as cleanpasses.
- PM drafted both Japanese strings. Independent reviewer row qitem-20261124112102-2ef35742 passed both with no corrections. Japanese has not been reviewed by a native speaker. Real-phone/Safari behavior unproved.

Operational receipts, screenshots and original failed harness receipts: /home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/1249-smtp-2026-11-24/. No further production mail was sent during local testing. No migration, provider activation, signup-policy change, or fallback is added. #1249 remains open pending PM release/Donewhen disposition; do not infer personalinbox proof from this test sink.
