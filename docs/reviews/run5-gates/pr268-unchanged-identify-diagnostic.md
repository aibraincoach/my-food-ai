# Additional unchanged identification diagnostic — FAILED 9/10

Retained failed result on `eab401e2b9601073092cc2ad9a4da5e5c67210dd`, before later test-only commits. SAM, identify, prompts and model client are byte-identical to production e442. This check is not represented as passing and was not retried for green. The required affected reference gates passed separately. [Observation on open issue #189](https://github.com/aibraincoach/my-food-ai/issues/189#issuecomment-6557424637); [independent assessment](https://github.com/aibraincoach/my-food-ai/pull/268#issuecomment-6557476886) found no introduced blocker in the reference-retrieval change. No fixture, quality threshold or model budget was weakened.

```json
{
  "head": "eab401e2b9601073092cc2ad9a4da5e5c67210dd",
  "calls": [
    {
      "model": "sam-3.1",
      "cap": null,
      "effort": null,
      "ms": 731
    },
    {
      "model": "muse-spark-1.3",
      "cap": 8192,
      "effort": "low",
      "status": "completed",
      "outputTokens": 951,
      "reasoningTokens": 824,
      "ms": 5100
    },
    {
      "model": "sam-3.1",
      "cap": null,
      "effort": null,
      "ms": 412
    },
    {
      "model": "muse-spark-1.3",
      "cap": 8192,
      "effort": "low",
      "status": "completed",
      "outputTokens": 349,
      "reasoningTokens": 276,
      "ms": 2744
    },
    {
      "model": "sam-3.1",
      "cap": null,
      "effort": null,
      "ms": 1206
    },
    {
      "model": "muse-spark-1.3",
      "cap": 8192,
      "effort": "low",
      "status": "completed",
      "outputTokens": 2178,
      "reasoningTokens": 1403,
      "ms": 10018
    },
    {
      "model": "sam-3.1",
      "cap": null,
      "effort": null,
      "ms": 383
    },
    {
      "model": "muse-spark-1.3",
      "cap": 8192,
      "effort": "low",
      "status": "completed",
      "outputTokens": 409,
      "reasoningTokens": 318,
      "ms": 4021
    },
    {
      "model": "sam-3.1",
      "cap": null,
      "effort": null,
      "ms": 357
    },
    {
      "model": "muse-spark-1.3",
      "cap": 8192,
      "effort": "low",
      "status": "completed",
      "outputTokens": 968,
      "reasoningTokens": 847,
      "ms": 5338
    },
    {
      "model": "sam-3.1",
      "cap": null,
      "effort": null,
      "ms": 324
    },
    {
      "model": "muse-spark-1.3",
      "cap": 8192,
      "effort": "low",
      "status": "completed",
      "outputTokens": 1025,
      "reasoningTokens": 895,
      "ms": 4627
    },
    {
      "model": "sam-3.1",
      "cap": null,
      "effort": null,
      "ms": 283
    },
    {
      "model": "muse-spark-1.3",
      "cap": 8192,
      "effort": "low",
      "status": "completed",
      "outputTokens": 1550,
      "reasoningTokens": 1470,
      "ms": 8054
    },
    {
      "model": "sam-3.1",
      "cap": null,
      "effort": null,
      "ms": 332
    },
    {
      "model": "muse-spark-1.3",
      "cap": 8192,
      "effort": "low",
      "status": "completed",
      "outputTokens": 656,
      "reasoningTokens": 562,
      "ms": 3548
    },
    {
      "model": "sam-3.1",
      "cap": null,
      "effort": null,
      "ms": 454
    },
    {
      "model": "muse-spark-1.3",
      "cap": 8192,
      "effort": "low",
      "status": "completed",
      "outputTokens": 1010,
      "reasoningTokens": 865,
      "ms": 5039
    },
    {
      "model": "sam-3.1",
      "cap": null,
      "effort": null,
      "ms": 809
    },
    {
      "model": "muse-spark-1.3",
      "cap": 8192,
      "effort": "low",
      "status": "completed",
      "outputTokens": 833,
      "reasoningTokens": 614,
      "ms": 4429
    }
  ],
  "results": [
    {
      "file": "01.jpg",
      "items": [
        {
          "regionIndex": 0,
          "name": "scrambled eggs",
          "portionText": "about 2 eggs scrambled",
          "portionGrams": 100,
          "confidence": 0.92
        },
        {
          "regionIndex": 1,
          "name": "toasted bread",
          "portionText": "2 slices",
          "portionGrams": 60,
          "confidence": 0.9
        }
      ],
      "ms": 6433,
      "pass": true
    },
    {
      "file": "02.jpg",
      "items": [
        {
          "regionIndex": 0,
          "name": "plain spaghetti",
          "portionText": "1 plate",
          "portionGrams": 200,
          "confidence": 0.9
        }
      ],
      "ms": 3595,
      "pass": true
    },
    {
      "file": "03.jpg",
      "items": [
        {
          "regionIndex": 19,
          "name": "tuna hosomaki",
          "portionText": "6 pieces",
          "portionGrams": 120,
          "confidence": 0.9
        },
        {
          "regionIndex": 12,
          "name": "cucumber hosomaki",
          "portionText": "6 pieces",
          "portionGrams": 110,
          "confidence": 0.9
        },
        {
          "regionIndex": 21,
          "name": "pickled ginger",
          "portionText": "1 small pile",
          "portionGrams": 15,
          "confidence": 0.85
        },
        {
          "regionIndex": 1,
          "name": "squid nigiri",
          "portionText": "3 pieces",
          "portionGrams": 90,
          "confidence": 0.8
        },
        {
          "regionIndex": 5,
          "name": "tuna nigiri",
          "portionText": "3 pieces",
          "portionGrams": 90,
          "confidence": 0.9
        },
        {
          "regionIndex": 8,
          "name": "cooked shrimp nigiri",
          "portionText": "3 pieces",
          "portionGrams": 90,
          "confidence": 0.95
        },
        {
          "regionIndex": 36,
          "name": "surf clam nigiri",
          "portionText": "3 pieces",
          "portionGrams": 90,
          "confidence": 0.8
        },
        {
          "regionIndex": 23,
          "name": "octopus nigiri",
          "portionText": "2 pieces",
          "portionGrams": 60,
          "confidence": 0.85
        },
        {
          "regionIndex": 11,
          "name": "yellowtail nigiri",
          "portionText": "3 pieces",
          "portionGrams": 90,
          "confidence": 0.75
        },
        {
          "regionIndex": 10,
          "name": "scallop nigiri",
          "portionText": "3 pieces",
          "portionGrams": 75,
          "confidence": 0.8
        },
        {
          "regionIndex": 44,
          "name": "salmon nigiri",
          "portionText": "2 pieces",
          "portionGrams": 60,
          "confidence": 0.9
        },
        {
          "regionIndex": 38,
          "name": "tamago nigiri",
          "portionText": "4 pieces",
          "portionGrams": 100,
          "confidence": 0.9
        },
        {
          "regionIndex": 13,
          "name": "conger eel nigiri",
          "portionText": "2 pieces",
          "portionGrams": 60,
          "confidence": 0.75
        },
        {
          "regionIndex": 40,
          "name": "salmon roe gunkan",
          "portionText": "2 pieces",
          "portionGrams": 60,
          "confidence": 0.85
        },
        {
          "regionIndex": 0,
          "name": "minced tuna gunkan",
          "portionText": "4 pieces",
          "portionGrams": 80,
          "confidence": 0.8
        },
        {
          "regionIndex": 14,
          "name": "sweet shrimp nigiri",
          "portionText": "2 pieces",
          "portionGrams": 50,
          "confidence": 0.7
        },
        {
          "regionIndex": 37,
          "name": "kohada nigiri",
          "portionText": "2 pieces",
          "portionGrams": 50,
          "confidence": 0.7
        }
      ],
      "ms": 13315,
      "pass": true
    },
    {
      "file": "04.jpg",
      "items": [
        {
          "regionIndex": 0,
          "name": "Margherita pizza",
          "portionText": "2 slices",
          "portionGrams": 250,
          "confidence": 0.92
        }
      ],
      "ms": 5042,
      "pass": true
    },
    {
      "file": "05.jpg",
      "items": [
        {
          "regionIndex": 2,
          "name": "cheeseburger with lettuce, tomato, onion and pickle",
          "portionText": "1 burger, deconstructed",
          "portionGrams": 280,
          "confidence": 0.95
        },
        {
          "regionIndex": null,
          "name": "cheeseburger patty with melted cheese",
          "portionText": null,
          "portionGrams": null,
          "confidence": 0.9
        }
      ],
      "ms": 6135,
      "pass": false
    },
    {
      "file": "06.jpg",
      "items": [
        {
          "regionIndex": 1,
          "name": "grilled chicken Caesar salad with croutons",
          "portionText": "1 large plate",
          "portionGrams": 350,
          "confidence": 0.9
        },
        {
          "regionIndex": 2,
          "name": "lemon wedge",
          "portionText": "1 wedge",
          "portionGrams": 10,
          "confidence": 0.65
        }
      ],
      "ms": 5127,
      "pass": true
    },
    {
      "file": "07.jpg",
      "items": [
        {
          "regionIndex": 0,
          "name": "pancakes",
          "portionText": "two pancakes",
          "portionGrams": 150,
          "confidence": 0.95
        }
      ],
      "ms": 8737,
      "pass": true
    },
    {
      "file": "08.jpg",
      "items": [
        {
          "regionIndex": 0,
          "name": "Ramen with cabbage, green onions and half boiled egg",
          "portionText": "1 bowl",
          "portionGrams": 550,
          "confidence": 0.95
        }
      ],
      "ms": 4259,
      "pass": true
    },
    {
      "file": "09.jpg",
      "items": [
        {
          "regionIndex": 5,
          "name": "Cheeseburger with lettuce, tomato, pickle and cheese",
          "portionText": "1 burger",
          "portionGrams": 260,
          "confidence": 0.95
        },
        {
          "regionIndex": 10,
          "name": "Crinkle-cut french fries",
          "portionText": "1 serving",
          "portionGrams": 120,
          "confidence": 0.95
        }
      ],
      "ms": 6541,
      "pass": true
    },
    {
      "file": "10.jpg",
      "items": [
        {
          "regionIndex": 9,
          "name": "roast lamb slices",
          "portionText": "about 6 slices",
          "portionGrams": 200,
          "confidence": 0.9
        },
        {
          "regionIndex": 10,
          "name": "Yorkshire pudding",
          "portionText": "2 puddings",
          "portionGrams": 90,
          "confidence": 0.95
        },
        {
          "regionIndex": 0,
          "name": "stuffing",
          "portionText": "1 scoop",
          "portionGrams": 90,
          "confidence": 0.9
        },
        {
          "regionIndex": 2,
          "name": "gravy",
          "portionText": "gravy over meat",
          "portionGrams": 60,
          "confidence": 0.85
        }
      ],
      "ms": 5943,
      "pass": true
    }
  ],
  "limits": "Food-category checks and visible component regressions, not measured portions or exact species certification",
  "pass": false,
  "elapsedMs": 66575
}
```
