import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState } from 'react';

export function useLocationsByProject(projectId: string) {
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) {
      setLocations([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'locations'),
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
        
        setLocations(list);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching locations:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  // Add a refetch method for compatibility with code expecting it
  const refetch = () => {
    // No-op since we use onSnapshot
  };

  return { data: locations, isLoading, error, refetch };
}

export function useCreateLocation() {
  const { user } = useAuth();

  const mutateAsync = async (data: any) => {
    if (!user) throw new Error('Must be logged in');

    const docData = {
      ...data,
      createdBy: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'locations'), docData);
    return { id: docRef.id, ...docData };
  };

  return { mutateAsync };
}

export function useUpdateLocation() {
  const mutateAsync = async ({ id, data }: { id: string; data: any }) => {
    const docRef = doc(db, 'locations', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { id, ...data };
  };

  return { mutateAsync };
}

export function useDeleteLocation() {
  const mutateAsync = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'locations', id));
  };

  return { mutateAsync };
}

