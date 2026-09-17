// DataVault Firebase & Cloudinary Configuration
// Using Firebase JS SDK Modular imports v12.19.0

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Firebase Project Credentials
const firebaseConfig = {
  apiKey: "AIzaSyB1cdJ3VajLQzKvw0gUYTkAXDvPhroPwWU",
  authDomain: "datavault-db0dd.firebaseapp.com",
  projectId: "datavault-db0dd",
  storageBucket: "datavault-db0dd.firebasestorage.app",
  messagingSenderId: "997796766130",
  appId: "1:997796766130:web:351d19964908019906c4ab",
  measurementId: "G-WXR45H4DDC"
};

// Initialize Firebase Core
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Cloudinary Configuration
// Supports dynamic overrides from Settings UI stored in localStorage
export const getCloudinaryConfig = () => {
  const savedCloudName = localStorage.getItem('datavault_cloudinary_cloud_name');
  const savedPreset = localStorage.getItem('datavault_cloudinary_upload_preset');

  return {
    cloudName: savedCloudName || "YOUR_CLOUD_NAME",
    uploadPreset: savedPreset || "YOUR_UNSIGNED_UPLOAD_PRESET"
  };
};

export const saveCloudinaryConfig = (cloudName, uploadPreset) => {
  if (cloudName) localStorage.setItem('datavault_cloudinary_cloud_name', cloudName.trim());
  if (uploadPreset) localStorage.setItem('datavault_cloudinary_upload_preset', uploadPreset.trim());
};
