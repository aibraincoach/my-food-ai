import type messages from '../../messages/en.json';
export const CAPTURE_NAMESPACES = ['navigation','errors','card','capture','feed','post','postMenu','thread'] as const;
type CaptureMessages = Pick<typeof messages,typeof CAPTURE_NAMESPACES[number]>;
export function pickCaptureMessages(messages:CaptureMessages):CaptureMessages {
 return Object.fromEntries(CAPTURE_NAMESPACES.map(namespace=>[namespace,messages[namespace]])) as CaptureMessages;
}
