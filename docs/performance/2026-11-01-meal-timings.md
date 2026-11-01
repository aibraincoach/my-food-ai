# 2026 11 01 meal timings

Sanitized production observations. Portion amounts are estimates.

```json
[
  {
    "name": "breakfast",
    "postId": "eed95180-7361-4e2b-ac99-1e3e244f9ba9",
    "status": "ready",
    "job": {
      "status": "finished",
      "attempts": 1,
      "error": null,
      "started_at": "2026-11-01T00:43:56.268166+00:00",
      "finished_at": "2026-11-01T00:44:39.974+00:00"
    },
    "created": "2026-11-01T00:43:55.249721+00:00",
    "queueFromCreationMs": 1019,
    "workerMs": 43706,
    "endToEndMs": 44725,
    "modelCalls": 7,
    "outputTokens": 10542,
    "modelWallMs": 40098,
    "foodResolutionWallMs": 30458,
    "fdcCalls": 6,
    "fdcWallMs": 10,
    "otherWallMs": 3605,
    "phases": {
      "sam": {
        "calls": 0,
        "sumMs": 0,
        "wallMs": 0,
        "outputTokens": 0,
        "caps": []
      },
      "spark_identify": {
        "calls": 1,
        "sumMs": 10119,
        "wallMs": 10119,
        "outputTokens": 1891,
        "caps": [
          2048
        ]
      },
      "spark_search": {
        "calls": 6,
        "sumMs": 57535,
        "wallMs": 29979,
        "outputTokens": 8651,
        "caps": [
          4096,
          4096,
          4096,
          4096,
          4096,
          4096
        ]
      },
      "spark_same_meal": {
        "calls": 0,
        "sumMs": 0,
        "wallMs": 0,
        "outputTokens": 0,
        "caps": []
      }
    },
    "runtime": "72910d0f49a3ba0a96bea015921d874ba13a6c5f",
    "label": "before"
  },
  {
    "name": "curry",
    "postId": "3b9b5bac-33a5-4959-bf54-4b1613a93c32",
    "status": "ready",
    "job": {
      "status": "finished",
      "attempts": 1,
      "error": null,
      "started_at": "2026-11-01T00:44:40.226202+00:00",
      "finished_at": "2026-11-01T00:45:29.682+00:00"
    },
    "created": "2026-11-01T00:43:55.773797+00:00",
    "queueFromCreationMs": 44453,
    "workerMs": 49456,
    "endToEndMs": 93909,
    "modelCalls": 6,
    "outputTokens": 10740,
    "modelWallMs": 47002,
    "foodResolutionWallMs": 24405,
    "fdcCalls": 4,
    "fdcWallMs": 2056,
    "otherWallMs": 2454,
    "phases": {
      "sam": {
        "calls": 0,
        "sumMs": 0,
        "wallMs": 0,
        "outputTokens": 0,
        "caps": []
      },
      "spark_identify": {
        "calls": 2,
        "sumMs": 22871,
        "wallMs": 22871,
        "outputTokens": 4057,
        "caps": [
          2048,
          8192
        ]
      },
      "spark_search": {
        "calls": 4,
        "sumMs": 38527,
        "wallMs": 24131,
        "outputTokens": 6683,
        "caps": [
          4096,
          4096,
          4096,
          4096
        ]
      },
      "spark_same_meal": {
        "calls": 0,
        "sumMs": 0,
        "wallMs": 0,
        "outputTokens": 0,
        "caps": []
      }
    },
    "runtime": "72910d0f49a3ba0a96bea015921d874ba13a6c5f",
    "label": "before"
  },
  {
    "name": "busy-photo",
    "postId": "d9410a54-8168-4f82-8c61-3f61dd6bd712",
    "status": "ready",
    "job": {
      "status": "finished",
      "attempts": 1,
      "error": null,
      "started_at": "2026-11-01T00:45:31.650283+00:00",
      "finished_at": "2026-11-01T00:47:27.389+00:00"
    },
    "created": "2026-11-01T00:43:56.779259+00:00",
    "queueFromCreationMs": 94871,
    "workerMs": 115739,
    "endToEndMs": 210610,
    "modelCalls": 14,
    "outputTokens": 21596,
    "modelWallMs": 96182,
    "foodResolutionWallMs": 55562,
    "fdcCalls": 11,
    "fdcWallMs": 14,
    "otherWallMs": 19551,
    "phases": {
      "sam": {
        "calls": 1,
        "sumMs": 1741,
        "wallMs": 1741,
        "outputTokens": 0,
        "caps": [
          null
        ]
      },
      "spark_identify": {
        "calls": 2,
        "sumMs": 39485,
        "wallMs": 39485,
        "outputTokens": 6370,
        "caps": [
          2048,
          8192
        ]
      },
      "spark_search": {
        "calls": 11,
        "sumMs": 98636,
        "wallMs": 54956,
        "outputTokens": 15226,
        "caps": [
          4096,
          4096,
          4096,
          4096,
          4096,
          4096,
          4096,
          4096,
          4096,
          4096,
          4096
        ]
      },
      "spark_same_meal": {
        "calls": 0,
        "sumMs": 0,
        "wallMs": 0,
        "outputTokens": 0,
        "caps": []
      }
    },
    "runtime": "72910d0f49a3ba0a96bea015921d874ba13a6c5f",
    "label": "before"
  },
  {
    "name": "breakfast",
    "postId": "af17c93d-abc8-4b40-9939-13d3ee09d98c",
    "status": "ready",
    "job": {
      "status": "finished",
      "attempts": 1,
      "error": null,
      "started_at": "2026-11-01T01:01:56.869877+00:00",
      "finished_at": "2026-11-01T01:02:13.366+00:00"
    },
    "created": "2026-11-01T01:01:56.030238+00:00",
    "queueFromCreationMs": 839,
    "workerMs": 16497,
    "endToEndMs": 17336,
    "modelCalls": 7,
    "outputTokens": 4703,
    "modelWallMs": 12604,
    "foodResolutionWallMs": 10044,
    "fdcCalls": 6,
    "fdcWallMs": 8,
    "otherWallMs": 3887,
    "phases": {
      "sam": {
        "calls": 0,
        "sumMs": 0,
        "wallMs": 0,
        "outputTokens": 0,
        "caps": []
      },
      "spark_identify": {
        "calls": 1,
        "sumMs": 3305,
        "wallMs": 3305,
        "outputTokens": 792,
        "caps": [
          8192
        ]
      },
      "spark_search": {
        "calls": 6,
        "sumMs": 19959,
        "wallMs": 9299,
        "outputTokens": 3911,
        "caps": [
          4096,
          4096,
          4096,
          4096,
          4096,
          4096
        ]
      },
      "spark_same_meal": {
        "calls": 0,
        "sumMs": 0,
        "wallMs": 0,
        "outputTokens": 0,
        "caps": []
      }
    },
    "runtime": "44576592955ce576b2a66f875518d18a4ebb8bd4",
    "label": "after"
  },
  {
    "name": "curry",
    "postId": "b0f44479-904d-406b-add2-e28edeb71442",
    "status": "ready",
    "job": {
      "status": "finished",
      "attempts": 1,
      "error": null,
      "started_at": "2026-11-01T01:02:14.647998+00:00",
      "finished_at": "2026-11-01T01:02:34.186+00:00"
    },
    "created": "2026-11-01T01:01:56.446132+00:00",
    "queueFromCreationMs": 18201,
    "workerMs": 19539,
    "endToEndMs": 37740,
    "modelCalls": 5,
    "outputTokens": 4081,
    "modelWallMs": 13642,
    "foodResolutionWallMs": 12346,
    "fdcCalls": 4,
    "fdcWallMs": 1158,
    "otherWallMs": 4740,
    "phases": {
      "sam": {
        "calls": 0,
        "sumMs": 0,
        "wallMs": 0,
        "outputTokens": 0,
        "caps": []
      },
      "spark_identify": {
        "calls": 1,
        "sumMs": 3409,
        "wallMs": 3409,
        "outputTokens": 841,
        "caps": [
          8192
        ]
      },
      "spark_search": {
        "calls": 4,
        "sumMs": 16389,
        "wallMs": 10233,
        "outputTokens": 3240,
        "caps": [
          4096,
          4096,
          4096,
          4096
        ]
      },
      "spark_same_meal": {
        "calls": 0,
        "sumMs": 0,
        "wallMs": 0,
        "outputTokens": 0,
        "caps": []
      }
    },
    "runtime": "44576592955ce576b2a66f875518d18a4ebb8bd4",
    "label": "after"
  },
  {
    "name": "busy-photo",
    "postId": "7b093288-f6b7-4d61-ae08-dc7deaa4f5be",
    "status": "ready",
    "job": {
      "status": "finished",
      "attempts": 1,
      "error": null,
      "started_at": "2026-11-01T01:02:34.412766+00:00",
      "finished_at": "2026-11-01T01:02:59.6+00:00"
    },
    "created": "2026-11-01T01:01:57.773908+00:00",
    "queueFromCreationMs": 36639,
    "workerMs": 25188,
    "endToEndMs": 61827,
    "modelCalls": 13,
    "outputTokens": 9652,
    "modelWallMs": 20259,
    "foodResolutionWallMs": 11208,
    "fdcCalls": 11,
    "fdcWallMs": 1600,
    "otherWallMs": 4921,
    "phases": {
      "sam": {
        "calls": 1,
        "sumMs": 1337,
        "wallMs": 1337,
        "outputTokens": 0,
        "caps": [
          null
        ]
      },
      "spark_identify": {
        "calls": 1,
        "sumMs": 8084,
        "wallMs": 8084,
        "outputTokens": 1837,
        "caps": [
          8192
        ]
      },
      "spark_search": {
        "calls": 11,
        "sumMs": 35489,
        "wallMs": 10838,
        "outputTokens": 7815,
        "caps": [
          4096,
          4096,
          4096,
          4096,
          4096,
          4096,
          4096,
          4096,
          4096,
          4096,
          4096
        ]
      },
      "spark_same_meal": {
        "calls": 0,
        "sumMs": 0,
        "wallMs": 0,
        "outputTokens": 0,
        "caps": []
      }
    },
    "runtime": "44576592955ce576b2a66f875518d18a4ebb8bd4",
    "label": "after"
  }
]
```
