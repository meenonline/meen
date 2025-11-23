import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { getDatabase, ref, set, push, onValue, remove, update, DataSnapshot } from 'firebase/database';
import { firebaseConfig } from '../constants';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

export const signIn = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in", error);
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

// Helper to convert snapshot to array
export const snapshotToArray = <T,>(snapshot: DataSnapshot): T[] => {
  const data: T[] = [];
  snapshot.forEach((child) => {
    data.push({
      id: child.key,
      ...child.val()
    } as T);
  });
  return data;
};
