import type messages from '../../messages/en.json';
export const AGENT_NAMESPACES=['api','agents','postMenu'] as const;
type AgentMessages=Pick<typeof messages,typeof AGENT_NAMESPACES[number]>;
export function pickAgentMessages(messages:AgentMessages):AgentMessages {
 return Object.fromEntries(AGENT_NAMESPACES.map(namespace=>[namespace,messages[namespace]])) as AgentMessages;
}
