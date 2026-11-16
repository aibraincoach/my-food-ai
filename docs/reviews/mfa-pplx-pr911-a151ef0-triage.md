Triage reviewer: Codex source verification; head a151ef033c670613ccabbeb8fd6b39fc4e17b662
Real, nonblocking: existing caption append can preserve/add extra whitespace; it does not discard a transcript and is outside the automatic-switch fix.
Real, nonblocking: CaptureSheet permits typing during capture while the other composers disable it. The existing latest-value ref keeps appended text; UI consistency is not changed here.
Coverage limit: the new regression exercises drink detection during recording and transcription, simulates unmount cleanup, and fails without the surface guard. Direct camera-caption runtime and real microphone/provider speech remain unverified.
Blocking findings: 0
Real findings: 2 (nonblocking observations retained)
