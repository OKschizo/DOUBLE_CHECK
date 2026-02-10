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

export function useEquipmentTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'equipmentTemplates'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTemplates(list);
      setIsLoading(false);
    }, (err) => {
      console.error('Error fetching equipment templates:', err);
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
      
      let itemsCreated = 0;
      let itemsSkipped = 0;
      
      // Get existing equipment to check for duplicates
      const existingQuery = query(
        collection(db, 'equipment'),
        where('projectId', '==', projectId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      const existingNames = new Set(
        existingSnapshot.docs.map(doc => doc.data().name)
      );
      
      // Create equipment items from template
      for (const item of template.items || []) {
        if (skipExisting && existingNames.has(item.name)) {
          itemsSkipped++;
          continue;
        }
        
        // Build data object, filtering out undefined values (Firestore doesn't accept undefined)
        const equipmentData: Record<string, any> = {
          projectId,
          name: item.name,
          category: item.category,
          quantity: item.quantity || 1,
          description: item.description || '',
          required: item.required || false,
          createdBy: user.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        // Only add rate fields if they have values
        if (item.dailyRate !== undefined && item.dailyRate !== null) {
          equipmentData.dailyRate = item.dailyRate;
        }
        if (item.weeklyRate !== undefined && item.weeklyRate !== null) {
          equipmentData.weeklyRate = item.weeklyRate;
        }
        
        await addDoc(collection(db, 'equipment'), equipmentData);
        
        itemsCreated++;
      }
      
      setIsPending(false);
      return { itemsCreated, itemsSkipped };
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

