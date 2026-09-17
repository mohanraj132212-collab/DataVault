// DataVault Cloudinary Upload Module
import { getCloudinaryConfig } from './firebase-config.js';
import { showToast } from './ui.js';

/**
 * Compress an image file using HTML5 Canvas
 * @param {File} file - Original image file
 * @param {number} maxWidth - Max width for resized image
 * @param {number} quality - Quality level (0 to 1)
 * @returns {Promise<Blob>}
 */
export function compressImage(file, maxWidth = 1600, quality = 0.8) {
  return new Promise((resolve) => {
    // If it's a PDF or non-image file, return as is
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob ? new File([blob], file.name, { type: file.type }) : file);
          },
          file.type,
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Upload a file to Cloudinary via unsigned upload preset
 * @param {File|Blob} file 
 * @param {function(number):void} onProgress - Progress percentage callback
 * @returns {Promise<{url: string, publicId: string, format: string}>}
 */
export async function uploadToCloudinary(file, onProgress) {
  const config = getCloudinaryConfig();

  if (!config.cloudName || config.cloudName === "YOUR_CLOUD_NAME" || !config.uploadPreset || config.uploadPreset === "YOUR_UNSIGNED_UPLOAD_PRESET") {
    showToast("Please configure your Cloudinary Cloud Name & Upload Preset in Settings first!", "error");
    throw new Error("Cloudinary configuration missing.");
  }

  // Compress image before upload if image file
  let uploadFile = file;
  if (file.type && file.type.startsWith('image/')) {
    uploadFile = await compressImage(file);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`;
  const formData = new FormData();
  formData.append('file', uploadFile);
  formData.append('upload_preset', config.uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve({
          url: response.secure_url,
          publicId: response.public_id,
          format: response.format,
          thumbnailUrl: response.secure_url // Cloudinary supports auto-transforms
        });
      } else {
        let errMessage = "Upload failed. Check Cloudinary preset settings.";
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.error && res.error.message) errMessage = res.error.message;
        } catch (_) {}
        showToast(errMessage, "error");
        reject(new Error(errMessage));
      }
    };

    xhr.onerror = () => {
      showToast("Network error during file upload.", "error");
      reject(new Error("Network error during Cloudinary upload"));
    };

    xhr.send(formData);
  });
}
