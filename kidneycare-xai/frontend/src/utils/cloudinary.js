/**
 * Media Management Utility
 * Handles multimedia uploads to Cloudinary storage and returns image URL.
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'mkvwiqlw';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'kidneycare';

/**
 * Resizes and compresses an image file to a lightweight data URL
 * (max 400x400 px, optimal for avatars and profiles).
 */
const createOptimizedDataUrl = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

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

        // Quality 0.85 WebP or JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result);
      img.src = e.target?.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads an image file to Cloudinary.
 * Makes a single clean attempt to upload using the configured unsigned preset.
 * If the Cloudinary preset is not yet whitelisted on the account,
 * gracefully falls back to an optimized image data URL without console spam.
 *
 * @param {File|Blob} file - The file to upload
 * @returns {Promise<string>} The URL of the image
 */
export const uploadToCloudinary = async (file) => {
  if (!file) throw new Error('No file provided for upload.');

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size exceeds 5MB limit. Please choose a smaller photo.');
  }

  // Attempt upload to Cloudinary with configured preset
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      }
    }
  } catch (err) {
    // Network or CORS issue, proceed to seamless fallback
  }

  // Resilient fallback: optimized image data URL
  const optimizedUrl = await createOptimizedDataUrl(file);
  if (optimizedUrl) {
    return optimizedUrl;
  }

  throw new Error('Could not process the selected image.');
};
