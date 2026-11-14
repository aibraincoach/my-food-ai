Triage by coder, head 85487ed63235f32fbf84e147461548e5e7cbad4, model Gemini 4 Hydrogen (picker, request proof and footer agree).
1. Question push not gated on hasNotEaten (persist.ts line 138 sends question push while markReady notify is false) — Cannot tell (unclear whether a question push should fire for not-eaten posts; needs product ruling).
2. Partial commit when mark_post_ready returns false — Real (persist_approximated_analysis at 0059 line 11 stays committed while question/comments are skipped; return false does not roll back).
3. Empty question string passes the function check — Real (minor; only null/non-object rejected, '' would insert).
4. Single-line formatting — Not real (repo convention).
Real findings: 2
