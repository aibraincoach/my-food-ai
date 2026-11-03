# Exact required final-code commands

Measured after main `789c2b7db3ac5a75f7c2b7271419a8a3176c9702` reached production READY. Built app and disposable local Postgres/Auth/REST/Storage used scripted local model responses and scoped USDA cache fixtures. Original cache rows restored and verified after the suite. No production model calls were made by these tests.

| Command | Exit | Result |
| --- | ---: | --- |
| npm run test:db |0|32passed,0failed,0skipped|
| node --test tests/*.test.mjs |1|153passed,148failed,2skipped|
| npx eslint . |1|2errors,6warnings|

The bare unit command is deliberately unchanged: no tsx loader or env-file substitution. Its failures include plain Node module/type loading and missing integration configuration; every failed name is listed in receipt.json and the judge README. These failures are reported rather than hidden behind focused loader-enabled passes. Full captured outputs are retained. ESLint’s existing PostHandle and PostMenu errors and six warnings remain visible. Passing DB checks do not prove physical-phone acceptance.
