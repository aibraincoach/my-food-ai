Triage reviewer: Codex lane E; reviewed head 3c5d55a9f6e134f29273413e166addebcea6021a
1. Real — the feed page is newest-first, while getDays orders Today oldest-first. Seeded Today therefore reversed its list on its first refresh. Sort seeded ready posts by eaten_at ascending and id ascending, matching getDays. A data-rule regression uses an intentionally descending input with an equal-time tie and asserts the stable chronological order.
Real findings: 1
