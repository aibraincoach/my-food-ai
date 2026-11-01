# PR 268 — Focused generic-alias and water gate

Final reviewed source head `4a5c8cb57899e3a403efb5e286212067eb4fff8c`.

```json
{
  "lookups": [
    {
      "query": "butternut squash soup",
      "http": 200
    },
    {
      "query": "+butternut +squash +soup",
      "http": 200
    }
  ],
  "head": "4a5c8cb57899e3a403efb5e286212067eb4fff8c",
  "calls": [
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 427,
      "reasoningTokens": 345,
      "ms": 24580
    }
  ],
  "results": [
    {
      "name": "butternut squash soup",
      "selected": {
        "id": 2709718,
        "description": "Soup, pumpkin",
        "dataType": "Survey (FNDDS)",
        "aliases": "squash, butternut squash, sweet potato, or carrot soup",
        "waterPer100g": 86.36
      },
      "pass": true,
      "ms": 25917,
      "resolution": {
        "source": "selected",
        "reason": "Selected Survey (FNDDS) generic reference 'Soup, pumpkin' whose additional descriptions explicitly include butternut squash soup as the same cream-based squash soup whole dish, covering the target butternut squash soup preparation with no incompatible exclusions.",
        "searches": 1
      }
    }
  ],
  "pass": true,
  "decisions": [
    {
      "name": "butternut squash soup",
      "currentQuery": "butternut squash soup",
      "retry": false,
      "output": {
        "id": 2709718,
        "query": null,
        "query_food": null,
        "reason": "Selected Survey (FNDDS) generic reference 'Soup, pumpkin' whose additional descriptions explicitly include butternut squash soup as the same cream-based squash soup whole dish, covering the target butternut squash soup preparation with no incompatible exclusions."
      },
      "error": null
    }
  ],
  "elapsedMs": 26641,
  "usdaRequests": 2
}
```
