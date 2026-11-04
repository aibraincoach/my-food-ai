// Deny a missing or foreign direct-link post before a streamed page can send 200.
// The authenticated client and the page's later reads keep their own RLS checks.
export async function postRequestAllowed(
  userId: string,
  postId: string,
  readPost: () => PromiseLike<{data: {id: string; user_id: string} | null; error: unknown}>,
): Promise<boolean> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) return false;
  try {
    const {data, error} = await readPost();
    return !error && data?.id === postId && data.user_id === userId;
  } catch {
    return false;
  }
}
