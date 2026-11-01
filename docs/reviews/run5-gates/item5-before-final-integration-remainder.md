# item5-before-final-integration-remainder

```json
{
  "head": "d4e7cb4a109f9df33d81db95e84e3a75f5f79ae3",
  "original": "eval/photos/10.jpg",
  "fixture": "scripts/fixtures/plate2.jpg",
  "fixtureCorrection": "The planned plate1.jpg reference is an empty plate. The original is the licensed meal photograph also used by plate2.jpg.",
  "calls": [
    {
      "status": 200
    },
    {
      "status": 200
    }
  ],
  "reference": [
    {
      "index": 0,
      "name": "Yorkshire pudding",
      "grams": 80
    },
    {
      "index": 1,
      "name": "sliced roast meat",
      "grams": 200
    },
    {
      "index": 2,
      "name": "stuffing",
      "grams": 80
    },
    {
      "index": 3,
      "name": "gravy",
      "grams": 60
    }
  ],
  "output": [
    {
      "index": 0,
      "remaining_count": 2,
      "remaining_grams": 80,
      "total_count": 2,
      "unit": "puddings"
    },
    {
      "index": 1,
      "remaining_count": 8,
      "remaining_grams": 200,
      "total_count": 8,
      "unit": "slices"
    },
    {
      "index": 2,
      "remaining_count": null,
      "remaining_grams": 80,
      "total_count": null,
      "unit": null
    },
    {
      "index": 3,
      "remaining_count": null,
      "remaining_grams": 60,
      "total_count": null,
      "unit": null
    }
  ],
  "pass": true
}
```
