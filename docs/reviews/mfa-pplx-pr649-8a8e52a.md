Head at submission: 8a8e52a94f08f81dc334640f498465448b21c411
Model proof: model_preference = gemini4hydrogen
Model picker at submission: Gemini 4 Hydrogen
Elapsed since Enter: 22.6s
Elapsed since tab open: 26.2s
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/649

Answer
Links
Images
Share
11:03 AM

code review 
 aibraincoach/my-food-ai#649

Finished
13s

PR #649 (docs(run18): fleet receipt, PPLX artifacts, Perplexity runner fix) is already merged into main [github_mcp_direct]. Most of the 38 changed files are Run 18 evidence and review artifacts, with one code change in tools/pplx-review.mjs [github_mcp_direct].

Tooling changes in tools/pplx-review.mjs

The runner updates the Perplexity UI selectors to handle #ask-input fallbacks ([aria-label="Ask anything…"], main [role="textbox"], main [contenteditable="true"]) and adds a 4-second wait loop in ensureModel for the model selector button to appear [github_mcp_direct].

Potential $ corruption in typePrompt: ASK_INPUT_FOCUS.replace("PROMPT_PLACEHOLDER", JSON.stringify(tab.prompt)) uses a string replacement [github_mcp_direct]. In JavaScript, String.prototype.replace interprets $$, $&, $', and $` in the replacement string as special patterns. If tab.prompt ever contains those sequences, the injected JavaScript will be corrupted. Use a replacer function instead: .replace("PROMPT_PLACEHOLDER", () => JSON.stringify(tab.prompt)).

Redundant branch in ensureModel: The wait loop checks if (label === WANT) break; immediately followed by if (label) break; [github_mcp_direct]. Since any truthy WANT satisfies if (label), the first if is redundant and can be removed.

Duplicated selector list: The 4-selector fallback for the ask input is repeated across ASK_INPUT_PROBE, ASK_INPUT_FOCUS, and boxText inside typePrompt [github_mcp_direct]. Extracting a shared selector helper string would keep them from drifting.

Documentation and review artifacts

The PR adds Fleet 18 completion receipts (docs/evidence/run18/fleet18-final.md, data-audit.json, investigation-571.md) and PPLX review captures/triage notes for PRs #633–#648 [github_mcp_direct].

Truncated review captures: Several captured markdown files (including mfa-pplx-pr636-537bb79.md, mfa-pplx-pr637-bf5724e.md, mfa-pplx-pr638-e31a6e8.md, mfa-pplx-pr639-7ffa8de.md, mfa-pplx-pr641-a50674c.md, and mfa-pplx-pr643-53c5650.md) cut off mid-sentence before the full findings were rendered, while their corresponding -triage.md files mark Real findings: 0 [github_mcp_direct]. If these are used for auditability, those captures are incomplete.

Show me how to fix the String replace issue
Explain the redundant branch in ensureModel
Help me extract the duplicated selectors into a helper
Review the evidence files in docs evidence run18
Check the triage status of the PPLX artifacts
Sources
⠇
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen