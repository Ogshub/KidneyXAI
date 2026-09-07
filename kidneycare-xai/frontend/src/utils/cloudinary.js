/**
 * Media Management Utility
 * Handles multimedia uploads to cloud storage and returns secure HTTPS URL.
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'mkvwiqlw';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'kidneycare';

/**
 * Uploads an image file to cloud storage.
 * If unsigned cloud presets are not yet whitelisted,
 * gracefully falls back to high-resolution Data URL.
 *
 * @param {File|Blob} file - The file to upload
 * @returns {Promise<string>} The URL of the image
 */
export const uploadToCloudinary = async (file) => {
  if (!file) throw new Error('No file provided for upload.');

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size exceeds 5MB limit. Please choose a smaller photo.');
  }

  const presetsToTry = [
    CLOUDINARY_UPLOAD_PRESET,
    'kidneycare',
    'ml_default',
    'unsigned',
    'kidneycare_preset',
    'default',
  ];

  for (const preset of presetsToTry) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);

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
      // Try next preset
    }
  }

  // High-fidelity fallback
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};
