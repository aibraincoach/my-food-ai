# 2026 11 01 food results

Sanitized production observations. Portion amounts are estimates.

```json
[
  {
    "label": "before",
    "case": "breakfast",
    "id": "eed95180-7361-4e2b-ac99-1e3e244f9ba9",
    "items": [
      {
        "name": "Japanese toast",
        "portion_grams": 60,
        "hasMask": false,
        "calories": 175.79999999999998,
        "protein_g": 6.215999999999999,
        "carbs_g": 32.442,
        "fat_g": 2.364,
        "source_ref": "2707599"
      },
      {
        "name": "ham",
        "portion_grams": 10,
        "hasMask": false,
        "calories": 11.700000000000001,
        "protein_g": 1.904,
        "carbs_g": 0.15800000000000003,
        "fat_g": 0.387,
        "source_ref": "2705878"
      },
      {
        "name": "green salad",
        "portion_grams": 40,
        "hasMask": false,
        "calories": 8.4,
        "protein_g": 0.524,
        "carbs_g": 1.372,
        "fat_g": 0.084,
        "source_ref": "2709792"
      },
      {
        "name": "scrambled egg",
        "portion_grams": 50,
        "hasMask": false,
        "calories": 74.5,
        "protein_g": 4.995,
        "carbs_g": 0.805,
        "fat_g": 5.5,
        "source_ref": "172187"
      },
      {
        "name": "black coffee",
        "portion_grams": 240,
        "hasMask": false,
        "calories": 2.4,
        "protein_g": 0.288,
        "carbs_g": 0,
        "fat_g": 0.048,
        "source_ref": "2710375"
      }
    ],
    "totalKcal": 272.8,
    "unavailable": [],
    "resolutions": [
      {
        "request": {
          "event": "food_resolution",
          "name": "ham",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Generic Survey (FNDDS) 'Ham' in Cold cuts and cured meats matches the target plain small slice of ham with no stated cooking or variety; no incompatible preparation, species, or added components.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "green salad",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Selected Survey record Mixed salad greens, raw as a generic reference for the target green/small salad: same generic food and raw preparation with no incompatible additions like meat, seafood, egg, cheese, bacon, dressing, or beans, compatible with caption's plain small salad side.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "scrambled egg",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "SR Legacy generic record 'Egg, whole, cooked, scrambled' matches the plain target one scrambled egg with cooked preparation and no cheese, meat, or tomatoes; other caption foods are separate items.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "black coffee",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Selected 'Coffee, brewed' as generic reference for plain black coffee with no milk, cream, sugar, or flavoring. Compatible Survey preparation; other candidates add milk (Cappuccino/Latte/Mocha/macchiato/pre-lightened), sugar/flavor, decaffeination, different preparation (espresso/Turkish/Cuban/instant), cold form (Iced/bottled/frozen), or different food (substitute/chicory/creamer/alcoholic/bread).",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Japanese toast",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Selected generic reference Bread, white, toasted as same generic food and preparation as Japanese toast with geographic descriptor omitted; toasted white yeast bread matches known form with no incompatible ingredients, other caption foods ham/salad/egg/coffee are separate items.",
          "searches": 2
        }
      }
    ]
  },
  {
    "label": "before",
    "case": "curry",
    "id": "3b9b5bac-33a5-4959-bf54-4b1613a93c32",
    "items": [
      {
        "name": "Tonkatsu",
        "portion_grams": 180,
        "hasMask": false,
        "calories": 495,
        "protein_g": 43.488,
        "carbs_g": 12.96,
        "fat_g": 28.44,
        "source_ref": "2705876"
      },
      {
        "name": "Japanese curry sauce",
        "portion_grams": 200,
        "hasMask": false,
        "calories": 190,
        "protein_g": 2.78,
        "carbs_g": 10.06,
        "fat_g": 16.44,
        "source_ref": "2710178"
      },
      {
        "name": "Cooked white rice",
        "portion_grams": 300,
        "hasMask": false,
        "calories": 387,
        "protein_g": 8.01,
        "carbs_g": 83.97,
        "fat_g": 0.8400000000000001,
        "source_ref": "2708403"
      }
    ],
    "totalKcal": 1072,
    "unavailable": [],
    "resolutions": [
      {
        "request": {
          "event": "food_resolution",
          "name": "Cooked white rice",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Selected Survey (FNDDS) generic reference Rice, white, cooked, NS as to fat for plain cooked white rice - same base food and cooked preparation with unspecified fat, no incompatible ingredients; other caption foods tonkatsu and curry sauce are not part of this portion.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Japanese curry sauce",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Selected Survey (FNDDS) 'Curry sauce' as generic reference for Japanese curry sauce: same generic cooked sauce food and preparation with compatible physical form, geographic descriptor omitted. Other candidates are different categories, species, or preparations: cookies, fruits, noodles, nuts, teriyaki/cheese sauce, curry powder spice, meat/poultry/seafood/legume/vegetable curry mixed dishes, or Thai and noodle branded recipes.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Tonkatsu",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Target is tonkatsu alone; curry sauce and rice are separate caption context, not part of portion. 'Pork, steak, coated' is a generic reference for the same food and preparation: boneless breaded/coated cooked pork cutlet, matching tonkatsu form better than bone-in chop, omitting only the Japanese geographic descriptor.",
          "searches": 2
        }
      }
    ]
  },
  {
    "label": "before",
    "case": "03.jpg",
    "id": "d9410a54-8168-4f82-8c61-3f61dd6bd712",
    "items": [
      {
        "name": "Gunkan sushi with salmon roe and minced tuna",
        "portion_grams": 185,
        "hasMask": true,
        "calories": 173.9,
        "protein_g": 5.402,
        "carbs_g": 34.0215,
        "fat_g": 1.2395,
        "source_ref": "2708959"
      },
      {
        "name": "Tuna nigiri",
        "portion_grams": 105,
        "hasMask": true,
        "calories": 105,
        "protein_g": 10.143,
        "carbs_g": 14.059500000000002,
        "fat_g": 0.3045,
        "source_ref": "2708971"
      },
      {
        "name": "Assorted white fish, squid, octopus, clam and scallop nigiri",
        "portion_grams": 460,
        "hasMask": true,
        "calories": 432.4,
        "protein_g": 13.431999999999999,
        "carbs_g": 84.594,
        "fat_g": 3.082,
        "source_ref": "2708959"
      },
      {
        "name": "Tuna hosomaki rolls",
        "portion_grams": 150,
        "hasMask": true,
        "calories": 145.5,
        "protein_g": 11.100000000000001,
        "carbs_g": 22.950000000000003,
        "fat_g": 0.39,
        "source_ref": "2708965"
      },
      {
        "name": "Tamagoyaki nigiri",
        "portion_grams": 110,
        "hasMask": true,
        "calories": 130.9,
        "protein_g": 8.052000000000001,
        "carbs_g": 11.275,
        "fat_g": 5.753000000000001,
        "source_ref": "2708972"
      },
      {
        "name": "Pickled ginger",
        "portion_grams": 20,
        "hasMask": true,
        "calories": 4,
        "protein_g": 0.066,
        "carbs_g": 0.9660000000000001,
        "fat_g": 0.020000000000000004,
        "source_ref": "2710082"
      },
      {
        "name": "Cucumber hosomaki rolls",
        "portion_grams": 110,
        "hasMask": true,
        "calories": 102.30000000000001,
        "protein_g": 1.9800000000000002,
        "carbs_g": 19.415,
        "fat_g": 1.617,
        "source_ref": "2708966"
      },
      {
        "name": "Salmon nigiri",
        "portion_grams": 70,
        "hasMask": true,
        "calories": 74.89999999999999,
        "protein_g": 6.244,
        "carbs_g": 9.373,
        "fat_g": 1.218,
        "source_ref": "2708969"
      },
      {
        "name": "Shrimp nigiri",
        "portion_grams": 150,
        "hasMask": true,
        "calories": 154.5,
        "protein_g": 13.649999999999999,
        "carbs_g": 20.865000000000002,
        "fat_g": 1.0499999999999998,
        "source_ref": "2708970"
      }
    ],
    "totalKcal": 1323.4,
    "unavailable": [],
    "resolutions": [
      {
        "request": {
          "event": "food_resolution",
          "name": "Tuna nigiri",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Selected Survey (FNDDS) generic reference 'Sushi, topped with tuna' as whole-dish match for tuna nigiri: covers sushi rice base assembled/topped with tuna, matching known main components (cooked vinegared rice + raw tuna slice) and assembled topped form with no incompatible additions, preferred over isolated tuna fish records and tuna roll variant.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Tuna hosomaki rolls",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Generic Survey reference 'Sushi roll tuna' is a broader generic whole-dish version of tuna hosomaki rolls with compatible raw preparation and rolled assembled form, covering the main components tuna, seasoned rice, and nori, unlike isolated tuna ingredients, tuna salads/sandwiches, avocado roll, nigiri topped with tuna, or bread rolls.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Gunkan sushi with salmon roe and minced tuna",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Selected Survey (FNDDS) Sushi, NFS as a generic reference for assembled sushi. It is a broader whole-dish of vinegared rice with nori and raw fish topping, same raw preparation and assembled topped/boat form, covering both named substantial components - salmon roe and minced tuna - with no incompatible additions or explicit exclusions.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Tamagoyaki nigiri",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Survey (FNDDS) 'Sushi, topped with egg' is a generic reference for egg nigiri, covering the whole assembled dish: sushi rice base topped with cooked egg, matching tamagoyaki nigiri preparation and assembled form. Other Survey records are different species/toppings (salmon, shrimp, eel, crab, tuna) and branded records are unnecessary fallbacks.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Shrimp nigiri",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Survey (FNDDS) generic reference 'Sushi, topped with shrimp' is a generic reference covering the whole assembled dish: seasoned rice base with shrimp topping, matching shrimp nigiri ingredients, cooked preparation and assembled sushi form.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Assorted white fish, squid, octopus, clam and scallop nigiri",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Selected Sushi, NFS as a generic reference for assorted nigiri. It is a broader Survey whole-dish record for sushi in assembled topped form with cooked rice plus seafood topping, which covers the known main components of white fish, squid, octopus, clam and scallop nigiri without a conflicting species or roll-form preparation.",
          "searches": 2
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Pickled ginger",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Selected generic Survey (FNDDS) reference 'Ginger root, pickled' is the same plain food and preparation as target Pickled ginger, preferred over branded records.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Salmon nigiri",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Generic Survey reference 'Sushi, topped with salmon' matches the assembled salmon nigiri form, covering both main components: vinegared sushi rice base topped with salmon, unlike raw salmon fillet records or salmon roll. It is a generic reference, not a proprietary recipe.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Cucumber hosomaki rolls",
          "matcherVersion": "fdc-reference-v3"
        },
        "response": {
          "source": "selected",
          "reason": "Selected Survey (FNDDS) Sushi roll, vegetable as a generic reference for cucumber hosomaki rolls. Whole-dish assembled sushi roll covering nori, seasoned sushi rice, and raw vegetable filling with cucumber as the vegetable component, same assembled raw-vegetable form and preparation; broader vegetable filling accepted as generic version of the target.",
          "searches": 2
        }
      }
    ]
  },
  {
    "label": "after",
    "case": "breakfast",
    "id": "af17c93d-abc8-4b40-9939-13d3ee09d98c",
    "items": [
      {
        "name": "Japanese toast",
        "portion_grams": 60,
        "hasMask": false,
        "calories": 175.79999999999998,
        "protein_g": 6.215999999999999,
        "carbs_g": 32.442,
        "fat_g": 2.364,
        "source_ref": "2707599"
      },
      {
        "name": "ham",
        "portion_grams": 10,
        "hasMask": false,
        "calories": 11.700000000000001,
        "protein_g": 1.904,
        "carbs_g": 0.15800000000000003,
        "fat_g": 0.387,
        "source_ref": "2705878"
      },
      {
        "name": "green salad",
        "portion_grams": 40,
        "hasMask": false,
        "calories": 8.4,
        "protein_g": 0.524,
        "carbs_g": 1.372,
        "fat_g": 0.084,
        "source_ref": "2709792"
      },
      {
        "name": "scrambled egg",
        "portion_grams": 50,
        "hasMask": false,
        "calories": 74.5,
        "protein_g": 4.995,
        "carbs_g": 0.805,
        "fat_g": 5.5,
        "source_ref": "172187"
      },
      {
        "name": "black coffee",
        "portion_grams": 240,
        "hasMask": false,
        "calories": 2.4,
        "protein_g": 0.288,
        "carbs_g": 0,
        "fat_g": 0.048,
        "source_ref": "2710375"
      }
    ],
    "totalKcal": 272.8,
    "unavailable": [],
    "resolutions": [
      {
        "request": {
          "event": "food_resolution",
          "name": "Japanese toast",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Selected generic Survey reference Bread, white, toasted as same generic food and preparation for Japanese toast (shokupan-style white bread, toasted); geographic descriptor omitted per rule. Target is plain toasted bread only; ham, salad, egg, coffee from caption are excluded.",
          "searches": 2
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "green salad",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Mixed salad greens, raw is a compatible generic reference for the target small green salad: same base food (lettuce/salad greens) and preparation (raw, uncoated, no dressing specified), with no incompatible additions.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "scrambled egg",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Selected SR Legacy generic record 'Egg, whole, cooked, scrambled' directly matches the target plain scrambled egg preparation with no incompatible additions; other foods in caption are excluded.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "ham",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Survey (FNDDS) generic 'Ham' in Cold cuts and cured meats matches the plain small slice of ham; other caption foods (toast, salad, egg, coffee) are separate items with no added preparation or components for this target.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "black coffee",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Selected Survey (FNDDS) 'Coffee, brewed' as generic reference for plain black coffee - same food and preparation with no milk, creamer, sugar, or flavoring, excluding cappuccino/latte/mocha/espresso and other incompatible preparations.",
          "searches": 1
        }
      }
    ]
  },
  {
    "label": "after",
    "case": "curry",
    "id": "b0f44479-904d-406b-add2-e28edeb71442",
    "items": [
      {
        "name": "Tonkatsu",
        "portion_grams": 200,
        "hasMask": false,
        "calories": 550,
        "protein_g": 48.32,
        "carbs_g": 14.4,
        "fat_g": 31.6,
        "source_ref": "2705876"
      },
      {
        "name": "Japanese curry sauce",
        "portion_grams": 240,
        "hasMask": false,
        "calories": 228,
        "protein_g": 3.336,
        "carbs_g": 12.072000000000001,
        "fat_g": 19.728,
        "source_ref": "2710178"
      },
      {
        "name": "Cooked white rice",
        "portion_grams": 350,
        "hasMask": false,
        "calories": 451.5,
        "protein_g": 9.344999999999999,
        "carbs_g": 97.96499999999999,
        "fat_g": 0.9800000000000001,
        "source_ref": "2708403"
      }
    ],
    "totalKcal": 1229.5,
    "unavailable": [],
    "resolutions": [
      {
        "request": {
          "event": "food_resolution",
          "name": "Tonkatsu",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Generic Survey (FNDDS) reference for coated pork steak, same base food and preparation as tonkatsu which is a coated/breaded pork cutlet; generic reference covers the target pork portion alone, with curry sauce and rice as separate foods not included.",
          "searches": 2
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Japanese curry sauce",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Generic Survey reference 'Curry sauce' is the same generic food and preparation as target Japanese curry sauce, with Japanese geographic descriptor omitted. It is a generic sauce reference covering the sauce alone, excluding tonkatsu and rice which are other meal foods.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Cooked white rice",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Target is plain cooked white rice as side to tonkatsu/curry; other caption foods are excluded. Selected Survey (FNDDS) record 'Rice, white, cooked, NS as to fat' is the compatible generic preparation with no specified added fat, matching the unspecified plain cooking method.",
          "searches": 1
        }
      }
    ]
  },
  {
    "label": "after",
    "case": "03.jpg",
    "id": "7b093288-f6b7-4d61-ae08-dc7deaa4f5be",
    "items": [
      {
        "name": "Pickled ginger",
        "portion_grams": 20,
        "hasMask": true,
        "calories": 4,
        "protein_g": 0.066,
        "carbs_g": 0.9660000000000001,
        "fat_g": 0.020000000000000004,
        "source_ref": "2710082"
      },
      {
        "name": "Tuna hosomaki rolls",
        "portion_grams": 150,
        "hasMask": true,
        "calories": 145.5,
        "protein_g": 11.100000000000001,
        "carbs_g": 22.950000000000003,
        "fat_g": 0.39,
        "source_ref": "2708965"
      },
      {
        "name": "Shrimp nigiri",
        "portion_grams": 150,
        "hasMask": true,
        "calories": 154.5,
        "protein_g": 13.649999999999999,
        "carbs_g": 20.865000000000002,
        "fat_g": 1.0499999999999998,
        "source_ref": "2708970"
      },
      {
        "name": "Assorted white fish, squid, octopus, clam and scallop nigiri",
        "portion_grams": 460,
        "hasMask": true,
        "calories": 432.4,
        "protein_g": 13.431999999999999,
        "carbs_g": 84.594,
        "fat_g": 3.082,
        "source_ref": "2708959"
      },
      {
        "name": "Tuna nigiri",
        "portion_grams": 105,
        "hasMask": true,
        "calories": 105,
        "protein_g": 10.143,
        "carbs_g": 14.059500000000002,
        "fat_g": 0.3045,
        "source_ref": "2708971"
      },
      {
        "name": "Cucumber hosomaki rolls",
        "portion_grams": 110,
        "hasMask": true,
        "calories": 102.30000000000001,
        "protein_g": 1.9800000000000002,
        "carbs_g": 19.415,
        "fat_g": 1.617,
        "source_ref": "2708966"
      },
      {
        "name": "Gunkan sushi with salmon roe and minced tuna",
        "portion_grams": 185,
        "hasMask": true,
        "calories": 173.9,
        "protein_g": 5.402,
        "carbs_g": 34.0215,
        "fat_g": 1.2395,
        "source_ref": "2708959"
      },
      {
        "name": "Tamagoyaki nigiri",
        "portion_grams": 110,
        "hasMask": true,
        "calories": 130.9,
        "protein_g": 8.052000000000001,
        "carbs_g": 11.275,
        "fat_g": 5.753000000000001,
        "source_ref": "2708972"
      },
      {
        "name": "Salmon nigiri",
        "portion_grams": 70,
        "hasMask": true,
        "calories": 74.89999999999999,
        "protein_g": 6.244,
        "carbs_g": 9.373,
        "fat_g": 1.218,
        "source_ref": "2708969"
      }
    ],
    "totalKcal": 1323.4,
    "unavailable": [],
    "resolutions": [
      {
        "request": {
          "event": "food_resolution",
          "name": "Tuna hosomaki rolls",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Generic Survey (FNDDS) whole-dish reference 'Sushi roll tuna' matches the target tuna hosomaki preparation and form - rolled sushi rice and nori assembled with raw tuna - and covers the known main components as a generic reference.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Shrimp nigiri",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Selected Survey generic reference 'Sushi, topped with shrimp' as broader generic whole-dish reference for shrimp nigiri; it covers the assembled form with cooked shrimp topping on sushi rice, matching known main components and cooked preparation with no incompatible ingredients.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Pickled ginger",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Generic Survey (FNDDS) record 'Ginger root, pickled' is the same food and preparation as target pickled ginger; sushi platter is context only.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Assorted white fish, squid, octopus, clam and scallop nigiri",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Selected Sushi, NFS as generic reference for assorted seafood nigiri. It is a generic Survey whole-dish record for assembled sushi (seasoned rice topped with seafood), which as a broader version covers the known main components: sushi rice base plus raw white fish, squid, octopus, clam and scallop toppings, compatible in mixed vs assembled form and raw vs cooked state. Specific topped records (tuna, salmon, shrimp, crab, eel, egg) and sushi rolls are rejected as different species or different rolled form.",
          "searches": 2
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Tuna nigiri",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Selected generic Survey (FNDDS) reference 'Sushi, topped with tuna' as generic whole-dish reference for tuna nigiri, covering vinegared sushi rice base topped with raw tuna slice, matching target preparation and form versus isolated tuna fish or tuna salad records or maki roll.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Cucumber hosomaki rolls",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Selected Survey generic reference 'Sushi roll, vegetable' as a generic broader version of the target cucumber hosomaki. It covers the whole-dish form: sushi rice + nori rolled around vegetable filling, which encompasses the known main components rice, nori, and cucumber with no incompatible fish/meat additions or different preparation.",
          "searches": 2
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Gunkan sushi with salmon roe and minced tuna",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Selected Survey Sushi, NFS as a generic reference for the assembled gunkan sushi. As a broader whole-dish sushi record it covers the vinegared-rice and seaweed gunkan base with raw fish/roe toppings, encompassing both named substantial components \u2013 minced tuna and salmon roe \u2013 in the same assembled raw physical form with no incompatible preparation or exclusion.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Tamagoyaki nigiri",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Selected generic Survey (FNDDS) reference 'Sushi, topped with egg' as a generic reference for tamagoyaki nigiri; it covers the whole dish of seasoned sushi rice topped with cooked egg, matching the known base and egg topping with no incompatible additions.",
          "searches": 1
        }
      },
      {
        "request": {
          "event": "food_resolution",
          "name": "Salmon nigiri",
          "matcherVersion": "fdc-reference-v4"
        },
        "response": {
          "source": "selected",
          "reason": "Generic Survey (FNDDS) whole-dish reference 'Sushi, topped with salmon' matches salmon nigiri form: vinegared sushi rice base topped with salmon, covering both main components (rice + raw salmon) as assembled nigiri, not just isolated fish.",
          "searches": 1
        }
      }
    ]
  }
]
```
