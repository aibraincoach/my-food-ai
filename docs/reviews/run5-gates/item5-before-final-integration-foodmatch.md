# item5-before-final-integration-foodmatch

```json
{
  "lookups": [
    {
      "query": "green salad",
      "http": 200
    },
    {
      "query": "ham",
      "http": 200
    },
    {
      "query": "Japanese toast",
      "http": 200
    },
    {
      "query": "scrambled egg",
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
      "query": "Japanese curry sauce",
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
      "query": "coated +pork cutlet",
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
      "query": "raw apple",
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
      "query": "Margherita pizza",
      "http": 200
    },
    {
      "query": "Grilled chicken Caesar salad with croutons",
      "http": 200
    },
    {
      "query": "cooked +pasta",
      "http": 200
    },
    {
      "query": "+sushi with squid",
      "http": 200
    },
    {
      "query": "ceramic plate",
      "http": 200
    },
    {
      "query": "cheese +pizza",
      "http": 200
    }
  ],
  "head": "d4e7cb4a109f9df33d81db95e84e3a75f5f79ae3",
  "calls": [
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 340,
      "reasoningTokens": 274,
      "ms": 1765
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 1080,
      "reasoningTokens": 917,
      "ms": 5134
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 438,
      "reasoningTokens": 336,
      "ms": 2934
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 880,
      "reasoningTokens": 811,
      "ms": 4521
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 410,
      "reasoningTokens": 336,
      "ms": 2332
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 895,
      "reasoningTokens": 797,
      "ms": 4269
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 843,
      "reasoningTokens": 735,
      "ms": 4371
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 939,
      "reasoningTokens": 868,
      "ms": 5237
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 508,
      "reasoningTokens": 414,
      "ms": 2814
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 1277,
      "reasoningTokens": 1202,
      "ms": 6033
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 450,
      "reasoningTokens": 371,
      "ms": 2403
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 375,
      "reasoningTokens": 276,
      "ms": 2102
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 385,
      "reasoningTokens": 326,
      "ms": 2239
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 1837,
      "reasoningTokens": 1713,
      "ms": 9825
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 993,
      "reasoningTokens": 883,
      "ms": 5281
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 1728,
      "reasoningTokens": 1554,
      "ms": 10143
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 1439,
      "reasoningTokens": 1269,
      "ms": 7874
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 674,
      "reasoningTokens": 604,
      "ms": 4404
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 849,
      "reasoningTokens": 743,
      "ms": 4968
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 625,
      "reasoningTokens": 538,
      "ms": 4949
    },
    {
      "cap": 4096,
      "http": 200,
      "status": "completed",
      "outputTokens": 1126,
      "reasoningTokens": 1030,
      "ms": 6926
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
      "ms": 9443,
      "resolution": {
        "source": "selected",
        "reason": "Target is Japanese toast alone; other caption foods are separate. 'Japanese' is a geographic descriptor for white shokupan-style toast. Selected Survey (FNDDS) 'Bread, white, toasted' is the same generic food and preparation (toasted white yeast bread), so geographic omission is allowed.",
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
      "ms": 2622,
      "resolution": {
        "source": "selected",
        "reason": "Generic Survey (FNDDS) record 'Ham' in Cold cuts and cured meats matches the target plain small slice of ham with no special preparation or additional components.",
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
      "ms": 3819,
      "resolution": {
        "source": "selected",
        "reason": "Selected 'Mixed salad greens, raw' as a generic reference for the target small green salad; compatible base food (lettuce/leafy greens) and raw preparation with no incompatible additions. Other candidates are incompatible different foods: dressings, bean/pea/cabbage/fruit salads, meat/seafood/egg/potato salads.",
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
      "ms": 5420,
      "resolution": {
        "source": "selected",
        "reason": "SR Legacy generic reference 'Egg, whole, cooked, scrambled' matches the target plain scrambled egg preparation with no cheese, meat, or other additions; other caption foods are separate items.",
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
      "ms": 2868,
      "resolution": {
        "source": "selected",
        "reason": "Selected Survey (FNDDS) 'Coffee, brewed' as the generic plain black coffee preparation, with no milk, creamer, sugar, flavoring or alcohol, matching the target black coffee.",
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
      "ms": 11149,
      "resolution": {
        "source": "selected",
        "reason": "Selected Pork, steak, coated as generic reference for tonkatsu alone; boneless coated pork steak matches breaded pork cutlet preparation. Japanese curry sauce and white rice are caption context only and not part of this item.",
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
      "ms": 4930,
      "resolution": {
        "source": "selected",
        "reason": "Selected generic Survey 'Curry sauce' as a generic reference for Japanese curry sauce: same food category (sauce) and cooked sauce preparation/physical form, with Japanese geographic descriptor omitted as same generic food. Other candidates are incompatible different foods with added meat/poultry/seafood/legume/vegetable/rice/noodles or isolated curry powder/teriyaki.",
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
      "ms": 6182,
      "resolution": {
        "source": "selected",
        "reason": "Selected Survey generic reference for the same plain food and preparation: white rice, cooked, with NS as to fat, compatible with target cooked white rice with no known added fat or other components.",
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
      "ms": 2952,
      "resolution": {
        "source": "selected",
        "reason": "Survey (FNDDS) generic reference 'Soup, lentil' matches the target whole dish with no extra meat, ham, curry, or canned/sodium specification; covers lentils as broth-based soup in same physical form.",
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
      "ms": 2724,
      "resolution": {
        "source": "selected",
        "reason": "Selected generic Survey (FNDDS) reference 'Fish, salmon, baked or broiled' - same food and preparation as target fillet of baked salmon, uncoated and cooked. Rejected coated, fried, grilled, raw, smoked, steamed, canned, mixed dishes and other species/preparations as incompatible.",
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
      "ms": 2852,
      "resolution": {
        "source": "selected",
        "reason": "Selected generic Survey (FNDDS) reference 'Apple, raw' is the same food and preparation as target raw apple with no incompatible variety or preparation.",
        "searches": 1
      }
    },
    {
      "name": "Squid nigiri",
      "selected": {
        "id": 2708959,
        "description": "Sushi, NFS",
        "dataType": "Survey (FNDDS)"
      },
      "pass": true,
      "ms": 15871,
      "resolution": {
        "source": "selected",
        "reason": "Selected Sushi, NFS as a generic reference for the whole assembled dish: vinegared rice with seafood topping in nigiri/sushi form covers squid nigiri's known main components of rice base + squid topping with compatible raw/assembled form. Specific topped records (tuna, salmon, shrimp, crab, eel, egg) are rejected as different named species.",
        "searches": 2
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
      "ms": 10961,
      "resolution": {
        "source": "selected",
        "reason": "Selected Survey (FNDDS) 'Pasta, cooked' as a generic reference for plain cooked spaghetti; same plain cooked pasta preparation with no sauce or additions, compatible with target.",
        "searches": 2
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
      "ms": 18143,
      "resolution": {
        "source": "selected",
        "reason": "Generic SR Legacy whole-dish cheese pizza reference compatible with Margherita pizza: regular crust with cheese topping implies crust, tomato sauce, and cheese, covering the main components of Margherita (crust, tomato, mozzarella), with basil as minor seasoning variation. Named PIZZA HUT recipes were not used.",
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
      "ms": 8493,
      "resolution": {
        "source": "selected",
        "reason": "No compatible generic whole-dish record exists. Generic 2706818 is chicken caesar garden salad but explicitly 'no dressing' and lacks croutons, so it misses the named substantial component croutons and conflicts on dressing. 2709591 is Caesar salad with no chicken/dressing. 2706819 is breaded/fried not grilled. 173312 is McDonald's Bacon Ranch with bacon, different dressing/recipe. Branded 2422578 is a retail Deli Salad label explicitly covering grilled chicken + leaf lettuce + parmesan + croutons + Caesar dressing, matching all known components of grilled chicken Caesar salad with croutons without incompatible additions.",
        "searches": 1
      }
    },
    {
      "name": "ceramic plate",
      "selected": null,
      "pass": true,
      "ms": 5798,
      "resolution": {
        "source": "unavailable",
        "reason": "Caption states empty ceramic plate with no food. Ceramic plate is inedible tableware, not a food. All candidates are incompatible different foods using 'plate' as meat cut (beef/veal plate/skirt steak) or an unrelated restaurant dish, so no nutrition reference applies.",
        "searches": 1
      }
    }
  ],
  "pass": true,
  "decisions": [
    {
      "name": "ham",
      "currentQuery": "ham",
      "retry": false,
      "output": {
        "id": 2705878,
        "query": null,
        "query_food": null,
        "reason": "Generic Survey (FNDDS) record 'Ham' in Cold cuts and cured meats matches the target plain small slice of ham with no special preparation or additional components."
      },
      "error": null
    },
    {
      "name": "green salad",
      "currentQuery": "green salad",
      "retry": false,
      "output": {
        "id": 2709792,
        "query": null,
        "query_food": null,
        "reason": "Selected 'Mixed salad greens, raw' as a generic reference for the target small green salad; compatible base food (lettuce/leafy greens) and raw preparation with no incompatible additions. Other candidates are incompatible different foods: dressings, bean/pea/cabbage/fruit salads, meat/seafood/egg/potato salads."
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
        "reason": "SR Legacy generic reference 'Egg, whole, cooked, scrambled' matches the target plain scrambled egg preparation with no cheese, meat, or other additions; other caption foods are separate items."
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
        "reason": "Selected Survey (FNDDS) 'Coffee, brewed' as the generic plain black coffee preparation, with no milk, creamer, sugar, flavoring or alcohol, matching the target black coffee."
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
        "reason": "Target is plain toasted bread (Japanese shokupan toast). All Japanese-labeled candidates are different food categories (persimmons, soba/somen noodles, chestnuts, pickled cabbage, tea cookie) not bread. All toast-labeled candidates are incompatible varieties or compound recipes with extra components not in target (cheese, cinnamon, raisin, onion, potato, egg bread, barley/black/multigrain/oatmeal/pumpernickel/Cuban, shrimp toast, cinnamon cereal, melba/anisette/zwieback). No generic plain white toasted bread reference present, so no compatible selection; retry as broader category with preparation."
      },
      "error": null
    },
    {
      "name": "Tonkatsu",
      "currentQuery": "Tonkatsu",
      "retry": false,
      "output": {
        "id": null,
        "query": "breaded pork cutlet",
        "query_food": "pork",
        "reason": "Candidate 2581968 is seaweed snacks, a different food category from the target Tonkatsu (coated/fried pork cutlet). Rice and curry sauce in caption are separate foods, not part of this item. New search translates Tonkatsu to its base food and preparation with coating retained."
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
        "reason": "Target is Japanese toast alone; other caption foods are separate. 'Japanese' is a geographic descriptor for white shokupan-style toast. Selected Survey (FNDDS) 'Bread, white, toasted' is the same generic food and preparation (toasted white yeast bread), so geographic omission is allowed."
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
        "reason": "Selected generic Survey 'Curry sauce' as a generic reference for Japanese curry sauce: same food category (sauce) and cooked sauce preparation/physical form, with Japanese geographic descriptor omitted as same generic food. Other candidates are incompatible different foods with added meat/poultry/seafood/legume/vegetable/rice/noodles or isolated curry powder/teriyaki."
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
        "reason": "Selected Survey generic reference for the same plain food and preparation: white rice, cooked, with NS as to fat, compatible with target cooked white rice with no known added fat or other components."
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
        "reason": "Survey (FNDDS) generic reference 'Soup, lentil' matches the target whole dish with no extra meat, ham, curry, or canned/sodium specification; covers lentils as broth-based soup in same physical form."
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
        "reason": "Selected generic Survey (FNDDS) reference 'Fish, salmon, baked or broiled' - same food and preparation as target fillet of baked salmon, uncoated and cooked. Rejected coated, fried, grilled, raw, smoked, steamed, canned, mixed dishes and other species/preparations as incompatible."
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
        "reason": "Selected generic Survey (FNDDS) reference 'Apple, raw' is the same food and preparation as target raw apple with no incompatible variety or preparation."
      },
      "error": null
    },
    {
      "name": "Tonkatsu",
      "currentQuery": "coated +pork cutlet",
      "retry": true,
      "output": {
        "id": 2705876,
        "query": null,
        "query_food": null,
        "reason": "Selected Pork, steak, coated as generic reference for tonkatsu alone; boneless coated pork steak matches breaded pork cutlet preparation. Japanese curry sauce and white rice are caption context only and not part of this item."
      },
      "error": null
    },
    {
      "name": "cooked spaghetti",
      "currentQuery": "cooked spaghetti",
      "retry": false,
      "output": {
        "id": null,
        "query": "cooked pasta",
        "query_food": "pasta",
        "reason": "All candidates incompatible with plain cooked spaghetti: spaghetti squash records are a different vegetable, sauce records are a condiment not pasta, meatball/meat-sauce/frozen/canned/babyfood records add incompatible meat/sauce, spinach-cooked and protein-fortified-cooked are different formulations, and dry spaghetti records are raw vs required cooked. Need broader pasta-category cooked search."
      },
      "error": null
    },
    {
      "name": "Squid nigiri",
      "currentQuery": "Squid nigiri",
      "retry": false,
      "output": {
        "id": null,
        "query": "sushi with squid",
        "query_food": "sushi",
        "reason": "No candidate is a whole-dish squid sushi. Isolated squid records (raw, tubes, fried, calamari) are a topping alone and cannot represent rice+squid portion; other FNDDS sushi topped with salmon, shrimp, eel, crab, tuna, egg are different named species; Rice with squid Puerto Rican style is a different regional recipe, not assembled sushi; branded NIGIRI records are ambiguous or proprietary without squid coverage."
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
        "reason": "No compatible generic whole-dish record exists. Generic 2706818 is chicken caesar garden salad but explicitly 'no dressing' and lacks croutons, so it misses the named substantial component croutons and conflicts on dressing. 2709591 is Caesar salad with no chicken/dressing. 2706819 is breaded/fried not grilled. 173312 is McDonald's Bacon Ranch with bacon, different dressing/recipe. Branded 2422578 is a retail Deli Salad label explicitly covering grilled chicken + leaf lettuce + parmesan + croutons + Caesar dressing, matching all known components of grilled chicken Caesar salad with croutons without incompatible additions."
      },
      "error": null
    },
    {
      "name": "cooked spaghetti",
      "currentQuery": "cooked +pasta",
      "retry": true,
      "output": {
        "id": 2708357,
        "query": null,
        "query_food": null,
        "reason": "Selected Survey (FNDDS) 'Pasta, cooked' as a generic reference for plain cooked spaghetti; same plain cooked pasta preparation with no sauce or additions, compatible with target."
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
        "reason": "Target is Margherita pizza - crust with tomato sauce, mozzarella, basil. No compatible generic Foundation/Survey/SR Legacy whole-dish pizza in candidates. Survey hits are different foods/preparations: dessert pizza, Mexican pizza, pizza rolls, breakfast pizza with egg, pizza no cheese. SR Legacy hits are identifiable PIZZA HUT named-chain proprietary recipes, which cannot be used as a proxy for an unbranded whole dish. Branded MARGHERITA PIZZA records are exact-name retail fallbacks only if no compatible generic exists, which has not yet been tested. Searching broader compatible whole-dish category cheese pizza for an unbranded generic reference with tomato and cheese."
      },
      "error": null
    },
    {
      "name": "Squid nigiri",
      "currentQuery": "+sushi with squid",
      "retry": true,
      "output": {
        "id": 2708959,
        "query": null,
        "query_food": null,
        "reason": "Selected Sushi, NFS as a generic reference for the whole assembled dish: vinegared rice with seafood topping in nigiri/sushi form covers squid nigiri's known main components of rice base + squid topping with compatible raw/assembled form. Specific topped records (tuna, salmon, shrimp, crab, eel, egg) are rejected as different named species."
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
        "reason": "Caption states empty ceramic plate with no food. Ceramic plate is inedible tableware, not a food. All candidates are incompatible different foods using 'plate' as meat cut (beef/veal plate/skirt steak) or an unrelated restaurant dish, so no nutrition reference applies."
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
        "reason": "Generic SR Legacy whole-dish cheese pizza reference compatible with Margherita pizza: regular crust with cheese topping implies crust, tomato sauce, and cheese, covering the main components of Margherita (crust, tomato, mozzarella), with basil as minor seasoning variation. Named PIZZA HUT recipes were not used."
      },
      "error": null
    }
  ],
  "elapsedMs": 33256,
  "usdaRequests": 21
}
```
