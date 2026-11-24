import {machineMessage} from '@/i18n/machine-messages';
const object = (properties: Record<string, unknown>, required: string[] = []) => ({ type: 'object', properties, required, additionalProperties: false });
const id = { type: 'string', format: 'uuid', description: machineMessage("route_fc3612a6af0e") };
export const AGENT_TOOLS = [
  { name: 'log_meal', description: machineMessage("route_ec3f7b71b8c9"), inputSchema: object({ caption: { type: 'string', minLength: 1, maxLength: 2000 }, eaten_at: { type: 'string', format: 'date-time', description: machineMessage("route_ccf1a54a80b3") } }, ['caption']) },
  { name: 'list_meals', description: machineMessage("route_1143db8392bd"), inputSchema: object({ from: { type: 'string', description: machineMessage("route_b3862cccf2e0") }, to: { type: 'string', description: machineMessage("route_3c8c5227359c") }, limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 } }) },
  { name: 'get_meal', description: machineMessage("route_0929975e657f"), inputSchema: object({ id }, ['id']) },
  { name: 'correct_meal', description: machineMessage("route_cc02e22e1a3e"), inputSchema: object({ id, text: { type: 'string', minLength: 1, maxLength: 4000 } }, ['id', 'text']) },
];
