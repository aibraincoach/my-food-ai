# My Food AI

Hackathon codebase for My Food AI (becomes My Fitness AI after the event). GitHub: [aibraincoach/my-food-ai](https://github.com/aibraincoach/my-food-ai).

## Start here

- [CLAUDE.md](CLAUDE.md) — agent and coder rules
- [BACKLOG.md](BACKLOG.md) — ordered work list
- [REVIEW_POLICY.md](REVIEW_POLICY.md) — PPLX → AGY → Codex review order

## Agent skills

Procedures live under `skills/`:

- `pm-handover` — reconcile docs and package a PM replacement zip
- `pplx-review` — Perplexity / Firefox BiDi batch reviews
- `agy-review` — Antigravity CLI reviews with full diff coverage
- `codex-review` — Codex CLI fallback reviews

Run offline AGY fixture tests: `node scripts/review/agy-review.test.mjs`.

## Database

See [docs/database-before-wipe.md](docs/database-before-wipe.md) for the pre-hackathon Supabase wipe record.
