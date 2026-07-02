// ─────────────────────────────────────────────
//  KhetiBahi – Image Upload Helper
//
//  We don't have any cloud file storage wired up
//  (no S3/Cloudinary bucket, no env vars for one),
//  so uploaded bill photos and profile pictures are
//  stored directly as compressed base64 data URLs
//  inside the MongoDB document. To keep documents
//  small and uploads fast on slow rural connections,
//  every image is downscaled + re-encoded as JPEG
//  client-side before it ever leaves the browser.
// ─────────────────────────────────────────────

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB — reject absurdly large source files early

export interface CompressImageOptions {
  /** Longest side (px) the output image is scaled down to. */
  maxDimension?: number;
  /** JPEG quality, 0–1. */
  quality?: number;
}

/**
 * Reads an <input type="file"> image, downscales it to fit within
 * `maxDimension` on its longest side, and re-encodes it as a JPEG
 * data URL. Keeps typical phone-camera bill photos under ~200-400KB
 * instead of the several MB they start as.
 */
export function fileToCompressedDataUrl(
  file: File,
  { maxDimension = 1280, quality = 0.72 }: CompressImageOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error("Image is too large. Please choose one under 5MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that image."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height / width) * maxDimension);
            width = maxDimension;
          } else {
            width = Math.round((width / height) * maxDimension);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process that image."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
