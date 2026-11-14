Triage by coder, head 2dedf0e5ef2abeb325c80a80681816ec41b6bbc9, model Gemini 4 Hydrogen (picker, request proof and footer agree).
1. Race on concurrent same-operationId reservations — Real (low severity; two concurrent POSTs can both pass the drafts/posts check before either reserves).
2. Unthrottled 400s after capUser moved past validation — Real (design observation; connects to owner ruling #716 on the cap rule).
3. Silent DB read errors — Not real as a defect (fail-closed intent is documented in the code comment; logging suggestion noted).
4. Single-line formatting — Not real (repo convention).
Real findings: 2
