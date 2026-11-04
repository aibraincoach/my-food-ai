# Issue 499: installed Next.js instant config

Read on 2026-11-04 against main `6fd863e3348dfad7b6ddb16d6216a5006e82f8bf`.

- package.json and installed node_modules/next/package.json both name Next.js16.4.3.
- next.config.ts enables cacheComponents and partialPrefetching.
- Installed framework documentation: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md`. Its Reference / Disabling instant sections describe `instant` as route-segment navigation validation config, enabled with cacheComponents; false opts out of instant validation and allows the segment to block. It also affects static-shell validation according to the highest config in the route tree.
- src/app/posts/[id]/page.tsx exports instant=false.

The premise that Next ignores this export is false for the installed version/configuration. Fleet12 retains the flag. This fact does not prove a detail timing improvement or resolve the owner's phone acceptance. Issue499 stays open per dispatch.
