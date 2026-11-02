import { AgentError } from './tokens';
/** Bound raw bytes before decoding or retaining the body. A multibyte payload
 * must not bypass the same cap as an ASCII request. */
export async function readAgentText(request: Request, maxBytes = 65536): Promise<string> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0, text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new AgentError('Request too large', 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}
