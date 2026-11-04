import type {UploadState} from './upload-manager';

export function uploadTargetsPost(upload: UploadState, postId: string) {
    return upload.postId === postId || upload.attachment?.postId === postId;
}
