Triage reviewer: Codex source verification; head 8b5d99e941273e4f3e439f4480cd097dc8583bf6
Not real: the related Search and Intake recording/status layouts remain unfixed. The reviewer confirms contents plus flex-wrap and order-last permit the existing VoiceRecorder fragment's full-width status/error rows below the input controls. Source matches both corrections.
Not real: a hypothetical future VoiceRecorder wrapper breaks this head. The current component returns the required fragment; a future component change is outside this diff.
Not real: no-op onActiveChange is an authorization/data-rule defect in this change. The dispatched VoiceButton explicitly uses it; users can submit their current typed value, while VoiceRecorder cleans up on unmount. Blocking submission during recording is an optional behavior change the reviewer labels low risk, not a blocker.
Not real: access tests trigger paid transcription or omit supplied-post authorization. Every fixture request stops before transcription, and the supplied-post ownership matrix is retained.
Real findings: 0
