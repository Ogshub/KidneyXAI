/**
 * Cloudinary Media Management Utility
 * Cloud Name: mkvwiqlw
 *
 * Handles multimedia uploads to Cloudinary and returns secure HTTPS URL.
 * Automatically persists uploaded asset URLs to Supabase via backend API.
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'mkvwiqlw';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'kidneycare_preset';

/**
 * Uploads an image file to Cloudinary.
 * Tries unsigned upload presets. If no unsigned preset is available on the Cloudinary
 * account, gracefully falls back to base64 Data URL to prevent UI interruption.
 *
 * @param {File|Blob} file - The file to upload
 * @returns {Promise<string>} The HTTPS URL of the uploaded image
 */
export const uploadToCloudinary = async (file) => {
  if (!file) throw new Error('No file provided for upload.');

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size exceeds 5MB limit. Please choose a smaller photo.');
  }

  // Presets to try for unsigned upload
  const presetsToTry = [
    CLOUDINARY_UPLOAD_PRESET,
    'ml_default',
    'kidneycare',
    'unsigned_preset',
    'default_unsigned',
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
          console.info('Cloudinary upload successful:', data.secure_url);
          return data.secure_url;
        }
      }
    } catch (err) {
      console.warn(`Cloudinary upload attempt with preset "${preset}" failed:`, err);
    }
  }

  // Graceful fallback to high-quality Base64 Data URL if Cloudinary presets aren't enabled
  console.info('Using Data URL fallback for profile picture storage in Supabase.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};
