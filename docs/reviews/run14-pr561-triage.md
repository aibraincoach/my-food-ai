Triage reviewer: Codex coder; reviewed head 30b574601998dceb0073c64636e7a43396a3bb36.

Real — P1 unknown-portion model estimates could not recover after a portion correction. scaleNutrition previously replaced every nutrient value with null and the nonnumeric-source guard prevented reconstruction. Fixed at c2ddfb2cd09db1f15ed06a728c25831cbaf0ee41: immutable per-100 g reference values now travel inside estimate provenance, separate from consumed amounts. Shared stored rescaling reconstructs the reference for both normal portion edits and correction replay. Legacy missing references request fresh resolution. Regression covers null/zero→known and known→unknown→known with values, source identity and model-estimate disclosure; focused suite 12/12 passes.

Validation gap — The initial live provider smoke recorded its base HEAD before the code was committed and its cendol case selected closest USDA; it did not prove a successful estimate. The separate real Meta/disposable PostgREST reanalysis receipt explicitly documents forced-empty USDA, numbers and estimate disclosure, with verified cleanup. It is evidence of the estimate path, not proof that live USDA lacks cendol. Full suite and DB gate passed before the recovery fix; final combined validation must include the revised code.

The first capture timed out after returning this actionable finding. It is not a counting zero-blocker review. Exact-head confirmation remains required on the revised head. Independent lane C source review at c2ddfb2c found no blockers; that is supplementary only.

Real findings: 1

Follow-up triage reviewer: Codex coder; reviewed head c2ddfb2cd09db1f15ed06a728c25831cbaf0ee41.

Real — P2 volume-only edits called the same rescaler with milliliters, so per-100 g reconstruction could invent mass and consumed numbers. Fixed at 377df937: ratio-only rescaleStoredAmounts is now explicit for the milliliter caller; rescaleStoredNutrition reconstructs only gram-reference edits. Regressions cover unknown-mass 100 ml→100 ml/200 ml staying unavailable and known consumed amounts scaling only by their volume ratio. Focused estimate/portion/nutrition suite 13/13 passes, TypeScript and focused ESLint pass. Final combined full-suite evidence remains the integration run's responsibility.

Real findings in follow-up: 1
