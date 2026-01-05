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
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState } from 'react';
import { syncBudgetForCrewUpdate } from '@/lib/firebase/syncUtils';

// Define types locally if not available in shared schemas yet
export interface CrewMember {
  id: string;
  projectId: string;
  userId?: string;
  name: string;
  role: string;
  department: string;
  email?: string;
  phone?: string;
  rate?: number;
  photoUrl?: string;
  status: 'pending' | 'confirmed' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

export function useCrewByProject(projectId: string) {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) {
      setCrew([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'crew'),
      where('projectId', '==', projectId)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const crewList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as CrewMember[];
        
        setCrew(crewList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching crew:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  return { data: crew, isLoading, error };
}

export function useCrewMember(id: string) {
  const [member, setMember] = useState<CrewMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'crew', id),
      (docSnap) => {
        if (docSnap.exists()) {
          setMember({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
          } as CrewMember);
        } else {
          setMember(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching crew member:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  return { data: member, isLoading, error };
}

export function useCreateCrewMember() {
  const { user } = useAuth();

  const mutateAsync = async (data: Omit<CrewMember, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: string }) => {
    if (!user) throw new Error('Must be logged in');

    const crewData = {
      ...data,
      status: data.status || 'pending',
      createdBy: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'crew'), crewData);
    return { id: docRef.id, ...crewData };
  };

  return { mutateAsync };
}

export function useUpdateCrewMember() {
  const mutateAsync = async ({ id, data }: { id: string; data: Partial<CrewMember> }) => {
    const docRef = doc(db, 'crew', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    // Sync budget items if relevant fields changed
    if (data.name || data.role || data.rate !== undefined) {
      await syncBudgetForCrewUpdate(id, {
        name: data.name,
        role: data.role,
        rate: data.rate,
      }).catch(err => console.error('Budget sync failed:', err));
    }

    return { id, ...data };
  };

  return { mutateAsync };
}

export function useDeleteCrewMember() {
  const mutateAsync = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'crew', id));
  };

  return { mutateAsync };
}
