Triage reviewer: Codex source verification; head 0dd05b8c1f6cf157740c026b9e9c04cacb7eaad1
Not real: null hints_seen spread. Migration 0013_profiles_hints.sql declares hints_seen text[] NOT NULL DEFAULT '{}'; the query cannot return a null column for an existing profile.
Real: the module-level profile promise survives client-side sign-out/sign-in and is not keyed to the current identity. src/lib/auth/actions.ts uses server-action redirects; media-session.ts explicitly supports new cookie identities on INITIAL_SESSION. A different account can reuse the old hint state. Fix required on a new reviewed head.
Not real: retaining dismissHint as an intentional user-action server call is outside the mount-triggered reread defect and preserves persistence.
Real findings: 1
