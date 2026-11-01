import type { JobHandler } from "@/lib/worker/handlers";
import { ioError } from "@/lib/worker/errors";
import { isUuid } from "@/lib/posts/items";

const cleanup: JobHandler = async (admin, job) => {
  const { owner_id: owner, deleted_post_id: postId, paths } = job.payload;
  if (job.post_id !== null || !isUuid(owner) || !isUuid(postId) || !Array.isArray(paths)) throw new Error("Invalid media cleanup job.");
  const prefix = `${owner}/${postId}`;
  const validPath = (path: unknown): path is string => typeof path === "string" && path.startsWith(`${prefix}/`) && !path.split("/").includes("..");
  if (!paths.every(validPath)) throw new Error("Invalid media cleanup paths.");
  if(job.payload.exact===true){
    // Added photos reserve only these two destinations before copying. Never
    // list or remove the rest of an existing meal's directory.
    if(!isUuid(job.payload.attachment_id)||paths.length!==2||!paths.every(path=>new RegExp(`^${prefix}/[0-9]+(?:[.]feed)?[.]jpg$`).test(path)))throw Error("Invalid attachment cleanup.");
    const {data:reservation,error:reservationError,status:reservationStatus}=await admin.from("post_photo_attachments").select("target_path,cleanup_job_id").eq("id",job.payload.attachment_id).eq("post_id",postId).eq("user_id",owner).maybeSingle();
    if(reservationError)throw ioError("Attachment cleanup could not be checked.",reservationError,reservationStatus);
    if(!reservation||reservation.cleanup_job_id!==job.id||!paths.includes(reservation.target_path)||!paths.includes(reservation.target_path.replace(/\.jpg$/,'.feed.jpg')))throw Error("Attachment cleanup does not match its reservation.");
    const {data:claimed,error:claimError,status:claimStatus}=await admin.from("post_media").select("storage_path").in("storage_path",paths);
    if(claimError)throw ioError("Attached media could not be checked.",claimError,claimStatus);
    if(claimed?.length)return;
    const {error}=await admin.storage.from("media").remove(paths);
    if(error)throw ioError("Unattached photo copies could not be removed.",error);
    return;
  }
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
  // An expired ordinary-upload stage has no post and no reason to retain its
  // caption/location manifest after every object has been removed. Pack stages
  // have no such row. A published tombstone or a claimed photo is never deleted.
  const { error: draftError, status: draftStatus } = await admin.from("post_upload_drafts").delete()
    .eq("id", postId).eq("user_id", owner).eq("published", false);
  if (draftError) throw ioError("Discarded upload draft could not be removed.", draftError, draftStatus);
};
export default cleanup;
