const object = (properties: Record<string, unknown>, required: string[] = []) => ({ type: 'object', properties, required, additionalProperties: false });
const id = { type: 'string', format: 'uuid', description: 'The meal id' };
export const AGENT_TOOLS = [
  { name: 'log_meal', description: 'Post a meal the user tells you about.', inputSchema: object({ caption: { type: 'string', minLength: 1, maxLength: 2000 }, eaten_at: { type: 'string', format: 'date-time', description: 'When eaten, in the past. Defaults to now.' } }, ['caption']) },
  { name: 'list_meals', description: 'Read meals the user has posted, newest first.', inputSchema: object({ from: { type: 'string', description: 'Inclusive ISO date or instant' }, to: { type: 'string', description: 'Exclusive ISO date or instant' }, limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 } }) },
  { name: 'get_meal', description: 'Read one owned meal, its items, consumed totals and thread.', inputSchema: object({ id }, ['id']) },
  { name: 'correct_meal', description: 'Add a correction to an owned meal.', inputSchema: object({ id, text: { type: 'string', minLength: 1, maxLength: 4000 } }, ['id', 'text']) },
];
