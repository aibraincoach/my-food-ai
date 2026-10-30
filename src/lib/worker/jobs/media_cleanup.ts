import type { JobHandler } from "@/lib/worker/handlers";
import { ioError } from "@/lib/worker/errors";
import { isUuid } from "@/lib/posts/items";

const cleanup: JobHandler = async (admin, job) => {
  const { owner_id: owner, deleted_post_id: postId, paths } = job.payload;
  if (job.post_id !== null || !isUuid(owner) || !isUuid(postId) || !Array.isArray(paths)) throw new Error("Invalid media cleanup job.");
  const prefix = `${owner}/${postId}`;
  const validPath = (path: unknown): path is string => typeof path === "string" && path.startsWith(`${prefix}/`) && !path.split("/").includes("..");
  if (!paths.every(validPath)) throw new Error("Invalid media cleanup paths.");
  // A staged upload may have become a committed pack photo. Never delete a claimed stage.
  // Issued upload URLs expire after two hours; staged cleanup is delayed for three hours.
  const { data: claimed, error: claimError, status: claimStatus } = await admin.from("post_media")
    .select("id").like("storage_path", `${prefix}/%`).limit(1);
  if (claimError) throw ioError("Media references could not be checked.", claimError, claimStatus);
  if (claimed?.length) return;
  const bucket = admin.storage.from("media");
  const pending = new Set<string>(paths);
  // Also discover generated card versions/copies not referenced by post_media.
  // Finish listing before deleting, so offset pagination cannot skip objects.
  const walk = async (directory: string) => {
    for (let offset = 0;; offset += 100) {
      const { data, error } = await bucket.list(directory, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
      if (error) throw ioError("Discarded meal media could not be listed.", error);
      for (const entry of data ?? []) {
        const path = `${directory}/${entry.name}`;
        if (!validPath(path)) throw new Error("Invalid stored media path.");
        if (entry.id) pending.add(path); else await walk(path);
      }
      if (!data || data.length < 100) break;
    }
  };
  await walk(prefix);
  const all = [...pending];
  for (let index = 0; index < all.length; index += 100) {
    const { error } = await bucket.remove(all.slice(index, index + 100));
    if (error) throw ioError("Discarded meal media could not be removed.", error);
  }
};
export default cleanup;
