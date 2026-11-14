Triage by coder, head 12901df35faccb08c8ae40142071d7eea370e1a8, model Gemini 4 Hydrogen (picker, request proof and footer agree).
1. usePostAuthor own-branch handle can evaluate to undefined while the bottom fallback returns '' — Real (trivial type-shape nit).
2. notify() after store.remove delays UI on slow removals — Not real (matches prior behavior; no rollback notification needed).
Real findings: 1
