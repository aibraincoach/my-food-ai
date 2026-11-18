import {PHOTO_NOT_KEPT,type UploadState} from './upload-manager';

// The line under a meal that has not reached the server yet. #1075: a failed photo says what the person can do
// (the card's own Try again and its menu's Delete), not where the photo is kept: the app keeps it in its own storage,
// which the person cannot see. AGY chose the wording.
export const PHOTO_NOT_POSTED = 'Not posted yet. Try again, or delete it.';
// #1093: a photo that was not kept cannot be sent again, so its card says so (AGY's words) and never offers a retry.
export function pendingUploadLine(upload: Pick<UploadState,'kind'|'state'|'removing'|'text'|'photoLost'>): string {
  if (upload.photoLost) return PHOTO_NOT_KEPT;
  if (upload.kind) return upload.state === 'failed' ? 'Could not confirm the save. Your selection is kept on this phone.'
    : upload.removing ? 'Removing pending post…' : upload.kind === 'drink' ? 'Saving drink…' : upload.kind === 'copy' ? 'Saving copy…' : 'Saving food…';
  if (upload.state === 'failed') return upload.text ? 'Could not confirm the save. Your caption is kept on this phone.' : PHOTO_NOT_POSTED;
  return upload.text ? 'Posting caption…' : 'Uploading photo…';
}
