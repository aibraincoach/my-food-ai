# PR 268 — Unchanged 16-food matching gate

Final reviewed source head `4a5c8cb57899e3a403efb5e286212067eb4fff8c`.

```json
{
  "lookups": [
    {
      "query": "Japanese toast",
      "http": 200
    },
    {
      "query": "green salad",
      "http": 200
    },
    {
      "query": "scrambled egg",
      "http": 200
    },
    {
      "query": "ham",
      "http": 200
    },
    {
      "query": "+japanese +toast",
      "http": 200
    },
    {
      "query": "+green +salad",
      "http": 200
    },
    {
      "query": "+scrambled +egg",
      "http": 200
    },
    {
      "query": "+ham",
      "http": 200
    },
    {
      "query": "black coffee",
      "http": 200
    },
    {
      "query": "Tonkatsu",
      "http": 200
    },
    {
      "query": "+tonkatsu",
      "http": 200
    },
    {
      "query": "+black +coffee",
      "http": 200
    },
    {
      "query": "Japanese curry sauce",
      "http": 200
    },
    {
      "query": "+japanese +curry +sauce",
      "http": 200
    },
    {
      "query": "Cooked white rice",
      "http": 200
    },
    {
      "query": "+bread toasted",
      "http": 200
    },
    {
      "query": "+cooked +white +rice",
      "http": 200
    },
    {
      "query": "+bread +toasted",
      "http": 200
    },
    {
      "query": "lentil soup",
      "http": 200
    },
    {
      "query": "baked salmon",
      "http": 200
    },
    {
      "query": "+lentil +soup",
      "http": 200
    },
    {
      "query": "raw apple",
      "http": 200
    },
    {
      "query": "+baked +salmon",
      "http": 200
    },
    {
      "query": "+raw +apple",
      "http": 200
    },
    {
      "query": "coated +pork",
      "http": 200
    },
    {
      "query": "+coated +pork",
      "http": 200
    },
    {
      "query": "Squid nigiri",
      "http": 200
    },
    {
      "query": "cooked spaghetti",
      "http": 200
    },
    {
      "query": "+squid +nigiri",
      "http": 200
    },
    {
      "query": "Margherita pizza",
      "http": 200
    },
    {
      "query": "+cooked +spaghetti",
      "http": 200
    },
    {
      "query": "+margherita +pizza",
      "http": 200
    },
    {
      "query": "Grilled chicken Caesar salad with croutons",
      "http": 200
    },
    {
      "query": "+grilled +chicken +caesar +salad +with +croutons",
      "http": 200
    },
    {
      "query": "ceramic plate",
      "http": 200
    },
    {
      "query": "+ceramic +plate",
      "http": 200
    },
    {
      "query": "cheese +pizza",
      "http": 200
    },
    {
      "query": "+cheese +pizza",
      "http": 200
    }
  ],
  "head": "4a5c8cb57899e3a403efb5e286212067eb4fff8c",
  "calls": [
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 1234,
      "reasoningTokens": 1053,
      "ms": 29300
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 549,
      "reasoningTokens": 415,
      "ms": 25230
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 632,
      "reasoningTokens": 558,
      "ms": 28729
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 664,
      "reasoningTokens": 593,
      "ms": 25401
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 779,
      "reasoningTokens": 685,
      "ms": 10107
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 291,
      "reasoningTokens": 227,
      "ms": 2120
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 625,
      "reasoningTokens": 526,
      "ms": 6294
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 520,
      "reasoningTokens": 448,
      "ms": 5086
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 647,
      "reasoningTokens": 571,
      "ms": 4598
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 338,
      "reasoningTokens": 271,
      "ms": 2529
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 358,
      "reasoningTokens": 283,
      "ms": 2309
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 326,
      "reasoningTokens": 268,
      "ms": 2484
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 770,
      "reasoningTokens": 677,
      "ms": 5547
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 842,
      "reasoningTokens": 723,
      "ms": 5111
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 501,
      "reasoningTokens": 438,
      "ms": 3590
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 1101,
      "reasoningTokens": 951,
      "ms": 7020
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 1119,
      "reasoningTokens": 1019,
      "ms": 6792
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 957,
      "reasoningTokens": 859,
      "ms": 5452
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 1079,
      "reasoningTokens": 942,
      "ms": 6249
    }
  ],
  "results": [
    {
      "name": "Japanese toast",
      "selected": {
        "id": 2707599,
        "description": "Bread, white, toasted",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 36752,
      "resolution": {
        "source": "selected",
        "reason": "Selected Bread, white, toasted as generic reference for Japanese toast, which is toasted white shokupan; geographic descriptor omitted as same generic food and preparation. Other caption foods ham, salad, egg, coffee are separate items and not included.",
        "searches": 2
      }
    },
    {
      "name": "ham",
      "selected": {
        "id": 2705878,
        "description": "Ham",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 27027,
      "resolution": {
        "source": "selected",
        "reason": "Generic Survey (FNDDS) reference for plain sliced ham matches the target 'small slice of ham' with no incompatible preparation, species, or added components; other foods in caption are not part of this item.",
        "searches": 1
      }
    },
    {
      "name": "green salad",
      "selected": {
        "id": 2709792,
        "description": "Mixed salad greens, raw",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 26719,
      "resolution": {
        "source": "selected",
        "reason": "Target is a plain small green salad as side to toast/ham/egg/coffee, with no dressing or other substantial components named. Selected 'Mixed salad greens, raw' as a generic reference that is the same generic food and preparation: raw lettuce/greens, compatible form. Other candidates are incompatible different foods: dressings, bean/pea/potato/egg/meat/seafood/fruit salads, seven-layer/Cobb/Greek salads with cheese/egg/meat not in target.",
        "searches": 1
      }
    },
    {
      "name": "scrambled egg",
      "selected": {
        "id": 172187,
        "description": "Egg, whole, cooked, scrambled",
        "dataType": "SR Legacy"
      },
      "pass": true,
      "ms": 30243,
      "resolution": {
        "source": "selected",
        "reason": "Target is plain scrambled egg with no cheese, meat, or vegetables named. SR Legacy 'Egg, whole, cooked, scrambled' is the same generic food and preparation, covering the whole dish without incompatible additions.",
        "searches": 1
      }
    },
    {
      "name": "black coffee",
      "selected": {
        "id": 2710375,
        "description": "Coffee, brewed",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 3112,
      "resolution": {
        "source": "selected",
        "reason": "Generic Survey (FNDDS) reference 'Coffee, brewed' matches plain black coffee with no milk, cream, sugar, or flavorings implied.",
        "searches": 1
      }
    },
    {
      "name": "Tonkatsu",
      "selected": {
        "id": 2705876,
        "description": "Pork, steak, coated",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 17325,
      "resolution": {
        "source": "selected",
        "reason": "Selects 'Pork, steak, coated' with cutlet as generic reference for tonkatsu, which is a coated/breaded fried pork cutlet; same base food pork and same coated preparation, compatible generic Survey record. Curry sauce and white rice from caption are separate meal components and not part of this portion.",
        "searches": 2
      }
    },
    {
      "name": "Japanese curry sauce",
      "selected": {
        "id": 2710178,
        "description": "Curry sauce",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 7046,
      "resolution": {
        "source": "selected",
        "reason": "Selected generic Survey 'Curry sauce' as a generic reference for Japanese curry sauce: same food and preparation (curry sauce), with geographic descriptor Japanese omitted. Rejected meat/poultry/seafood/vegetable curries and curry-with-rice items as different mixed dishes, curry powder as spice, and unrelated Japanese foods.",
        "searches": 1
      }
    },
    {
      "name": "Cooked white rice",
      "selected": {
        "id": 2708403,
        "description": "Rice, white, cooked, NS as to fat",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 6177,
      "resolution": {
        "source": "selected",
        "reason": "Selected generic Survey (FNDDS) reference for Rice, white, cooked, NS as to fat, matching the target plain cooked white rice without assuming added fat, grain length, or enrichment.",
        "searches": 1
      }
    },
    {
      "name": "lentil soup",
      "selected": {
        "id": 2707462,
        "description": "Soup, lentil",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 3664,
      "resolution": {
        "source": "selected",
        "reason": "Generic Survey (FNDDS) reference 'Soup, lentil' matches target whole-dish lentil soup with compatible broth-based soup form and cooked preparation; no incompatible additions or exclusions.",
        "searches": 1
      }
    },
    {
      "name": "baked salmon",
      "selected": {
        "id": 2706286,
        "description": "Fish, salmon, baked or broiled",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 3461,
      "resolution": {
        "source": "selected",
        "reason": "Generic Survey (FNDDS) reference for fish, salmon, baked or broiled matches the target fillet of baked salmon in base food, cooked form, and cooking process with no incompatible coating or additions.",
        "searches": 1
      }
    },
    {
      "name": "raw apple",
      "selected": {
        "id": 2709215,
        "description": "Apple, raw",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 3831,
      "resolution": {
        "source": "selected",
        "reason": "Selected generic Survey (FNDDS) reference 'Apple, raw' \u2013 same food and preparation as target raw apple with no incompatible ingredients or processing.",
        "searches": 1
      }
    },
    {
      "name": "Squid nigiri",
      "selected": {
        "id": 2708971,
        "description": "Sushi, topped with tuna",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 5811,
      "resolution": {
        "source": "selected",
        "reason": "Selected Survey (FNDDS) Sushi, topped with tuna / sushi topped with other seafood, NFS / Nigiri as a generic reference for squid nigiri. It is the same assembled whole dish: seasoned sushi rice topped with raw seafood, covering the rice base and the squid topping under 'other seafood, NFS' with compatible raw preparation and assembled form. Isolated squid-only records were rejected as topping in place of compound dish.",
        "searches": 1
      }
    },
    {
      "name": "cooked spaghetti",
      "selected": {
        "id": 2708357,
        "description": "Pasta, cooked",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 4722,
      "resolution": {
        "source": "selected",
        "reason": "Generic Survey (FNDDS) reference for plain cooked pasta explicitly includes spaghetti of any shape, matching plain cooked spaghetti with no incompatible sauces or ingredients.",
        "searches": 1
      }
    },
    {
      "name": "Margherita pizza",
      "selected": {
        "id": 173292,
        "description": "Fast Food, Pizza Chain, 14\" pizza, cheese topping, regular crust",
        "dataType": "SR Legacy"
      },
      "pass": true,
      "ms": 15223,
      "resolution": {
        "source": "selected",
        "reason": "Margherita pizza is crust with tomato sauce, cheese, and basil. Selected generic SR Legacy cheese pizza with regular crust as broader generic reference for the same whole dish: crust + tomato sauce + cheese, with basil as minor seasoning. Rejected white/no-cheese as missing sauce/cheese, fruit/vegetable/meat and extra-cheese as extra ingredients, topping-only as isolated component, stuffed/frozen/gluten-free/whole-wheat and named PIZZA HUT proprietary recipes as incompatible preparation/recipe.",
        "searches": 2
      }
    },
    {
      "name": "Grilled chicken Caesar salad with croutons",
      "selected": {
        "id": 2422578,
        "description": "CHICKEN CAESAR GRILLED CHICKEN ON LEAF LETTUCE WITH PARMESAN CHEESE, CROUTONS & CAESAR DRESSING SALAD, CHICKEN CAESAR",
        "dataType": "Branded"
      },
      "pass": true,
      "ms": 7627,
      "resolution": {
        "source": "selected",
        "reason": "Branded retail whole-dish fallback covering all named components: grilled chicken, leaf lettuce Caesar base with parmesan cheese, croutons, and Caesar dressing. Generic candidates 2706818 and 2709591 explicitly state 'no dressing' and omit croutons, conflicting with a Caesar salad with croutons target.",
        "searches": 1
      }
    },
    {
      "name": "ceramic plate",
      "selected": null,
      "pass": true,
      "ms": 6354,
      "resolution": {
        "source": "unavailable",
        "reason": "Target is non-food: an empty ceramic plate with no food per caption. All candidates are incompatible different categories \u2013 beef/veal 'plate' meat cuts and a macaroni n' cheese restaurant plate \u2013 matching only the word 'plate' for dishware, not an edible food. No valid food search applies.",
        "searches": 1
      }
    }
  ],
  "pass": true,
  "decisions": [
    {
      "name": "green salad",
      "currentQuery": "green salad",
      "retry": false,
      "output": {
        "id": 2709792,
        "query": null,
        "query_food": null,
        "reason": "Target is a plain small green salad as side to toast/ham/egg/coffee, with no dressing or other substantial components named. Selected 'Mixed salad greens, raw' as a generic reference that is the same generic food and preparation: raw lettuce/greens, compatible form. Other candidates are incompatible different foods: dressings, bean/pea/potato/egg/meat/seafood/fruit salads, seven-layer/Cobb/Greek salads with cheese/egg/meat not in target."
      },
      "error": null
    },
    {
      "name": "ham",
      "currentQuery": "ham",
      "retry": false,
      "output": {
        "id": 2705878,
        "query": null,
        "query_food": null,
        "reason": "Generic Survey (FNDDS) reference for plain sliced ham matches the target 'small slice of ham' with no incompatible preparation, species, or added components; other foods in caption are not part of this item."
      },
      "error": null
    },
    {
      "name": "black coffee",
      "currentQuery": "black coffee",
      "retry": false,
      "output": {
        "id": 2710375,
        "query": null,
        "query_food": null,
        "reason": "Generic Survey (FNDDS) reference 'Coffee, brewed' matches plain black coffee with no milk, cream, sugar, or flavorings implied."
      },
      "error": null
    },
    {
      "name": "scrambled egg",
      "currentQuery": "scrambled egg",
      "retry": false,
      "output": {
        "id": 172187,
        "query": null,
        "query_food": null,
        "reason": "Target is plain scrambled egg with no cheese, meat, or vegetables named. SR Legacy 'Egg, whole, cooked, scrambled' is the same generic food and preparation, covering the whole dish without incompatible additions."
      },
      "error": null
    },
    {
      "name": "Japanese toast",
      "currentQuery": "Japanese toast",
      "retry": false,
      "output": {
        "id": null,
        "query": "bread toasted",
        "query_food": "bread",
        "reason": "All candidates are incompatible with plain Japanese toast (toasted bread). 'Japanese' hits are different foods (persimmons, soba/somen noodles, chestnuts, pickled cabbage, tea cookie). 'Toast' hits are different categories/recipes (melba/anisette/zwieback crackers/cookies, shrimp toast seafood dish, cinnamon toast cereal). Flavored toasted breads (cheese, cinnamon, onion, raisin, etc.) add unsupported ingredients, and specific grain types (barley, black, multigrain, oatmeal, potato, pumpernickel, Cuban, egg) are not shown to be the same plain white shokupan-type toast. Searching broader base food with preparation to find plain toasted bread."
      },
      "error": null
    },
    {
      "name": "Cooked white rice",
      "currentQuery": "Cooked white rice",
      "retry": false,
      "output": {
        "id": 2708403,
        "query": null,
        "query_food": null,
        "reason": "Selected generic Survey (FNDDS) reference for Rice, white, cooked, NS as to fat, matching the target plain cooked white rice without assuming added fat, grain length, or enrichment."
      },
      "error": null
    },
    {
      "name": "Japanese toast",
      "currentQuery": "+bread toasted",
      "retry": true,
      "output": {
        "id": 2707599,
        "query": null,
        "query_food": null,
        "reason": "Selected Bread, white, toasted as generic reference for Japanese toast, which is toasted white shokupan; geographic descriptor omitted as same generic food and preparation. Other caption foods ham, salad, egg, coffee are separate items and not included."
      },
      "error": null
    },
    {
      "name": "Japanese curry sauce",
      "currentQuery": "Japanese curry sauce",
      "retry": false,
      "output": {
        "id": 2710178,
        "query": null,
        "query_food": null,
        "reason": "Selected generic Survey 'Curry sauce' as a generic reference for Japanese curry sauce: same food and preparation (curry sauce), with geographic descriptor Japanese omitted. Rejected meat/poultry/seafood/vegetable curries and curry-with-rice items as different mixed dishes, curry powder as spice, and unrelated Japanese foods."
      },
      "error": null
    },
    {
      "name": "Tonkatsu",
      "currentQuery": "Tonkatsu",
      "retry": false,
      "output": {
        "id": null,
        "query": "coated pork",
        "query_food": "pork",
        "reason": "Candidate 2581968 is teriyaki seaweed snacks, a different food category from breaded pork cutlet, so incompatible. Target is tonkatsu alone; curry sauce and rice are context only. New search uses USDA term 'coated' for breading with base food pork."
      },
      "error": null
    },
    {
      "name": "lentil soup",
      "currentQuery": "lentil soup",
      "retry": false,
      "output": {
        "id": 2707462,
        "query": null,
        "query_food": null,
        "reason": "Generic Survey (FNDDS) reference 'Soup, lentil' matches target whole-dish lentil soup with compatible broth-based soup form and cooked preparation; no incompatible additions or exclusions."
      },
      "error": null
    },
    {
      "name": "baked salmon",
      "currentQuery": "baked salmon",
      "retry": false,
      "output": {
        "id": 2706286,
        "query": null,
        "query_food": null,
        "reason": "Generic Survey (FNDDS) reference for fish, salmon, baked or broiled matches the target fillet of baked salmon in base food, cooked form, and cooking process with no incompatible coating or additions."
      },
      "error": null
    },
    {
      "name": "raw apple",
      "currentQuery": "raw apple",
      "retry": false,
      "output": {
        "id": 2709215,
        "query": null,
        "query_food": null,
        "reason": "Selected generic Survey (FNDDS) reference 'Apple, raw' \u2013 same food and preparation as target raw apple with no incompatible ingredients or processing."
      },
      "error": null
    },
    {
      "name": "Tonkatsu",
      "currentQuery": "coated +pork",
      "retry": true,
      "output": {
        "id": 2705876,
        "query": null,
        "query_food": null,
        "reason": "Selects 'Pork, steak, coated' with cutlet as generic reference for tonkatsu, which is a coated/breaded fried pork cutlet; same base food pork and same coated preparation, compatible generic Survey record. Curry sauce and white rice from caption are separate meal components and not part of this portion."
      },
      "error": null
    },
    {
      "name": "cooked spaghetti",
      "currentQuery": "cooked spaghetti",
      "retry": false,
      "output": {
        "id": 2708357,
        "query": null,
        "query_food": null,
        "reason": "Generic Survey (FNDDS) reference for plain cooked pasta explicitly includes spaghetti of any shape, matching plain cooked spaghetti with no incompatible sauces or ingredients."
      },
      "error": null
    },
    {
      "name": "Squid nigiri",
      "currentQuery": "Squid nigiri",
      "retry": false,
      "output": {
        "id": 2708971,
        "query": null,
        "query_food": null,
        "reason": "Selected Survey (FNDDS) Sushi, topped with tuna / sushi topped with other seafood, NFS / Nigiri as a generic reference for squid nigiri. It is the same assembled whole dish: seasoned sushi rice topped with raw seafood, covering the rice base and the squid topping under 'other seafood, NFS' with compatible raw preparation and assembled form. Isolated squid-only records were rejected as topping in place of compound dish."
      },
      "error": null
    },
    {
      "name": "Margherita pizza",
      "currentQuery": "Margherita pizza",
      "retry": false,
      "output": {
        "id": null,
        "query": "cheese pizza",
        "query_food": "pizza",
        "reason": "All candidates incompatible: Branded MARGHERITA PIZZA records are retail fallbacks not selectable before exhausting generic search; SR Legacy PIZZA HUT cheese/pepperoni/sausage/supreme pizzas are identifiable named-chain proprietary recipes, not generic collection settings; Survey dessert, Mexican, breakfast, rolls, and no-cheese pizza are different food categories/preparations missing cheese-tomato whole dish. New search for broader generic whole-dish category cheese pizza to retrieve unbranded reference covering crust, tomato sauce, and cheese compatible with Margherita."
      },
      "error": null
    },
    {
      "name": "ceramic plate",
      "currentQuery": "ceramic plate",
      "retry": false,
      "output": {
        "id": null,
        "query": null,
        "query_food": null,
        "reason": "Target is non-food: an empty ceramic plate with no food per caption. All candidates are incompatible different categories \u2013 beef/veal 'plate' meat cuts and a macaroni n' cheese restaurant plate \u2013 matching only the word 'plate' for dishware, not an edible food. No valid food search applies."
      },
      "error": null
    },
    {
      "name": "Grilled chicken Caesar salad with croutons",
      "currentQuery": "Grilled chicken Caesar salad with croutons",
      "retry": false,
      "output": {
        "id": 2422578,
        "query": null,
        "query_food": null,
        "reason": "Branded retail whole-dish fallback covering all named components: grilled chicken, leaf lettuce Caesar base with parmesan cheese, croutons, and Caesar dressing. Generic candidates 2706818 and 2709591 explicitly state 'no dressing' and omit croutons, conflicting with a Caesar salad with croutons target."
      },
      "error": null
    },
    {
      "name": "Margherita pizza",
      "currentQuery": "cheese +pizza",
      "retry": true,
      "output": {
        "id": 173292,
        "query": null,
        "query_food": null,
        "reason": "Margherita pizza is crust with tomato sauce, cheese, and basil. Selected generic SR Legacy cheese pizza with regular crust as broader generic reference for the same whole dish: crust + tomato sauce + cheese, with basil as minor seasoning. Rejected white/no-cheese as missing sauce/cheese, fruit/vegetable/meat and extra-cheese as extra ingredients, topping-only as isolated component, stuffed/frozen/gluten-free/whole-wheat and named PIZZA HUT proprietary recipes as incompatible preparation/recipe."
      },
      "error": null
    }
  ],
  "elapsedMs": 56596,
  "usdaRequests": 38
}
```
