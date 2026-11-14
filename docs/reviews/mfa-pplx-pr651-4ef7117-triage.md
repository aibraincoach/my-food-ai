Triage by coder, head 4ef71176147a40644ec571fd2d3d5daa9871ef21, model Gemini 4 Hydrogen (picker, request proof and footer agree).
1. ownRow parentElement fragility — Real (test-only, low; line 77 filters on the button's parent containing the question text).
2. Duplicate question text collision — Cannot tell (both posts use plate3.jpg 'a glass of beer', but whether the two generated questions are text-identical and co-present in the DOM is timing-dependent; first post is answered at lines 131-135 before the dismiss assert).
3. Unrestored window.fetch wrapper — Real (harmless; installed at line 79, never restored, nothing after it uses window.fetch).
4. Indentation style — Not real (repo uses compressed single-line style deliberately).
Real findings: 2
