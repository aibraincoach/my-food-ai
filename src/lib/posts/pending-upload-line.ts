import type {UploadState} from './upload-manager';

// Card actions differ from the chip: Delete removes a pending post or an added
// photo. An attachment belongs to a meal that is already posted. AGY chose these words.
export const PHOTO_NOT_POSTED = 'Not posted yet. Try again, or delete it.';
const POST_PHOTO_LOST = 'Photo lost. Delete this post.';
const ATTACHMENT_PHOTO_LOST = 'Photo lost. Delete this photo.';
const ATTACHMENT_PHOTO_FAILED = 'Photo not uploaded yet. Try again, or delete this photo.';
export function pendingUploadLine(upload: Pick<UploadState,'kind'|'state'|'removing'|'text'|'photoLost'|'attachment'>): string {
  if (upload.photoLost) return upload.attachment ? ATTACHMENT_PHOTO_LOST : POST_PHOTO_LOST;
  if (upload.attachment && upload.state === 'failed') return ATTACHMENT_PHOTO_FAILED;
  if (upload.kind) return upload.state === 'failed' ? 'Could not confirm the save. Your selection is kept on this phone.'
    : upload.removing ? 'Removing pending post…' : upload.kind === 'drink' ? 'Saving drink…' : upload.kind === 'copy' ? 'Saving copy…' : 'Saving food…';
  if (upload.state === 'failed') return upload.text ? 'Could not confirm the save. Your caption is kept on this phone.' : PHOTO_NOT_POSTED;
  return upload.text ? 'Posting caption…' : 'Uploading photo…';
}
