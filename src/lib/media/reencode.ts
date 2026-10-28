// Client-side shot re-encoding. Drawing through a canvas drops EXIF
// (including GPS) and bakes in orientation. Two JPEGs per shot: the
// original capped at 4096px on the long side, and a 1080px feed copy.

export interface ReencodedShot {
  original: Blob;
  feed: Blob;
  phash: string;
  width: number;
  height: number;
}

const ORIGINAL_LONG_SIDE = 4096;
const FEED_LONG_SIDE = 1080;

function drawScaled(img: HTMLImageElement, longSide: number): HTMLCanvasElement {
  const scale = Math.min(1, longSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("reencode: 2d canvas context unavailable.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("reencode: JPEG export failed."))),
      "image/jpeg",
      0.85
    );
  });
}

function differenceHash(source: HTMLCanvasElement): string {
  const canvas=document.createElement("canvas"); canvas.width=9;canvas.height=8;
  const ctx=canvas.getContext("2d"); if(!ctx) throw new Error("Canvas unavailable.");
  ctx.drawImage(source,0,0,9,8);
  const pixels=ctx.getImageData(0,0,9,8).data;
  const gray=(i:number)=>pixels[i]*0.299+pixels[i+1]*0.587+pixels[i+2]*0.114;
  let hash=BigInt(0);
  for(let y=0;y<8;y++) for(let x=0;x<8;x++) hash=(hash<<BigInt(1))|BigInt(gray((y*9+x)*4)>gray((y*9+x+1)*4)?1:0);
  return BigInt.asIntN(64,hash).toString();
}

export async function reencodeShot(file: File): Promise<ReencodedShot> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("reencode: could not decode image."));
      el.src = url;
    });
    const originalCanvas = drawScaled(img, ORIGINAL_LONG_SIDE);
    const [original, feed] = await Promise.all([
      toJpeg(originalCanvas),
      toJpeg(drawScaled(img, FEED_LONG_SIDE)),
    ]);
    return { original, feed, phash:differenceHash(originalCanvas), width: originalCanvas.width, height: originalCanvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function storagePaths(userId: string, postId: string, position: number) {
  return {
    original: `${userId}/${postId}/${position}.jpg`,
    feed: `${userId}/${postId}/${position}.feed.jpg`,
  };
}
