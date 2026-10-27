export function isOwnedPhotoPath(path: unknown, userId: string, postId: string): path is string {
  const prefix = `${userId}/${postId}/`;
  return typeof path === "string" && path.startsWith(prefix)
    && /^(0|[1-9][0-9]*)\.jpg$/.test(path.slice(prefix.length));
}

export function isOwnedGeneratedCardPath(path: unknown, userId: string, postId: string): path is string {
  const prefix = `${userId}/${postId}/cards/`;
  return typeof path === "string" && path.startsWith(prefix)
    && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/card\.png$/.test(path.slice(prefix.length));
}
