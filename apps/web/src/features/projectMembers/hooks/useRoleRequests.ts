import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useEffect, useState } from 'react';

export function useRoleRequests(projectId: string) {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'role_requests'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
        reviewedAt: d.data().reviewedAt?.toDate(),
      })));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const reviewRequest = async ({ requestId, action, reviewNote }: any) => {
    const status = action === 'approve' ? 'approved' : 'denied';
    await updateDoc(doc(db, 'role_requests', requestId), {
      status,
      reviewNote,
      reviewedAt: serverTimestamp(),
    });
  };

  return {
    data: requests,
    isLoading,
    reviewRequest: { mutate: reviewRequest, mutateAsync: reviewRequest },
  };
}

