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
import { syncBudgetForCastUpdate } from '@/lib/firebase/syncUtils';

export interface CastMember {
  id: string;
  projectId: string;
  actorName: string;
  characterName: string;
  castType: 'lead' | 'supporting' | 'featured' | 'extra' | 'stunt' | 'voice' | string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  agent?: string;
  rate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export function useCastByProject(projectId: string) {
  const [cast, setCast] = useState<CastMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Add a simple refetch capability (mostly for compat, onSnapshot handles updates)
  const [refetchIndex, setRefetchIndex] = useState(0);

  const refetch = () => setRefetchIndex(i => i + 1);

  useEffect(() => {
    if (!projectId) {
      setCast([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'cast'),
      where('projectId', '==', projectId)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const castList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as CastMember[];
        
        setCast(castList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching cast:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId, refetchIndex]);

  return { data: cast, isLoading, error, refetch };
}

export function useCreateCastMember() {
  const { user } = useAuth();

  const mutateAsync = async (data: any) => {
    if (!user) throw new Error('Must be logged in');

    const castData = {
      ...data,
      createdBy: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'cast'), castData);
    return { id: docRef.id, ...castData };
  };

  return { mutateAsync };
}

export function useUpdateCastMember() {
  const mutateAsync = async ({ id, data }: { id: string; data: Partial<CastMember> }) => {
    const docRef = doc(db, 'cast', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    // Sync budget items if relevant fields changed
    if (data.actorName || data.characterName || data.rate !== undefined) {
      await syncBudgetForCastUpdate(id, {
        actorName: data.actorName,
        characterName: data.characterName,
        rate: data.rate,
      }).catch(err => console.error('Budget sync failed:', err));
    }

    return { id, ...data };
  };

  return { mutateAsync };
}

export function useDeleteCastMember() {
  const mutateAsync = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'cast', id));
  };

  return { mutateAsync };
}

