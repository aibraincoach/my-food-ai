# Run 5 exact-head review receipts

The current entries name the heads actually merged. Earlier receipts are retained as history. Every merge separately passed its current-head, clean mergeability and green-check gates.

```json
{
  "reviewer": "Gemini 3.8 Flash via Perplexity",
  "note": "Exact-head independent review ledger including owner-requested label-read availability defect PR267. Separate full-suite, mergeability and deployment gates still apply; reviewed heads must match current remote heads before each merge. The review operator performed no code changes, DB tests, migrations or merges.",
  "receipts": [
    {
      "pr": 259,
      "reviewedHead": "8135e33d48368b8c1af1823d59d9ef1a538836df",
      "verdict": "BLOCKERS: NONE",
      "receipt": "https://github.com/aibraincoach/my-food-ai/pull/259#issuecomment-6552582433"
    },
    {
      "pr": 260,
      "reviewedHead": "d78ce82fe72e0f7298ef4d05f469d1a71bbb5b92",
      "verdict": "BLOCKERS: NONE",
      "receipt": "https://github.com/aibraincoach/my-food-ai/pull/260#issuecomment-6553263748"
    },
    {
      "pr": 261,
      "reviewedHead": "8a8f27b453534e9bdd4d1f4f6c240a0ea59bee6c",
      "verdict": "BLOCKERS: NONE",
      "receipt": "https://github.com/aibraincoach/my-food-ai/pull/261#issuecomment-6552661528"
    },
    {
      "pr": 262,
      "reviewedHead": "c479f5f6ff290b692c418453d066737916d1165b",
      "verdict": "BLOCKERS: NONE",
      "receipt": "https://github.com/aibraincoach/my-food-ai/pull/262#issuecomment-6557048729",
      "previousReceipt": {
        "reviewedHead": "4ebfd54f62ac5da44279fe0df66f707a2fa285b2",
        "receipt": "https://github.com/aibraincoach/my-food-ai/pull/262#issuecomment-6552792305"
      }
    },
    {
      "pr": 263,
      "reviewedHead": "e68c45e50a1e2ee8e429bf2aced5a2231048790d",
      "verdict": "BLOCKERS: NONE",
      "receipt": "https://github.com/aibraincoach/my-food-ai/pull/263#issuecomment-6557089749",
      "previousReceipt": {
        "reviewedHead": "a80aa9f9ddcc79605e782c72d20be05f4e2360dc",
        "receipt": "https://github.com/aibraincoach/my-food-ai/pull/263#issuecomment-6553271037"
      }
    },
    {
      "pr": 264,
      "verdict": "BLOCKERS: NONE",
      "reviewedHead": "10bf343bce44ec40998038dc62471900663b900e",
      "receipt": "https://github.com/aibraincoach/my-food-ai/pull/264#issuecomment-6557186674",
      "previousReceipt": {
        "reviewedHead": "b649bbce507eb1c36d55e1af71c0429a81b3d82d",
        "receipt": "https://github.com/aibraincoach/my-food-ai/pull/264#issuecomment-6553316534"
      }
    },
    {
      "pr": 265,
      "reviewedHead": "a4ad37472693e9bc2e5586048975187002881dcd",
      "verdict": "BLOCKERS: NONE",
      "receipt": "https://github.com/aibraincoach/my-food-ai/pull/265#issuecomment-6557186837",
      "previousReceipt": {
        "reviewedHead": "9ca8cf6894f4f948a9da051165d9c40bbbd9a16b",
        "receipt": "https://github.com/aibraincoach/my-food-ai/pull/265#issuecomment-6553327015"
      }
    },
    {
      "pr": 267,
      "reviewedHead": "154f2f8f410516f0f3a41ed647c4385788335c08",
      "verdict": "BLOCKERS: NONE",
      "receipt": "https://github.com/aibraincoach/my-food-ai/pull/267#issuecomment-6557187001",
      "previousReceipt": {
        "reviewedHead": "b5410deb098cc4d6924a8e4296f093fc7203accb",
        "receipt": "https://github.com/aibraincoach/my-food-ai/pull/267#issuecomment-6556995338"
      }
    },
    {
      "pr": 268,
      "reviewedHead": "4a5c8cb57899e3a403efb5e286212067eb4fff8c",
      "verdict": "BLOCKERS: NONE",
      "receipt": "https://github.com/aibraincoach/my-food-ai/pull/268#issuecomment-6557476886",
      "triage": "https://github.com/aibraincoach/my-food-ai/pull/268#issuecomment-6557477009"
    }
  ]
}
```
