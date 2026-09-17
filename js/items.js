// DataVault Firestore Items Storage & CRUD Operations Module
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db, auth } from "./firebase-config.js";
import { showToast } from "./ui.js";

/**
 * Add a new item to the vault in Firestore
 * @param {Object} itemData 
 * @returns {Promise<string>} Item Document ID
 */
export async function addVaultItem(itemData) {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthenticated user.");

  try {
    const payload = {
      userId: user.uid,
      type: itemData.type, // 'document' | 'photo' | 'note' | 'book' | 'visiting-card'
      category: itemData.category || 'Other',
      title: itemData.title || 'Untitled',
      description: itemData.description || '',
      fileUrl: itemData.fileUrl || '',
      publicId: itemData.publicId || '',
      fileType: itemData.fileType || '',
      thumbnailUrl: itemData.thumbnailUrl || '',
      favorite: Boolean(itemData.favorite),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Custom category fields
      personName: itemData.personName || '',
      company: itemData.company || '',
      designation: itemData.designation || '',
      phone: itemData.phone || '',
      email: itemData.email || '',
      website: itemData.website || '',
      author: itemData.author || '',
      content: itemData.content || ''
    };

    const docRef = await addDoc(collection(db, "items"), payload);
    showToast("Item saved to your Vault! 🔒", "success");
    return docRef.id;
  } catch (error) {
    console.error("Error adding item:", error);
    showToast("Failed to save item to Firestore.", "error");
    throw error;
  }
}

/**
 * Listen to realtime items for the current user
 * @param {function(Array):void} callback 
 */
export function subscribeUserItems(callback) {
  const user = auth.currentUser;
  if (!user) return () => {};

  const q = query(
    collection(db, "items"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  }, (error) => {
    console.error("Firestore subscription error:", error);
    showToast("Failed to load vault items.", "error");
  });
}

/**
 * Toggle Favorite status on an item
 * @param {string} itemId 
 * @param {boolean} currentFavState 
 */
export async function toggleItemFavorite(itemId, currentFavState) {
  try {
    const itemRef = doc(db, "items", itemId);
    await updateDoc(itemRef, {
      favorite: !currentFavState,
      updatedAt: serverTimestamp()
    });
    showToast(!currentFavState ? "Added to Favorites ⭐" : "Removed from Favorites", "info");
  } catch (error) {
    showToast("Failed to update favorite status.", "error");
  }
}

/**
 * Delete item document from Firestore
 * @param {string} itemId 
 */
export async function deleteVaultItem(itemId) {
  try {
    const itemRef = doc(db, "items", itemId);
    await deleteDoc(itemRef);
    showToast("Item permanently deleted from Vault.", "info");
  } catch (error) {
    showToast("Failed to delete item.", "error");
    throw error;
  }
}
