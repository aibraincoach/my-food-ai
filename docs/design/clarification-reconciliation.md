# Clarification close and navigation reconciliation (#366)

The older frame 1-05 omits both the close control and the floating navigation pill. These omissions do not override the later approved navigation contract in [the round 3 plan, item 1](../plan.md): the pill sits above sheet scrims, and tapping it closes the sheet and navigates. Removing it from clarification would restore an older frame while breaking that explicit way home.

The current shared `Sheet` already renders an unboxed close icon: its button has a transparent background, no border, a 44 px hit area and a 22 px close glyph. `NeedsInputSheet` uses that shared control. A browser focus outline can surround its hit area while focused; this keyboard-navigation indicator is retained and is distinct from a filled close-button background. The originally reported boxed background is absent from the current page. No product change is needed for either reported difference.

## Actual page checks

Chrome at 390×844, designated test account 1, November 3, 2026. Existing multiple-choice clarification was opened without selecting an option or submitting an answer. Production looked the same before and after this reconciliation; no application code or stored question data was changed.

| Check | Result |
| --- | --- |
| Before, 09:19 UTC: close appearance | Transparent background; bare close icon, no box |
| Before: pill visibility and Home | Pill visible; Home closed the sheet |
| After reconciliation: close appearance | Still transparent and unboxed |
| After: Escape | Dismissed without answering |
| After: pill Home | Dismissed without answering |

The different question text, choice count and thumbnail are stored meal data, not layout regressions. The older reference's lack of navigation is intentionally superseded. Physical-phone and OS gesture behavior are not established by this emulated-browser check. Evidence remains in the Fleet 10 execution receipt; this reconciliation alone does not close the issue.
