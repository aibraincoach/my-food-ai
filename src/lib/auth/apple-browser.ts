// Product display rule only; User-Agent is never an authentication boundary.
export function appleBrowserEligible(userAgent: string): boolean {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true;
  return /Macintosh/i.test(userAgent) && /AppleWebKit/i.test(userAgent) && /Safari/i.test(userAgent)
    && !/Chrome|Chromium|CriOS|Edg|Firefox|FxiOS|OPR|Opera/i.test(userAgent);
}
