# Fleet 63 — sign-in: Google (#1204), Apple on Apple browsers (#1205), Line (#1203), the ChatGPT placeholder (#1183), Facebook unchanged (#114), and #1184's build order (2026-11-20)

You are the coder. You have the filesystem, GitHub, local-stack, Vercel and Supabase Management API access this plan needs. **Production contact is limited to section 6, after the PM's merge order, and to the provider settings the owner's credentials unlock.** Carry it out; do not return it, evaluate it or wait on anyone except where a step names the owner, the designer or the PM.

**What this plan is.** The PM's order of 2026-11-20 11:36Z, item 3. It runs after Fleet 62 (the demo-path fixes).

**The owner's ruling (#1184, Nov 20).** The sign-in screen offers exactly six choices:
- **email,** the normal way, kept as it is;
- **Google,** for everybody;
- **Apple,** only on Apple browsers (WebKit), detected from the visitor's browser;
- **Line,** for the investor;
- **ChatGPT,** "coming soon", and it must look plausible and good;
- **Facebook,** "coming soon" until Meta's review passes.

**Not wanted:** Microsoft, GitHub, Yahoo! JAPAN.

**What is blocked, and on whom.** This decides the order.

| Part | Blocked until | Who |
|---|---|---|
| A: the shared screen, the Apple browser rule, visible cancel and failure, the first-sign-in handle step | nothing | coder |
| B: Google works | the owner creates a Google OAuth client (section 2, about 20 minutes, free) | owner |
| C: Line works | the owner creates a LINE Login channel, publishes it and applies for email permission (section 2; the email approval can take days) | owner |
| D: Apple works | the owner joins the Apple Developer Program ($99 a year; enrolment can take a day or more) and creates the Sign in with Apple keys (section 2) | owner |
| E: ChatGPT "coming soon" | the designer supplies the mark and confirms it, and AGY or the designer gives the wording (#1183 says no such asset was found) | designer |
| Facebook | nothing to build: the button is already disabled, with "Facebook sign-in is coming soon." It moves onto the shared component in part A | coder |

**The owner's setup can start now, before Fleet 62 ends,** because B, C and D wait on it. Line's email approval has the longest wait, so start it first.

**Rules:**
- **Rule 5:**
  - a failed or cancelled provider sign-in shows a plain message on the sign-in screen;
  - nothing switches the person to email or another provider on its own;
  - nothing retries;
  - no provider path is kept "just in case".
- **Rule 4:** the local stack for all tests. Production only in section 6.
- **No secret in the repository, an issue, a PR or a queue body.** The owner's credentials go straight into the Supabase settings (Management API or dashboard) and nowhere else.
- **AGY decides wording and engineering; the designer decides appearance.** Each provider also has its own button rules:
  - Google's "Sign in with Google" branding;
  - Apple's Human Interface Guidelines for Sign in with Apple;
  - LINE's login-button guidelines, including the Japanese "LINEでログイン".

  The designer chooses within those rules. The coder uses each provider's official artwork.

**Shape:**
- **five code PRs (A to E),** each shipping and reviewed on its own. A first; B, C and D in the order their credentials arrive; E when the designer's mark arrives;
- one docs PR;
- a sourced table posted on #1184 (section 5);
- **no full stop between PRs:** each is reported to the PM when ready and merges only on the PM's order at its exact head;
- **base:** main at Fleet 62's last merge. Record the 40-character sha.

**When done, stop.** Done means every numbered item below is reported done, not done, or blocked with its blocker named. After the last item there is no new PR and no new fix.

**The only halts are:**
- a review tool that is unavailable (report "written, not reviewed");
- a fact below that turns out false (that item only is void);
- an operation that would contact a customer;
- **a part still blocked:** report it blocked and carry on with the others.

**Your own stack, outside the worktrees:** `TEST_PORT_BASE=64360 TEST_PG_PORT=58649 TEST_STACK_DIR=/tmp/mfa-f63s TEST_ENV_FILE=.env.test.fleet63`.

## 1. What the planner checked (read-only, at main `2eb5df89`)

**Today's code:**
- **Email sign-in and sign-up** are server actions (`src/lib/auth/actions.ts`).
- **Sign-up inserts the `profiles` row** (`handle text unique not null`) with the service-role client and deletes the auth user if that insert fails. **Nothing else creates a profile.** So a first sign-in through any provider would have **no profile and no handle.** Part A must handle this.
- **`src/app/auth/callback/route.ts`** exchanges `code` for a session. **When the provider returns no `code`** (the person cancelled, or the provider failed, which arrives as `error` and `error_description`), **it redirects to `/sign-in` with no message.** That is a rule-5 silent failure, and part A removes it.
- **`src/components/FacebookButton.tsx`** is a disabled button with the coming-soon line. It is used on both auth pages.
- **CAPTCHA is off** by owner ruling. The `HCaptcha` component stays as it is.

**The providers** (current primary documentation, read 2026-11-20; **the coder re-checks each when building**):
- **Supabase supports Google and Apple natively.**
- **Supabase has custom OAuth and OIDC providers:**
  - the identifier starts with `custom:`;
  - they are created in the dashboard or with `supabase.auth.admin.customProviders.createProvider`;
  - PKCE is on by default;
  - **"By default, providers must return an email address"**, and `email_optional: true` allows none;
  - the free plan allows 3 custom providers.

  (supabase.com/docs/guides/auth/custom-oauth-providers)
- **LINE Login is OIDC.**
  - Discovery is at `https://access.line.me/.well-known/openid-configuration`.
  - **The email comes only in the ID token, and only after LINE approves an email-permission application** in the channel's settings.
  - **For web login, LINE signs ID tokens with HS256 (the channel secret), not with a published key;** ES256 is for native apps, the LINE SDK and LIFF. (developers.line.biz/en/docs/line-login/verify-id-token/)

  **So whether Supabase's OIDC auto-discovery can verify LINE's web ID token is unproven.** Part C proves it first.
- **Apple on the web** needs a Services ID, a Sign in with Apple key (.p8), its Key ID and the Team ID. Supabase's guide says the secret made from the key **expires and must be regenerated at least every six months.**

**Not checked by the planner. The coder proves or reports each:**
- the return to the **installed home-screen app** after a provider's redirect;
- **Google inside LINE's in-app browser.** Google refuses sign-in from many in-app browsers. If the investor opens the link from a LINE chat, Google may show an error. **This is a demo risk:** the PM tells the owner to open the demo in Safari.

## 2. What the owner creates (the PM relays this. Values go to the coder privately, never into an issue)

**The coder first sends the PM two values:**
- the production URL;
- the Supabase callback URL: `https://<project-ref>.supabase.co/auth/v1/callback` for Google and Apple, and the custom-provider callback that Supabase's create form shows, for Line.

**Google (B), free, about 20 minutes:**
1. In Google Cloud Console, create a project. In Google Auth Platform, set up the consent screen:
   - External;
   - app name "My Food AI", a support email, and the authorized domains;
   - **publish it to "In production"** (basic sign-in scopes need no Google verification).
2. Create an OAuth client ID of type "Web application":
   - the authorized JavaScript origin is the production URL;
   - the authorized redirect URI is the Supabase callback.
3. **Give the coder the client ID and client secret.**

**Note for the owner:** Google's screen will say "continue to `<project-ref>.supabase.co`" unless the project has a Supabase custom domain, which is a paid add-on. **The owner decides; this plan does not buy it.**

**Line (C), free; the email approval can take days, so start first:**
1. In the LINE Developers console, sign in with a LINE account, create a **Provider**, then a **LINE Login channel** (app type: web app).
2. Set the callback URL to the Supabase custom-provider callback.
3. **Apply for "Email address permission"** under OpenID Connect. LINE asks for the reason, and for a screenshot of where the app tells people it collects their email.
4. **Switch the channel from "Developing" to "Published".** A developing channel lets only its admins and testers sign in, so **the investor could not.**
5. **Give the coder the Channel ID and Channel secret.**

**Apple (D), $99 a year:**
1. **Join the Apple Developer Program.** An individual enrolment is quickest; an organisation needs a D-U-N-S number.
2. Create an App ID with Sign in with Apple, then a **Services ID** for the web, with the production domain and the Supabase callback as its return URL.
3. Create a **Sign in with Apple key** and download the .p8 file once.
4. **Give the coder the Services ID, the Team ID, the Key ID and the .p8 file.**

**Ongoing:** the secret made from the key must be renewed **at least every six months,** or Apple sign-in stops. The coder writes the date it expires in the PR, and the PM tracks it.

**ChatGPT (E):** the designer supplies the mark they confirm for use and the coming-soon wording, or AGY gives the wording.

## 3. Owner decisions the PM gets before the parts they affect (plain questions)

1. **"If you sign in with Google using the same email as your current account, should you land in that same account?"**
   - **Recommended: yes.** This is Supabase's default for a verified email.
   - The alternative is always a separate account.
2. **"Apple can hide your email, and Line gives none until LINE approves it. Is a separate account in that case fine for the demo?"**
   - **Recommended: yes,** with no account-linking screen in this fleet.
3. **"Until a provider's setup is done, should its button say 'coming soon' like Facebook, or not appear?"**
   - **Recommended: "coming soon",** to match the six choices the owner ruled.
   - The coder ships whichever is ruled. **There is no runtime switch either way:** each provider's PR (B, C, D) turns its own button live in code, after its settings are applied.

## 4. The parts

### A. The shared screen, buildable now

**The buttons:**
- **one provider-button component** replaces `FacebookButton`, which is deleted (DRY). It is used for Google, Apple, Line, ChatGPT and Facebook, on the sign-in and sign-up pages;
- its states are **live** (starts the provider's sign-in) and **coming soon** (disabled, with its one line);
- **default order,** until the designer rules: email form, Google, Apple (eligible browsers only), Line, ChatGPT, Facebook.

**The Apple browser rule:**
- **one pure server function** that reads the request's User-Agent. It is eligible on iPhone, iPad and iPod (every iOS browser is WebKit, including Chrome and Firefox on iOS and iPadOS's desktop-style "Macintosh" agent), and on macOS Safari;
- it is not eligible on macOS Chrome, Edge, Firefox or Opera, Android, Windows or Linux;
- **the Apple button is not rendered at all on an ineligible browser.**
- **Test table:** each of those agents, plus the LINE in-app browser on iOS (eligible: WebKit) and on Android (not eligible).

**Cancel and failure, made visible:**
- `auth/callback` reads `error` and `error_description` when there is no `code`, and returns to `/sign-in` with a plain message (AGY's wording): "Sign-in was cancelled" for `access_denied`, a general failure line otherwise;
- **delete the silent redirect.** The provider's raw text is not shown.

**The first-sign-in handle step:**
- after a provider sign-in, a person with no `profiles` row goes to one screen that asks for a handle, with the sign-up page's field;
- the row is inserted with the service-role client, as sign-up does;
- **a taken handle shows its error and keeps the person on that screen;**
- **every page the middleware's matcher covers sends a signed-in person without a profile to that screen.** Add the check there, once. **`/shell` is excluded:** it is the public, anonymous offline shell that `public/sw.js` caches at install, it reads no account data, and it stays outside the middleware. The check applies as soon as the person reaches any matched page (builder's note, 13:27Z).

**Done when:**
- the screen shows the six choices by the rules above;
- a provider whose PR has not shipped shows its ruled state;
- **on the local stack,** a seeded signed-in user without a profile is sent to the handle step, and reaches Home after choosing a free handle;
- a cancelled return shows the message.

**Proof** (all local):
- unit tests for the Apple rule's table and the callback's `error` cases;
- WebKit and Chromium browser tests of the sign-in page: the Apple button shown and hidden;
- a DB test of the handle step: a free handle, a taken handle, and no profile → redirect.

### B. Google (when the owner's client ID and secret arrive)

**The change:**
- enable Google in the Supabase auth settings through the Management API, with the redirect allow-list covering the production URL;
- the button calls `signInWithOAuth({provider:'google'})` with the callback's `redirectTo`.

**Done when** (#1204), on production:
- a new person signs in with Google, chooses a handle and reaches Home;
- a returning person reaches their account;
- cancelling shows the message;
- email sign-in is unchanged.

**Proof:** the owner on his phone and a desktop browser (section 7). The coder makes **one** production sign-in with the fleet's test Google account if one exists, and none otherwise.

### C. Line (when the Channel ID and secret arrive)

**First, prove the route** on the published channel with the coder's own LINE test sign-in:
- **OIDC auto-discovery,** if Supabase accepts LINE's HS256 web ID token;
- **otherwise a manual OAuth2 provider** (LINE's authorization, token and profile endpoints) with `email_optional: true`.

**Ship only the one route that works.** No second route is kept. If neither works, **C is void:** report it with the error. The Line button then keeps its ruled not-ready state.

**Done when** (#1203):
- a person creates an account and signs in with Line from a phone on production;
- the button reads "LINEでログイン" on a Japanese-language browser and "Log in with LINE" otherwise, as LINE's guidelines give;
- **the linking rule** (the owner's answer to section 3, question 2) is written in the PR and on #1203.

**Proof:** the owner on his phone, and the investor-facing check in section 7.

### D. Apple (when the four Apple values arrive)

**The change:**
- enable Apple in the Supabase settings with the generated secret. **Its expiry date goes in the PR;**
- the button shows only under part A's rule.

**Done when** (#1205):
- a person on an eligible Apple browser signs in with Apple on production;
- the choice is hidden on an ineligible browser;
- cancelling and failure are visible;
- email remains.

**Proof:**
- part A's browser tests show both cases;
- the owner on his iPhone (section 7).

### E. ChatGPT "coming soon" (when the designer's mark arrives)

**The change:** the coming-soon state of the shared button, with the designer's mark and the given wording. **It starts no sign-in and calls no provider.**

**Done when** (#1183):
- the screen shows the button with the confirmed mark;
- tapping it shows the coming-soon wording;
- nothing else on the screen changes.

**Proof:** a browser test, and the designer's look at a screenshot.

## 5. #1184, the study's answer

**The coder posts one comment on #1184:**
- **a table of the six choices,** each with:
  - what is built;
  - cost (Google free; Line free; Apple $99 a year; Supabase custom providers within the free plan's three);
  - the exact owner-created accounts and keys (section 2), never values;
  - effort, display rule and blockers;
  - **documented versus tested,** each with its source URL and the date checked;
- **the build order:**
  1. A (the screen, visible failures, the handle step);
  2. Google;
  3. Line;
  4. Apple;
  5. ChatGPT placeholder.

  **Why this order:** Google serves every viewer and has the shortest setup. Line is the investor's choice but waits on LINE's approval. Apple serves only Apple browsers and has the costliest setup. Facebook is unchanged.
- **what the investor will see before the demo,** given which parts are done.

## 6. Checks, review, production

**Per PR:**
- **worktree** `/tmp/mfa-f63-<part>` from `origin/main`, with `npm ci`; branch `fix63/<part>-<word>`;
- `npx tsc --noEmit`, `npx eslint` on the changed files, the new tests, and every auth-related test file;
- **both suites once** with the built app (10 minutes each), against main's counts;
- **review:**
  - the reviewer seat, given the code and the issue;
  - then one PPLX review (AGY if PPLX is unavailable);
  - AGY on every new string.

**The report to the PM per PR:**
- the number, branch, final head (40 characters), checks, suites and reviews;
- what is proven locally;
- what waits on the owner.

**Production, after each PM merge order:**
- the deployment is READY, and `/api/health` returns 200 once;
- **for B, C and D,** the provider's settings are applied through the Management API (or the dashboard for a custom provider), and the settings are read back once without printing the secret;
- **at most one coder sign-in per provider,** with a fleet test account, never the owner's. Nothing else.

**Docs PR:** branch `docs/fleet63`, with this plan unchanged as `docs/plan-fleet63.md`. It merges after the last code PR.

## 7. What the owner checks (the PM relays it, in plain words)

After each provider's merge:
1. **On your iPhone, in Safari and in the home-screen app,** tap the provider and sign in. Do you come back signed in, inside the app? (B, C, D)
2. **Tap it and cancel.** Does the sign-in screen say it was cancelled? (A)
3. **The first time,** were you asked for a handle, and did Home open after it? (A)
4. **On a laptop in Chrome:** the Apple choice should not be there. On the iPhone it should. (D)
5. **Open the link from a LINE chat,** as the investor might. Does Line sign-in work there, and does Google? (C, B: the risk in section 1)

## 8. Stop

**When every part is merged, reported or reported blocked, send the PM one closing message:**
- each part's PR, its state and head, or its blocker and who holds it;
- the #1184 comment's link;
- Apple's secret expiry date, if D shipped;
- the owner checks still open;
- anything void.

**Then stop.**
