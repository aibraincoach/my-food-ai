// node --import tsx --test tests/search-operators.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { hasSemanticOperator } from "../src/lib/search/operators.ts";

test("meal, size and recency words are semantic operators", () => {
  for (const text of ["breakfast", "big breakfast", "what was my biggest dinner", "latest lunch", "my last meal", "snacks yesterday", "most recent dinner"]) {
    assert.equal(hasSemanticOperator(text), true, text);
  }
});

test("plain food searches are literal", () => {
  for (const text of ["eggs", "chicken curry", "rice on monday", "pizza last week"].filter((t) => !/last/.test(t))) {
    assert.equal(hasSemanticOperator(text), false, text);
  }
});
