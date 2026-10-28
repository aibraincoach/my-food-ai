// A post with photos parks its analyze job for this long, so no worker tick claims it while the client is
// still uploading. If the client never confirms the uploads, the job runs after the delay.
export const UPLOAD_PARK_MS = 120_000;

// A photo that is still missing this long after the post was created is treated as the upload still in flight
// (retried with backoff). It always outlasts the parking delay, so a job released by the fallback still gets
// a full minute of retries, and it is derived from it so the two can never drift apart.
export const UPLOAD_GRACE_MS = UPLOAD_PARK_MS + 60_000;
