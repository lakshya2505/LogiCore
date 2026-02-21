import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../config/firebase';

// Set persistence to LOCAL so user stays logged in across browser refreshes
setPersistence(auth, browserLocalPersistence);

/**
 * Register a new user
 * @param {string} email
 * @param {string} password
 * @returns {Promise} user credential
 */
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Login user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise} user credential
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Logout current user
 * @returns {Promise}
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Get current user
 * @returns {Object} current user object, or null
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - called with user object when auth state changes
 * @returns {Function} unsubscribe function
 */
export const onAuthStateChanged = (callback) => {
  return auth.onAuthStateChanged(callback);
};
