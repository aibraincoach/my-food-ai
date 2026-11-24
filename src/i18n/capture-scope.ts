import type messages from '../../messages/en.json';
export const CAPTURE_NAMESPACES = ['api','navigation','errors','card','capture','feed','post','postMenu','thread','hints','days','search','shortcuts','profile','deleted'] as const;
type CaptureMessages = Pick<typeof messages,typeof CAPTURE_NAMESPACES[number]>;
export function pickCaptureMessages(messages:CaptureMessages):CaptureMessages {
 return Object.fromEntries(CAPTURE_NAMESPACES.map(namespace=>[namespace,messages[namespace]])) as CaptureMessages;
}
