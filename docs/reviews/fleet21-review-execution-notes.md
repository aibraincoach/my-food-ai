# Fleet 21 external-review evidence

PPLX ran through the original authenticated Firefox profile on display :10, BiDi port 9223. The unrelated browser on port 42947 was left alone. The reviewer was the offered Gemini 4 Hydrogen model; valid receipts match picker, `model_preference=gemini4hydrogen`, and completed answer footer. Every submission was exactly `code review <PR URL>`. No AGY or Codex review fallback was used. Codex performed source-backed triage only.

The first #909 attempt was rejected with WRONG MODEL because the repository runner recorded a transient generic picker label, `Model`, while the request and answer named Gemini 4 Hydrogen. That attempt is not a valid review. An external temporary runner waits for the actual model label and retains the request-proof check.

The first 15-tab batch exhausted the repository runner's per-tab 120-second automation windows during cumulative setup and submission. Its failed captures and terminal claim records are not review clearance. A temporary external adaptation submits each ready tab and starts answer polling immediately while later tabs open, retaining current-head, Vercel-success, claim, memory, and model gates.

The next batch exposed another runner limitation: Perplexity's `Finished` marker marks the research phase and can appear while answer text is still streaming. Short stable snapshots were truncated. Every original live thread was therefore re-inspected without resubmission. Activating the background tabs flushed their completed answer text. All fifteen complete captures showed answer Copy/Helpful controls, no Stop response control, and matching model proof. Corrected complete receipts explicitly supersede earlier truncated snapshots. The original runner's exit 2 is retained as an automation result, not represented as exit 0.

Subsequent confirmations require completed-answer Copy/Helpful controls and absence of Stop response before capture. No repository tooling was modified for these adaptations.

The complete initial reviews found two source-confirmed issues: #909's cache could survive a client-side identity change; #911 placed the new recorder/status inside Search's fixed-height input label. Their fixes received new-head PPLX confirmation. The #911 confirmation found the related non-wrapping drink-field recording/status row, which also received a correction and new-head confirmation. Full per-head findings and triage remain in their respective capture files.

Review evidence is collected on the fleet docs branch instead of mutating each reviewed product head with a receipt-only commit. This preserves the exact reviewed product head and avoids an endless receipt-commit/review cycle. The final docs-head review stays on GitHub and in its external capture after all required evidence is committed. Review clearance does not authorize any merge.
