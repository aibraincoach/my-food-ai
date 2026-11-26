# #1175 deterministic control gate

PM ruled D-1175-G2 (plan35539ca1). Main before the change:e7234099 (the later1407 merge is tests only). Inputs:704names,851description literals. The broad crossing gate has1152unique protein decisions changing drop to pass; the original3014-row pair replay changes only the3intended red-bean-bun cases and no drops.

Full pre-choice comparison:1134new passes,each with a passing plain-bread control;18stay dropped by recordContradicts on both main and head;0new full drops;0new passes with a dropped control. The lists below contain every crossing and its control. These establish alignment with plain bread, not that an unrelated food is a good bread match: the chooser remains responsible for food compatibility. No model call or provider search was run.

Fixture limits: description-only inputs, no category, empty caption, synthetic SR Legacy gram basis and positive100kcal energy. The100kcal is a test operand, NOT USDA data or a density claim. Each comparison runs gramBasis,hasNutrition,energyFits,excludedComponents,referenceProteinMismatch and recordContradicts as match.ts applies them. All18drops are recordContradicts,not energy. Other imported filters are byte-identical to main. No production or stored-number recheck.

Controls: if the record description changes under the rewrite, use Rolls, dinner, plain with the same target. If the target changes, replace just its dish-word+bread phrase with the bread noun and retain other words. Apply both for a both-side change.

Reproduction and full per-filter results live at /home/opc/.openrig/shared-docs/rigs/myfoodai/state/build/1175/bread-style/: corpus.json,gate-replay.mjs,cross-probe.mjs,cross-probe.json,full-control-gate.mjs,FULL-CONTROL-GATE.json. The initial STOP was reported, then this exact comparison was authorized by the PM; no matching rule was widened.

## 1134 newly passing crossings with passing controls

| Target | Record | Control target | Control record | Main → head | Control |
|---|---|---|---|---|---|
| chicken satay with peanut sauce | Rolls, hamburger or hotdog, plain | chicken satay with peanut sauce | Rolls, dinner, plain | drop → pass | pass |
| chicken satay with peanut sauce | Roll, white, hamburger bun | chicken satay with peanut sauce | Rolls, dinner, plain | drop → pass | pass |
| chicken satay with peanut sauce | Rolls, hot dog | chicken satay with peanut sauce | Rolls, dinner, plain | drop → pass | pass |
| chicken satay with peanut sauce | Hamburger bun | chicken satay with peanut sauce | Rolls, dinner, plain | drop → pass | pass |
| chicken satay with peanut sauce | Roll, hot dog | chicken satay with peanut sauce | Rolls, dinner, plain | drop → pass | pass |
| lamb curry with rice | Rolls, hamburger or hotdog, plain | lamb curry with rice | Rolls, dinner, plain | drop → pass | pass |
| lamb curry with rice | Roll, white, hamburger bun | lamb curry with rice | Rolls, dinner, plain | drop → pass | pass |
| lamb curry with rice | Rolls, hot dog | lamb curry with rice | Rolls, dinner, plain | drop → pass | pass |
| lamb curry with rice | Hamburger bun | lamb curry with rice | Rolls, dinner, plain | drop → pass | pass |
| lamb curry with rice | Roll, hot dog | lamb curry with rice | Rolls, dinner, plain | drop → pass | pass |
| lamb curry | Rolls, hamburger or hotdog, plain | lamb curry | Rolls, dinner, plain | drop → pass | pass |
| lamb curry | Roll, white, hamburger bun | lamb curry | Rolls, dinner, plain | drop → pass | pass |
| lamb curry | Rolls, hot dog | lamb curry | Rolls, dinner, plain | drop → pass | pass |
| lamb curry | Hamburger bun | lamb curry | Rolls, dinner, plain | drop → pass | pass |
| lamb curry | Roll, hot dog | lamb curry | Rolls, dinner, plain | drop → pass | pass |
| fried egg | Rolls, hamburger or hotdog, plain | fried egg | Rolls, dinner, plain | drop → pass | pass |
| fried egg | Roll, white, hamburger bun | fried egg | Rolls, dinner, plain | drop → pass | pass |
| fried egg | Rolls, hot dog | fried egg | Rolls, dinner, plain | drop → pass | pass |
| fried egg | Hamburger bun | fried egg | Rolls, dinner, plain | drop → pass | pass |
| fried egg | Roll, hot dog | fried egg | Rolls, dinner, plain | drop → pass | pass |
| sweet and sour chicken | Rolls, hamburger or hotdog, plain | sweet and sour chicken | Rolls, dinner, plain | drop → pass | pass |
| sweet and sour chicken | Roll, white, hamburger bun | sweet and sour chicken | Rolls, dinner, plain | drop → pass | pass |
| sweet and sour chicken | Rolls, hot dog | sweet and sour chicken | Rolls, dinner, plain | drop → pass | pass |
| sweet and sour chicken | Hamburger bun | sweet and sour chicken | Rolls, dinner, plain | drop → pass | pass |
| sweet and sour chicken | Roll, hot dog | sweet and sour chicken | Rolls, dinner, plain | drop → pass | pass |
| chicken noodle soup | Rolls, hamburger or hotdog, plain | chicken noodle soup | Rolls, dinner, plain | drop → pass | pass |
| chicken noodle soup | Roll, white, hamburger bun | chicken noodle soup | Rolls, dinner, plain | drop → pass | pass |
| chicken noodle soup | Rolls, hot dog | chicken noodle soup | Rolls, dinner, plain | drop → pass | pass |
| chicken noodle soup | Hamburger bun | chicken noodle soup | Rolls, dinner, plain | drop → pass | pass |
| chicken noodle soup | Roll, hot dog | chicken noodle soup | Rolls, dinner, plain | drop → pass | pass |
| hot dog bun | Sushi roll, tuna | bun | Sushi roll, tuna | drop → pass | pass |
| hot dog bun | Spring roll, with shrimp | bun | Spring roll, with shrimp | drop → pass | pass |
| hot dog bun | Egg roll, chicken | bun | Egg roll, chicken | drop → pass | pass |
| hot dog bun | Sushi, roll, tuna | bun | Sushi, roll, tuna | drop → pass | pass |
| hot dog bun | Roll with meat and/or shrimp, vegetables and rice paper, not fried | bun | Roll with meat and/or shrimp, vegetables and rice paper, not fried | drop → pass | pass |
| burger bun | Sandwich, ham, on bun | bun | Sandwich, ham, on bun | drop → pass | pass |
| burger bun | Sushi roll, tuna | bun | Sushi roll, tuna | drop → pass | pass |
| burger bun | Egg roll, with pork | bun | Egg roll, with pork | drop → pass | pass |
| burger bun | Spring roll, with shrimp | bun | Spring roll, with shrimp | drop → pass | pass |
| burger bun | Egg roll, chicken | bun | Egg roll, chicken | drop → pass | pass |
| burger bun | Steamed bun, pork | bun | Steamed bun, pork | drop → pass | pass |
| burger bun | Sushi, roll, tuna | bun | Sushi, roll, tuna | drop → pass | pass |
| burger bun | Roll with meat and/or shrimp, vegetables and rice paper, not fried | bun | Roll with meat and/or shrimp, vegetables and rice paper, not fried | drop → pass | pass |
| butter chicken | Rolls, hamburger or hotdog, plain | butter chicken | Rolls, dinner, plain | drop → pass | pass |
| butter chicken | Roll, white, hamburger bun | butter chicken | Rolls, dinner, plain | drop → pass | pass |
| butter chicken | Rolls, hot dog | butter chicken | Rolls, dinner, plain | drop → pass | pass |
| butter chicken | Hamburger bun | butter chicken | Rolls, dinner, plain | drop → pass | pass |
| butter chicken | Roll, hot dog | butter chicken | Rolls, dinner, plain | drop → pass | pass |
| orange chicken | Rolls, hamburger or hotdog, plain | orange chicken | Rolls, dinner, plain | drop → pass | pass |
| orange chicken | Roll, white, hamburger bun | orange chicken | Rolls, dinner, plain | drop → pass | pass |
| orange chicken | Rolls, hot dog | orange chicken | Rolls, dinner, plain | drop → pass | pass |
| orange chicken | Hamburger bun | orange chicken | Rolls, dinner, plain | drop → pass | pass |
| orange chicken | Roll, hot dog | orange chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon chicken | Rolls, hamburger or hotdog, plain | lemon chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon chicken | Roll, white, hamburger bun | lemon chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon chicken | Rolls, hot dog | lemon chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon chicken | Hamburger bun | lemon chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon chicken | Roll, hot dog | lemon chicken | Rolls, dinner, plain | drop → pass | pass |
| pasta with pork and grated cheese | Roll, white, hamburger bun | pasta with pork and grated cheese | Rolls, dinner, plain | drop → pass | pass |
| pasta with pork and grated cheese | Hamburger bun | pasta with pork and grated cheese | Rolls, dinner, plain | drop → pass | pass |
| Pork sate stuffed with mushrooms | Roll, white, hamburger bun | Pork sate stuffed with mushrooms | Rolls, dinner, plain | drop → pass | pass |
| Pork sate stuffed with mushrooms | Hamburger bun | Pork sate stuffed with mushrooms | Rolls, dinner, plain | drop → pass | pass |
| Ikan dabu dabu fried fish | Rolls, hamburger or hotdog, plain | Ikan dabu dabu fried fish | Rolls, dinner, plain | drop → pass | pass |
| Ikan dabu dabu fried fish | Roll, white, hamburger bun | Ikan dabu dabu fried fish | Rolls, dinner, plain | drop → pass | pass |
| Ikan dabu dabu fried fish | Rolls, hot dog | Ikan dabu dabu fried fish | Rolls, dinner, plain | drop → pass | pass |
| Ikan dabu dabu fried fish | Hamburger bun | Ikan dabu dabu fried fish | Rolls, dinner, plain | drop → pass | pass |
| Ikan dabu dabu fried fish | Roll, hot dog | Ikan dabu dabu fried fish | Rolls, dinner, plain | drop → pass | pass |
| grilled chicken | Rolls, hamburger or hotdog, plain | grilled chicken | Rolls, dinner, plain | drop → pass | pass |
| grilled chicken | Roll, white, hamburger bun | grilled chicken | Rolls, dinner, plain | drop → pass | pass |
| grilled chicken | Rolls, hot dog | grilled chicken | Rolls, dinner, plain | drop → pass | pass |
| grilled chicken | Hamburger bun | grilled chicken | Rolls, dinner, plain | drop → pass | pass |
| grilled chicken | Roll, hot dog | grilled chicken | Rolls, dinner, plain | drop → pass | pass |
| fish oil capsule | Rolls, hamburger or hotdog, plain | fish oil capsule | Rolls, dinner, plain | drop → pass | pass |
| fish oil capsule | Roll, white, hamburger bun | fish oil capsule | Rolls, dinner, plain | drop → pass | pass |
| fish oil capsule | Rolls, hot dog | fish oil capsule | Rolls, dinner, plain | drop → pass | pass |
| fish oil capsule | Hamburger bun | fish oil capsule | Rolls, dinner, plain | drop → pass | pass |
| fish oil capsule | Roll, hot dog | fish oil capsule | Rolls, dinner, plain | drop → pass | pass |
| salmon | Rolls, hamburger or hotdog, plain | salmon | Rolls, dinner, plain | drop → pass | pass |
| salmon | Roll, white, hamburger bun | salmon | Rolls, dinner, plain | drop → pass | pass |
| salmon | Rolls, hot dog | salmon | Rolls, dinner, plain | drop → pass | pass |
| salmon | Hamburger bun | salmon | Rolls, dinner, plain | drop → pass | pass |
| salmon | Roll, hot dog | salmon | Rolls, dinner, plain | drop → pass | pass |
| chicken nuggets | Rolls, hamburger or hotdog, plain | chicken nuggets | Rolls, dinner, plain | drop → pass | pass |
| chicken nuggets | Roll, white, hamburger bun | chicken nuggets | Rolls, dinner, plain | drop → pass | pass |
| chicken nuggets | Rolls, hot dog | chicken nuggets | Rolls, dinner, plain | drop → pass | pass |
| chicken nuggets | Hamburger bun | chicken nuggets | Rolls, dinner, plain | drop → pass | pass |
| chicken nuggets | Roll, hot dog | chicken nuggets | Rolls, dinner, plain | drop → pass | pass |
| fish sticks | Rolls, hamburger or hotdog, plain | fish sticks | Rolls, dinner, plain | drop → pass | pass |
| fish sticks | Roll, white, hamburger bun | fish sticks | Rolls, dinner, plain | drop → pass | pass |
| fish sticks | Rolls, hot dog | fish sticks | Rolls, dinner, plain | drop → pass | pass |
| fish sticks | Hamburger bun | fish sticks | Rolls, dinner, plain | drop → pass | pass |
| fish sticks | Roll, hot dog | fish sticks | Rolls, dinner, plain | drop → pass | pass |
| ham sandwich | Roll, white, hamburger bun | ham sandwich | Rolls, dinner, plain | drop → pass | pass |
| ham sandwich | Hamburger bun | ham sandwich | Rolls, dinner, plain | drop → pass | pass |
| egg salad | Rolls, hamburger or hotdog, plain | egg salad | Rolls, dinner, plain | drop → pass | pass |
| egg salad | Roll, white, hamburger bun | egg salad | Rolls, dinner, plain | drop → pass | pass |
| egg salad | Rolls, hot dog | egg salad | Rolls, dinner, plain | drop → pass | pass |
| egg salad | Hamburger bun | egg salad | Rolls, dinner, plain | drop → pass | pass |
| egg salad | Roll, hot dog | egg salad | Rolls, dinner, plain | drop → pass | pass |
| tuna melt | Rolls, hamburger or hotdog, plain | tuna melt | Rolls, dinner, plain | drop → pass | pass |
| tuna melt | Roll, white, hamburger bun | tuna melt | Rolls, dinner, plain | drop → pass | pass |
| tuna melt | Rolls, hot dog | tuna melt | Rolls, dinner, plain | drop → pass | pass |
| tuna melt | Hamburger bun | tuna melt | Rolls, dinner, plain | drop → pass | pass |
| tuna melt | Roll, hot dog | tuna melt | Rolls, dinner, plain | drop → pass | pass |
| chicken fried rice | Rolls, hamburger or hotdog, plain | chicken fried rice | Rolls, dinner, plain | drop → pass | pass |
| chicken fried rice | Roll, white, hamburger bun | chicken fried rice | Rolls, dinner, plain | drop → pass | pass |
| chicken fried rice | Rolls, hot dog | chicken fried rice | Rolls, dinner, plain | drop → pass | pass |
| chicken fried rice | Hamburger bun | chicken fried rice | Rolls, dinner, plain | drop → pass | pass |
| chicken fried rice | Roll, hot dog | chicken fried rice | Rolls, dinner, plain | drop → pass | pass |
| nasi goreng with chicken | Rolls, hamburger or hotdog, plain | nasi goreng with chicken | Rolls, dinner, plain | drop → pass | pass |
| nasi goreng with chicken | Roll, white, hamburger bun | nasi goreng with chicken | Rolls, dinner, plain | drop → pass | pass |
| nasi goreng with chicken | Rolls, hot dog | nasi goreng with chicken | Rolls, dinner, plain | drop → pass | pass |
| nasi goreng with chicken | Hamburger bun | nasi goreng with chicken | Rolls, dinner, plain | drop → pass | pass |
| nasi goreng with chicken | Roll, hot dog | nasi goreng with chicken | Rolls, dinner, plain | drop → pass | pass |
| pad thai with shrimp | Rolls, hamburger or hotdog, plain | pad thai with shrimp | Rolls, dinner, plain | drop → pass | pass |
| pad thai with shrimp | Roll, white, hamburger bun | pad thai with shrimp | Rolls, dinner, plain | drop → pass | pass |
| pad thai with shrimp | Rolls, hot dog | pad thai with shrimp | Rolls, dinner, plain | drop → pass | pass |
| pad thai with shrimp | Hamburger bun | pad thai with shrimp | Rolls, dinner, plain | drop → pass | pass |
| pad thai with shrimp | Roll, hot dog | pad thai with shrimp | Rolls, dinner, plain | drop → pass | pass |
| chicken parmesan | Rolls, hamburger or hotdog, plain | chicken parmesan | Rolls, dinner, plain | drop → pass | pass |
| chicken parmesan | Roll, white, hamburger bun | chicken parmesan | Rolls, dinner, plain | drop → pass | pass |
| chicken parmesan | Rolls, hot dog | chicken parmesan | Rolls, dinner, plain | drop → pass | pass |
| chicken parmesan | Hamburger bun | chicken parmesan | Rolls, dinner, plain | drop → pass | pass |
| chicken parmesan | Roll, hot dog | chicken parmesan | Rolls, dinner, plain | drop → pass | pass |
| tuna | Rolls, hamburger or hotdog, plain | tuna | Rolls, dinner, plain | drop → pass | pass |
| tuna | Roll, white, hamburger bun | tuna | Rolls, dinner, plain | drop → pass | pass |
| tuna | Rolls, hot dog | tuna | Rolls, dinner, plain | drop → pass | pass |
| tuna | Hamburger bun | tuna | Rolls, dinner, plain | drop → pass | pass |
| tuna | Roll, hot dog | tuna | Rolls, dinner, plain | drop → pass | pass |
| cod | Rolls, hamburger or hotdog, plain | cod | Rolls, dinner, plain | drop → pass | pass |
| cod | Roll, white, hamburger bun | cod | Rolls, dinner, plain | drop → pass | pass |
| cod | Rolls, hot dog | cod | Rolls, dinner, plain | drop → pass | pass |
| cod | Hamburger bun | cod | Rolls, dinner, plain | drop → pass | pass |
| cod | Roll, hot dog | cod | Rolls, dinner, plain | drop → pass | pass |
| shrimp | Rolls, hamburger or hotdog, plain | shrimp | Rolls, dinner, plain | drop → pass | pass |
| shrimp | Roll, white, hamburger bun | shrimp | Rolls, dinner, plain | drop → pass | pass |
| shrimp | Rolls, hot dog | shrimp | Rolls, dinner, plain | drop → pass | pass |
| shrimp | Hamburger bun | shrimp | Rolls, dinner, plain | drop → pass | pass |
| shrimp | Roll, hot dog | shrimp | Rolls, dinner, plain | drop → pass | pass |
| prawn | Rolls, hamburger or hotdog, plain | prawn | Rolls, dinner, plain | drop → pass | pass |
| prawn | Roll, white, hamburger bun | prawn | Rolls, dinner, plain | drop → pass | pass |
| prawn | Rolls, hot dog | prawn | Rolls, dinner, plain | drop → pass | pass |
| prawn | Hamburger bun | prawn | Rolls, dinner, plain | drop → pass | pass |
| prawn | Roll, hot dog | prawn | Rolls, dinner, plain | drop → pass | pass |
| ham | Roll, white, hamburger bun | ham | Rolls, dinner, plain | drop → pass | pass |
| ham | Hamburger bun | ham | Rolls, dinner, plain | drop → pass | pass |
| egg noodles | Rolls, hamburger or hotdog, plain | egg noodles | Rolls, dinner, plain | drop → pass | pass |
| egg noodles | Roll, white, hamburger bun | egg noodles | Rolls, dinner, plain | drop → pass | pass |
| egg noodles | Rolls, hot dog | egg noodles | Rolls, dinner, plain | drop → pass | pass |
| egg noodles | Hamburger bun | egg noodles | Rolls, dinner, plain | drop → pass | pass |
| egg noodles | Roll, hot dog | egg noodles | Rolls, dinner, plain | drop → pass | pass |
| squid nigiri | Rolls, hamburger or hotdog, plain | squid nigiri | Rolls, dinner, plain | drop → pass | pass |
| squid nigiri | Roll, white, hamburger bun | squid nigiri | Rolls, dinner, plain | drop → pass | pass |
| squid nigiri | Rolls, hot dog | squid nigiri | Rolls, dinner, plain | drop → pass | pass |
| squid nigiri | Hamburger bun | squid nigiri | Rolls, dinner, plain | drop → pass | pass |
| squid nigiri | Roll, hot dog | squid nigiri | Rolls, dinner, plain | drop → pass | pass |
| pork chop | Roll, white, hamburger bun | pork chop | Rolls, dinner, plain | drop → pass | pass |
| pork chop | Hamburger bun | pork chop | Rolls, dinner, plain | drop → pass | pass |
| chicken curry | Rolls, hamburger or hotdog, plain | chicken curry | Rolls, dinner, plain | drop → pass | pass |
| chicken curry | Roll, white, hamburger bun | chicken curry | Rolls, dinner, plain | drop → pass | pass |
| chicken curry | Rolls, hot dog | chicken curry | Rolls, dinner, plain | drop → pass | pass |
| chicken curry | Hamburger bun | chicken curry | Rolls, dinner, plain | drop → pass | pass |
| chicken curry | Roll, hot dog | chicken curry | Rolls, dinner, plain | drop → pass | pass |
| bacon and eggs | Roll, white, hamburger bun | bacon and eggs | Rolls, dinner, plain | drop → pass | pass |
| bacon and eggs | Hamburger bun | bacon and eggs | Rolls, dinner, plain | drop → pass | pass |
| scrambled eggs with bacon | Roll, white, hamburger bun | scrambled eggs with bacon | Rolls, dinner, plain | drop → pass | pass |
| scrambled eggs with bacon | Hamburger bun | scrambled eggs with bacon | Rolls, dinner, plain | drop → pass | pass |
| ham and cheese omelet | Roll, white, hamburger bun | ham and cheese omelet | Rolls, dinner, plain | drop → pass | pass |
| ham and cheese omelet | Hamburger bun | ham and cheese omelet | Rolls, dinner, plain | drop → pass | pass |
| grilled fish | Rolls, hamburger or hotdog, plain | grilled fish | Rolls, dinner, plain | drop → pass | pass |
| grilled fish | Roll, white, hamburger bun | grilled fish | Rolls, dinner, plain | drop → pass | pass |
| grilled fish | Rolls, hot dog | grilled fish | Rolls, dinner, plain | drop → pass | pass |
| grilled fish | Hamburger bun | grilled fish | Rolls, dinner, plain | drop → pass | pass |
| grilled fish | Roll, hot dog | grilled fish | Rolls, dinner, plain | drop → pass | pass |
| fish fillet | Rolls, hamburger or hotdog, plain | fish fillet | Rolls, dinner, plain | drop → pass | pass |
| fish fillet | Roll, white, hamburger bun | fish fillet | Rolls, dinner, plain | drop → pass | pass |
| fish fillet | Rolls, hot dog | fish fillet | Rolls, dinner, plain | drop → pass | pass |
| fish fillet | Hamburger bun | fish fillet | Rolls, dinner, plain | drop → pass | pass |
| fish fillet | Roll, hot dog | fish fillet | Rolls, dinner, plain | drop → pass | pass |
| egg roll | Rolls, hamburger or hotdog, plain | egg roll | Rolls, dinner, plain | drop → pass | pass |
| egg roll | Roll, white, hamburger bun | egg roll | Rolls, dinner, plain | drop → pass | pass |
| egg roll | Rolls, hot dog | egg roll | Rolls, dinner, plain | drop → pass | pass |
| egg roll | Hamburger bun | egg roll | Rolls, dinner, plain | drop → pass | pass |
| egg roll | Roll, hot dog | egg roll | Rolls, dinner, plain | drop → pass | pass |
| imitation crab | Rolls, hamburger or hotdog, plain | imitation crab | Rolls, dinner, plain | drop → pass | pass |
| imitation crab | Roll, white, hamburger bun | imitation crab | Rolls, dinner, plain | drop → pass | pass |
| imitation crab | Rolls, hot dog | imitation crab | Rolls, dinner, plain | drop → pass | pass |
| imitation crab | Hamburger bun | imitation crab | Rolls, dinner, plain | drop → pass | pass |
| imitation crab | Roll, hot dog | imitation crab | Rolls, dinner, plain | drop → pass | pass |
| crab stick | Rolls, hamburger or hotdog, plain | crab stick | Rolls, dinner, plain | drop → pass | pass |
| crab stick | Roll, white, hamburger bun | crab stick | Rolls, dinner, plain | drop → pass | pass |
| crab stick | Rolls, hot dog | crab stick | Rolls, dinner, plain | drop → pass | pass |
| crab stick | Hamburger bun | crab stick | Rolls, dinner, plain | drop → pass | pass |
| crab stick | Roll, hot dog | crab stick | Rolls, dinner, plain | drop → pass | pass |
| salmon roe | Rolls, hamburger or hotdog, plain | salmon roe | Rolls, dinner, plain | drop → pass | pass |
| salmon roe | Roll, white, hamburger bun | salmon roe | Rolls, dinner, plain | drop → pass | pass |
| salmon roe | Rolls, hot dog | salmon roe | Rolls, dinner, plain | drop → pass | pass |
| salmon roe | Hamburger bun | salmon roe | Rolls, dinner, plain | drop → pass | pass |
| salmon roe | Roll, hot dog | salmon roe | Rolls, dinner, plain | drop → pass | pass |
| turkey bacon | Roll, white, hamburger bun | turkey bacon | Rolls, dinner, plain | drop → pass | pass |
| turkey bacon | Hamburger bun | turkey bacon | Rolls, dinner, plain | drop → pass | pass |
| chicken liver | Rolls, hamburger or hotdog, plain | chicken liver | Rolls, dinner, plain | drop → pass | pass |
| chicken liver | Roll, white, hamburger bun | chicken liver | Rolls, dinner, plain | drop → pass | pass |
| chicken liver | Rolls, hot dog | chicken liver | Rolls, dinner, plain | drop → pass | pass |
| chicken liver | Hamburger bun | chicken liver | Rolls, dinner, plain | drop → pass | pass |
| chicken liver | Roll, hot dog | chicken liver | Rolls, dinner, plain | drop → pass | pass |
| chicken wings | Rolls, hamburger or hotdog, plain | chicken wings | Rolls, dinner, plain | drop → pass | pass |
| chicken wings | Roll, white, hamburger bun | chicken wings | Rolls, dinner, plain | drop → pass | pass |
| chicken wings | Rolls, hot dog | chicken wings | Rolls, dinner, plain | drop → pass | pass |
| chicken wings | Hamburger bun | chicken wings | Rolls, dinner, plain | drop → pass | pass |
| chicken wings | Roll, hot dog | chicken wings | Rolls, dinner, plain | drop → pass | pass |
| fish and chips | Rolls, hamburger or hotdog, plain | fish and chips | Rolls, dinner, plain | drop → pass | pass |
| fish and chips | Roll, white, hamburger bun | fish and chips | Rolls, dinner, plain | drop → pass | pass |
| fish and chips | Rolls, hot dog | fish and chips | Rolls, dinner, plain | drop → pass | pass |
| fish and chips | Hamburger bun | fish and chips | Rolls, dinner, plain | drop → pass | pass |
| fish and chips | Roll, hot dog | fish and chips | Rolls, dinner, plain | drop → pass | pass |
| chicken sausage | Roll, white, hamburger bun | chicken sausage | Rolls, dinner, plain | drop → pass | pass |
| chicken sausage | Hamburger bun | chicken sausage | Rolls, dinner, plain | drop → pass | pass |
| sausage and egg sandwich | Roll, white, hamburger bun | sausage and egg sandwich | Rolls, dinner, plain | drop → pass | pass |
| sausage and egg sandwich | Hamburger bun | sausage and egg sandwich | Rolls, dinner, plain | drop → pass | pass |
| chicken burger | Rolls, hamburger or hotdog, plain | chicken burger | Rolls, dinner, plain | drop → pass | pass |
| chicken burger | Roll, white, hamburger bun | chicken burger | Rolls, dinner, plain | drop → pass | pass |
| chicken burger | Rolls, hot dog | chicken burger | Rolls, dinner, plain | drop → pass | pass |
| chicken burger | Hamburger bun | chicken burger | Rolls, dinner, plain | drop → pass | pass |
| chicken burger | Roll, hot dog | chicken burger | Rolls, dinner, plain | drop → pass | pass |
| chicken satay | Rolls, hamburger or hotdog, plain | chicken satay | Rolls, dinner, plain | drop → pass | pass |
| chicken satay | Roll, white, hamburger bun | chicken satay | Rolls, dinner, plain | drop → pass | pass |
| chicken satay | Rolls, hot dog | chicken satay | Rolls, dinner, plain | drop → pass | pass |
| chicken satay | Hamburger bun | chicken satay | Rolls, dinner, plain | drop → pass | pass |
| chicken satay | Roll, hot dog | chicken satay | Rolls, dinner, plain | drop → pass | pass |
| pork bun | Roll, white, hamburger bun | pork bun | Rolls, dinner, plain | drop → pass | pass |
| pork bun | Hamburger bun | pork bun | Rolls, dinner, plain | drop → pass | pass |
| tuna sushi | Rolls, hamburger or hotdog, plain | tuna sushi | Rolls, dinner, plain | drop → pass | pass |
| tuna sushi | Roll, white, hamburger bun | tuna sushi | Rolls, dinner, plain | drop → pass | pass |
| tuna sushi | Rolls, hot dog | tuna sushi | Rolls, dinner, plain | drop → pass | pass |
| tuna sushi | Hamburger bun | tuna sushi | Rolls, dinner, plain | drop → pass | pass |
| tuna sushi | Roll, hot dog | tuna sushi | Rolls, dinner, plain | drop → pass | pass |
| prawn cocktail | Rolls, hamburger or hotdog, plain | prawn cocktail | Rolls, dinner, plain | drop → pass | pass |
| prawn cocktail | Roll, white, hamburger bun | prawn cocktail | Rolls, dinner, plain | drop → pass | pass |
| prawn cocktail | Rolls, hot dog | prawn cocktail | Rolls, dinner, plain | drop → pass | pass |
| prawn cocktail | Hamburger bun | prawn cocktail | Rolls, dinner, plain | drop → pass | pass |
| prawn cocktail | Roll, hot dog | prawn cocktail | Rolls, dinner, plain | drop → pass | pass |
| oyster sauce | Rolls, hamburger or hotdog, plain | oyster sauce | Rolls, dinner, plain | drop → pass | pass |
| oyster sauce | Roll, white, hamburger bun | oyster sauce | Rolls, dinner, plain | drop → pass | pass |
| oyster sauce | Rolls, hot dog | oyster sauce | Rolls, dinner, plain | drop → pass | pass |
| oyster sauce | Hamburger bun | oyster sauce | Rolls, dinner, plain | drop → pass | pass |
| oyster sauce | Roll, hot dog | oyster sauce | Rolls, dinner, plain | drop → pass | pass |
| fish sauce | Rolls, hamburger or hotdog, plain | fish sauce | Rolls, dinner, plain | drop → pass | pass |
| fish sauce | Roll, white, hamburger bun | fish sauce | Rolls, dinner, plain | drop → pass | pass |
| fish sauce | Rolls, hot dog | fish sauce | Rolls, dinner, plain | drop → pass | pass |
| fish sauce | Hamburger bun | fish sauce | Rolls, dinner, plain | drop → pass | pass |
| fish sauce | Roll, hot dog | fish sauce | Rolls, dinner, plain | drop → pass | pass |
| lobster roll | Rolls, hamburger or hotdog, plain | lobster roll | Rolls, dinner, plain | drop → pass | pass |
| lobster roll | Roll, white, hamburger bun | lobster roll | Rolls, dinner, plain | drop → pass | pass |
| lobster roll | Rolls, hot dog | lobster roll | Rolls, dinner, plain | drop → pass | pass |
| lobster roll | Hamburger bun | lobster roll | Rolls, dinner, plain | drop → pass | pass |
| lobster roll | Roll, hot dog | lobster roll | Rolls, dinner, plain | drop → pass | pass |
| pork | Roll, white, hamburger bun | pork | Rolls, dinner, plain | drop → pass | pass |
| pork | Hamburger bun | pork | Rolls, dinner, plain | drop → pass | pass |
| chicken | Rolls, hamburger or hotdog, plain | chicken | Rolls, dinner, plain | drop → pass | pass |
| chicken | Roll, white, hamburger bun | chicken | Rolls, dinner, plain | drop → pass | pass |
| chicken | Rolls, hot dog | chicken | Rolls, dinner, plain | drop → pass | pass |
| chicken | Hamburger bun | chicken | Rolls, dinner, plain | drop → pass | pass |
| chicken | Roll, hot dog | chicken | Rolls, dinner, plain | drop → pass | pass |
| duck | Rolls, hamburger or hotdog, plain | duck | Rolls, dinner, plain | drop → pass | pass |
| duck | Roll, white, hamburger bun | duck | Rolls, dinner, plain | drop → pass | pass |
| duck | Rolls, hot dog | duck | Rolls, dinner, plain | drop → pass | pass |
| duck | Hamburger bun | duck | Rolls, dinner, plain | drop → pass | pass |
| duck | Roll, hot dog | duck | Rolls, dinner, plain | drop → pass | pass |
| mussels with fries | Rolls, hamburger or hotdog, plain | mussels with fries | Rolls, dinner, plain | drop → pass | pass |
| mussels with fries | Roll, white, hamburger bun | mussels with fries | Rolls, dinner, plain | drop → pass | pass |
| mussels with fries | Rolls, hot dog | mussels with fries | Rolls, dinner, plain | drop → pass | pass |
| mussels with fries | Hamburger bun | mussels with fries | Rolls, dinner, plain | drop → pass | pass |
| mussels with fries | Roll, hot dog | mussels with fries | Rolls, dinner, plain | drop → pass | pass |
| fish burger | Rolls, hamburger or hotdog, plain | fish burger | Rolls, dinner, plain | drop → pass | pass |
| fish burger | Roll, white, hamburger bun | fish burger | Rolls, dinner, plain | drop → pass | pass |
| fish burger | Rolls, hot dog | fish burger | Rolls, dinner, plain | drop → pass | pass |
| fish burger | Hamburger bun | fish burger | Rolls, dinner, plain | drop → pass | pass |
| fish burger | Roll, hot dog | fish burger | Rolls, dinner, plain | drop → pass | pass |
| turkey burger | Rolls, hamburger or hotdog, plain | turkey burger | Rolls, dinner, plain | drop → pass | pass |
| turkey burger | Roll, white, hamburger bun | turkey burger | Rolls, dinner, plain | drop → pass | pass |
| turkey burger | Rolls, hot dog | turkey burger | Rolls, dinner, plain | drop → pass | pass |
| turkey burger | Hamburger bun | turkey burger | Rolls, dinner, plain | drop → pass | pass |
| turkey burger | Roll, hot dog | turkey burger | Rolls, dinner, plain | drop → pass | pass |
| chicken meatballs | Rolls, hamburger or hotdog, plain | chicken meatballs | Rolls, dinner, plain | drop → pass | pass |
| chicken meatballs | Roll, white, hamburger bun | chicken meatballs | Rolls, dinner, plain | drop → pass | pass |
| chicken meatballs | Rolls, hot dog | chicken meatballs | Rolls, dinner, plain | drop → pass | pass |
| chicken meatballs | Hamburger bun | chicken meatballs | Rolls, dinner, plain | drop → pass | pass |
| chicken meatballs | Roll, hot dog | chicken meatballs | Rolls, dinner, plain | drop → pass | pass |
| veggie burger | Rolls, hamburger or hotdog, plain | veggie burger | Rolls, dinner, plain | drop → pass | pass |
| veggie burger | Roll, white, hamburger bun | veggie burger | Rolls, dinner, plain | drop → pass | pass |
| veggie burger | Rolls, hot dog | veggie burger | Rolls, dinner, plain | drop → pass | pass |
| veggie burger | Hamburger bun | veggie burger | Rolls, dinner, plain | drop → pass | pass |
| veggie burger | Roll, hot dog | veggie burger | Rolls, dinner, plain | drop → pass | pass |
| salmon burger | Rolls, hamburger or hotdog, plain | salmon burger | Rolls, dinner, plain | drop → pass | pass |
| salmon burger | Roll, white, hamburger bun | salmon burger | Rolls, dinner, plain | drop → pass | pass |
| salmon burger | Rolls, hot dog | salmon burger | Rolls, dinner, plain | drop → pass | pass |
| salmon burger | Hamburger bun | salmon burger | Rolls, dinner, plain | drop → pass | pass |
| salmon burger | Roll, hot dog | salmon burger | Rolls, dinner, plain | drop → pass | pass |
| egg drop soup | Rolls, hamburger or hotdog, plain | egg drop soup | Rolls, dinner, plain | drop → pass | pass |
| egg drop soup | Roll, white, hamburger bun | egg drop soup | Rolls, dinner, plain | drop → pass | pass |
| egg drop soup | Rolls, hot dog | egg drop soup | Rolls, dinner, plain | drop → pass | pass |
| egg drop soup | Hamburger bun | egg drop soup | Rolls, dinner, plain | drop → pass | pass |
| egg drop soup | Roll, hot dog | egg drop soup | Rolls, dinner, plain | drop → pass | pass |
| chicken hot dog | Rolls, hamburger or hotdog, plain | chicken hot dog | Rolls, dinner, plain | drop → pass | pass |
| chicken hot dog | Roll, white, hamburger bun | chicken hot dog | Rolls, dinner, plain | drop → pass | pass |
| chicken hot dog | Rolls, hot dog | chicken hot dog | Rolls, dinner, plain | drop → pass | pass |
| chicken hot dog | Hamburger bun | chicken hot dog | Rolls, dinner, plain | drop → pass | pass |
| chicken hot dog | Roll, hot dog | chicken hot dog | Rolls, dinner, plain | drop → pass | pass |
| omelet | Rolls, hamburger or hotdog, plain | omelet | Rolls, dinner, plain | drop → pass | pass |
| omelet | Roll, white, hamburger bun | omelet | Rolls, dinner, plain | drop → pass | pass |
| omelet | Rolls, hot dog | omelet | Rolls, dinner, plain | drop → pass | pass |
| omelet | Hamburger bun | omelet | Rolls, dinner, plain | drop → pass | pass |
| omelet | Roll, hot dog | omelet | Rolls, dinner, plain | drop → pass | pass |
| scrambled eggs | Rolls, hamburger or hotdog, plain | scrambled eggs | Rolls, dinner, plain | drop → pass | pass |
| scrambled eggs | Roll, white, hamburger bun | scrambled eggs | Rolls, dinner, plain | drop → pass | pass |
| scrambled eggs | Rolls, hot dog | scrambled eggs | Rolls, dinner, plain | drop → pass | pass |
| scrambled eggs | Hamburger bun | scrambled eggs | Rolls, dinner, plain | drop → pass | pass |
| scrambled eggs | Roll, hot dog | scrambled eggs | Rolls, dinner, plain | drop → pass | pass |
| fish | Rolls, hamburger or hotdog, plain | fish | Rolls, dinner, plain | drop → pass | pass |
| fish | Roll, white, hamburger bun | fish | Rolls, dinner, plain | drop → pass | pass |
| fish | Rolls, hot dog | fish | Rolls, dinner, plain | drop → pass | pass |
| fish | Hamburger bun | fish | Rolls, dinner, plain | drop → pass | pass |
| fish | Roll, hot dog | fish | Rolls, dinner, plain | drop → pass | pass |
| ikura | Rolls, hamburger or hotdog, plain | ikura | Rolls, dinner, plain | drop → pass | pass |
| ikura | Roll, white, hamburger bun | ikura | Rolls, dinner, plain | drop → pass | pass |
| ikura | Rolls, hot dog | ikura | Rolls, dinner, plain | drop → pass | pass |
| ikura | Hamburger bun | ikura | Rolls, dinner, plain | drop → pass | pass |
| ikura | Roll, hot dog | ikura | Rolls, dinner, plain | drop → pass | pass |
| chicken fried chicken | Rolls, hamburger or hotdog, plain | chicken fried chicken | Rolls, dinner, plain | drop → pass | pass |
| chicken fried chicken | Roll, white, hamburger bun | chicken fried chicken | Rolls, dinner, plain | drop → pass | pass |
| chicken fried chicken | Rolls, hot dog | chicken fried chicken | Rolls, dinner, plain | drop → pass | pass |
| chicken fried chicken | Hamburger bun | chicken fried chicken | Rolls, dinner, plain | drop → pass | pass |
| chicken fried chicken | Roll, hot dog | chicken fried chicken | Rolls, dinner, plain | drop → pass | pass |
| tofu burger | Rolls, hamburger or hotdog, plain | tofu burger | Rolls, dinner, plain | drop → pass | pass |
| tofu burger | Roll, white, hamburger bun | tofu burger | Rolls, dinner, plain | drop → pass | pass |
| tofu burger | Rolls, hot dog | tofu burger | Rolls, dinner, plain | drop → pass | pass |
| tofu burger | Hamburger bun | tofu burger | Rolls, dinner, plain | drop → pass | pass |
| tofu burger | Roll, hot dog | tofu burger | Rolls, dinner, plain | drop → pass | pass |
| tempeh stir fry | Rolls, hamburger or hotdog, plain | tempeh stir fry | Rolls, dinner, plain | drop → pass | pass |
| tempeh stir fry | Roll, white, hamburger bun | tempeh stir fry | Rolls, dinner, plain | drop → pass | pass |
| tempeh stir fry | Rolls, hot dog | tempeh stir fry | Rolls, dinner, plain | drop → pass | pass |
| tempeh stir fry | Hamburger bun | tempeh stir fry | Rolls, dinner, plain | drop → pass | pass |
| tempeh stir fry | Roll, hot dog | tempeh stir fry | Rolls, dinner, plain | drop → pass | pass |
| beans and rice | Rolls, hamburger or hotdog, plain | beans and rice | Rolls, dinner, plain | drop → pass | pass |
| beans and rice | Roll, white, hamburger bun | beans and rice | Rolls, dinner, plain | drop → pass | pass |
| beans and rice | Rolls, hot dog | beans and rice | Rolls, dinner, plain | drop → pass | pass |
| beans and rice | Hamburger bun | beans and rice | Rolls, dinner, plain | drop → pass | pass |
| beans and rice | Roll, hot dog | beans and rice | Rolls, dinner, plain | drop → pass | pass |
| lentil soup | Rolls, hamburger or hotdog, plain | lentil soup | Rolls, dinner, plain | drop → pass | pass |
| lentil soup | Roll, white, hamburger bun | lentil soup | Rolls, dinner, plain | drop → pass | pass |
| lentil soup | Rolls, hot dog | lentil soup | Rolls, dinner, plain | drop → pass | pass |
| lentil soup | Hamburger bun | lentil soup | Rolls, dinner, plain | drop → pass | pass |
| lentil soup | Roll, hot dog | lentil soup | Rolls, dinner, plain | drop → pass | pass |
| shrimp fried rice | Rolls, hamburger or hotdog, plain | shrimp fried rice | Rolls, dinner, plain | drop → pass | pass |
| shrimp fried rice | Roll, white, hamburger bun | shrimp fried rice | Rolls, dinner, plain | drop → pass | pass |
| shrimp fried rice | Rolls, hot dog | shrimp fried rice | Rolls, dinner, plain | drop → pass | pass |
| shrimp fried rice | Hamburger bun | shrimp fried rice | Rolls, dinner, plain | drop → pass | pass |
| shrimp fried rice | Roll, hot dog | shrimp fried rice | Rolls, dinner, plain | drop → pass | pass |
| pork and shrimp dumpling | Roll, white, hamburger bun | pork and shrimp dumpling | Rolls, dinner, plain | drop → pass | pass |
| pork and shrimp dumpling | Hamburger bun | pork and shrimp dumpling | Rolls, dinner, plain | drop → pass | pass |
| sausage | Roll, white, hamburger bun | sausage | Rolls, dinner, plain | drop → pass | pass |
| sausage | Hamburger bun | sausage | Rolls, dinner, plain | drop → pass | pass |
| bacon | Roll, white, hamburger bun | bacon | Rolls, dinner, plain | drop → pass | pass |
| bacon | Hamburger bun | bacon | Rolls, dinner, plain | drop → pass | pass |
| octopus salad | Rolls, hamburger or hotdog, plain | octopus salad | Rolls, dinner, plain | drop → pass | pass |
| octopus salad | Roll, white, hamburger bun | octopus salad | Rolls, dinner, plain | drop → pass | pass |
| octopus salad | Rolls, hot dog | octopus salad | Rolls, dinner, plain | drop → pass | pass |
| octopus salad | Hamburger bun | octopus salad | Rolls, dinner, plain | drop → pass | pass |
| octopus salad | Roll, hot dog | octopus salad | Rolls, dinner, plain | drop → pass | pass |
| pasta with pork and cheese | Roll, white, hamburger bun | pasta with pork and cheese | Rolls, dinner, plain | drop → pass | pass |
| pasta with pork and cheese | Hamburger bun | pasta with pork and cheese | Rolls, dinner, plain | drop → pass | pass |
| bean sprouts | Rolls, hamburger or hotdog, plain | bean sprouts | Rolls, dinner, plain | drop → pass | pass |
| bean sprouts | Roll, white, hamburger bun | bean sprouts | Rolls, dinner, plain | drop → pass | pass |
| bean sprouts | Rolls, hot dog | bean sprouts | Rolls, dinner, plain | drop → pass | pass |
| bean sprouts | Hamburger bun | bean sprouts | Rolls, dinner, plain | drop → pass | pass |
| bean sprouts | Roll, hot dog | bean sprouts | Rolls, dinner, plain | drop → pass | pass |
| honey garlic chicken | Rolls, hamburger or hotdog, plain | honey garlic chicken | Rolls, dinner, plain | drop → pass | pass |
| honey garlic chicken | Roll, white, hamburger bun | honey garlic chicken | Rolls, dinner, plain | drop → pass | pass |
| honey garlic chicken | Rolls, hot dog | honey garlic chicken | Rolls, dinner, plain | drop → pass | pass |
| honey garlic chicken | Hamburger bun | honey garlic chicken | Rolls, dinner, plain | drop → pass | pass |
| honey garlic chicken | Roll, hot dog | honey garlic chicken | Rolls, dinner, plain | drop → pass | pass |
| garlic butter shrimp | Rolls, hamburger or hotdog, plain | garlic butter shrimp | Rolls, dinner, plain | drop → pass | pass |
| garlic butter shrimp | Roll, white, hamburger bun | garlic butter shrimp | Rolls, dinner, plain | drop → pass | pass |
| garlic butter shrimp | Rolls, hot dog | garlic butter shrimp | Rolls, dinner, plain | drop → pass | pass |
| garlic butter shrimp | Hamburger bun | garlic butter shrimp | Rolls, dinner, plain | drop → pass | pass |
| garlic butter shrimp | Roll, hot dog | garlic butter shrimp | Rolls, dinner, plain | drop → pass | pass |
| rice and beans | Rolls, hamburger or hotdog, plain | rice and beans | Rolls, dinner, plain | drop → pass | pass |
| rice and beans | Roll, white, hamburger bun | rice and beans | Rolls, dinner, plain | drop → pass | pass |
| rice and beans | Rolls, hot dog | rice and beans | Rolls, dinner, plain | drop → pass | pass |
| rice and beans | Hamburger bun | rice and beans | Rolls, dinner, plain | drop → pass | pass |
| rice and beans | Roll, hot dog | rice and beans | Rolls, dinner, plain | drop → pass | pass |
| egg fried rice | Rolls, hamburger or hotdog, plain | egg fried rice | Rolls, dinner, plain | drop → pass | pass |
| egg fried rice | Roll, white, hamburger bun | egg fried rice | Rolls, dinner, plain | drop → pass | pass |
| egg fried rice | Rolls, hot dog | egg fried rice | Rolls, dinner, plain | drop → pass | pass |
| egg fried rice | Hamburger bun | egg fried rice | Rolls, dinner, plain | drop → pass | pass |
| egg fried rice | Roll, hot dog | egg fried rice | Rolls, dinner, plain | drop → pass | pass |
| chicken and rice | Rolls, hamburger or hotdog, plain | chicken and rice | Rolls, dinner, plain | drop → pass | pass |
| chicken and rice | Roll, white, hamburger bun | chicken and rice | Rolls, dinner, plain | drop → pass | pass |
| chicken and rice | Rolls, hot dog | chicken and rice | Rolls, dinner, plain | drop → pass | pass |
| chicken and rice | Hamburger bun | chicken and rice | Rolls, dinner, plain | drop → pass | pass |
| chicken and rice | Roll, hot dog | chicken and rice | Rolls, dinner, plain | drop → pass | pass |
| soy sauce | Rolls, hamburger or hotdog, plain | soy sauce | Rolls, dinner, plain | drop → pass | pass |
| soy sauce | Roll, white, hamburger bun | soy sauce | Rolls, dinner, plain | drop → pass | pass |
| soy sauce | Rolls, hot dog | soy sauce | Rolls, dinner, plain | drop → pass | pass |
| soy sauce | Hamburger bun | soy sauce | Rolls, dinner, plain | drop → pass | pass |
| soy sauce | Roll, hot dog | soy sauce | Rolls, dinner, plain | drop → pass | pass |
| tandoori chicken | Rolls, hamburger or hotdog, plain | tandoori chicken | Rolls, dinner, plain | drop → pass | pass |
| tandoori chicken | Roll, white, hamburger bun | tandoori chicken | Rolls, dinner, plain | drop → pass | pass |
| tandoori chicken | Rolls, hot dog | tandoori chicken | Rolls, dinner, plain | drop → pass | pass |
| tandoori chicken | Hamburger bun | tandoori chicken | Rolls, dinner, plain | drop → pass | pass |
| tandoori chicken | Roll, hot dog | tandoori chicken | Rolls, dinner, plain | drop → pass | pass |
| chicken kebab | Rolls, hamburger or hotdog, plain | chicken kebab | Rolls, dinner, plain | drop → pass | pass |
| chicken kebab | Roll, white, hamburger bun | chicken kebab | Rolls, dinner, plain | drop → pass | pass |
| chicken kebab | Rolls, hot dog | chicken kebab | Rolls, dinner, plain | drop → pass | pass |
| chicken kebab | Hamburger bun | chicken kebab | Rolls, dinner, plain | drop → pass | pass |
| chicken kebab | Roll, hot dog | chicken kebab | Rolls, dinner, plain | drop → pass | pass |
| tofu stir fry | Rolls, hamburger or hotdog, plain | tofu stir fry | Rolls, dinner, plain | drop → pass | pass |
| tofu stir fry | Roll, white, hamburger bun | tofu stir fry | Rolls, dinner, plain | drop → pass | pass |
| tofu stir fry | Rolls, hot dog | tofu stir fry | Rolls, dinner, plain | drop → pass | pass |
| tofu stir fry | Hamburger bun | tofu stir fry | Rolls, dinner, plain | drop → pass | pass |
| tofu stir fry | Roll, hot dog | tofu stir fry | Rolls, dinner, plain | drop → pass | pass |
| tuna salad | Rolls, hamburger or hotdog, plain | tuna salad | Rolls, dinner, plain | drop → pass | pass |
| tuna salad | Roll, white, hamburger bun | tuna salad | Rolls, dinner, plain | drop → pass | pass |
| tuna salad | Rolls, hot dog | tuna salad | Rolls, dinner, plain | drop → pass | pass |
| tuna salad | Hamburger bun | tuna salad | Rolls, dinner, plain | drop → pass | pass |
| tuna salad | Roll, hot dog | tuna salad | Rolls, dinner, plain | drop → pass | pass |
| chicken salad | Rolls, hamburger or hotdog, plain | chicken salad | Rolls, dinner, plain | drop → pass | pass |
| chicken salad | Roll, white, hamburger bun | chicken salad | Rolls, dinner, plain | drop → pass | pass |
| chicken salad | Rolls, hot dog | chicken salad | Rolls, dinner, plain | drop → pass | pass |
| chicken salad | Hamburger bun | chicken salad | Rolls, dinner, plain | drop → pass | pass |
| chicken salad | Roll, hot dog | chicken salad | Rolls, dinner, plain | drop → pass | pass |
| salad with chicken | Rolls, hamburger or hotdog, plain | salad with chicken | Rolls, dinner, plain | drop → pass | pass |
| salad with chicken | Roll, white, hamburger bun | salad with chicken | Rolls, dinner, plain | drop → pass | pass |
| salad with chicken | Rolls, hot dog | salad with chicken | Rolls, dinner, plain | drop → pass | pass |
| salad with chicken | Hamburger bun | salad with chicken | Rolls, dinner, plain | drop → pass | pass |
| salad with chicken | Roll, hot dog | salad with chicken | Rolls, dinner, plain | drop → pass | pass |
| tomato egg | Rolls, hamburger or hotdog, plain | tomato egg | Rolls, dinner, plain | drop → pass | pass |
| tomato egg | Roll, white, hamburger bun | tomato egg | Rolls, dinner, plain | drop → pass | pass |
| tomato egg | Rolls, hot dog | tomato egg | Rolls, dinner, plain | drop → pass | pass |
| tomato egg | Hamburger bun | tomato egg | Rolls, dinner, plain | drop → pass | pass |
| tomato egg | Roll, hot dog | tomato egg | Rolls, dinner, plain | drop → pass | pass |
| salmon with lemon | Rolls, hamburger or hotdog, plain | salmon with lemon | Rolls, dinner, plain | drop → pass | pass |
| salmon with lemon | Roll, white, hamburger bun | salmon with lemon | Rolls, dinner, plain | drop → pass | pass |
| salmon with lemon | Rolls, hot dog | salmon with lemon | Rolls, dinner, plain | drop → pass | pass |
| salmon with lemon | Hamburger bun | salmon with lemon | Rolls, dinner, plain | drop → pass | pass |
| salmon with lemon | Roll, hot dog | salmon with lemon | Rolls, dinner, plain | drop → pass | pass |
| shrimp and lemon | Rolls, hamburger or hotdog, plain | shrimp and lemon | Rolls, dinner, plain | drop → pass | pass |
| shrimp and lemon | Roll, white, hamburger bun | shrimp and lemon | Rolls, dinner, plain | drop → pass | pass |
| shrimp and lemon | Rolls, hot dog | shrimp and lemon | Rolls, dinner, plain | drop → pass | pass |
| shrimp and lemon | Hamburger bun | shrimp and lemon | Rolls, dinner, plain | drop → pass | pass |
| shrimp and lemon | Roll, hot dog | shrimp and lemon | Rolls, dinner, plain | drop → pass | pass |
| lemon pepper chicken | Rolls, hamburger or hotdog, plain | lemon pepper chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon pepper chicken | Roll, white, hamburger bun | lemon pepper chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon pepper chicken | Rolls, hot dog | lemon pepper chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon pepper chicken | Hamburger bun | lemon pepper chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon pepper chicken | Roll, hot dog | lemon pepper chicken | Rolls, dinner, plain | drop → pass | pass |
| chili crab | Rolls, hamburger or hotdog, plain | chili crab | Rolls, dinner, plain | drop → pass | pass |
| chili crab | Roll, white, hamburger bun | chili crab | Rolls, dinner, plain | drop → pass | pass |
| chili crab | Rolls, hot dog | chili crab | Rolls, dinner, plain | drop → pass | pass |
| chili crab | Hamburger bun | chili crab | Rolls, dinner, plain | drop → pass | pass |
| chili crab | Roll, hot dog | chili crab | Rolls, dinner, plain | drop → pass | pass |
| lemon and chicken | Rolls, hamburger or hotdog, plain | lemon and chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and chicken | Roll, white, hamburger bun | lemon and chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and chicken | Rolls, hot dog | lemon and chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and chicken | Hamburger bun | lemon and chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and chicken | Roll, hot dog | lemon and chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and herb chicken | Rolls, hamburger or hotdog, plain | lemon and herb chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and herb chicken | Roll, white, hamburger bun | lemon and herb chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and herb chicken | Rolls, hot dog | lemon and herb chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and herb chicken | Hamburger bun | lemon and herb chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and herb chicken | Roll, hot dog | lemon and herb chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and herb roasted chicken | Rolls, hamburger or hotdog, plain | lemon and herb roasted chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and herb roasted chicken | Roll, white, hamburger bun | lemon and herb roasted chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and herb roasted chicken | Rolls, hot dog | lemon and herb roasted chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and herb roasted chicken | Hamburger bun | lemon and herb roasted chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and herb roasted chicken | Roll, hot dog | lemon and herb roasted chicken | Rolls, dinner, plain | drop → pass | pass |
| lemon and pepper salmon | Rolls, hamburger or hotdog, plain | lemon and pepper salmon | Rolls, dinner, plain | drop → pass | pass |
| lemon and pepper salmon | Roll, white, hamburger bun | lemon and pepper salmon | Rolls, dinner, plain | drop → pass | pass |
| lemon and pepper salmon | Rolls, hot dog | lemon and pepper salmon | Rolls, dinner, plain | drop → pass | pass |
| lemon and pepper salmon | Hamburger bun | lemon and pepper salmon | Rolls, dinner, plain | drop → pass | pass |
| lemon and pepper salmon | Roll, hot dog | lemon and pepper salmon | Rolls, dinner, plain | drop → pass | pass |
| lime and chili shrimp | Rolls, hamburger or hotdog, plain | lime and chili shrimp | Rolls, dinner, plain | drop → pass | pass |
| lime and chili shrimp | Roll, white, hamburger bun | lime and chili shrimp | Rolls, dinner, plain | drop → pass | pass |
| lime and chili shrimp | Rolls, hot dog | lime and chili shrimp | Rolls, dinner, plain | drop → pass | pass |
| lime and chili shrimp | Hamburger bun | lime and chili shrimp | Rolls, dinner, plain | drop → pass | pass |
| lime and chili shrimp | Roll, hot dog | lime and chili shrimp | Rolls, dinner, plain | drop → pass | pass |
| avocado and egg toast | Rolls, hamburger or hotdog, plain | avocado and egg toast | Rolls, dinner, plain | drop → pass | pass |
| avocado and egg toast | Roll, white, hamburger bun | avocado and egg toast | Rolls, dinner, plain | drop → pass | pass |
| avocado and egg toast | Rolls, hot dog | avocado and egg toast | Rolls, dinner, plain | drop → pass | pass |
| avocado and egg toast | Hamburger bun | avocado and egg toast | Rolls, dinner, plain | drop → pass | pass |
| avocado and egg toast | Roll, hot dog | avocado and egg toast | Rolls, dinner, plain | drop → pass | pass |
| grape and chicken salad | Rolls, hamburger or hotdog, plain | grape and chicken salad | Rolls, dinner, plain | drop → pass | pass |
| grape and chicken salad | Roll, white, hamburger bun | grape and chicken salad | Rolls, dinner, plain | drop → pass | pass |
| grape and chicken salad | Rolls, hot dog | grape and chicken salad | Rolls, dinner, plain | drop → pass | pass |
| grape and chicken salad | Hamburger bun | grape and chicken salad | Rolls, dinner, plain | drop → pass | pass |
| grape and chicken salad | Roll, hot dog | grape and chicken salad | Rolls, dinner, plain | drop → pass | pass |
| green beans | Rolls, hamburger or hotdog, plain | green beans | Rolls, dinner, plain | drop → pass | pass |
| green beans | Roll, white, hamburger bun | green beans | Rolls, dinner, plain | drop → pass | pass |
| green beans | Rolls, hot dog | green beans | Rolls, dinner, plain | drop → pass | pass |
| green beans | Hamburger bun | green beans | Rolls, dinner, plain | drop → pass | pass |
| green beans | Roll, hot dog | green beans | Rolls, dinner, plain | drop → pass | pass |
| long beans | Rolls, hamburger or hotdog, plain | long beans | Rolls, dinner, plain | drop → pass | pass |
| long beans | Roll, white, hamburger bun | long beans | Rolls, dinner, plain | drop → pass | pass |
| long beans | Rolls, hot dog | long beans | Rolls, dinner, plain | drop → pass | pass |
| long beans | Hamburger bun | long beans | Rolls, dinner, plain | drop → pass | pass |
| long beans | Roll, hot dog | long beans | Rolls, dinner, plain | drop → pass | pass |
| tempeh | Rolls, hamburger or hotdog, plain | tempeh | Rolls, dinner, plain | drop → pass | pass |
| tempeh | Roll, white, hamburger bun | tempeh | Rolls, dinner, plain | drop → pass | pass |
| tempeh | Rolls, hot dog | tempeh | Rolls, dinner, plain | drop → pass | pass |
| tempeh | Hamburger bun | tempeh | Rolls, dinner, plain | drop → pass | pass |
| tempeh | Roll, hot dog | tempeh | Rolls, dinner, plain | drop → pass | pass |
| avocado with egg | Rolls, hamburger or hotdog, plain | avocado with egg | Rolls, dinner, plain | drop → pass | pass |
| avocado with egg | Roll, white, hamburger bun | avocado with egg | Rolls, dinner, plain | drop → pass | pass |
| avocado with egg | Rolls, hot dog | avocado with egg | Rolls, dinner, plain | drop → pass | pass |
| avocado with egg | Hamburger bun | avocado with egg | Rolls, dinner, plain | drop → pass | pass |
| avocado with egg | Roll, hot dog | avocado with egg | Rolls, dinner, plain | drop → pass | pass |
| butter beans | Rolls, hamburger or hotdog, plain | butter beans | Rolls, dinner, plain | drop → pass | pass |
| butter beans | Roll, white, hamburger bun | butter beans | Rolls, dinner, plain | drop → pass | pass |
| butter beans | Rolls, hot dog | butter beans | Rolls, dinner, plain | drop → pass | pass |
| butter beans | Hamburger bun | butter beans | Rolls, dinner, plain | drop → pass | pass |
| butter beans | Roll, hot dog | butter beans | Rolls, dinner, plain | drop → pass | pass |
| honey mustard chicken | Rolls, hamburger or hotdog, plain | honey mustard chicken | Rolls, dinner, plain | drop → pass | pass |
| honey mustard chicken | Roll, white, hamburger bun | honey mustard chicken | Rolls, dinner, plain | drop → pass | pass |
| honey mustard chicken | Rolls, hot dog | honey mustard chicken | Rolls, dinner, plain | drop → pass | pass |
| honey mustard chicken | Hamburger bun | honey mustard chicken | Rolls, dinner, plain | drop → pass | pass |
| honey mustard chicken | Roll, hot dog | honey mustard chicken | Rolls, dinner, plain | drop → pass | pass |
| egg sandwich | Rolls, hamburger or hotdog, plain | egg sandwich | Rolls, dinner, plain | drop → pass | pass |
| egg sandwich | Roll, white, hamburger bun | egg sandwich | Rolls, dinner, plain | drop → pass | pass |
| egg sandwich | Rolls, hot dog | egg sandwich | Rolls, dinner, plain | drop → pass | pass |
| egg sandwich | Hamburger bun | egg sandwich | Rolls, dinner, plain | drop → pass | pass |
| egg sandwich | Roll, hot dog | egg sandwich | Rolls, dinner, plain | drop → pass | pass |
| chili sauce chicken | Rolls, hamburger or hotdog, plain | chili sauce chicken | Rolls, dinner, plain | drop → pass | pass |
| chili sauce chicken | Roll, white, hamburger bun | chili sauce chicken | Rolls, dinner, plain | drop → pass | pass |
| chili sauce chicken | Rolls, hot dog | chili sauce chicken | Rolls, dinner, plain | drop → pass | pass |
| chili sauce chicken | Hamburger bun | chili sauce chicken | Rolls, dinner, plain | drop → pass | pass |
| chili sauce chicken | Roll, hot dog | chili sauce chicken | Rolls, dinner, plain | drop → pass | pass |
| teriyaki chicken | Rolls, hamburger or hotdog, plain | teriyaki chicken | Rolls, dinner, plain | drop → pass | pass |
| teriyaki chicken | Roll, white, hamburger bun | teriyaki chicken | Rolls, dinner, plain | drop → pass | pass |
| teriyaki chicken | Rolls, hot dog | teriyaki chicken | Rolls, dinner, plain | drop → pass | pass |
| teriyaki chicken | Hamburger bun | teriyaki chicken | Rolls, dinner, plain | drop → pass | pass |
| teriyaki chicken | Roll, hot dog | teriyaki chicken | Rolls, dinner, plain | drop → pass | pass |
| chicken breast | Rolls, hamburger or hotdog, plain | chicken breast | Rolls, dinner, plain | drop → pass | pass |
| chicken breast | Roll, white, hamburger bun | chicken breast | Rolls, dinner, plain | drop → pass | pass |
| chicken breast | Rolls, hot dog | chicken breast | Rolls, dinner, plain | drop → pass | pass |
| chicken breast | Hamburger bun | chicken breast | Rolls, dinner, plain | drop → pass | pass |
| chicken breast | Roll, hot dog | chicken breast | Rolls, dinner, plain | drop → pass | pass |
| nasi goreng with sunny-side-up egg | Rolls, hamburger or hotdog, plain | nasi goreng with sunny-side-up egg | Rolls, dinner, plain | drop → pass | pass |
| nasi goreng with sunny-side-up egg | Roll, white, hamburger bun | nasi goreng with sunny-side-up egg | Rolls, dinner, plain | drop → pass | pass |
| nasi goreng with sunny-side-up egg | Rolls, hot dog | nasi goreng with sunny-side-up egg | Rolls, dinner, plain | drop → pass | pass |
| nasi goreng with sunny-side-up egg | Hamburger bun | nasi goreng with sunny-side-up egg | Rolls, dinner, plain | drop → pass | pass |
| nasi goreng with sunny-side-up egg | Roll, hot dog | nasi goreng with sunny-side-up egg | Rolls, dinner, plain | drop → pass | pass |
| Tuna and black olive pain Suisse | Rolls, hamburger or hotdog, plain | Tuna and black olive pain Suisse | Rolls, dinner, plain | drop → pass | pass |
| Tuna and black olive pain Suisse | Roll, white, hamburger bun | Tuna and black olive pain Suisse | Rolls, dinner, plain | drop → pass | pass |
| Tuna and black olive pain Suisse | Rolls, hot dog | Tuna and black olive pain Suisse | Rolls, dinner, plain | drop → pass | pass |
| Tuna and black olive pain Suisse | Hamburger bun | Tuna and black olive pain Suisse | Rolls, dinner, plain | drop → pass | pass |
| Tuna and black olive pain Suisse | Roll, hot dog | Tuna and black olive pain Suisse | Rolls, dinner, plain | drop → pass | pass |
| Omelette | Rolls, hamburger or hotdog, plain | Omelette | Rolls, dinner, plain | drop → pass | pass |
| Omelette | Roll, white, hamburger bun | Omelette | Rolls, dinner, plain | drop → pass | pass |
| Omelette | Rolls, hot dog | Omelette | Rolls, dinner, plain | drop → pass | pass |
| Omelette | Hamburger bun | Omelette | Rolls, dinner, plain | drop → pass | pass |
| Omelette | Roll, hot dog | Omelette | Rolls, dinner, plain | drop → pass | pass |
| shrimp rice noodle roll | Rolls, hamburger or hotdog, plain | shrimp rice noodle roll | Rolls, dinner, plain | drop → pass | pass |
| shrimp rice noodle roll | Roll, white, hamburger bun | shrimp rice noodle roll | Rolls, dinner, plain | drop → pass | pass |
| shrimp rice noodle roll | Rolls, hot dog | shrimp rice noodle roll | Rolls, dinner, plain | drop → pass | pass |
| shrimp rice noodle roll | Hamburger bun | shrimp rice noodle roll | Rolls, dinner, plain | drop → pass | pass |
| shrimp rice noodle roll | Roll, hot dog | shrimp rice noodle roll | Rolls, dinner, plain | drop → pass | pass |
| Shrimp tempura with sauce | Rolls, hamburger or hotdog, plain | Shrimp tempura with sauce | Rolls, dinner, plain | drop → pass | pass |
| Shrimp tempura with sauce | Roll, white, hamburger bun | Shrimp tempura with sauce | Rolls, dinner, plain | drop → pass | pass |
| Shrimp tempura with sauce | Rolls, hot dog | Shrimp tempura with sauce | Rolls, dinner, plain | drop → pass | pass |
| Shrimp tempura with sauce | Hamburger bun | Shrimp tempura with sauce | Rolls, dinner, plain | drop → pass | pass |
| Shrimp tempura with sauce | Roll, hot dog | Shrimp tempura with sauce | Rolls, dinner, plain | drop → pass | pass |
| fried calamari | Rolls, hamburger or hotdog, plain | fried calamari | Rolls, dinner, plain | drop → pass | pass |
| fried calamari | Roll, white, hamburger bun | fried calamari | Rolls, dinner, plain | drop → pass | pass |
| fried calamari | Rolls, hot dog | fried calamari | Rolls, dinner, plain | drop → pass | pass |
| fried calamari | Hamburger bun | fried calamari | Rolls, dinner, plain | drop → pass | pass |
| fried calamari | Roll, hot dog | fried calamari | Rolls, dinner, plain | drop → pass | pass |
| salt and pepper battered baby squid | Rolls, hamburger or hotdog, plain | salt and pepper battered baby squid | Rolls, dinner, plain | drop → pass | pass |
| salt and pepper battered baby squid | Roll, white, hamburger bun | salt and pepper battered baby squid | Rolls, dinner, plain | drop → pass | pass |
| salt and pepper battered baby squid | Rolls, hot dog | salt and pepper battered baby squid | Rolls, dinner, plain | drop → pass | pass |
| salt and pepper battered baby squid | Hamburger bun | salt and pepper battered baby squid | Rolls, dinner, plain | drop → pass | pass |
| salt and pepper battered baby squid | Roll, hot dog | salt and pepper battered baby squid | Rolls, dinner, plain | drop → pass | pass |
| tuna rica (spicy shredded tuna with red | Rolls, hamburger or hotdog, plain | tuna rica (spicy shredded tuna with red | Rolls, dinner, plain | drop → pass | pass |
| tuna rica (spicy shredded tuna with red | Roll, white, hamburger bun | tuna rica (spicy shredded tuna with red | Rolls, dinner, plain | drop → pass | pass |
| tuna rica (spicy shredded tuna with red | Rolls, hot dog | tuna rica (spicy shredded tuna with red | Rolls, dinner, plain | drop → pass | pass |
| tuna rica (spicy shredded tuna with red | Hamburger bun | tuna rica (spicy shredded tuna with red | Rolls, dinner, plain | drop → pass | pass |
| tuna rica (spicy shredded tuna with red | Roll, hot dog | tuna rica (spicy shredded tuna with red | Rolls, dinner, plain | drop → pass | pass |
| Salmon bomb sushi with spicy topping and | Rolls, hamburger or hotdog, plain | Salmon bomb sushi with spicy topping and | Rolls, dinner, plain | drop → pass | pass |
| Salmon bomb sushi with spicy topping and | Roll, white, hamburger bun | Salmon bomb sushi with spicy topping and | Rolls, dinner, plain | drop → pass | pass |
| Salmon bomb sushi with spicy topping and | Rolls, hot dog | Salmon bomb sushi with spicy topping and | Rolls, dinner, plain | drop → pass | pass |
| Salmon bomb sushi with spicy topping and | Hamburger bun | Salmon bomb sushi with spicy topping and | Rolls, dinner, plain | drop → pass | pass |
| Salmon bomb sushi with spicy topping and | Roll, hot dog | Salmon bomb sushi with spicy topping and | Rolls, dinner, plain | drop → pass | pass |
| Salmon sashimi platter with garnishes | Rolls, hamburger or hotdog, plain | Salmon sashimi platter with garnishes | Rolls, dinner, plain | drop → pass | pass |
| Salmon sashimi platter with garnishes | Roll, white, hamburger bun | Salmon sashimi platter with garnishes | Rolls, dinner, plain | drop → pass | pass |
| Salmon sashimi platter with garnishes | Rolls, hot dog | Salmon sashimi platter with garnishes | Rolls, dinner, plain | drop → pass | pass |
| Salmon sashimi platter with garnishes | Hamburger bun | Salmon sashimi platter with garnishes | Rolls, dinner, plain | drop → pass | pass |
| Salmon sashimi platter with garnishes | Roll, hot dog | Salmon sashimi platter with garnishes | Rolls, dinner, plain | drop → pass | pass |
| assorted salmon sashimi | Rolls, hamburger or hotdog, plain | assorted salmon sashimi | Rolls, dinner, plain | drop → pass | pass |
| assorted salmon sashimi | Roll, white, hamburger bun | assorted salmon sashimi | Rolls, dinner, plain | drop → pass | pass |
| assorted salmon sashimi | Rolls, hot dog | assorted salmon sashimi | Rolls, dinner, plain | drop → pass | pass |
| assorted salmon sashimi | Hamburger bun | assorted salmon sashimi | Rolls, dinner, plain | drop → pass | pass |
| assorted salmon sashimi | Roll, hot dog | assorted salmon sashimi | Rolls, dinner, plain | drop → pass | pass |
| salmon nigiri | Rolls, hamburger or hotdog, plain | salmon nigiri | Rolls, dinner, plain | drop → pass | pass |
| salmon nigiri | Roll, white, hamburger bun | salmon nigiri | Rolls, dinner, plain | drop → pass | pass |
| salmon nigiri | Rolls, hot dog | salmon nigiri | Rolls, dinner, plain | drop → pass | pass |
| salmon nigiri | Hamburger bun | salmon nigiri | Rolls, dinner, plain | drop → pass | pass |
| salmon nigiri | Roll, hot dog | salmon nigiri | Rolls, dinner, plain | drop → pass | pass |
| grilled salmon | Rolls, hamburger or hotdog, plain | grilled salmon | Rolls, dinner, plain | drop → pass | pass |
| grilled salmon | Roll, white, hamburger bun | grilled salmon | Rolls, dinner, plain | drop → pass | pass |
| grilled salmon | Rolls, hot dog | grilled salmon | Rolls, dinner, plain | drop → pass | pass |
| grilled salmon | Hamburger bun | grilled salmon | Rolls, dinner, plain | drop → pass | pass |
| grilled salmon | Roll, hot dog | grilled salmon | Rolls, dinner, plain | drop → pass | pass |
| pork and rice | Roll, white, hamburger bun | pork and rice | Rolls, dinner, plain | drop → pass | pass |
| pork and rice | Hamburger bun | pork and rice | Rolls, dinner, plain | drop → pass | pass |
| red bean bun | Rolls, hamburger or hotdog, plain | red bean bun | Rolls, dinner, plain | drop → pass | pass |
| red bean bun | Roll, white, hamburger bun | red bean bun | Rolls, dinner, plain | drop → pass | pass |
| red bean bun | Rolls, hot dog | red bean bun | Rolls, dinner, plain | drop → pass | pass |
| red bean bun | Hamburger bun | red bean bun | Rolls, dinner, plain | drop → pass | pass |
| red bean bun | Roll, hot dog | red bean bun | Rolls, dinner, plain | drop → pass | pass |
| tuna sandwich | Rolls, hamburger or hotdog, plain | tuna sandwich | Rolls, dinner, plain | drop → pass | pass |
| tuna sandwich | Roll, white, hamburger bun | tuna sandwich | Rolls, dinner, plain | drop → pass | pass |
| tuna sandwich | Rolls, hot dog | tuna sandwich | Rolls, dinner, plain | drop → pass | pass |
| tuna sandwich | Hamburger bun | tuna sandwich | Rolls, dinner, plain | drop → pass | pass |
| tuna sandwich | Roll, hot dog | tuna sandwich | Rolls, dinner, plain | drop → pass | pass |
| tuna fried rice | Rolls, hamburger or hotdog, plain | tuna fried rice | Rolls, dinner, plain | drop → pass | pass |
| tuna fried rice | Roll, white, hamburger bun | tuna fried rice | Rolls, dinner, plain | drop → pass | pass |
| tuna fried rice | Rolls, hot dog | tuna fried rice | Rolls, dinner, plain | drop → pass | pass |
| tuna fried rice | Hamburger bun | tuna fried rice | Rolls, dinner, plain | drop → pass | pass |
| tuna fried rice | Roll, hot dog | tuna fried rice | Rolls, dinner, plain | drop → pass | pass |
| fried beans | Rolls, hamburger or hotdog, plain | fried beans | Rolls, dinner, plain | drop → pass | pass |
| fried beans | Roll, white, hamburger bun | fried beans | Rolls, dinner, plain | drop → pass | pass |
| fried beans | Rolls, hot dog | fried beans | Rolls, dinner, plain | drop → pass | pass |
| fried beans | Hamburger bun | fried beans | Rolls, dinner, plain | drop → pass | pass |
| fried beans | Roll, hot dog | fried beans | Rolls, dinner, plain | drop → pass | pass |
| fried tuna | Rolls, hamburger or hotdog, plain | fried tuna | Rolls, dinner, plain | drop → pass | pass |
| fried tuna | Roll, white, hamburger bun | fried tuna | Rolls, dinner, plain | drop → pass | pass |
| fried tuna | Rolls, hot dog | fried tuna | Rolls, dinner, plain | drop → pass | pass |
| fried tuna | Hamburger bun | fried tuna | Rolls, dinner, plain | drop → pass | pass |
| fried tuna | Roll, hot dog | fried tuna | Rolls, dinner, plain | drop → pass | pass |
| Lamb curry with rice | Rolls, hamburger or hotdog, plain | Lamb curry with rice | Rolls, dinner, plain | drop → pass | pass |
| Lamb curry with rice | Roll, white, hamburger bun | Lamb curry with rice | Rolls, dinner, plain | drop → pass | pass |
| Lamb curry with rice | Rolls, hot dog | Lamb curry with rice | Rolls, dinner, plain | drop → pass | pass |
| Lamb curry with rice | Hamburger bun | Lamb curry with rice | Rolls, dinner, plain | drop → pass | pass |
| Lamb curry with rice | Roll, hot dog | Lamb curry with rice | Rolls, dinner, plain | drop → pass | pass |
| Grilled chicken | Rolls, hamburger or hotdog, plain | Grilled chicken | Rolls, dinner, plain | drop → pass | pass |
| Grilled chicken | Roll, white, hamburger bun | Grilled chicken | Rolls, dinner, plain | drop → pass | pass |
| Grilled chicken | Rolls, hot dog | Grilled chicken | Rolls, dinner, plain | drop → pass | pass |
| Grilled chicken | Hamburger bun | Grilled chicken | Rolls, dinner, plain | drop → pass | pass |
| Grilled chicken | Roll, hot dog | Grilled chicken | Rolls, dinner, plain | drop → pass | pass |
| Pork soup dumpling | Roll, white, hamburger bun | Pork soup dumpling | Rolls, dinner, plain | drop → pass | pass |
| Pork soup dumpling | Hamburger bun | Pork soup dumpling | Rolls, dinner, plain | drop → pass | pass |
| Salmon sashimi | Rolls, hamburger or hotdog, plain | Salmon sashimi | Rolls, dinner, plain | drop → pass | pass |
| Salmon sashimi | Roll, white, hamburger bun | Salmon sashimi | Rolls, dinner, plain | drop → pass | pass |
| Salmon sashimi | Rolls, hot dog | Salmon sashimi | Rolls, dinner, plain | drop → pass | pass |
| Salmon sashimi | Hamburger bun | Salmon sashimi | Rolls, dinner, plain | drop → pass | pass |
| Salmon sashimi | Roll, hot dog | Salmon sashimi | Rolls, dinner, plain | drop → pass | pass |
| Fried egg | Rolls, hamburger or hotdog, plain | Fried egg | Rolls, dinner, plain | drop → pass | pass |
| Fried egg | Roll, white, hamburger bun | Fried egg | Rolls, dinner, plain | drop → pass | pass |
| Fried egg | Rolls, hot dog | Fried egg | Rolls, dinner, plain | drop → pass | pass |
| Fried egg | Hamburger bun | Fried egg | Rolls, dinner, plain | drop → pass | pass |
| Fried egg | Roll, hot dog | Fried egg | Rolls, dinner, plain | drop → pass | pass |
| Butter chicken | Rolls, hamburger or hotdog, plain | Butter chicken | Rolls, dinner, plain | drop → pass | pass |
| Butter chicken | Roll, white, hamburger bun | Butter chicken | Rolls, dinner, plain | drop → pass | pass |
| Butter chicken | Rolls, hot dog | Butter chicken | Rolls, dinner, plain | drop → pass | pass |
| Butter chicken | Hamburger bun | Butter chicken | Rolls, dinner, plain | drop → pass | pass |
| Butter chicken | Roll, hot dog | Butter chicken | Rolls, dinner, plain | drop → pass | pass |
| Chicken satay with peanut sauce | Rolls, hamburger or hotdog, plain | Chicken satay with peanut sauce | Rolls, dinner, plain | drop → pass | pass |
| Chicken satay with peanut sauce | Roll, white, hamburger bun | Chicken satay with peanut sauce | Rolls, dinner, plain | drop → pass | pass |
| Chicken satay with peanut sauce | Rolls, hot dog | Chicken satay with peanut sauce | Rolls, dinner, plain | drop → pass | pass |
| Chicken satay with peanut sauce | Hamburger bun | Chicken satay with peanut sauce | Rolls, dinner, plain | drop → pass | pass |
| Chicken satay with peanut sauce | Roll, hot dog | Chicken satay with peanut sauce | Rolls, dinner, plain | drop → pass | pass |
| Pork crackling | Roll, white, hamburger bun | Pork crackling | Rolls, dinner, plain | drop → pass | pass |
| Pork crackling | Hamburger bun | Pork crackling | Rolls, dinner, plain | drop → pass | pass |
| Honey glazed chicken | Rolls, hamburger or hotdog, plain | Honey glazed chicken | Rolls, dinner, plain | drop → pass | pass |
| Honey glazed chicken | Roll, white, hamburger bun | Honey glazed chicken | Rolls, dinner, plain | drop → pass | pass |
| Honey glazed chicken | Rolls, hot dog | Honey glazed chicken | Rolls, dinner, plain | drop → pass | pass |
| Honey glazed chicken | Hamburger bun | Honey glazed chicken | Rolls, dinner, plain | drop → pass | pass |
| Honey glazed chicken | Roll, hot dog | Honey glazed chicken | Rolls, dinner, plain | drop → pass | pass |
| Sushi roll, tuna | Rolls, hamburger or hotdog, plain | Sushi roll, tuna | Rolls, dinner, plain | drop → pass | pass |
| Sushi roll, tuna | Roll, white, hamburger bun | Sushi roll, tuna | Rolls, dinner, plain | drop → pass | pass |
| Sushi roll, tuna | Rolls, hot dog | Sushi roll, tuna | Rolls, dinner, plain | drop → pass | pass |
| Sushi roll, tuna | Hamburger bun | Sushi roll, tuna | Rolls, dinner, plain | drop → pass | pass |
| Sushi roll, tuna | Roll, hot dog | Sushi roll, tuna | Rolls, dinner, plain | drop → pass | pass |
| fried fish | Rolls, hamburger or hotdog, plain | fried fish | Rolls, dinner, plain | drop → pass | pass |
| fried fish | Roll, white, hamburger bun | fried fish | Rolls, dinner, plain | drop → pass | pass |
| fried fish | Rolls, hot dog | fried fish | Rolls, dinner, plain | drop → pass | pass |
| fried fish | Hamburger bun | fried fish | Rolls, dinner, plain | drop → pass | pass |
| fried fish | Roll, hot dog | fried fish | Rolls, dinner, plain | drop → pass | pass |
| prawn crackers | Rolls, hamburger or hotdog, plain | prawn crackers | Rolls, dinner, plain | drop → pass | pass |
| prawn crackers | Roll, white, hamburger bun | prawn crackers | Rolls, dinner, plain | drop → pass | pass |
| prawn crackers | Rolls, hot dog | prawn crackers | Rolls, dinner, plain | drop → pass | pass |
| prawn crackers | Hamburger bun | prawn crackers | Rolls, dinner, plain | drop → pass | pass |
| prawn crackers | Roll, hot dog | prawn crackers | Rolls, dinner, plain | drop → pass | pass |
| chicken and shrimp fried rice | Rolls, hamburger or hotdog, plain | chicken and shrimp fried rice | Rolls, dinner, plain | drop → pass | pass |
| chicken and shrimp fried rice | Roll, white, hamburger bun | chicken and shrimp fried rice | Rolls, dinner, plain | drop → pass | pass |
| chicken and shrimp fried rice | Rolls, hot dog | chicken and shrimp fried rice | Rolls, dinner, plain | drop → pass | pass |
| chicken and shrimp fried rice | Hamburger bun | chicken and shrimp fried rice | Rolls, dinner, plain | drop → pass | pass |
| chicken and shrimp fried rice | Roll, hot dog | chicken and shrimp fried rice | Rolls, dinner, plain | drop → pass | pass |
| pork dumpling | Roll, white, hamburger bun | pork dumpling | Rolls, dinner, plain | drop → pass | pass |
| pork dumpling | Hamburger bun | pork dumpling | Rolls, dinner, plain | drop → pass | pass |
| sausage roll | Roll, white, hamburger bun | sausage roll | Rolls, dinner, plain | drop → pass | pass |
| sausage roll | Hamburger bun | sausage roll | Rolls, dinner, plain | drop → pass | pass |
| calamari | Rolls, hamburger or hotdog, plain | calamari | Rolls, dinner, plain | drop → pass | pass |
| calamari | Roll, white, hamburger bun | calamari | Rolls, dinner, plain | drop → pass | pass |
| calamari | Rolls, hot dog | calamari | Rolls, dinner, plain | drop → pass | pass |
| calamari | Hamburger bun | calamari | Rolls, dinner, plain | drop → pass | pass |
| calamari | Roll, hot dog | calamari | Rolls, dinner, plain | drop → pass | pass |
| shrimp omelet | Rolls, hamburger or hotdog, plain | shrimp omelet | Rolls, dinner, plain | drop → pass | pass |
| shrimp omelet | Roll, white, hamburger bun | shrimp omelet | Rolls, dinner, plain | drop → pass | pass |
| shrimp omelet | Rolls, hot dog | shrimp omelet | Rolls, dinner, plain | drop → pass | pass |
| shrimp omelet | Hamburger bun | shrimp omelet | Rolls, dinner, plain | drop → pass | pass |
| shrimp omelet | Roll, hot dog | shrimp omelet | Rolls, dinner, plain | drop → pass | pass |
| chicken patty | Rolls, hamburger or hotdog, plain | chicken patty | Rolls, dinner, plain | drop → pass | pass |
| chicken patty | Roll, white, hamburger bun | chicken patty | Rolls, dinner, plain | drop → pass | pass |
| chicken patty | Rolls, hot dog | chicken patty | Rolls, dinner, plain | drop → pass | pass |
| chicken patty | Hamburger bun | chicken patty | Rolls, dinner, plain | drop → pass | pass |
| chicken patty | Roll, hot dog | chicken patty | Rolls, dinner, plain | drop → pass | pass |
| baked beans | Rolls, hamburger or hotdog, plain | baked beans | Rolls, dinner, plain | drop → pass | pass |
| baked beans | Roll, white, hamburger bun | baked beans | Rolls, dinner, plain | drop → pass | pass |
| baked beans | Rolls, hot dog | baked beans | Rolls, dinner, plain | drop → pass | pass |
| baked beans | Hamburger bun | baked beans | Rolls, dinner, plain | drop → pass | pass |
| baked beans | Roll, hot dog | baked beans | Rolls, dinner, plain | drop → pass | pass |
| tuna steak | Rolls, hamburger or hotdog, plain | tuna steak | Rolls, dinner, plain | drop → pass | pass |
| tuna steak | Roll, white, hamburger bun | tuna steak | Rolls, dinner, plain | drop → pass | pass |
| tuna steak | Rolls, hot dog | tuna steak | Rolls, dinner, plain | drop → pass | pass |
| tuna steak | Hamburger bun | tuna steak | Rolls, dinner, plain | drop → pass | pass |
| tuna steak | Roll, hot dog | tuna steak | Rolls, dinner, plain | drop → pass | pass |
| turkey meatballs | Rolls, hamburger or hotdog, plain | turkey meatballs | Rolls, dinner, plain | drop → pass | pass |
| turkey meatballs | Roll, white, hamburger bun | turkey meatballs | Rolls, dinner, plain | drop → pass | pass |
| turkey meatballs | Rolls, hot dog | turkey meatballs | Rolls, dinner, plain | drop → pass | pass |
| turkey meatballs | Hamburger bun | turkey meatballs | Rolls, dinner, plain | drop → pass | pass |
| turkey meatballs | Roll, hot dog | turkey meatballs | Rolls, dinner, plain | drop → pass | pass |
| lentil meatballs | Rolls, hamburger or hotdog, plain | lentil meatballs | Rolls, dinner, plain | drop → pass | pass |
| lentil meatballs | Roll, white, hamburger bun | lentil meatballs | Rolls, dinner, plain | drop → pass | pass |
| lentil meatballs | Rolls, hot dog | lentil meatballs | Rolls, dinner, plain | drop → pass | pass |
| lentil meatballs | Hamburger bun | lentil meatballs | Rolls, dinner, plain | drop → pass | pass |
| lentil meatballs | Roll, hot dog | lentil meatballs | Rolls, dinner, plain | drop → pass | pass |
| Fish, tuna, cooked | Rolls, hamburger or hotdog, plain | Fish, tuna, cooked | Rolls, dinner, plain | drop → pass | pass |
| Fish, tuna, cooked | Roll, white, hamburger bun | Fish, tuna, cooked | Rolls, dinner, plain | drop → pass | pass |
| Fish, tuna, cooked | Rolls, hot dog | Fish, tuna, cooked | Rolls, dinner, plain | drop → pass | pass |
| Fish, tuna, cooked | Hamburger bun | Fish, tuna, cooked | Rolls, dinner, plain | drop → pass | pass |
| Fish, tuna, cooked | Roll, hot dog | Fish, tuna, cooked | Rolls, dinner, plain | drop → pass | pass |
| chicken seasoning | Rolls, hamburger or hotdog, plain | chicken seasoning | Rolls, dinner, plain | drop → pass | pass |
| chicken seasoning | Roll, white, hamburger bun | chicken seasoning | Rolls, dinner, plain | drop → pass | pass |
| chicken seasoning | Rolls, hot dog | chicken seasoning | Rolls, dinner, plain | drop → pass | pass |
| chicken seasoning | Hamburger bun | chicken seasoning | Rolls, dinner, plain | drop → pass | pass |
| chicken seasoning | Roll, hot dog | chicken seasoning | Rolls, dinner, plain | drop → pass | pass |
| pork sate with mushrooms | Roll, white, hamburger bun | pork sate with mushrooms | Rolls, dinner, plain | drop → pass | pass |
| pork sate with mushrooms | Hamburger bun | pork sate with mushrooms | Rolls, dinner, plain | drop → pass | pass |
| ikan dabu dabu fried fish | Rolls, hamburger or hotdog, plain | ikan dabu dabu fried fish | Rolls, dinner, plain | drop → pass | pass |
| ikan dabu dabu fried fish | Roll, white, hamburger bun | ikan dabu dabu fried fish | Rolls, dinner, plain | drop → pass | pass |
| ikan dabu dabu fried fish | Rolls, hot dog | ikan dabu dabu fried fish | Rolls, dinner, plain | drop → pass | pass |
| ikan dabu dabu fried fish | Hamburger bun | ikan dabu dabu fried fish | Rolls, dinner, plain | drop → pass | pass |
| ikan dabu dabu fried fish | Roll, hot dog | ikan dabu dabu fried fish | Rolls, dinner, plain | drop → pass | pass |
| pork dish | Roll, white, hamburger bun | pork dish | Rolls, dinner, plain | drop → pass | pass |
| pork dish | Hamburger bun | pork dish | Rolls, dinner, plain | drop → pass | pass |
| chicken dish | Rolls, hamburger or hotdog, plain | chicken dish | Rolls, dinner, plain | drop → pass | pass |
| chicken dish | Roll, white, hamburger bun | chicken dish | Rolls, dinner, plain | drop → pass | pass |
| chicken dish | Rolls, hot dog | chicken dish | Rolls, dinner, plain | drop → pass | pass |
| chicken dish | Hamburger bun | chicken dish | Rolls, dinner, plain | drop → pass | pass |
| chicken dish | Roll, hot dog | chicken dish | Rolls, dinner, plain | drop → pass | pass |
| hot dog bun | Chicken, roasted | bun | Chicken, roasted | drop → pass | pass |
| hot dog bun | Lamb, ground, raw | bun | Lamb, ground, raw | drop → pass | pass |
| hot dog bun | Egg, whole, raw, fresh | bun | Egg, whole, raw, fresh | drop → pass | pass |
| hot dog bun | Chicken, sweet and sour | bun | Chicken, sweet and sour | drop → pass | pass |
| hot dog bun | Soup, chicken noodle, canned | bun | Soup, chicken noodle, canned | drop → pass | pass |
| hot dog bun | Fried fish with sauce, Puerto Rican style | bun | Fried fish with sauce, Puerto Rican style | drop → pass | pass |
| hot dog bun | Chicken, broilers or fryers, breast, raw | bun | Chicken, broilers or fryers, breast, raw | drop → pass | pass |
| hot dog bun | Fish, salmon, Atlantic, raw | bun | Fish, salmon, Atlantic, raw | drop → pass | pass |
| hot dog bun | Chicken, broilers or fryers, nuggets, fried | bun | Chicken, broilers or fryers, nuggets, fried | drop → pass | pass |
| hot dog bun | Fast foods, chicken tenders | bun | Fast foods, chicken tenders | drop → pass | pass |
| hot dog bun | Chicken nuggets, from fast food | bun | Chicken nuggets, from fast food | drop → pass | pass |
| hot dog bun | Chicken patty, fillet, or tenders, breaded, cooked | bun | Chicken patty, fillet, or tenders, breaded, cooked | drop → pass | pass |
| hot dog bun | Fish, fish sticks, frozen, prepared | bun | Fish, fish sticks, frozen, prepared | drop → pass | pass |
| hot dog bun | Fish, pollock, Alaska, breaded, fried | bun | Fish, pollock, Alaska, breaded, fried | drop → pass | pass |
| hot dog bun | Fish sticks, battered | bun | Fish sticks, battered | drop → pass | pass |
| hot dog bun | Egg salad | bun | Egg salad | drop → pass | pass |
| hot dog bun | Egg salad sandwich | bun | Egg salad sandwich | drop → pass | pass |
| hot dog bun | Egg, whole, cooked, hard-boiled | bun | Egg, whole, cooked, hard-boiled | drop → pass | pass |
| hot dog bun | Eggs, whole, cooked, hard-boiled | bun | Eggs, whole, cooked, hard-boiled | drop → pass | pass |
| hot dog bun | Tuna melt sandwich | bun | Tuna melt sandwich | drop → pass | pass |
| hot dog bun | Fish, tuna, light, canned in water, drained solids | bun | Fish, tuna, light, canned in water, drained solids | drop → pass | pass |
| hot dog bun | Tuna salad | bun | Tuna salad | drop → pass | pass |
| hot dog bun | Sandwich, tuna salad | bun | Sandwich, tuna salad | drop → pass | pass |
| hot dog bun | Rice, fried, with chicken | bun | Rice, fried, with chicken | drop → pass | pass |
| hot dog bun | Chicken fried rice | bun | Chicken fried rice | drop → pass | pass |
| hot dog bun | Fried rice with chicken | bun | Fried rice with chicken | drop → pass | pass |
| hot dog bun | Rice, fried, with chicken and vegetables | bun | Rice, fried, with chicken and vegetables | drop → pass | pass |
| hot dog bun | Fried rice, with egg | bun | Fried rice, with egg | drop → pass | pass |
| hot dog bun | Pad thai with shrimp | bun | Pad thai with shrimp | drop → pass | pass |
| hot dog bun | Noodles, pad thai, with shrimp | bun | Noodles, pad thai, with shrimp | drop → pass | pass |
| hot dog bun | Pad thai, with chicken | bun | Pad thai, with chicken | drop → pass | pass |
| hot dog bun | Chicken and broccoli | bun | Chicken and broccoli | drop → pass | pass |
| hot dog bun | Steak and shrimp | bun | Steak and shrimp | drop → pass | pass |
| hot dog bun | Chicken parmesan | bun | Chicken parmesan | drop → pass | pass |
| hot dog bun | Chicken parmigiana, breaded | bun | Chicken parmigiana, breaded | drop → pass | pass |
| hot dog bun | Chicken, breaded, with cheese and tomato sauce | bun | Chicken, breaded, with cheese and tomato sauce | drop → pass | pass |
| hot dog bun | Veal parmigiana | bun | Veal parmigiana | drop → pass | pass |
| hot dog bun | Fish, salmon, Atlantic, farmed, cooked, dry heat | bun | Fish, salmon, Atlantic, farmed, cooked, dry heat | drop → pass | pass |
| hot dog bun | Salmon, baked or broiled | bun | Salmon, baked or broiled | drop → pass | pass |
| hot dog bun | Salmon, raw | bun | Salmon, raw | drop → pass | pass |
| hot dog bun | Tuna, fresh, bluefin, raw | bun | Tuna, fresh, bluefin, raw | drop → pass | pass |
| hot dog bun | Fish, cod, Atlantic, cooked, dry heat | bun | Fish, cod, Atlantic, cooked, dry heat | drop → pass | pass |
| hot dog bun | Cod, baked or broiled | bun | Cod, baked or broiled | drop → pass | pass |
| hot dog bun | Crustaceans, shrimp, cooked | bun | Crustaceans, shrimp, cooked | drop → pass | pass |
| hot dog bun | Shrimp, cooked, fried | bun | Shrimp, cooked, fried | drop → pass | pass |
| hot dog bun | Noodles, egg, cooked, enriched | bun | Noodles, egg, cooked, enriched | drop → pass | pass |
| hot dog bun | Egg noodles | bun | Egg noodles | drop → pass | pass |
| hot dog bun | Dumplings, chicken | bun | Dumplings, chicken | drop → pass | pass |
| hot dog bun | Dumpling, shrimp | bun | Dumpling, shrimp | drop → pass | pass |
| hot dog bun | Mollusks, squid, mixed species, cooked | bun | Mollusks, squid, mixed species, cooked | drop → pass | pass |
| hot dog bun | Fish, salmon, Atlantic, cooked | bun | Fish, salmon, Atlantic, cooked | drop → pass | pass |
| hot dog bun | Curry with chicken | bun | Curry with chicken | drop → pass | pass |
| hot dog bun | Chicken, broilers or fryers, breast, cooked | bun | Chicken, broilers or fryers, breast, cooked | drop → pass | pass |
| hot dog bun | Egg, whole, cooked, scrambled | bun | Egg, whole, cooked, scrambled | drop → pass | pass |
| hot dog bun | Eggs, scrambled | bun | Eggs, scrambled | drop → pass | pass |
| hot dog bun | Omelet, egg, with cheese | bun | Omelet, egg, with cheese | drop → pass | pass |
| hot dog bun | Egg, whole, omelet | bun | Egg, whole, omelet | drop → pass | pass |
| hot dog bun | Fish, tilapia, cooked | bun | Fish, tilapia, cooked | drop → pass | pass |
| hot dog bun | Fish, cod, Atlantic, cooked | bun | Fish, cod, Atlantic, cooked | drop → pass | pass |
| hot dog bun | Fish, tilapia, raw | bun | Fish, tilapia, raw | drop → pass | pass |
| hot dog bun | Fish, surimi | bun | Fish, surimi | drop → pass | pass |
| hot dog bun | Crustaceans, crab, blue, cooked | bun | Crustaceans, crab, blue, cooked | drop → pass | pass |
| hot dog bun | Fish, caviar, black and red, granular | bun | Fish, caviar, black and red, granular | drop → pass | pass |
| hot dog bun | Fish, roe, mixed species, raw | bun | Fish, roe, mixed species, raw | drop → pass | pass |
| hot dog bun | Chicken, liver, all classes, cooked | bun | Chicken, liver, all classes, cooked | drop → pass | pass |
| hot dog bun | Liver, chicken | bun | Liver, chicken | drop → pass | pass |
| hot dog bun | Chicken, wing, meat and skin, cooked, fried | bun | Chicken, wing, meat and skin, cooked, fried | drop → pass | pass |
| hot dog bun | Fish, cod, battered or breaded, fried | bun | Fish, cod, battered or breaded, fried | drop → pass | pass |
| hot dog bun | Fish and chips | bun | Fish and chips | drop → pass | pass |
| hot dog bun | Sandwich, egg and cheese | bun | Sandwich, egg and cheese | drop → pass | pass |
| hot dog bun | Chicken sandwich, fillet, with cheese | bun | Chicken sandwich, fillet, with cheese | drop → pass | pass |
| hot dog bun | Curry, chicken | bun | Curry, chicken | drop → pass | pass |
| hot dog bun | Chicken, satay | bun | Chicken, satay | drop → pass | pass |
| hot dog bun | Fish, tuna, fresh, raw | bun | Fish, tuna, fresh, raw | drop → pass | pass |
| hot dog bun | Lobster salad | bun | Lobster salad | drop → pass | pass |
| hot dog bun | Crustaceans, lobster, northern, cooked | bun | Crustaceans, lobster, northern, cooked | drop → pass | pass |
| hot dog bun | Duck, roasted | bun | Duck, roasted | drop → pass | pass |
| hot dog bun | Mollusks, mussel, blue, cooked | bun | Mollusks, mussel, blue, cooked | drop → pass | pass |
| hot dog bun | Chicken, ground, cooked | bun | Chicken, ground, cooked | drop → pass | pass |
| hot dog bun | Fish sandwich, fried | bun | Fish sandwich, fried | drop → pass | pass |
| hot dog bun | Turkey, ground, cooked | bun | Turkey, ground, cooked | drop → pass | pass |
| hot dog bun | Turkey burger | bun | Turkey burger | drop → pass | pass |
| hot dog bun | Meatballs, chicken | bun | Meatballs, chicken | drop → pass | pass |
| hot dog bun | Veggie burger | bun | Veggie burger | drop → pass | pass |
| hot dog bun | Meatless burger patty, soy based | bun | Meatless burger patty, soy based | drop → pass | pass |
| hot dog bun | Fish, tuna, light, canned | bun | Fish, tuna, light, canned | drop → pass | pass |
| hot dog bun | Chickpeas, cooked | bun | Chickpeas, cooked | drop → pass | pass |
| hot dog bun | Soup, chicken broth | bun | Soup, chicken broth | drop → pass | pass |
| hot dog bun | Egg drop soup | bun | Egg drop soup | drop → pass | pass |
| hot dog bun | Soup, egg drop | bun | Soup, egg drop | drop → pass | pass |
| hot dog bun | Egg, whole, cooked | bun | Egg, whole, cooked | drop → pass | pass |
| hot dog bun | Chicken frankfurter | bun | Chicken frankfurter | drop → pass | pass |
| hot dog bun | Turkey, ground | bun | Turkey, ground | drop → pass | pass |
| hot dog bun | Chicken omelet | bun | Chicken omelet | drop → pass | pass |
| hot dog bun | Fish, tuna, light, canned in water | bun | Fish, tuna, light, canned in water | drop → pass | pass |
| hot dog bun | Mackerel, cooked | bun | Mackerel, cooked | drop → pass | pass |
| hot dog bun | Tofu, raw | bun | Tofu, raw | drop → pass | pass |
| hot dog bun | Tempeh | bun | Tempeh | drop → pass | pass |
| hot dog bun | Beans, cooked | bun | Beans, cooked | drop → pass | pass |
| hot dog bun | Soup, lentil | bun | Soup, lentil | drop → pass | pass |
| hot dog bun | Rice, fried, with shrimp | bun | Rice, fried, with shrimp | drop → pass | pass |
| hot dog bun | Dumpling, chicken | bun | Dumpling, chicken | drop → pass | pass |
| hot dog bun | Lamb, ground, cooked | bun | Lamb, ground, cooked | drop → pass | pass |
| hot dog bun | Octopus, cooked | bun | Octopus, cooked | drop → pass | pass |
| hot dog bun | Mollusks, octopus, common, cooked | bun | Mollusks, octopus, common, cooked | drop → pass | pass |
| hot dog bun | Chicken satay with peanut sauce | bun | Chicken satay with peanut sauce | drop → pass | pass |
| hot dog bun | Salad, caesar, with chicken | bun | Salad, caesar, with chicken | drop → pass | pass |
| hot dog bun | Mung beans, mature seeds, sprouted, raw | bun | Mung beans, mature seeds, sprouted, raw | drop → pass | pass |
| hot dog bun | Butter chicken | bun | Butter chicken | drop → pass | pass |
| hot dog bun | Chicken, cooked | bun | Chicken, cooked | drop → pass | pass |
| hot dog bun | Shrimp, cooked | bun | Shrimp, cooked | drop → pass | pass |
| hot dog bun | Beans, kidney | bun | Beans, kidney | drop → pass | pass |
| hot dog bun | Chicken curry | bun | Chicken curry | drop → pass | pass |
| hot dog bun | Chicken shawarma | bun | Chicken shawarma | drop → pass | pass |
| hot dog bun | Lamb, cooked | bun | Lamb, cooked | drop → pass | pass |
| hot dog bun | Fish, tuna, cooked | bun | Fish, tuna, cooked | drop → pass | pass |
| hot dog bun | Salmon, cooked | bun | Salmon, cooked | drop → pass | pass |
| hot dog bun | Stir-fry and soy-based sauce mixtures | bun | Stir-fry and soy-based sauce mixtures | drop → pass | pass |
| hot dog bun | Chicken salad | bun | Chicken salad | drop → pass | pass |
| hot dog bun | Crustaceans, crab, cooked | bun | Crustaceans, crab, cooked | drop → pass | pass |
| hot dog bun | Chili with beans | bun | Chili with beans | drop → pass | pass |
| hot dog bun | Beans, snap, green, raw | bun | Beans, snap, green, raw | drop → pass | pass |
| hot dog bun | Yardlong bean, raw | bun | Yardlong bean, raw | drop → pass | pass |
| hot dog bun | Beans, lima, canned | bun | Beans, lima, canned | drop → pass | pass |
| hot dog bun | Sandwich, egg | bun | Sandwich, egg | drop → pass | pass |
| hot dog bun | Pad thai with chicken | bun | Pad thai with chicken | drop → pass | pass |
| hot dog bun | Egg, whole, cooked, omelet | bun | Egg, whole, cooked, omelet | drop → pass | pass |
| hot dog bun | Shrimp, fried | bun | Shrimp, fried | drop → pass | pass |
| hot dog bun | Calamari, fried | bun | Calamari, fried | drop → pass | pass |
| hot dog bun | Mollusks, squid, mixed species, cooked, fried | bun | Mollusks, squid, mixed species, cooked, fried | drop → pass | pass |
| hot dog bun | Sushi, topped with salmon | bun | Sushi, topped with salmon | drop → pass | pass |
| hot dog bun | Fish, salmon, raw | bun | Fish, salmon, raw | drop → pass | pass |
| hot dog bun | Fish, battered or breaded, fried | bun | Fish, battered or breaded, fried | drop → pass | pass |
| hot dog bun | Fish and chips (fish with french fries) | bun | Fish and chips (fish with french fries) | drop → pass | pass |
| hot dog bun | Fish sticks with french fries | bun | Fish sticks with french fries | drop → pass | pass |
| hot dog bun | Caesar salad with chicken | bun | Caesar salad with chicken | drop → pass | pass |
| hot dog bun | Noodles, egg, cooked | bun | Noodles, egg, cooked | drop → pass | pass |
| hot dog bun | Sushi, topped with tuna | bun | Sushi, topped with tuna | drop → pass | pass |
| hot dog bun | Clams, fried | bun | Clams, fried | drop → pass | pass |
| hot dog bun | Oysters, fried | bun | Oysters, fried | drop → pass | pass |
| hot dog bun | Scallops, fried | bun | Scallops, fried | drop → pass | pass |
| hot dog bun | Tofu, fried | bun | Tofu, fried | drop → pass | pass |
| hot dog bun | Fried green beans | bun | Fried green beans | drop → pass | pass |
| hot dog bun | Fish, bass, fried | bun | Fish, bass, fried | drop → pass | pass |
| hot dog bun | Fish, catfish, fried | bun | Fish, catfish, fried | drop → pass | pass |
| hot dog bun | Fish, cod, fried | bun | Fish, cod, fried | drop → pass | pass |
| hot dog bun | Fish, flounder, fried | bun | Fish, flounder, fried | drop → pass | pass |
| hot dog bun | Fish, haddock, fried | bun | Fish, haddock, fried | drop → pass | pass |
| hot dog bun | Beans, canned | bun | Beans, canned | drop → pass | pass |
| hot dog bun | Fish, tuna, canned in oil | bun | Fish, tuna, canned in oil | drop → pass | pass |
| hot dog bun | Chicken, broilers or fryers, breast, meat only, raw | bun | Chicken, broilers or fryers, breast, meat only, raw | drop → pass | pass |
| hot dog bun | Chicken, broilers or fryers, breast, meat only, cooked, grilled | bun | Chicken, broilers or fryers, breast, meat only, cooked, grilled | drop → pass | pass |
| hot dog bun | Egg, whole, fried | bun | Egg, whole, fried | drop → pass | pass |
| hot dog bun | Chicken, glazed, honey | bun | Chicken, glazed, honey | drop → pass | pass |
| hot dog bun | Veggie burgers or soyburgers, unprepared | bun | Veggie burgers or soyburgers, unprepared | drop → pass | pass |
| hot dog bun | Mollusks, squid | bun | Mollusks, squid | drop → pass | pass |
| hot dog bun | Chicken seasoning | bun | Chicken seasoning | drop → pass | pass |
| hot dog bun | Chicken nuggets, frozen | bun | Chicken nuggets, frozen | drop → pass | pass |
| hot dog bun | Fish sticks, frozen | bun | Fish sticks, frozen | drop → pass | pass |
| hot dog bun | Sandwich, tuna melt | bun | Sandwich, tuna melt | drop → pass | pass |
| hot dog bun | Noodles, pad thai with shrimp | bun | Noodles, pad thai with shrimp | drop → pass | pass |
| hot dog bun | Fish, tuna, canned | bun | Fish, tuna, canned | drop → pass | pass |
| hot dog bun | Fish, cod, cooked | bun | Fish, cod, cooked | drop → pass | pass |
| hot dog bun | Potato salad with egg | bun | Potato salad with egg | drop → pass | pass |
| hot dog bun | Chicken caesar salad, with dressing | bun | Chicken caesar salad, with dressing | drop → pass | pass |
| burger bun | Chicken, roasted | bun | Chicken, roasted | drop → pass | pass |
| burger bun | Lamb, ground, raw | bun | Lamb, ground, raw | drop → pass | pass |
| burger bun | Egg, whole, raw, fresh | bun | Egg, whole, raw, fresh | drop → pass | pass |
| burger bun | Chicken, sweet and sour | bun | Chicken, sweet and sour | drop → pass | pass |
| burger bun | Soup, chicken noodle, canned | bun | Soup, chicken noodle, canned | drop → pass | pass |
| burger bun | Ham or pork with mushroom sauce | bun | Ham or pork with mushroom sauce | drop → pass | pass |
| burger bun | Fried fish with sauce, Puerto Rican style | bun | Fried fish with sauce, Puerto Rican style | drop → pass | pass |
| burger bun | Chicken, broilers or fryers, breast, raw | bun | Chicken, broilers or fryers, breast, raw | drop → pass | pass |
| burger bun | Fish, salmon, Atlantic, raw | bun | Fish, salmon, Atlantic, raw | drop → pass | pass |
| burger bun | Bacon, pan-fried | bun | Bacon, pan-fried | drop → pass | pass |
| burger bun | Chicken, broilers or fryers, nuggets, fried | bun | Chicken, broilers or fryers, nuggets, fried | drop → pass | pass |
| burger bun | Fast foods, chicken tenders | bun | Fast foods, chicken tenders | drop → pass | pass |
| burger bun | Chicken nuggets, from fast food | bun | Chicken nuggets, from fast food | drop → pass | pass |
| burger bun | Chicken patty, fillet, or tenders, breaded, cooked | bun | Chicken patty, fillet, or tenders, breaded, cooked | drop → pass | pass |
| burger bun | Fish, fish sticks, frozen, prepared | bun | Fish, fish sticks, frozen, prepared | drop → pass | pass |
| burger bun | Fish, pollock, Alaska, breaded, fried | bun | Fish, pollock, Alaska, breaded, fried | drop → pass | pass |
| burger bun | Fish sticks, battered | bun | Fish sticks, battered | drop → pass | pass |
| burger bun | Sandwich, ham and cheese | bun | Sandwich, ham and cheese | drop → pass | pass |
| burger bun | Ham, sliced, regular | bun | Ham, sliced, regular | drop → pass | pass |
| burger bun | Pork, cured, ham, boneless, regular | bun | Pork, cured, ham, boneless, regular | drop → pass | pass |
| burger bun | Ham sandwich, on bread | bun | Ham sandwich, on bread | drop → pass | pass |
| burger bun | Sandwich, bacon, lettuce, and tomato | bun | Sandwich, bacon, lettuce, and tomato | drop → pass | pass |
| burger bun | Egg salad | bun | Egg salad | drop → pass | pass |
| burger bun | Egg salad sandwich | bun | Egg salad sandwich | drop → pass | pass |
| burger bun | Egg, whole, cooked, hard-boiled | bun | Egg, whole, cooked, hard-boiled | drop → pass | pass |
| burger bun | Eggs, whole, cooked, hard-boiled | bun | Eggs, whole, cooked, hard-boiled | drop → pass | pass |
| burger bun | Tuna melt sandwich | bun | Tuna melt sandwich | drop → pass | pass |
| burger bun | Fish, tuna, light, canned in water, drained solids | bun | Fish, tuna, light, canned in water, drained solids | drop → pass | pass |
| burger bun | Tuna salad | bun | Tuna salad | drop → pass | pass |
| burger bun | Sandwich, tuna salad | bun | Sandwich, tuna salad | drop → pass | pass |
| burger bun | Rice, fried, with chicken | bun | Rice, fried, with chicken | drop → pass | pass |
| burger bun | Chicken fried rice | bun | Chicken fried rice | drop → pass | pass |
| burger bun | Fried rice, with pork | bun | Fried rice, with pork | drop → pass | pass |
| burger bun | Fried rice with chicken | bun | Fried rice with chicken | drop → pass | pass |
| burger bun | Rice, fried, with chicken and vegetables | bun | Rice, fried, with chicken and vegetables | drop → pass | pass |
| burger bun | Fried rice, with egg | bun | Fried rice, with egg | drop → pass | pass |
| burger bun | Pad thai with shrimp | bun | Pad thai with shrimp | drop → pass | pass |
| burger bun | Noodles, pad thai, with shrimp | bun | Noodles, pad thai, with shrimp | drop → pass | pass |
| burger bun | Pad thai, with chicken | bun | Pad thai, with chicken | drop → pass | pass |
| burger bun | Chicken and broccoli | bun | Chicken and broccoli | drop → pass | pass |
| burger bun | Steak and shrimp | bun | Steak and shrimp | drop → pass | pass |
| burger bun | Chicken parmesan | bun | Chicken parmesan | drop → pass | pass |
| burger bun | Chicken parmigiana, breaded | bun | Chicken parmigiana, breaded | drop → pass | pass |
| burger bun | Chicken, breaded, with cheese and tomato sauce | bun | Chicken, breaded, with cheese and tomato sauce | drop → pass | pass |
| burger bun | Veal parmigiana | bun | Veal parmigiana | drop → pass | pass |
| burger bun | Fish, salmon, Atlantic, farmed, cooked, dry heat | bun | Fish, salmon, Atlantic, farmed, cooked, dry heat | drop → pass | pass |
| burger bun | Salmon, baked or broiled | bun | Salmon, baked or broiled | drop → pass | pass |
| burger bun | Salmon, raw | bun | Salmon, raw | drop → pass | pass |
| burger bun | Tuna, fresh, bluefin, raw | bun | Tuna, fresh, bluefin, raw | drop → pass | pass |
| burger bun | Fish, cod, Atlantic, cooked, dry heat | bun | Fish, cod, Atlantic, cooked, dry heat | drop → pass | pass |
| burger bun | Cod, baked or broiled | bun | Cod, baked or broiled | drop → pass | pass |
| burger bun | Crustaceans, shrimp, cooked | bun | Crustaceans, shrimp, cooked | drop → pass | pass |
| burger bun | Shrimp, cooked, fried | bun | Shrimp, cooked, fried | drop → pass | pass |
| burger bun | Pork, cured, ham, sliced | bun | Pork, cured, ham, sliced | drop → pass | pass |
| burger bun | Ham, deli style, prepackaged | bun | Ham, deli style, prepackaged | drop → pass | pass |
| burger bun | Pork, fresh, leg, roasted | bun | Pork, fresh, leg, roasted | drop → pass | pass |
| burger bun | Noodles, egg, cooked, enriched | bun | Noodles, egg, cooked, enriched | drop → pass | pass |
| burger bun | Egg noodles | bun | Egg noodles | drop → pass | pass |
| burger bun | Dumpling, pork | bun | Dumpling, pork | drop → pass | pass |
| burger bun | Dumplings, chicken | bun | Dumplings, chicken | drop → pass | pass |
| burger bun | Dumpling, shrimp | bun | Dumpling, shrimp | drop → pass | pass |
| burger bun | Mollusks, squid, mixed species, cooked | bun | Mollusks, squid, mixed species, cooked | drop → pass | pass |
| burger bun | Pork, fresh, loin, chop, cooked | bun | Pork, fresh, loin, chop, cooked | drop → pass | pass |
| burger bun | Fish, salmon, Atlantic, cooked | bun | Fish, salmon, Atlantic, cooked | drop → pass | pass |
| burger bun | Curry with chicken | bun | Curry with chicken | drop → pass | pass |
| burger bun | Chicken, broilers or fryers, breast, cooked | bun | Chicken, broilers or fryers, breast, cooked | drop → pass | pass |
| burger bun | Egg, whole, cooked, scrambled | bun | Egg, whole, cooked, scrambled | drop → pass | pass |
| burger bun | Eggs, scrambled | bun | Eggs, scrambled | drop → pass | pass |
| burger bun | Omelet, egg, with cheese | bun | Omelet, egg, with cheese | drop → pass | pass |
| burger bun | Egg omelet or scrambled egg, with cheese and ham | bun | Egg omelet or scrambled egg, with cheese and ham | drop → pass | pass |
| burger bun | Egg, whole, omelet | bun | Egg, whole, omelet | drop → pass | pass |
| burger bun | Fish, tilapia, cooked | bun | Fish, tilapia, cooked | drop → pass | pass |
| burger bun | Fish, cod, Atlantic, cooked | bun | Fish, cod, Atlantic, cooked | drop → pass | pass |
| burger bun | Fish, tilapia, raw | bun | Fish, tilapia, raw | drop → pass | pass |
| burger bun | Fish, surimi | bun | Fish, surimi | drop → pass | pass |
| burger bun | Crustaceans, crab, blue, cooked | bun | Crustaceans, crab, blue, cooked | drop → pass | pass |
| burger bun | Fish, caviar, black and red, granular | bun | Fish, caviar, black and red, granular | drop → pass | pass |
| burger bun | Fish, roe, mixed species, raw | bun | Fish, roe, mixed species, raw | drop → pass | pass |
| burger bun | Bacon, pork, cooked | bun | Bacon, pork, cooked | drop → pass | pass |
| burger bun | Turkey bacon, cooked | bun | Turkey bacon, cooked | drop → pass | pass |
| burger bun | Chicken, liver, all classes, cooked | bun | Chicken, liver, all classes, cooked | drop → pass | pass |
| burger bun | Liver, chicken | bun | Liver, chicken | drop → pass | pass |
| burger bun | Chicken, wing, meat and skin, cooked, fried | bun | Chicken, wing, meat and skin, cooked, fried | drop → pass | pass |
| burger bun | Fish, cod, battered or breaded, fried | bun | Fish, cod, battered or breaded, fried | drop → pass | pass |
| burger bun | Fish and chips | bun | Fish and chips | drop → pass | pass |
| burger bun | Sausage, poultry, cooked | bun | Sausage, poultry, cooked | drop → pass | pass |
| burger bun | Sausage, chicken | bun | Sausage, chicken | drop → pass | pass |
| burger bun | Sandwich, egg and cheese | bun | Sandwich, egg and cheese | drop → pass | pass |
| burger bun | Sausage, pork, cooked | bun | Sausage, pork, cooked | drop → pass | pass |
| burger bun | Chicken sandwich, fillet, with cheese | bun | Chicken sandwich, fillet, with cheese | drop → pass | pass |
| burger bun | Curry, chicken | bun | Curry, chicken | drop → pass | pass |
| burger bun | Chicken, satay | bun | Chicken, satay | drop → pass | pass |
| burger bun | Fish, tuna, fresh, raw | bun | Fish, tuna, fresh, raw | drop → pass | pass |
| burger bun | Lobster salad | bun | Lobster salad | drop → pass | pass |
| burger bun | Crustaceans, lobster, northern, cooked | bun | Crustaceans, lobster, northern, cooked | drop → pass | pass |
| burger bun | Pork, fresh, loin, cooked | bun | Pork, fresh, loin, cooked | drop → pass | pass |
| burger bun | Duck, roasted | bun | Duck, roasted | drop → pass | pass |
| burger bun | Mollusks, mussel, blue, cooked | bun | Mollusks, mussel, blue, cooked | drop → pass | pass |
| burger bun | Chicken, ground, cooked | bun | Chicken, ground, cooked | drop → pass | pass |
| burger bun | Fish sandwich, fried | bun | Fish sandwich, fried | drop → pass | pass |
| burger bun | Turkey, ground, cooked | bun | Turkey, ground, cooked | drop → pass | pass |
| burger bun | Turkey burger | bun | Turkey burger | drop → pass | pass |
| burger bun | Meatballs, chicken | bun | Meatballs, chicken | drop → pass | pass |
| burger bun | Veggie burger | bun | Veggie burger | drop → pass | pass |
| burger bun | Meatless burger patty, soy based | bun | Meatless burger patty, soy based | drop → pass | pass |
| burger bun | Fish, tuna, light, canned | bun | Fish, tuna, light, canned | drop → pass | pass |
| burger bun | Chickpeas, cooked | bun | Chickpeas, cooked | drop → pass | pass |
| burger bun | Soup, chicken broth | bun | Soup, chicken broth | drop → pass | pass |
| burger bun | Egg drop soup | bun | Egg drop soup | drop → pass | pass |
| burger bun | Soup, egg drop | bun | Soup, egg drop | drop → pass | pass |
| burger bun | Egg, whole, cooked | bun | Egg, whole, cooked | drop → pass | pass |
| burger bun | Chicken frankfurter | bun | Chicken frankfurter | drop → pass | pass |
| burger bun | Pork sausage | bun | Pork sausage | drop → pass | pass |
| burger bun | Turkey, ground | bun | Turkey, ground | drop → pass | pass |
| burger bun | Chicken omelet | bun | Chicken omelet | drop → pass | pass |
| burger bun | Sandwich, sausage | bun | Sandwich, sausage | drop → pass | pass |
| burger bun | Fish, tuna, light, canned in water | bun | Fish, tuna, light, canned in water | drop → pass | pass |
| burger bun | Mackerel, cooked | bun | Mackerel, cooked | drop → pass | pass |
| burger bun | Tofu, raw | bun | Tofu, raw | drop → pass | pass |
| burger bun | Tempeh | bun | Tempeh | drop → pass | pass |
| burger bun | Beans, cooked | bun | Beans, cooked | drop → pass | pass |
| burger bun | Soup, lentil | bun | Soup, lentil | drop → pass | pass |
| burger bun | Rice, fried, with shrimp | bun | Rice, fried, with shrimp | drop → pass | pass |
| burger bun | Dumpling, chicken | bun | Dumpling, chicken | drop → pass | pass |
| burger bun | Pork, cured, bacon | bun | Pork, cured, bacon | drop → pass | pass |
| burger bun | Pork, fresh, loin | bun | Pork, fresh, loin | drop → pass | pass |
| burger bun | Lamb, ground, cooked | bun | Lamb, ground, cooked | drop → pass | pass |
| burger bun | Octopus, cooked | bun | Octopus, cooked | drop → pass | pass |
| burger bun | Mollusks, octopus, common, cooked | bun | Mollusks, octopus, common, cooked | drop → pass | pass |
| burger bun | Chicken satay with peanut sauce | bun | Chicken satay with peanut sauce | drop → pass | pass |
| burger bun | Pasta with pork and cheese | bun | Pasta with pork and cheese | drop → pass | pass |
| burger bun | Salad, caesar, with chicken | bun | Salad, caesar, with chicken | drop → pass | pass |
| burger bun | Mung beans, mature seeds, sprouted, raw | bun | Mung beans, mature seeds, sprouted, raw | drop → pass | pass |
| burger bun | Butter chicken | bun | Butter chicken | drop → pass | pass |
| burger bun | Chicken, cooked | bun | Chicken, cooked | drop → pass | pass |
| burger bun | Shrimp, cooked | bun | Shrimp, cooked | drop → pass | pass |
| burger bun | Beans, kidney | bun | Beans, kidney | drop → pass | pass |
| burger bun | Chicken curry | bun | Chicken curry | drop → pass | pass |
| burger bun | Pork, cooked | bun | Pork, cooked | drop → pass | pass |
| burger bun | Chicken shawarma | bun | Chicken shawarma | drop → pass | pass |
| burger bun | Lamb, cooked | bun | Lamb, cooked | drop → pass | pass |
| burger bun | Fish, tuna, cooked | bun | Fish, tuna, cooked | drop → pass | pass |
| burger bun | Salmon, cooked | bun | Salmon, cooked | drop → pass | pass |
| burger bun | Pork floss | bun | Pork floss | drop → pass | pass |
| burger bun | Sausage, pork | bun | Sausage, pork | drop → pass | pass |
| burger bun | Stir-fry and soy-based sauce mixtures | bun | Stir-fry and soy-based sauce mixtures | drop → pass | pass |
| burger bun | Chicken salad | bun | Chicken salad | drop → pass | pass |
| burger bun | Crustaceans, crab, cooked | bun | Crustaceans, crab, cooked | drop → pass | pass |
| burger bun | Chili with beans | bun | Chili with beans | drop → pass | pass |
| burger bun | Beans, snap, green, raw | bun | Beans, snap, green, raw | drop → pass | pass |
| burger bun | Yardlong bean, raw | bun | Yardlong bean, raw | drop → pass | pass |
| burger bun | Beans, lima, canned | bun | Beans, lima, canned | drop → pass | pass |
| burger bun | Sandwich, egg | bun | Sandwich, egg | drop → pass | pass |
| burger bun | Pad thai with chicken | bun | Pad thai with chicken | drop → pass | pass |
| burger bun | HAM | bun | HAM | drop → pass | pass |
| burger bun | Ham, turkey, sliced, extra lean, prepackaged or deli | bun | Ham, turkey, sliced, extra lean, prepackaged or deli | drop → pass | pass |
| burger bun | Ham, sliced, restaurant | bun | Ham, sliced, restaurant | drop → pass | pass |
| burger bun | Ham, sliced, pre-packaged, deli meat (96%fat free, water added) | bun | Ham, sliced, pre-packaged, deli meat (96%fat free, water added) | drop → pass | pass |
| burger bun | Pork, steak, coated | bun | Pork, steak, coated | drop → pass | pass |
| burger bun | Egg, whole, cooked, omelet | bun | Egg, whole, cooked, omelet | drop → pass | pass |
| burger bun | Shrimp, fried | bun | Shrimp, fried | drop → pass | pass |
| burger bun | Calamari, fried | bun | Calamari, fried | drop → pass | pass |
| burger bun | Mollusks, squid, mixed species, cooked, fried | bun | Mollusks, squid, mixed species, cooked, fried | drop → pass | pass |
| burger bun | Sushi, topped with salmon | bun | Sushi, topped with salmon | drop → pass | pass |
| burger bun | Fish, salmon, raw | bun | Fish, salmon, raw | drop → pass | pass |
| burger bun | Pork satay | bun | Pork satay | drop → pass | pass |
| burger bun | Fish, battered or breaded, fried | bun | Fish, battered or breaded, fried | drop → pass | pass |
| burger bun | Fish and chips (fish with french fries) | bun | Fish and chips (fish with french fries) | drop → pass | pass |
| burger bun | Fish sticks with french fries | bun | Fish sticks with french fries | drop → pass | pass |
| burger bun | Caesar salad with chicken | bun | Caesar salad with chicken | drop → pass | pass |
| burger bun | Noodles, egg, cooked | bun | Noodles, egg, cooked | drop → pass | pass |
| burger bun | Macaroni and cheese with pork | bun | Macaroni and cheese with pork | drop → pass | pass |
| burger bun | Pork and rice with gravy | bun | Pork and rice with gravy | drop → pass | pass |
| burger bun | Sushi, topped with tuna | bun | Sushi, topped with tuna | drop → pass | pass |
| burger bun | ITALIAN JACKFRUIT SAUSAGES, ITALIAN JACKFRUIT | bun | ITALIAN JACKFRUIT SAUSAGES, ITALIAN JACKFRUIT | drop → pass | pass |
| burger bun | Clams, fried | bun | Clams, fried | drop → pass | pass |
| burger bun | Oysters, fried | bun | Oysters, fried | drop → pass | pass |
| burger bun | Scallops, fried | bun | Scallops, fried | drop → pass | pass |
| burger bun | Tofu, fried | bun | Tofu, fried | drop → pass | pass |
| burger bun | Fried green beans | bun | Fried green beans | drop → pass | pass |
| burger bun | Fish, bass, fried | bun | Fish, bass, fried | drop → pass | pass |
| burger bun | Fish, catfish, fried | bun | Fish, catfish, fried | drop → pass | pass |
| burger bun | Fish, cod, fried | bun | Fish, cod, fried | drop → pass | pass |
| burger bun | Fish, flounder, fried | bun | Fish, flounder, fried | drop → pass | pass |
| burger bun | Fish, haddock, fried | bun | Fish, haddock, fried | drop → pass | pass |
| burger bun | Beans, canned | bun | Beans, canned | drop → pass | pass |
| burger bun | Fish, tuna, canned in oil | bun | Fish, tuna, canned in oil | drop → pass | pass |
| burger bun | Chicken, broilers or fryers, breast, meat only, raw | bun | Chicken, broilers or fryers, breast, meat only, raw | drop → pass | pass |
| burger bun | Chicken, broilers or fryers, breast, meat only, cooked, grilled | bun | Chicken, broilers or fryers, breast, meat only, cooked, grilled | drop → pass | pass |
| burger bun | Pork cutlet, breaded, fried | bun | Pork cutlet, breaded, fried | drop → pass | pass |
| burger bun | Egg, whole, fried | bun | Egg, whole, fried | drop → pass | pass |
| burger bun | Pork skins, plain | bun | Pork skins, plain | drop → pass | pass |
| burger bun | Chicken, glazed, honey | bun | Chicken, glazed, honey | drop → pass | pass |
| burger bun | Pork, ground, cooked | bun | Pork, ground, cooked | drop → pass | pass |
| burger bun | Veggie burgers or soyburgers, unprepared | bun | Veggie burgers or soyburgers, unprepared | drop → pass | pass |
| burger bun | Beans, baked, canned, with pork | bun | Beans, baked, canned, with pork | drop → pass | pass |
| burger bun | Mollusks, squid | bun | Mollusks, squid | drop → pass | pass |
| burger bun | Chicken seasoning | bun | Chicken seasoning | drop → pass | pass |
| burger bun | Chicken nuggets, frozen | bun | Chicken nuggets, frozen | drop → pass | pass |
| burger bun | Fish sticks, frozen | bun | Fish sticks, frozen | drop → pass | pass |
| burger bun | Sandwich, bacon, lettuce and tomato | bun | Sandwich, bacon, lettuce and tomato | drop → pass | pass |
| burger bun | Sandwich, tuna melt | bun | Sandwich, tuna melt | drop → pass | pass |
| burger bun | Noodles, pad thai with shrimp | bun | Noodles, pad thai with shrimp | drop → pass | pass |
| burger bun | Fish, tuna, canned | bun | Fish, tuna, canned | drop → pass | pass |
| burger bun | Fish, cod, cooked | bun | Fish, cod, cooked | drop → pass | pass |
| burger bun | Pork, cured, ham | bun | Pork, cured, ham | drop → pass | pass |
| burger bun | Potato salad with egg | bun | Potato salad with egg | drop → pass | pass |
| burger bun | Chicken caesar salad, with dressing | bun | Chicken caesar salad, with dressing | drop → pass | pass |

## 18 crossings dropped on both versions

| Target | Record | Control target | Control record | Main → head | Control |
|---|---|---|---|---|---|
| hot dog bun | Fish oil, cod liver | bun | Fish oil, cod liver | drop → drop | drop |
| hot dog bun | Shrimp cocktail | bun | Shrimp cocktail | drop → drop | drop |
| hot dog bun | Sauce, oyster, ready-to-serve | bun | Sauce, oyster, ready-to-serve | drop → drop | drop |
| hot dog bun | Sauce, fish, ready-to-serve | bun | Sauce, fish, ready-to-serve | drop → drop | drop |
| hot dog bun | Soy sauce | bun | Soy sauce | drop → drop | drop |
| hot dog bun | Fish oil, salmon | bun | Fish oil, salmon | drop → drop | drop |
| hot dog bun | shrimp cocktail | bun | shrimp cocktail | drop → drop | drop |
| hot dog bun | Gravy, CAMPBELL'S, chicken | bun | Gravy, CAMPBELL'S, chicken | drop → drop | drop |
| hot dog bun | Chicken caesar salad, no dressing | bun | Chicken caesar salad, no dressing | drop → drop | drop |
| burger bun | Fish oil, cod liver | bun | Fish oil, cod liver | drop → drop | drop |
| burger bun | Shrimp cocktail | bun | Shrimp cocktail | drop → drop | drop |
| burger bun | Sauce, oyster, ready-to-serve | bun | Sauce, oyster, ready-to-serve | drop → drop | drop |
| burger bun | Sauce, fish, ready-to-serve | bun | Sauce, fish, ready-to-serve | drop → drop | drop |
| burger bun | Soy sauce | bun | Soy sauce | drop → drop | drop |
| burger bun | Fish oil, salmon | bun | Fish oil, salmon | drop → drop | drop |
| burger bun | shrimp cocktail | bun | shrimp cocktail | drop → drop | drop |
| burger bun | Gravy, CAMPBELL'S, chicken | bun | Gravy, CAMPBELL'S, chicken | drop → drop | drop |
| burger bun | Chicken caesar salad, no dressing | bun | Chicken caesar salad, no dressing | drop → drop | drop |
