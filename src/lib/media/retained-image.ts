export type ImageRead = {path: string; url: string; failed: boolean};
export function imageIdentity(url: string): string {
  try { const parsed=new URL(url,'https://relative.invalid');return parsed.origin+parsed.pathname; }
  catch { return url; }
}
// Signed query tokens are read capabilities, not image identity. Keep a working
// immutable image mounted; use the latest capability only if this read failed.
export function retainedImageUrl(read: ImageRead, fresh: string): string {
  return !read.failed && read.path===imageIdentity(fresh) ? read.url : fresh;
}
