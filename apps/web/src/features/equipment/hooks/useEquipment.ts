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
import { syncBudgetForEquipmentUpdate } from '@/lib/firebase/syncUtils';

export function useEquipmentByProject(projectId: string) {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) {
      setEquipment([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'equipment'),
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
        
        setEquipment(list);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching equipment:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  return { data: equipment, isLoading, error };
}

export function useCreateEquipment() {
  const { user } = useAuth();

  const mutateAsync = async (data: any) => {
    if (!user) throw new Error('Must be logged in');

    const docData = {
      ...data,
      createdBy: user.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'equipment'), docData);
    return { id: docRef.id, ...docData };
  };

  return { mutateAsync };
}

export function useUpdateEquipment() {
  const mutateAsync = async ({ id, data }: { id: string; data: any }) => {
    const docRef = doc(db, 'equipment', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    // Sync budget items if relevant fields changed
    if (data.name || data.dailyRate !== undefined || data.weeklyRate !== undefined) {
      await syncBudgetForEquipmentUpdate(id, {
        name: data.name,
        dailyRate: data.dailyRate,
        weeklyRate: data.weeklyRate,
      }).catch(err => console.error('Budget sync failed:', err));
    }

    return { id, ...data };
  };

  return { mutateAsync };
}

export function useDeleteEquipment() {
  const mutateAsync = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'equipment', id));
  };

  return { mutateAsync };
}

