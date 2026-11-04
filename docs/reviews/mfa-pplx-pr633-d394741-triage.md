PPLX triage · head d3947416ac606cce6e390af1d17c6a25a6547ac5

Real — rice composition ran on any protein dish without a rice cue: fixed at d3947416 by gating `composeRiceWithProtein` on rice/sushi/bowl keywords in name+caption.

Real — `referenceProteinMismatch` used a shorter protein list in USDA descriptions: fixed at d3947416 by reusing `PROTEIN_WORDS` for description scans.

Not real — remaining PPLX notes (performance, word-boundary edge cases) are advisory; no blocking defect identified on this head after the fixes.

Real findings: 0
