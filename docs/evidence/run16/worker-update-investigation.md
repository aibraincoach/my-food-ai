# M3 second-reading investigation

Read-only investigation; no registration.update(), reload, hard refresh, production writes, or new test run performed.

Observed report evidence: baseline worker version1 self.BUILD3de232f7e8dbf416db44d8d30985d264bed03a30 installed and activated with the same global CDP auto-attach instrumentation. After the next one-normal-load operation, documentdf582d017e0e6f020f03efb949579bdf18199d43 appeared, but repeated target enumeration and Runtime self.BUILD readings retained only activated version1/build3de. Registration installing/waiting were null. No new version2 was recorded. This does not prove worker-driven replacement; the existing shell refresh can explain document advancement.

No concrete instrumentation defect was identified. The working baseline update is direct counterevidence to a claim that CDP attachment categorically disables updates. Duplicate auto-attach sessions do not explain the absence of any new browser worker-version event.

Primary Chromium source inspected:

- https://github.com/chromium/chromium/blob/main/content/browser/service_worker/service_worker_version.cc — OnRequestTermination around670 keeps an idle worker alive while DevTools is attached; ScheduleUpdate around704 starts/resets its update timer without a debugger guard.
- https://github.com/chromium/chromium/blob/main/content/renderer/service_worker/service_worker_provider_context.cc — DispatchNetworkQuiet around314 calls HintToUpdateServiceWorker around336.
- https://github.com/chromium/chromium/blob/main/content/browser/service_worker/service_worker_client.cc — HintToUpdateServiceWorker around227 clears versions_to_update_; its destructors notify versions to update.
- https://github.com/chromium/chromium/blob/main/content/browser/service_worker/service_worker_controllee_request_handler.cc — MaybeScheduleUpdate around124 states window navigation update logic waits for the renderer HintToUpdateServiceWorker message.

Inference, not a measured cause: network-quiet scheduling can affect update timing. There is no captured network-idleness/renderer-hint trace proving that cause here. DevTools affects worker lifetime, but this source inspection did not establish that it prevented the observed update check.

Conclusion: M3 worker mechanism acceptance remains failed/unproven. Keep #598 open and record the exact production outcome. Do not claim a general Chrome imported-script comparison failure, and do not restart merely to seek a passing reading.
