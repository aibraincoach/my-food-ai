# Verified rehearsal evidence

Sanitized timestamps, stored test-post results and retained correction history. No account identifiers or session material.

```json
{
  "timeline": [
    {
      "name": "start: empty sign-in, five-second spoken introduction",
      "at": "2026-11-01T01:12:27.296Z",
      "elapsedMs": 0
    },
    {
      "name": "signed in through configured test helper",
      "at": "2026-11-01T01:12:33.296Z",
      "elapsedMs": 6000
    },
    {
      "name": "post published",
      "at": "2026-11-01T01:12:37.378Z",
      "elapsedMs": 10082,
      "id": "c069f60e-5ef8-4082-89b1-a199cc23f2d6",
      "file": "02.jpg"
    },
    {
      "name": "meal ready in feed",
      "at": "2026-11-01T01:12:51.728Z",
      "elapsedMs": 24432,
      "id": "c069f60e-5ef8-4082-89b1-a199cc23f2d6"
    },
    {
      "name": "SAM outlines visible",
      "at": "2026-11-01T01:12:52.518Z",
      "elapsedMs": 25222
    },
    {
      "name": "correction submitted",
      "at": "2026-11-01T01:12:54.965Z",
      "elapsedMs": 27669
    },
    {
      "name": "original, correction and revised analysis visible",
      "at": "2026-11-01T01:13:00.933Z",
      "elapsedMs": 33637
    },
    {
      "name": "post published",
      "at": "2026-11-01T01:13:07.325Z",
      "elapsedMs": 40029,
      "id": "e43ac7dc-128a-4032-b530-f5463a37618b",
      "file": "07.jpg"
    },
    {
      "name": "genuine needs-input strip visible",
      "at": "2026-11-01T01:13:13.650Z",
      "elapsedMs": 46354,
      "id": "e43ac7dc-128a-4032-b530-f5463a37618b"
    },
    {
      "name": "finish: Days visible",
      "at": "2026-11-01T01:13:18.578Z",
      "elapsedMs": 51282
    }
  ],
  "stored-proof": [
    {
      "postId": "c069f60e-5ef8-4082-89b1-a199cc23f2d6",
      "post": {
        "status": "ready",
        "needs_input": null
      },
      "jobs": [
        {
          "kind": "analyze",
          "status": "finished",
          "attempts": 1,
          "error": null,
          "started_at": "2026-11-01T01:12:37.66185+00:00",
          "finished_at": "2026-11-01T01:12:51.891+00:00"
        },
        {
          "kind": "correct",
          "status": "finished",
          "attempts": 1,
          "error": null,
          "started_at": "2026-11-01T01:12:55.225148+00:00",
          "finished_at": "2026-11-01T01:12:59.903+00:00"
        }
      ],
      "comments": [
        {
          "author": "model",
          "body": "Consumed: 314 kcal \u00b7 12 g protein \u00b7 61 g carbs \u00b7 2 g fat.",
          "created_at": "2026-11-01T01:12:51.068654+00:00"
        },
        {
          "author": "user",
          "body": "The spaghetti was 150 grams.",
          "created_at": "2026-11-01T01:12:55.111713+00:00"
        },
        {
          "author": "model",
          "body": "Consumed: 236 kcal \u00b7 9 g protein \u00b7 46 g carbs \u00b7 1 g fat.",
          "created_at": "2026-11-01T01:12:59.063409+00:00"
        }
      ],
      "items": [
        {
          "name": "plain spaghetti",
          "portion_grams": 200,
          "superseded_at": "2026-11-01T01:12:59.063409+00:00"
        },
        {
          "name": "plain spaghetti",
          "portion_grams": 150,
          "superseded_at": null
        }
      ],
      "traceKinds": {
        "sam": 1,
        "spark_identify": 1,
        "fdc": 4,
        "spark_search": 2,
        "spark_correct": 1
      }
    },
    {
      "postId": "e43ac7dc-128a-4032-b530-f5463a37618b",
      "post": {
        "status": "needs_input",
        "needs_input": {
          "short": "Clarification needed",
          "options": [
            "Grilled salmon",
            "Pancakes",
            "Crumpets"
          ],
          "question": "Your caption says grilled salmon but the photo shows browned pancakes, what did you eat?"
        }
      },
      "jobs": [
        {
          "kind": "analyze",
          "status": "finished",
          "attempts": 1,
          "error": null,
          "started_at": "2026-11-01T01:13:06.77498+00:00",
          "finished_at": "2026-11-01T01:13:11.858+00:00"
        }
      ],
      "comments": [
        {
          "author": "model",
          "body": "Your caption says grilled salmon but the photo shows browned pancakes, what did you eat?",
          "created_at": "2026-11-01T01:13:11.683039+00:00"
        }
      ],
      "items": [],
      "traceKinds": {
        "sam": 1,
        "spark_identify": 1
      }
    }
  ]
}
```
