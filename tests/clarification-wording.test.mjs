import assert from 'node:assert/strict';
import test from 'node:test';
import { readNeedsInput } from '../src/lib/pipeline/needs-input.ts';

test('stored clarification comments cannot bypass the model wording guard', () => {
  assert.deepEqual(readNeedsInput({question:'You should eat more vegetables?',short:'Clarification needed',options:['Rice','Try to eat less']}),
    {question:'What did you eat?',short:'Clarification needed',options:['Rice']});
  assert.equal(readNeedsInput({question:'Was this rice or pasta?',short:'Clarification needed',options:['Rice','Pasta']}).question,'Was this rice or pasta?');
});
