Triage reviewer: coder; reviewed head f24f5f672adf201ff73e046e8bf41e9d2b06da0f, Gemini 3.8 Flash via PPLX.

1. Not real — disabled native button cannot submit the form, and shared Button already defaults to type=button. Built browser click produced no request. Explicit type added for clarity.
2. Not real blocker — duplicate disabled classes are redundant, without behavioral defect. Removed as cleanup.
3. Not real blocker — client marker is unnecessary here. Removed.
4. Real — explanatory text was not associated with disabled control for assistive technology. Added aria-describedby and stable message id.

Real findings: 1; fixed in this commit, same-reviewer confirmation follows.
