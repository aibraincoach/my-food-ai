export type UploadError = 'dropped' | 'too_large' | 'no_response';
export class PhotoUploadError extends Error {
    constructor(public readonly code: UploadError) { super(code); this.name = 'PhotoUploadError'; }
}
/** Browser upload progress counts only bytes sent, never nutrition or a target. */
export function putWithProgress(url: string, blob: Blob, onProgress: (sent: number, total: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url);
        xhr.timeout = 120000;
        xhr.setRequestHeader('Content-Type', 'image/jpeg');
        xhr.upload.onprogress = event => onProgress(event.loaded, event.lengthComputable ? event.total : blob.size);
        xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(blob.size, blob.size);
            resolve();
        }
        else
            reject(new PhotoUploadError(xhr.status === 413 ? 'too_large' : 'no_response')); };
        xhr.onerror = xhr.onabort = () => reject(new PhotoUploadError('dropped'));
        xhr.ontimeout = () => reject(new PhotoUploadError('no_response'));
        xhr.send(blob);
    });
}
