Coder triage for PR #547 at 8bff5d10d7267c1f88ea3d463c6cc386e8017bec. PPLX final footer is GPT-6.1 Sol, accepted by the dispatched Fleet13 ChatGPT override. The complete same-thread response was read without resubmitting after the initial runner capture ended early.

Previous P2 at d5aacb5: equality-only rollback could erase a same-value later edit. Fixed: an AFTER UPDATE trigger invalidates migration provenance for any subsequent write. The regression covers same-value edits and edit-away-and-back. Final review explicitly approves with no blockers.

Operational limit retained: updating an unrelated nutrition field also invalidates rollback provenance; rollback conservatively preserves its sugar instead of reversing it. This protects subsequent data writes and is intentional. Production application/readback is required before closure.
Real findings: 1 (fixed)
