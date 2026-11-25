import {converted, noFixedMessages, untranslatedNamesAndUnits} from './scripts/eslint-i18n.mjs';
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: converted,
    plugins: {messages: {rules: {'no-fixed-text': noFixedMessages}}},
    rules: {
      'react/jsx-no-literals': ['error', {noStrings: true, ignoreProps: true, allowedStrings: untranslatedNamesAndUnits}],
      'messages/no-fixed-text': 'error',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "uploads/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
