# item6-identify

```json
{
  "head": "9ca8cf6894f4f948a9da051165d9c40bbbd9a16b",
  "fixture": "eval/photos/03.jpg",
  "fullMeal": false,
  "calls": [
    {
      "model": "sam-3.1",
      "format": null,
      "cap": null,
      "http": 200,
      "ms": 741
    },
    {
      "model": "muse-spark-1.3",
      "format": "identify",
      "cap": 8192,
      "http": 200,
      "status": "completed",
      "incomplete_reason": null,
      "input_tokens": 3648,
      "output_tokens": 1792,
      "reasoning_tokens": 1040,
      "output_chars": 2198,
      "ms": 13157
    },
    {
      "model": "muse-spark-1.3",
      "format": "search_query",
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "incomplete_reason": null,
      "input_tokens": 1072,
      "output_tokens": 687,
      "reasoning_tokens": 619,
      "output_chars": 277,
      "ms": 5597
    }
  ],
  "regions": 47,
  "items": [
    {
      "name": "tuna hosomaki sushi rolls",
      "portion_estimate_g": 140
    },
    {
      "name": "cucumber hosomaki sushi rolls",
      "portion_estimate_g": 100
    },
    {
      "name": "pickled ginger",
      "portion_estimate_g": 15
    },
    {
      "name": "tuna nigiri sushi",
      "portion_estimate_g": 90
    },
    {
      "name": "squid nigiri sushi",
      "portion_estimate_g": 90
    },
    {
      "name": "cooked shrimp nigiri sushi",
      "portion_estimate_g": 90
    },
    {
      "name": "surf clam nigiri sushi",
      "portion_estimate_g": 90
    },
    {
      "name": "octopus nigiri sushi",
      "portion_estimate_g": 60
    },
    {
      "name": "sweet shrimp nigiri sushi",
      "portion_estimate_g": 60
    },
    {
      "name": "white fish nigiri sushi",
      "portion_estimate_g": 90
    },
    {
      "name": "scallop nigiri sushi",
      "portion_estimate_g": 60
    },
    {
      "name": "salmon nigiri sushi",
      "portion_estimate_g": 60
    },
    {
      "name": "tamago nigiri sushi",
      "portion_estimate_g": 80
    },
    {
      "name": "eel nigiri sushi",
      "portion_estimate_g": 60
    },
    {
      "name": "salmon roe gunkan sushi with cucumber",
      "portion_estimate_g": 60
    },
    {
      "name": "minced tuna gunkan sushi",
      "portion_estimate_g": 80
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
  "elapsed_ms": 21320,
  "usda_requests": 0,
  "reserved_output_tokens": 12288
}
```
