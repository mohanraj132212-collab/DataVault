// DataVault Authentication Module
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";
import { showToast } from "./ui.js";

/**
 * Register a new user
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 */
export async function registerUser(name, email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update Firebase Auth Display Name
    await updateProfile(user, { displayName: name });

    // Store user document in Firestore `users/{userId}`
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      createdAt: serverTimestamp(),
      photoURL: user.photoURL || ""
    });

    showToast("Account created successfully! Welcome to DataVault 🎉", "success");
    return user;
  } catch (error) {
    let msg = "Failed to register account.";
    if (error.code === 'auth/email-already-in-use') msg = "This email is already registered.";
    if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
    if (error.code === 'auth/invalid-email') msg = "Please enter a valid email address.";
    showToast(msg, "error");
    throw error;
  }
}

/**
 * Sign in user with email and password
 * @param {string} email 
 * @param {string} password 
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    showToast("Welcome back!", "success");
    return userCredential.user;
  } catch (error) {
    let msg = "Invalid email or password.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      msg = "Incorrect email or password.";
    }
    showToast(msg, "error");
    throw error;
  }
}

/**
 * Trigger password reset email
 * @param {string} email 
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    showToast("Password reset link sent to your email!", "success");
  } catch (error) {
    showToast("Failed to send password reset email. Verify email address.", "error");
    throw error;
  }
}

/**
 * Logout authenticated user
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    showToast("Logged out successfully.", "info");
    window.location.href = "login.html";
  } catch (error) {
    showToast("Error logging out.", "error");
  }
}

/**
 * Monitor Auth state change and handle page access protection
 * @param {function(Object):void} onUserAuthenticated 
 * @param {boolean} requiresAuth 
 */
export function initAuthListener(onUserAuthenticated, requiresAuth = true) {
  onAuthStateChanged(auth, async (user) => {
    const currentPage = window.location.pathname.split("/").pop();

    if (user) {
      // User is logged in
      if (currentPage === "login.html" || currentPage === "register.html" || currentPage === "" || currentPage === "index.html") {
        window.location.href = "dashboard.html";
        return;
      }
      if (onUserAuthenticated) onUserAuthenticated(user);
    } else {
      // User is logged out
      if (requiresAuth && currentPage === "dashboard.html") {
        window.location.href = "login.html";
        return;
      }
      if (onUserAuthenticated) onUserAuthenticated(null);
    }
  });
}
