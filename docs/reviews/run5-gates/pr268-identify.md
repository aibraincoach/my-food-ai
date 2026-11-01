# PR 268 — Required identify and frozen-matcher gate

Final reviewed source head `4a5c8cb57899e3a403efb5e286212067eb4fff8c`.

```json
{
  "head": "4a5c8cb57899e3a403efb5e286212067eb4fff8c",
  "fixture": "eval/photos/03.jpg",
  "fullMeal": false,
  "calls": [
    {
      "model": "sam-3.1",
      "format": null,
      "cap": null,
      "http": 200,
      "ms": 1117
    },
    {
      "model": "muse-spark-1.3",
      "format": "identify",
      "cap": 8192,
      "http": 200,
      "status": "completed",
      "incomplete_reason": null,
      "input_tokens": 3648,
      "output_tokens": 2229,
      "reasoning_tokens": 1574,
      "output_chars": 1874,
      "ms": 32214
    },
    {
      "model": "muse-spark-1.3",
      "format": "search_query",
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "incomplete_reason": null,
      "input_tokens": 1072,
      "output_tokens": 1788,
      "reasoning_tokens": 1691,
      "output_chars": 401,
      "ms": 11190
    }
  ],
  "regions": 47,
  "items": [
    {
      "name": "Tuna hosomaki rolls",
      "portion_estimate_g": 140
    },
    {
      "name": "Cucumber hosomaki rolls",
      "portion_estimate_g": 100
    },
    {
      "name": "Tuna nigiri",
      "portion_estimate_g": 120
    },
    {
      "name": "Squid nigiri",
      "portion_estimate_g": 120
    },
    {
      "name": "Cooked shrimp nigiri",
      "portion_estimate_g": 90
    },
    {
      "name": "Surf clam nigiri",
      "portion_estimate_g": 90
    },
    {
      "name": "White fish nigiri",
      "portion_estimate_g": 120
    },
    {
      "name": "Octopus nigiri",
      "portion_estimate_g": 60
    },
    {
      "name": "Salmon nigiri",
      "portion_estimate_g": 60
    },
    {
      "name": "Scallop nigiri",
      "portion_estimate_g": 90
    },
    {
      "name": "Tamago nigiri",
      "portion_estimate_g": 80
    },
    {
      "name": "Salmon roe gunkan with cucumber",
      "portion_estimate_g": 60
    },
    {
      "name": "Minced tuna gunkan",
      "portion_estimate_g": 100
    },
    {
      "name": "Pickled ginger",
      "portion_estimate_g": 20
    }
  ],
  "match": {
    "name": "ham",
    "searches": [
      "ham"
    ],
    "selected": {
      "id": 2073255,
      "description": "HAM"
    }
  },
  "pass": true,
  "elapsed_ms": 46600,
  "usda_requests": 0,
  "reserved_output_tokens": 12288
}
```
