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
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState } from 'react';

export function useShotsByScene(sceneId: string) {
  const [shots, setShots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sceneId) {
      setShots([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'shots'),
      where('sceneId', '==', sceneId),
      orderBy('shotNumber')
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
  }, [sceneId]);

  return { data: shots, isLoading, error };
}

export function useProjectShots(projectId: string) {
  const [shots, setShots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, 'shots'),
      where('projectId', '==', projectId)
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

  return { data: shots, isLoading, error };
}

export function useCreateShot() {
  const { user } = useAuth();

  const mutateAsync = async (data: any) => {
    if (!user) throw new Error('Must be logged in');

    const docData = {
      ...data,
      createdBy: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'shots'), docData);
    return { id: docRef.id, ...docData };
  };

  return { mutateAsync };
}

export function useUpdateShot() {
  const mutateAsync = async ({ id, data }: { id: string; data: any }) => {
    const docRef = doc(db, 'shots', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { id, ...data };
  };

  return { mutateAsync };
}

export function useDeleteShot() {
  const mutateAsync = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'shots', id));
  };

  return { mutateAsync };
}

// Combined hook for ShotDetailModal compatibility
export function useShots(sceneId: string) {
  const { data: shots, isLoading, error } = useShotsByScene(sceneId);
  const createShot = useCreateShot();
  const updateShot = useUpdateShot();
  const deleteShot = useDeleteShot();

  const markBestTake = {
    mutate: async ({ id, takeNumber }: { id: string; takeNumber: number }) => {
      const shotRef = doc(db, 'shots', id);
      await updateDoc(shotRef, {
        bestTake: takeNumber,
        updatedAt: serverTimestamp(),
      });
    },
    isPending: false,
  };

  return {
    shots: shots || [],
    isLoading,
    error,
    createShot,
    updateShot,
    deleteShot,
    markBestTake,
  };
}