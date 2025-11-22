'use client';

import { useEffect } from 'react';
import { onAuthStateChange } from '@/lib/firebase/auth';
import { useAuthStore } from '../stores/authStore';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, timestampToDate } from '@/lib/firebase/firestore';
import type { User } from '@doublecheck/schemas';

export function useAuth() {
  const { firebaseUser, user, loading, setFirebaseUser, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (!isMounted) return;
      
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        setLoading(true);
        // Subscribe to user document changes
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (!isMounted) return;
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            const userData: User = {
              id: docSnap.id,
              email: data.email,
              displayName: data.displayName,
              orgId: data.orgId,
              role: data.role,
              photoURL: data.photoURL,
              createdAt: timestampToDate(data.createdAt),
              updatedAt: timestampToDate(data.updatedAt),
            };
            setUser(userData);
          } else {
            // User document doesn't exist yet (might be created shortly after signup)
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
          if (!isMounted) return;
          
          // Silently handle errors - user document might not exist yet or permissions might be resolving
          // Don't block the app from loading
          setUser(null);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
    };
  }, [setFirebaseUser, setUser, setLoading]);

  return { firebaseUser, user, loading };
}

