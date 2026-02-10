import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useEffect, useState } from 'react';

export function useLocationTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'location_templates'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTemplates(list);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const applyTemplate = async (data: any) => {
    console.log("Apply location template", data);
    return { locationsCreated: 0, locationsSkipped: 0 };
  };

  return {
    templates,
    isLoading,
    applyTemplate: { mutate: applyTemplate, mutateAsync: applyTemplate }
  };
}

