import type {CaptureFailure} from './capture-failure';
import type {UploadState} from './upload-manager';

// Card actions differ from the chip: Delete removes a pending post or an added
// photo. An attachment belongs to a meal that is already posted. AGY chose these words.
export const PHOTO_NOT_POSTED:CaptureFailure = {code:'notPostedYet'};
const POST_PHOTO_LOST:CaptureFailure = {code:'postPhotoLost'};
const ATTACHMENT_PHOTO_LOST:CaptureFailure = {code:'attachmentPhotoLost'};
const ATTACHMENT_PHOTO_FAILED:CaptureFailure = {code:'attachmentPhotoFailed'};
export function pendingUploadLine(upload: Pick<UploadState,'kind'|'state'|'removing'|'text'|'photoLost'|'attachment'|'failure'|'failureKind'>): CaptureFailure {
  if (upload.photoLost) return upload.attachment ? ATTACHMENT_PHOTO_LOST : POST_PHOTO_LOST;
  if (upload.state === 'failed' && upload.failureKind === 'storage' && upload.failure) return upload.failure;
  if (upload.attachment && upload.state === 'failed') return ATTACHMENT_PHOTO_FAILED;
  if (upload.kind) return upload.state === 'failed' ? {code:'selectionNotConfirmed'}
    : upload.removing ? {code:'removingPending'} : upload.kind === 'drink' ? {code:'savingDrink'} : upload.kind === 'copy' ? {code:'savingCopy'} : {code:'savingFood'};
  if (upload.state === 'failed') return upload.text ? {code:'captionNotConfirmed'} : PHOTO_NOT_POSTED;
  return upload.text ? {code:'postingCaption'} : {code:'uploadingPhoto'};
}
