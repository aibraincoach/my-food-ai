export type Facing = "environment" | "user";

export interface Camera {
  stream: MediaStream;
  flip(): Promise<MediaStream>;
  close(): void;
}

// The switch failed but a camera is live again and the facing is unchanged; flipping again may succeed.
// `stream` is set when the previous camera had to be reopened, so the preview must follow it.
export class CameraFlipError extends Error {
  readonly retryable = true;
  constructor(cause: unknown, readonly stream?: MediaStream) {
    super("Could not switch cameras.", { cause });
    this.name = "CameraFlipError";
  }
}

export async function openCamera(initialFacing: Facing): Promise<Camera> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera unavailable.");
  let facing = initialFacing;
  let closed = false;
  let generation = 0;
  const open = (mode: Facing) => navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
  const stop = (stream: MediaStream) => stream.getTracks().forEach((track) => track.stop());
  const first = await open(facing);
  const camera: Camera = {
    stream: first,
    async flip() {
      const request = ++generation;
      const superseded = () => closed || request !== generation;
      const next: Facing = facing === "environment" ? "user" : "environment";
      let stream: MediaStream | undefined;
      try {
        // Acquire first: a rejected request leaves the working camera untouched.
        stream = await open(next);
      } catch (cause) {
        if (superseded()) throw new Error("Camera closed.");
        // Some devices cannot open a second camera while the first is held. Release it and try
        // again; if that still fails, reopen the previous camera so the preview is never left dead.
        stop(camera.stream);
        try {
          stream = await open(next);
        } catch (second) {
          if (superseded()) throw new Error("Camera closed.");
          let restored: MediaStream;
          try {
            restored = await open(facing);
          } catch {
            throw new Error("Camera unavailable.");
          }
          if (superseded()) { stop(restored); throw new Error("Camera closed."); }
          camera.stream = restored;
          throw new CameraFlipError(second ?? cause, restored);
        }
      }
      if (superseded()) {
        stop(stream);
        throw new Error("Camera closed.");
      }
      if (camera.stream !== stream) stop(camera.stream);
      facing = next;
      camera.stream = stream;
      return stream;
    },
    close() {
      closed = true;
      generation++;
      stop(camera.stream);
    },
  };
  return camera;
}

export async function grabFrame(video: HTMLVideoElement): Promise<Blob> {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
    throw new Error("Camera is not ready yet.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Camera capture unavailable.");
  context.drawImage(video, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("Camera capture failed.")), "image/jpeg", 0.95
  ));
}
