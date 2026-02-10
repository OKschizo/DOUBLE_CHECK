import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Default budget templates (always available)
const DEFAULT_TEMPLATES = [
  {
    id: 'default-feature-film',
    name: 'Feature Film (Standard)',
    description: 'Complete budget structure for feature film production',
    type: 'feature',
    categories: [
      { name: 'Above The Line', department: 'production', phase: 'pre-production', items: [
        { description: 'Director', unit: 'flat', quantity: 1 },
        { description: 'Producer', unit: 'flat', quantity: 1 },
        { description: 'Writer', unit: 'flat', quantity: 1 },
        { description: 'Cast/Talent', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Production Staff', department: 'production', phase: 'production', items: [
        { description: 'Line Producer', unit: 'weeks', quantity: 1 },
        { description: 'UPM', unit: 'weeks', quantity: 1 },
        { description: 'Production Coordinator', unit: 'weeks', quantity: 1 },
        { description: 'Production Assistants', unit: 'weeks', quantity: 1 },
      ]},
      { name: 'Camera', department: 'camera', phase: 'production', items: [
        { description: 'Director of Photography', unit: 'days', quantity: 1 },
        { description: '1st AC', unit: 'days', quantity: 1 },
        { description: '2nd AC', unit: 'days', quantity: 1 },
        { description: 'Camera Operator', unit: 'days', quantity: 1 },
        { description: 'Camera Package', unit: 'days', quantity: 1 },
      ]},
      { name: 'Lighting & Grip', department: 'lighting_grip', phase: 'production', items: [
        { description: 'Gaffer', unit: 'days', quantity: 1 },
        { description: 'Key Grip', unit: 'days', quantity: 1 },
        { description: 'Best Boy Electric', unit: 'days', quantity: 1 },
        { description: 'Best Boy Grip', unit: 'days', quantity: 1 },
        { description: 'Lighting Package', unit: 'days', quantity: 1 },
        { description: 'Grip Package', unit: 'days', quantity: 1 },
      ]},
      { name: 'Sound', department: 'sound', phase: 'production', items: [
        { description: 'Production Sound Mixer', unit: 'days', quantity: 1 },
        { description: 'Boom Operator', unit: 'days', quantity: 1 },
        { description: 'Sound Package', unit: 'days', quantity: 1 },
      ]},
      { name: 'Art Department', department: 'art', phase: 'production', items: [
        { description: 'Production Designer', unit: 'weeks', quantity: 1 },
        { description: 'Art Director', unit: 'weeks', quantity: 1 },
        { description: 'Set Decorator', unit: 'weeks', quantity: 1 },
        { description: 'Props Master', unit: 'days', quantity: 1 },
        { description: 'Set Construction', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Wardrobe', department: 'wardrobe', phase: 'production', items: [
        { description: 'Costume Designer', unit: 'weeks', quantity: 1 },
        { description: 'Wardrobe Supervisor', unit: 'days', quantity: 1 },
        { description: 'Costume Purchases/Rentals', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Hair & Makeup', department: 'makeup_hair', phase: 'production', items: [
        { description: 'Key Makeup', unit: 'days', quantity: 1 },
        { description: 'Key Hair', unit: 'days', quantity: 1 },
        { description: 'Makeup Supplies', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Locations', department: 'production', phase: 'production', items: [
        { description: 'Location Manager', unit: 'weeks', quantity: 1 },
        { description: 'Location Scouts', unit: 'days', quantity: 1 },
        { description: 'Location Fees', unit: 'flat', quantity: 1 },
        { description: 'Permits', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Transportation', department: 'transportation', phase: 'production', items: [
        { description: 'Transportation Coordinator', unit: 'weeks', quantity: 1 },
        { description: 'Drivers', unit: 'days', quantity: 1 },
        { description: 'Vehicle Rentals', unit: 'days', quantity: 1 },
        { description: 'Gas/Fuel', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Catering', department: 'catering', phase: 'production', items: [
        { description: 'Craft Services', unit: 'days', quantity: 1 },
        { description: 'Catering', unit: 'days', quantity: 1 },
      ]},
      { name: 'Post-Production', department: 'post_production', phase: 'post-production', items: [
        { description: 'Editor', unit: 'weeks', quantity: 1 },
        { description: 'Assistant Editor', unit: 'weeks', quantity: 1 },
        { description: 'Color Grading', unit: 'flat', quantity: 1 },
        { description: 'Sound Design & Mix', unit: 'flat', quantity: 1 },
        { description: 'VFX', unit: 'flat', quantity: 1 },
        { description: 'Music & Score', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Insurance & Legal', department: 'production', phase: 'pre-production', items: [
        { description: 'Production Insurance', unit: 'flat', quantity: 1 },
        { description: 'E&O Insurance', unit: 'flat', quantity: 1 },
        { description: 'Legal Fees', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Contingency', department: 'production', phase: 'other', items: [
        { description: 'Contingency (10%)', unit: 'flat', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'default-commercial',
    name: 'Commercial (Standard)',
    description: 'Budget structure for commercial/advertising production',
    type: 'commercial',
    categories: [
      { name: 'Creative Fees', department: 'production', phase: 'pre-production', items: [
        { description: 'Director Fee', unit: 'flat', quantity: 1 },
        { description: 'Creative Fee', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Pre-Production', department: 'production', phase: 'pre-production', items: [
        { description: 'Producer', unit: 'days', quantity: 1 },
        { description: 'Casting', unit: 'flat', quantity: 1 },
        { description: 'Location Scouting', unit: 'flat', quantity: 1 },
        { description: 'Storyboards', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Production Crew', department: 'production', phase: 'production', items: [
        { description: 'DP', unit: 'days', quantity: 1 },
        { description: 'Camera Team', unit: 'days', quantity: 1 },
        { description: 'Lighting & Grip', unit: 'days', quantity: 1 },
        { description: 'Sound', unit: 'days', quantity: 1 },
        { description: 'Wardrobe/Makeup/Hair', unit: 'days', quantity: 1 },
        { description: 'Art Department', unit: 'days', quantity: 1 },
      ]},
      { name: 'Talent', department: 'production', phase: 'production', items: [
        { description: 'Principal Talent', unit: 'days', quantity: 1 },
        { description: 'Extras/Background', unit: 'days', quantity: 1 },
        { description: 'Talent Usage Fees', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Equipment', department: 'camera', phase: 'production', items: [
        { description: 'Camera Package', unit: 'days', quantity: 1 },
        { description: 'Lighting Package', unit: 'days', quantity: 1 },
        { description: 'Grip Package', unit: 'days', quantity: 1 },
        { description: 'Special Equipment', unit: 'days', quantity: 1 },
      ]},
      { name: 'Location & Studio', department: 'production', phase: 'production', items: [
        { description: 'Studio Rental', unit: 'days', quantity: 1 },
        { description: 'Location Fees', unit: 'flat', quantity: 1 },
        { description: 'Permits', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Post-Production', department: 'post_production', phase: 'post-production', items: [
        { description: 'Offline Edit', unit: 'days', quantity: 1 },
        { description: 'Online/Finishing', unit: 'days', quantity: 1 },
        { description: 'Color', unit: 'flat', quantity: 1 },
        { description: 'VFX/Animation', unit: 'flat', quantity: 1 },
        { description: 'Sound Mix', unit: 'flat', quantity: 1 },
        { description: 'Music License', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Production Fee & Markup', department: 'production', phase: 'other', items: [
        { description: 'Production Fee', unit: 'flat', quantity: 1 },
        { description: 'Insurance', unit: 'flat', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'default-music-video',
    name: 'Music Video',
    description: 'Streamlined budget for music video production',
    type: 'music_video',
    categories: [
      { name: 'Above The Line', department: 'production', phase: 'pre-production', items: [
        { description: 'Director', unit: 'flat', quantity: 1 },
        { description: 'Producer', unit: 'flat', quantity: 1 },
      ]},
      { name: 'Production', department: 'production', phase: 'production', items: [
        { description: 'Camera Team', unit: 'days', quantity: 1 },
        { description: 'Lighting & Grip', unit: 'days', quantity: 1 },
        { description: 'Wardrobe/Makeup/Hair', unit: 'days', quantity: 1 },
        { description: 'Art/Set Design', unit: 'flat', quantity: 1 },
        { description: 'Choreographer/Dancers', unit: 'days', quantity: 1 },
      ]},
      { name: 'Equipment & Locations', department: 'camera', phase: 'production', items: [
        { description: 'Camera Package', unit: 'days', quantity: 1 },
        { description: 'Lighting Package', unit: 'days', quantity: 1 },
        { description: 'Location/Studio', unit: 'days', quantity: 1 },
      ]},
      { name: 'Post-Production', department: 'post_production', phase: 'post-production', items: [
        { description: 'Edit', unit: 'flat', quantity: 1 },
        { description: 'Color Grade', unit: 'flat', quantity: 1 },
        { description: 'VFX', unit: 'flat', quantity: 1 },
      ]},
    ],
  },
  {
    id: 'default-short-film',
    name: 'Short Film',
    description: 'Compact budget structure for short film production',
    type: 'short',
    categories: [
      { name: 'Above The Line', department: 'production', phase: 'pre-production', items: [] },
      { name: 'Production', department: 'production', phase: 'production', items: [] },
      { name: 'Camera', department: 'camera', phase: 'production', items: [] },
      { name: 'Lighting & Grip', department: 'lighting_grip', phase: 'production', items: [] },
      { name: 'Sound', department: 'sound', phase: 'production', items: [] },
      { name: 'Art & Wardrobe', department: 'art', phase: 'production', items: [] },
      { name: 'Locations', department: 'production', phase: 'production', items: [] },
      { name: 'Post-Production', department: 'post_production', phase: 'post-production', items: [] },
    ],
  },
];

export function useBudgetTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'budget_templates'), orderBy('name'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const dbTemplates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));
        // Combine default templates with database templates
        // Database templates override defaults with same ID
        const dbTemplateIds = new Set(dbTemplates.map(t => t.id));
        const combined = [
          ...DEFAULT_TEMPLATES.filter(t => !dbTemplateIds.has(t.id)),
          ...dbTemplates,
        ];
        setTemplates(combined);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching budget templates:', err);
        // On error, still show default templates
        setTemplates(DEFAULT_TEMPLATES);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const createTemplate = async (data: any) => {
    await addDoc(collection(db, 'budget_templates'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  // Apply a budget template to a project
  const applyTemplate = useCallback(async ({ 
    projectId, 
    templateId, 
    phase 
  }: { 
    projectId: string; 
    templateId: string; 
    phase?: string;
  }) => {
    if (!user) throw new Error("Not logged in");
    
    // Find the template
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error("Template not found");
    
    const categoriesCreated: string[] = [];
    const itemsCreated: string[] = [];
    
    // Get existing categories to check for duplicates
    const existingCatsQuery = query(
      collection(db, 'budget_categories'),
      where('projectId', '==', projectId)
    );
    const existingCatsSnap = await getDocs(existingCatsQuery);
    const existingCatNames = new Set(existingCatsSnap.docs.map(d => d.data().name?.toLowerCase()));
    
    // Get max order for new categories
    let maxOrder = 0;
    existingCatsSnap.docs.forEach(d => {
      const order = d.data().order || 0;
      if (order > maxOrder) maxOrder = order;
    });
    
    // Create categories from template
    const categoryIdMap: Record<string, string> = {}; // Map template category index to new category ID
    
    for (let i = 0; i < (template.categories || []).length; i++) {
      const cat = template.categories[i];
      
      // Skip if category already exists
      if (existingCatNames.has(cat.name?.toLowerCase())) {
        // Find the existing category ID
        const existingCat = existingCatsSnap.docs.find(d => 
          d.data().name?.toLowerCase() === cat.name?.toLowerCase()
        );
        if (existingCat) {
          categoryIdMap[i] = existingCat.id;
        }
        continue;
      }
      
      maxOrder++;
      const catRef = await addDoc(collection(db, 'budget_categories'), {
        projectId,
        name: cat.name,
        order: maxOrder,
        department: cat.department,
        phase: phase && phase !== 'all' ? phase : (cat.phase || 'production'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      categoryIdMap[i] = catRef.id;
      categoriesCreated.push(catRef.id);
    }
    
    // Create items from template (if template has default items)
    for (let i = 0; i < (template.categories || []).length; i++) {
      const cat = template.categories[i];
      const categoryId = categoryIdMap[i];
      if (!categoryId) continue;
      
      for (const item of (cat.items || [])) {
        const itemRef = await addDoc(collection(db, 'budget_items'), {
          projectId,
          categoryId,
          description: item.name || item.description,
          estimatedAmount: item.estimatedAmount || 0,
          actualAmount: 0,
          status: 'estimated',
          unit: item.unit,
          quantity: item.quantity || 1,
          unitRate: item.unitRate || item.rate,
          accountCode: item.accountCode,
          phase: phase && phase !== 'all' ? phase : (cat.phase || 'production'),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        itemsCreated.push(itemRef.id);
      }
    }
    
    return {
      success: true,
      categoriesCreated: categoriesCreated.length,
      itemsCreated: itemsCreated.length,
    };
  }, [templates, user]);

  return {
    templates,
    isLoading,
    error,
    createTemplate: { mutate: createTemplate, mutateAsync: createTemplate },
    applyTemplate: { mutate: applyTemplate, mutateAsync: applyTemplate },
  };
}

export function useBudgetTemplate(templateId: string) {
  const [template, setTemplate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!templateId) return;

    const unsubscribe = onSnapshot(doc(db, 'budget_templates', templateId), 
      (doc) => {
        if (doc.exists()) {
          setTemplate({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
          });
        } else {
          setTemplate(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching budget template:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [templateId]);

  return { template, isLoading, error };
}
