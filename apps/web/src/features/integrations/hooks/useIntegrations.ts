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
import { useEffect, useState } from 'react';

export function useIntegrations(projectId: string) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setIntegrations([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'integrations'),
      where('projectId', '==', projectId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastSyncAt: doc.data().lastSyncAt?.toDate(),
      }));
      setIntegrations(list);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const createIntegration = async (data: any) => {
    const docRef = await addDoc(collection(db, 'integrations'), {
      ...data,
      status: 'disconnected', // Initial status
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  };

  const deleteIntegration = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'integrations', id));
  };

  const syncIntegration = async ({ integrationId }: { integrationId: string }) => {
    // In client-side mode, we might not be able to actually sync
    // But we can simulate it or trigger a cloud function if available
    console.log("Sync integration", integrationId);
    return { message: "Sync triggered (simulated)" };
  };

  return {
    integrations,
    isLoading,
    createIntegration: { mutate: createIntegration, mutateAsync: createIntegration },
    deleteIntegration: { mutate: deleteIntegration, mutateAsync: deleteIntegration },
    syncIntegration: { mutate: syncIntegration, mutateAsync: syncIntegration },
  };
}

