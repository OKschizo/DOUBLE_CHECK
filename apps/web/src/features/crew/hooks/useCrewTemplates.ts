import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState } from 'react';

export function useCrewTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'crewTemplates'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTemplates(list);
      setIsLoading(false);
    }, (err) => {
      console.error('Error fetching crew templates:', err);
      setTemplates([]);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const applyTemplate = async ({ projectId, templateId, skipExisting, overwriteExisting }: any) => {
    if (!user) throw new Error('Must be logged in');
    
    setIsPending(true);
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');
      
      let positionsCreated = 0;
      let positionsSkipped = 0;
      
      // Get existing crew to check for duplicates
      const existingQuery = query(
        collection(db, 'crew'),
        where('projectId', '==', projectId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      const existingRoles = new Set(
        existingSnapshot.docs.map(doc => `${doc.data().department}-${doc.data().role}`)
      );
      
      // Create crew positions from template
      for (const position of template.positions || []) {
        const roleKey = `${position.department}-${position.role}`;
        
        if (skipExisting && existingRoles.has(roleKey)) {
          positionsSkipped++;
          continue;
        }
        
        await addDoc(collection(db, 'crew'), {
          projectId,
          name: position.name || '',
          role: position.role,
          department: position.department,
          email: position.email || '',
          phone: position.phone || '',
          rate: position.rate || 0,
          status: 'pending',
          createdBy: user.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        positionsCreated++;
      }
      
      setIsPending(false);
      return { positionsCreated, positionsSkipped };
    } catch (error) {
      setIsPending(false);
      throw error;
    }
  };

  return {
    templates,
    isLoading,
    applyTemplate: { 
      mutate: applyTemplate, 
      mutateAsync: applyTemplate,
      isPending 
    }
  };
}

