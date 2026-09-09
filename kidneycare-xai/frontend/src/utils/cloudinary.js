/**
 * Image Upload Utility
 * Resizes and compresses an uploaded image locally for instant profile picture display.
 * Uses canvas-based resizing: fast, no network request, works offline.
 */

/**
 * Resizes and compresses an image file to a lightweight JPEG data URL.
 * Max 400x400 px at 85% quality — ideal for avatar/profile photos.
 *
 * @param {File|Blob} file - The image file to process
 * @returns {Promise<string>} A base64 JPEG data URL
 */
const createOptimizedDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        // Scale down to maxDim while preserving aspect ratio
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 85% JPEG — good balance of quality vs size
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = e.target?.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Processes an image file for profile display.
 * Validates size, resizes locally, and returns a data URL — instantly.
 * No network request, no external dependency, no cold-start delays.
 *
 * @param {File|Blob} file - The file to upload
 * @returns {Promise<string>} The optimized image data URL
 */
export const uploadToCloudinary = async (file) => {
  if (!file) throw new Error('No file provided for upload.');

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size exceeds 5MB limit. Please choose a smaller photo.');
  }

  const optimizedUrl = await createOptimizedDataUrl(file);
  if (optimizedUrl) {
    return optimizedUrl;
  }

  throw new Error('Could not process the selected image. Please try a different file.');
};
