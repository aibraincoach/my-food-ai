Lane J: #611. Stored dimensions flow through feed slides and determine immediate/full photo boxes. Responsive image srcSet/fallback remains intact. Desktop window additionally respects available viewport width at 1024px.

Validation: production build passed; 24 targeted feed/detail/cache tests passed; scoped lint clean. Independent self-review found no concrete blocker.

M9: production missing-photo-size count before 0, after 0. Guarded apply performed no row writes.

M10: combined local production build, disposable account2 fixtures. Phone390x844 portrait opening frame390x520 and detail390x520; landscape390x292.5 both. Desktop1280x800 portrait opening frame510x680 and detail510x680; landscape640x480 both. Images exactly fill their boxes with natural aspect ratio, no crop/bars. Direct URLs: phone portrait390x520, landscape390x292.5; desktop full-page detail portrait480x640 (80dvh cap), landscape640x480. No in-memory opening frame on direct URLs. All observed immediate-frame heights remained unchanged until detail replaced them.

Driver correction: first run waited for hidden readiness marker to become visible, timed out30s; corrected to wait for attached marker. Second run passed. No code change from driver issue.
