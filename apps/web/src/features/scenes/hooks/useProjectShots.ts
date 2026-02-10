import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState, useMemo } from 'react';

export function useProjectShots(projectId: string) {
  const [shots, setShots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId) {
      setShots([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'shots'),
      where('projectId', '==', projectId),
      orderBy('shotNumber', 'asc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }));
        
        setShots(list);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching shots:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  // Convert date strings to Date objects
  const processedShots = useMemo(() => {
    return shots.map((shot) => ({
      ...shot,
      createdAt: shot.createdAt instanceof Date ? shot.createdAt : new Date(shot.createdAt),
      updatedAt: shot.updatedAt instanceof Date ? shot.updatedAt : new Date(shot.updatedAt),
    }));
  }, [shots]);

  const createShot = {
    mutateAsync: async (data: any) => {
      if (!user) throw new Error('Must be logged in');
      const docData = {
        ...data,
        createdBy: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'shots'), docData);
      return { id: docRef.id, ...docData };
    },
    isPending: false,
  };

  const updateShot = {
    mutateAsync: async ({ id, data }: { id: string; data: any }) => {
      const docRef = doc(db, 'shots', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return { id, ...data };
    },
    isPending: false,
  };

  const deleteShot = {
    mutateAsync: async ({ id }: { id: string }) => {
      await deleteDoc(doc(db, 'shots', id));
    },
    isPending: false,
  };

  const updateShotOrder = {
    mutateAsync: async ({ updates }: { updates: Array<{ id: string; sortOrder: number }> }) => {
      const batch = writeBatch(db);
      updates.forEach(({ id, sortOrder }) => {
        const shotRef = doc(db, 'shots', id);
        batch.update(shotRef, { sortOrder, updatedAt: serverTimestamp() });
      });
      await batch.commit();
    },
    isPending: false,
  };

  return {
    shots: processedShots,
    isLoading,
    error,
    refetch: () => {}, // No-op for onSnapshot
    createShot,
    updateShot,
    deleteShot,
    updateShotOrder,
  };
}
