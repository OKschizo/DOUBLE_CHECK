import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useEffect, useState } from 'react';

export function useDepartmentHeads(projectId: string) {
  const [heads, setHeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setHeads([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'department_heads'),
      where('projectId', '==', projectId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHeads(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const assignHead = async (data: any) => {
    await addDoc(collection(db, 'department_heads'), {
      ...data,
      assignedAt: serverTimestamp(),
    });
  };

  const removeHead = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'department_heads', id));
  };

  return {
    data: heads,
    isLoading,
    assignHead: { mutate: assignHead, mutateAsync: assignHead },
    removeHead: { mutate: removeHead, mutateAsync: removeHead },
  };
}

