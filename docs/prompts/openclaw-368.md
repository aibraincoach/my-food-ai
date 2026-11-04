# Rate-limit probe for the My Food AI sign-up form (issue #368)

You are testing one thing: when many sign-ups go through the app's own sign-up form, does the authentication service count them against the app server's address (so everybody would be locked out together) or against your address (so only you would be locked out)? You need two devices on two different internet connections. Nothing else is required. You will not need to read any code.

## What the app is
- Web app: https://my-food-ai-ten.vercel.app
- Sign-up page: https://my-food-ai-ten.vercel.app/sign-up — three fields: Email, Handle, Password; one button "Sign up".
- Sign-in page: https://my-food-ai-ten.vercel.app/sign-in — Email, Password; button "Sign in".
- The form is sent to the app's server (Vercel), which forwards it to the authentication service (Supabase). Supabase limits sign-ups and sign-ins per source address; in an earlier direct test it refused at the 31st request. We do not know whether it sees Vercel's address or yours. That is the question.
- A refused request shows an error line under the form (and the page address gains `?error=...`). A successful sign-up opens the app's feed (page title "My Food AI", a "New post" button). There is no e-mail confirmation step.

## Accounts you may use
- Only addresses of this exact shape: `clearchoice+mfa368-YYYYMMDD-NN@gmail.com`, where YYYYMMDD is today's date and NN is 01, 02, … 40. Example: `clearchoice+mfa368-20261105-07@gmail.com`. You have access to that inbox; no mail is expected.
- Handle: `mfa368-NN` (same NN). Password: one password you choose, 12+ characters, the same for every account; keep it in your report.
- Never use any other address, never sign in to an account you did not create here, never post, upload, comment or delete anything in the app. We delete these accounts afterwards from the list in your report.

## Device A (a computer on one connection; use a fresh private window for every attempt)
1. Note the time. Open the sign-up page in a private window. Fill `…-01@gmail.com`, handle `mfa368-01`, the password. Click Sign up. Record: attempt number, clock time to the second, the outcome (feed opened / error text exactly as shown / page did not load). Close the private window.
2. Repeat for NN = 02 through 35, one after another without pausing, each in a new private window. Stop early only if ten attempts in a row show the same error.
3. Record the first attempt that was refused (its number, time and exact text) and whether later attempts were refused too. If none of 35 was refused, say so.

## Device B (a phone on mobile data, Wi-Fi OFF, within 5 minutes of the last Device A attempt)
4. On the phone, open the sign-in page in a private window and sign in as `…-01@gmail.com` with the password (account 01 was created in step 1). Record the time, and the outcome exactly (feed opened, or the error text).
5. Still on the phone, open the sign-up page and create `…-36@gmail.com` with handle `mfa368-36`. Record the outcome exactly.
6. Back on Device A (same connection as before), in a new private window, try to sign in as `…-01@gmail.com`. Record the outcome.

## What the results mean (write the matching line in your report)
- Device A was refused at some point, and Device B could sign in and sign up: Supabase counts your address, not the server's. One abuser locks out only themselves.
- Device A was refused, and Device B was also refused on both tries: Supabase counts the server's address. One abuser can lock out everybody. This is the serious outcome.
- Device A was never refused in 35 attempts: the limit was not reached through the app; say so, with the times.

## Report (plain text, in this order)
1. The date, the two devices and how each was connected (home Wi-Fi, office, mobile network name).
2. A table of every attempt: number, time, device, action (sign-up or sign-in), address used, outcome text.
3. The first refusal on Device A (number, time, text) or "none in 35".
4. The Device B outcomes (steps 4 and 5) and the Device A sign-in afterwards (step 6).
5. The one matching line from "What the results mean".
6. The full list of addresses you created, so they can be deleted.
Do not retry anything after a refusal except as the steps say; the limit resets by itself within an hour. Do not run this more than once per day.
