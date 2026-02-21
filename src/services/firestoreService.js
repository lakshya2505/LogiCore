import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  setDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * USERS COLLECTION
 */

export const createUserProfile = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      createdAt: new Date(),
    });
  } catch (error) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
};

export const getUserProfile = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    await updateDoc(doc(db, 'users', userId), updates);
  } catch (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
};

/**
 * GENERIC CRUD OPERATIONS FOR ANY COLLECTION
 */

export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to add document: ${error.message}`);
  }
};

export const updateDocument = async (collectionName, docId, updates) => {
  try {
    await updateDoc(doc(db, collectionName, docId), updates);
  } catch (error) {
    throw new Error(`Failed to update document: ${error.message}`);
  }
};

export const deleteDocument = async (collectionName, docId) => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
};

export const getDocuments = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Failed to get documents: ${error.message}`);
  }
};

/**
 * REAL-TIME LISTENER FOR COLLECTION
 */
export const subscribeToCollection = (collectionName, callback) => {
  try {
    return onSnapshot(collection(db, collectionName), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  } catch (error) {
    throw new Error(`Failed to subscribe to collection: ${error.message}`);
  }
};

/**
 * BATCH OPERATIONS
 */
export const batchSetDocuments = async (collectionName, documentsData) => {
  try {
    const batch = writeBatch(db);
    documentsData.forEach((data, index) => {
      const docRef = doc(db, collectionName, data.id || `doc_${index}_${Date.now()}`);
      batch.set(docRef, { ...data, createdAt: new Date() });
    });
    await batch.commit();
  } catch (error) {
    throw new Error(`Failed to batch set documents: ${error.message}`);
  }
};
