Triage reviewer: Codex source verification; head 5df965db3b30799e0bf6cb097e22ea04702ec59e
Real: VoiceButton is nested in SearchBox's fixed-height h-tap/desktop:h-12 label. VoiceRecorder renders full-width status/error content there, so the new control can overflow the field and its button becomes a second labelable descendant. Move it outside the input label and allow status/error below the bar.
Not real: sibling placement below CaptureSheet/LightComposer fields is inherently broken. Those containers allow flow layout; the required page look verifies the chosen placement.
Not real: optional postId weakens ownership checks for named posts. The route still validates UUID/ownership whenever postId is present and keeps sign-in and per-user limits.
Real findings: 1
