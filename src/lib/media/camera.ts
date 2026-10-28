export type Facing = "environment" | "user";

export interface Camera {
  stream: MediaStream;
  flip(): Promise<MediaStream>;
  close(): void;
}

// The previous stream is still live and the facing is unchanged; flipping again may succeed.
export class CameraFlipError extends Error {
  readonly retryable = true;
  constructor(cause: unknown) {
    super("Could not switch cameras.", { cause });
    this.name = "CameraFlipError";
  }
}

export async function openCamera(initialFacing: Facing): Promise<Camera> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera unavailable.");
  let facing = initialFacing;
  let closed = false;
  let generation = 0;
  const first = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
  const camera: Camera = {
    stream: first,
    async flip() {
      const request = ++generation;
      const next: Facing = facing === "environment" ? "user" : "environment";
      // Acquire first: a rejected request must leave the working camera untouched.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: next }, audio: false });
      } catch (cause) {
        if (closed || request !== generation) throw new Error("Camera closed.");
        throw new CameraFlipError(cause);
      }
      if (closed || request !== generation) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("Camera closed.");
      }
      camera.stream.getTracks().forEach((track) => track.stop());
      facing = next;
      camera.stream = stream;
      return stream;
    },
    close() {
      closed = true;
      generation++;
      camera.stream.getTracks().forEach((track) => track.stop());
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
