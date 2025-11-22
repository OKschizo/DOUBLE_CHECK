import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from './config';
import { db } from './firestore';

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};

export const signIn = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    if (result.user) {
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        id: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || email.split('@')[0],
        orgId: 'default-org', // Placeholder for now
        role: 'admin', // Default first user to admin for now, or 'viewer'
        photoURL: result.user.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signInWithGoogle = async () => {
  try {
    // Suppress console errors temporarily
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = () => {};
    console.warn = () => {};
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await signInWithPopup(auth, provider);
    
    // Restore console
    console.error = originalError;
    console.warn = originalWarn;
    
    // Create user document if it doesn't exist (non-blocking)
    if (result.user) {
      const userRef = doc(db, 'users', result.user.uid);
      getDoc(userRef).then((userSnap) => {
        if (!userSnap.exists()) {
          setDoc(userRef, {
            id: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || result.user.email?.split('@')[0],
            orgId: 'default-org',
            role: 'admin',
            photoURL: result.user.photoURL || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }).catch(() => {
            // Silently ignore errors
          });
        }
      }).catch(() => {
        // Silently ignore errors
      });
    }

    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

