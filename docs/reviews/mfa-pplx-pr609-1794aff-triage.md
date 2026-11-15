Triage by coder, head 1794affa85fd8f68bbf5c4c0e636fc92716caf22, model Gemini 4 Hydrogen (request proof and footer agree).
1. Fixed 24px gutter added to scaled padding — Not real (explicit, reasoned tradeoff).
2. SSR flash: gutter 0 on server, 24 after hydration on desktop (useDesktop server snapshot is false) — Real (minor, verified mechanism; purely visual).
3. Single-slide desktop cards get the gutter too — Not real (explicit tradeoff, harmless).
Real findings: 1
