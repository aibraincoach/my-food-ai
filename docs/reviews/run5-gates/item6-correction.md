# item6-correction

```json
{
  "head": "9ca8cf6894f4f948a9da051165d9c40bbbd9a16b",
  "results": [
    {
      "name": "added-photo-no-text",
      "sourceItems": 1,
      "allowedIndices": [
        null,
        0
      ],
      "status": "completed",
      "ms": 11125,
      "output": {
        "items": [
          {
            "keep": "pasta",
            "name": "plain spaghetti",
            "portion_grams": 200,
            "portion_text": "about 200 grams",
            "region_index": 0
          },
          {
            "keep": null,
            "name": "scrambled eggs",
            "portion_grams": 150,
            "portion_text": "about 150 grams",
            "region_index": null
          },
          {
            "keep": null,
            "name": "toasted white bread",
            "portion_grams": 60,
            "portion_text": "2 slices",
            "region_index": null
          }
        ],
        "needs_input": null,
        "reply": "Kept the spaghetti and added scrambled eggs and toast from the second photo."
      },
      "pass": true
    },
    {
      "name": "first-clarification",
      "sourceItems": 0,
      "allowedIndices": [
        null
      ],
      "status": "completed",
      "ms": 9284,
      "output": {
        "items": [
          {
            "keep": null,
            "name": "plain spaghetti",
            "portion_grams": 200,
            "portion_text": "about 200 grams",
            "region_index": null
          }
        ],
        "needs_input": null,
        "reply": "Logged the plain spaghetti about 200 grams."
      },
      "pass": true
    },
    {
      "name": "portion-correction",
      "sourceItems": 2,
      "allowedIndices": [
        null,
        0,
        1
      ],
      "status": "completed",
      "ms": 5766,
      "output": {
        "items": [
          {
            "keep": null,
            "name": "plain spaghetti",
            "portion_grams": 150,
            "portion_text": "150 grams",
            "region_index": 0
          },
          {
            "keep": "coffee",
            "name": "black coffee",
            "portion_grams": 240,
            "portion_text": "one cup",
            "region_index": 1
          }
        ],
        "needs_input": null,
        "reply": "Updated spaghetti to 150 grams."
      },
      "pass": true
    }
  ],
  "pass": true,
  "calls": 3,
  "elapsedMs": 26948
}
```
