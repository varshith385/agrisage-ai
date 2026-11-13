/**
 * Image validation and client-side compression utility for agricultural uploads.
 * Ensures fast upload performance and prevents decompression issues on mobile/low-bandwidth connections.
 */

export interface ImageValidationResult {
  valid: boolean;
  errorKey?: string;
  errorMessage?: string;
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Validates uploaded image format and file size.
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, errorMessage: 'No file provided.' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      errorKey: 'common.invalid_image_type',
      errorMessage: 'Invalid file format. Please upload a JPEG, PNG, or WebP photo.',
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      errorKey: 'common.image_too_large',
      errorMessage: `File size (${sizeMb} MB) exceeds maximum allowed limit of 15 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Compresses and scales down high-resolution images using an in-memory Canvas.
 * Keeps output under 1280px on the longest dimension at 85% JPEG quality.
 */
export async function compressImage(
  file: File,
  maxDimension = 1280,
  quality = 0.85
): Promise<File> {
  // If file is already small (under 750KB), return as is
  if (file.size <= 750 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file); // If compression didn't reduce size, use original
            } else {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
