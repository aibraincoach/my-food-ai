# Bilingual Auth email templates

The confirmation and password-reset templates show English first and Japanese second. Each has one bilingual action link using `{{ .ConfirmationURL }}`. There is no stored language or per-person selection, no image or tracking, and no app Auth or redirect change. The English is PM-approved; Japanese is PM-drafted and independently double-read, not native-speaker reviewed. Real Gmail and iOS Mail rendering is unproved.

## Current production comparison is still required

The production templates live in Supabase settings and have not been read for this packet: RT's browser is disconnected. `{{ .ConfirmationURL }}` is the standard local GoTrue assumption, **not a claim about the current production link**. Supabase documents this variable as the signed verification URL, including the requested redirect. [Supabase email-template variables](https://supabase.com/docs/guides/auth/auth-email-templates).

The PM will supply the current Confirm sign up and Reset password subjects and HTML in `decisions/`. Before any apply, compare their actual action-link expressions with these files and show the comparison to the PM. If the production expression differs, revise and review the local templates and proof first. Do not substitute a guessed URL, change redirect settings or introduce an alternate verification path.

## Files and local proof

| Supabase email | Subject | HTML |
|---|---|---|
| Confirm sign up | `confirmation` in `supabase/templates/subjects.json` | `supabase/templates/confirmation.html` |
| Reset password | `recovery` in `supabase/templates/subjects.json` | `supabase/templates/recovery.html` |

On a new disposable stack, `MFA_STACK_CONFIRM=1 MFA_STACK_EMAIL_TEMPLATES=1` serves the two files on loopback and configures only that stack's GoTrue template/subject environment variables. With the template flag off, its built-in English supplies the baseline. The local recovery verification route and both redirect destinations are configured identically for baseline and head. No production setting uses this test server.

`tests/browser/auth-email-templates.mjs` checks native SMTP messages in Mailpit for both flows and locales: exact approved bilingual subject/text, one signed action link, absence of private form values, and the native URL shape. With link-following enabled, its browser context carries the initiating PKCE verifier and follows the real email link. Confirmation reaches the signed-in handle screen; recovery reaches the new-password form. The test records URL parameter names and redirect paths, never token values. GoTrue/Mailpit and the app must run on the same new disposable environment; do not point it at production. Existing confirmation and password-reset tests remain required checks.

## Separately ordered production apply

These files authorize no production change. The owner must first give written yes and the PM must order the exact reviewed files/head. The PM or authorized night-time browser workflow then does the following:

1. Save the current four fields—both subjects and both HTML bodies—as the private rollback snapshot. Record the project and timestamp without credentials or live verification links. The snapshot must contain the real values; this document does not invent them.
2. Complete the link-expression comparison above and obtain the PM's apply order. Keep the current sender, SMTP configuration, confirmation policy, Site URL and redirect allowlist.
3. Paste each subject and body into the matching email template fields, save, then read back all four fields against the reviewed files. Stop on a mismatch.
4. Only as separately ordered, request one reset for an existing PM-designated test account whose inbox is the Resend sink or the owner's. Read back the received text and exact signed destination; keep token values private. Do not create a production account for this test, repeat sends automatically, or treat a reset request without a delivered message as proof.
5. Report the readback and message result to the PM. This local PR does not claim the Resend test or production acceptance is done.

## Rollback

Before applying anything, the real four-field snapshot must exist. If the PM orders rollback, restore those exact two subjects and two HTML bodies in the same project and read back all four fields. Restore the captured link expressions exactly. Do not use GoTrue defaults as an assumed production rollback. No account, session, redirect, SMTP or sender change is part of this rollback.
