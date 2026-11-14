Triage by coder, head ff3d010d489c21593cada2bd373e00819de3f0f9, model Gemini 4 Hydrogen (picker, request proof and footer agree).
1. Docs-only exemption does not apply (tools/pplx-review.mjs changed in a docs PR) — Real (process; the runner fix could not wait for a code fleet and is reviewed here).
2. Four changesets bundled in one PR — Real (process; kept together because the review evidence belongs with the procedure it ran under).
3. itemAny page-wide fallback could click a non-menu element — Real (fixed after this review: picks scoped to [role=menu]/[role=listbox]).
4. Substring model check could collide on short slugs — Real (fixed after this review: containment needs the shorter side >= 6 chars).
5. BACKLOG.md footer fused with a #689 fragment — Real (assembly error; footer rewritten to the supplied text, verified clean).
6. PM pack structure — Not a defect (well-formed, claims marked UNRUN).
Real findings: 5 (3, 4, 5 fixed after this review; 1, 2 accepted process notes)
