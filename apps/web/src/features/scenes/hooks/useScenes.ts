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
import { syncSceneToSchedule } from '@/lib/firebase/syncUtils';

export function useScenesByProject(projectId: string) {
  const [scenes, setScenes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) {
      setScenes([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'scenes'),
      where('projectId', '==', projectId),
      orderBy('sceneNumber')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        }));
        
        // Sort by sortOrder (if exists) then sceneNumber
        list.sort((a: any, b: any) => {
          // If both have sortOrder, use that
          if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
            return a.sortOrder - b.sortOrder;
          }
          // If only one has sortOrder, prioritize the one without (legacy first)
          if (a.sortOrder !== undefined) return 1;
          if (b.sortOrder !== undefined) return -1;
          // Fall back to sceneNumber comparison
          return (a.sceneNumber || '').localeCompare(b.sceneNumber || '', undefined, { numeric: true });
        });
        
        setScenes(list);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching scenes:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  return { data: scenes, isLoading, error };
}

export function useCreateScene() {
  const { user } = useAuth();

  const mutateAsync = async (data: any) => {
    if (!user) throw new Error('Must be logged in');

    const docData = {
      ...data,
      createdBy: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'scenes'), docData);
    return { id: docRef.id, ...docData };
  };

  return { mutateAsync };
}

export function useUpdateScene() {
  const mutateAsync = async ({ id, data }: { id: string; data?: any }) => {
    if (!data || typeof data !== 'object') {
      console.error('useUpdateScene: data is required and must be an object', { id, data });
      throw new Error('Invalid data provided to updateScene');
    }
    
    const docRef = doc(db, 'scenes', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    // Sync to schedule if shootingDayIds are provided
    if (data.shootingDayIds && Array.isArray(data.shootingDayIds)) {
      await syncSceneToSchedule(id, data.shootingDayIds)
        .catch(err => console.error('Schedule sync failed:', err));
    }

    return { id, ...data };
  };

  return { mutateAsync };
}

export function useDeleteScene() {
  const mutateAsync = async (id: string) => {
    await deleteDoc(doc(db, 'scenes', id));
  };

  return { mutateAsync };
}

// Hook to update scene order (for drag and drop)
export function useUpdateSceneOrder() {
  const mutateAsync = async (updates: Array<{ id: string; sortOrder: number }>) => {
    const promises = updates.map(({ id, sortOrder }) => {
      const docRef = doc(db, 'scenes', id);
      return updateDoc(docRef, {
        sortOrder,
        updatedAt: serverTimestamp(),
      });
    });
    await Promise.all(promises);
  };

  return { mutateAsync };
}

// Alias for compatibility
export function useScenes(projectId: string) {
  return useScenesByProject(projectId);
}

// Hook to fetch a single scene
export function useScene(sceneId: string) {
  const [scene, setScene] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sceneId) {
      setScene(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'scenes', sceneId), 
      (docSnap) => {
        if (docSnap.exists()) {
          setScene({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
          });
        } else {
          setScene(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching scene:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sceneId]);

  return { data: scene, isLoading, error };
}