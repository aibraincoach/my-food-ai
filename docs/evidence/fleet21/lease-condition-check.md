# PR914 conditional worker verification

The investigation left operational takeover verification conditional: after a worker is killed mid-job, the next eligible queued job must start within the sixty-second lease plus one worker wake. It did not independently rerun the builder's retained 59.98714-second measurement. It also distinguished this from the killed job's unchanged 360-second abandoned-job recovery; accepted heartbeat failure can permit overlapping workers, while SKIP LOCKED claims remain in force.

On the existing disposable loopback backend, with worker source at b91220b364b89d0b1eae4fab80d058d4ce90fc63 (the original worker patch rebased on main 8914b3e6), a newly posted real local meal entered a running job. Only the scripted model was paused to hold it. The owned application group was killed with SIGKILL, the same build restarted and a second meal posted. The second job started 59.977016 seconds after the kill, with one explicit worker wake after lease expiry.

The model was resumed; both owned application groups stopped; the two measurement posts deleted; only observed measurement lease holders released. The backend already existed. No migration, production row or production process was touched.

All 13 targeted worker cases pass (worker-execution-budget, worker-recovery-wake, worker-safety and empty-job-claim). Production-mode build and a separate no-emit TypeScript check pass. Worker/queue source did not need another behavioral change to satisfy this measurement; this commit adds its evidence after rebasing onto current main. The default lease, heartbeat 20-second cadence, ownership-checked renewal and 360-second orphan recovery retain their documented behavior.

This is the correcting coder's fresh measurement, not an independent runtime execution. The new full head still requires its own independent read and an explicit merge order. It is not merged by this report.
