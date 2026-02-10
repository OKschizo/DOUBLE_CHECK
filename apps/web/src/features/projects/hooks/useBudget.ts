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
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEffect, useState, useCallback } from 'react';
import type { BudgetCategory, BudgetItem } from '@/lib/schemas';

// Department to category mapping
const DEPARTMENT_TO_CATEGORY: Record<string, string> = {
  'camera': 'Camera',
  'lighting_grip': 'Lighting & Grip',
  'lighting': 'Lighting & Grip',
  'grip': 'Lighting & Grip',
  'sound': 'Sound',
  'art': 'Art Department',
  'wardrobe': 'Wardrobe',
  'makeup_hair': 'Hair & Makeup',
  'makeup': 'Hair & Makeup',
  'production': 'Production',
  'post_production': 'Post-Production',
  'transportation': 'Transportation',
  'catering': 'Catering',
  'stunts': 'Stunts',
  'vfx': 'VFX',
  'other': 'Other',
};

// Equipment category to budget category mapping
const EQUIPMENT_TO_CATEGORY: Record<string, string> = {
  'camera': 'Camera',
  'lenses': 'Camera',
  'lighting': 'Lighting & Grip',
  'grip': 'Lighting & Grip',
  'power': 'Lighting & Grip',
  'audio': 'Sound',
  'sound': 'Sound',
  'monitors': 'Camera',
  'wireless_video': 'Camera',
  'specialty': 'Equipment',
  'vehicles': 'Transportation',
  'art': 'Art Department',
  'wardrobe': 'Wardrobe',
  'makeup': 'Hair & Makeup',
  'transportation': 'Transportation',
  'other': 'Equipment',
};

// Define Budget structure if not available
export interface Budget {
  categories: BudgetCategory[];
  items: BudgetItem[];
}

export function useBudget(projectId: string) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId) {
      setBudget(null);
      setIsLoading(false);
      return;
    }

    // We need to listen to both categories and items
    // This is a simplified approach; in production you might want to structure this differently
    const categoriesQuery = query(
      collection(db, 'budget_categories'),
      where('projectId', '==', projectId),
      orderBy('order', 'asc')
    );

    const itemsQuery = query(
      collection(db, 'budget_items'),
      where('projectId', '==', projectId)
    );

    const unsubscribeCategories = onSnapshot(categoriesQuery, (catSnap) => {
      const categories = catSnap.docs.map(d => ({ id: d.id, ...d.data() })) as BudgetCategory[];
      
      // Update state with new categories, keeping existing items
      setBudget(prev => ({
        categories,
        items: prev?.items || []
      }));
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setError(err);
    });

    const unsubscribeItems = onSnapshot(itemsQuery, (itemSnap) => {
      const items = itemSnap.docs.map(d => ({ id: d.id, ...d.data() })) as BudgetItem[];
      
      // Update state with new items, keeping existing categories
      setBudget(prev => ({
        categories: prev?.categories || [],
        items
      }));
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setError(err);
    });

    return () => {
      unsubscribeCategories();
      unsubscribeItems();
    };
  }, [projectId]);

  // Mutations
  const createCategory = async (data: any) => {
    if (!user) throw new Error("Not logged in");
    await addDoc(collection(db, 'budget_categories'), {
      ...data,
      projectId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const updateCategory = async ({ id, data }: { id: string, data: any }) => {
    await updateDoc(doc(db, 'budget_categories', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  const deleteCategory = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'budget_categories', id));
  };

  const createItem = async (data: any) => {
    if (!user) throw new Error("Not logged in");
    await addDoc(collection(db, 'budget_items'), {
      ...data,
      projectId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const updateItem = async ({ id, data }: { id: string, data: any }) => {
    await updateDoc(doc(db, 'budget_items', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  };

  const deleteItem = async ({ id }: { id: string }) => {
    await deleteDoc(doc(db, 'budget_items', id));
  };

  // Helper: Find or create a budget category
  const findOrCreateCategory = useCallback(async (categoryName: string, department?: string, phase?: string): Promise<string> => {
    if (!user) throw new Error("Not logged in");
    
    // Try to find existing category by name
    const categoriesRef = collection(db, 'budget_categories');
    const existingQuery = query(
      categoriesRef,
      where('projectId', '==', projectId),
      where('name', '==', categoryName)
    );
    const existingSnap = await getDocs(existingQuery);
    
    if (!existingSnap.empty) {
      return existingSnap.docs[0].id;
    }
    
    // Get max order for new category
    const allCategoriesQuery = query(
      categoriesRef,
      where('projectId', '==', projectId),
      orderBy('order', 'desc')
    );
    let maxOrder = 0;
    try {
      const allCatSnap = await getDocs(allCategoriesQuery);
      if (!allCatSnap.empty) {
        maxOrder = (allCatSnap.docs[0].data().order || 0) + 1;
      }
    } catch {
      // If orderBy fails, just use 0
    }
    
    // Create new category
    const newCatRef = await addDoc(categoriesRef, {
      projectId,
      name: categoryName,
      order: maxOrder,
      department: department || 'other',
      phase: phase || 'production',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return newCatRef.id;
  }, [projectId, user]);

  // Create budget items from crew members
  const createFromCrew = async ({ crewMemberIds, phase }: { crewMemberIds: string[], phase?: string }) => {
    if (!user) throw new Error("Not logged in");
    
    const createdItems: string[] = [];
    
    for (const crewId of crewMemberIds) {
      // Fetch crew member
      const crewDoc = await getDocs(query(
        collection(db, 'crew'),
        where('projectId', '==', projectId)
      ));
      const crewMember = crewDoc.docs.find(d => d.id === crewId);
      if (!crewMember) continue;
      
      const data = crewMember.data();
      const department = data.department || 'other';
      const categoryName = DEPARTMENT_TO_CATEGORY[department.toLowerCase()] || 'Other';
      
      // Find or create category
      const categoryId = await findOrCreateCategory(categoryName, department, phase);
      
      // Calculate estimated amount
      const rate = data.rate || 0;
      const days = data.days || 1;
      const estimatedAmount = rate * days;
      
      // Create budget item
      const itemRef = await addDoc(collection(db, 'budget_items'), {
        projectId,
        categoryId,
        description: `${data.name} - ${data.role}`,
        estimatedAmount,
        actualAmount: 0,
        status: 'estimated',
        unit: 'days',
        quantity: days,
        unitRate: rate,
        linkedCrewMemberId: crewId,
        phase: phase || 'production',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      createdItems.push(itemRef.id);
    }
    
    return { success: true, itemsCreated: createdItems.length };
  };

  // Create budget items from equipment
  const createFromEquipment = async ({ equipmentIds, phase, rentalDays }: { equipmentIds: string[], phase?: string, rentalDays?: number }) => {
    if (!user) throw new Error("Not logged in");
    
    const createdItems: string[] = [];
    const days = rentalDays || 1;
    
    for (const equipId of equipmentIds) {
      // Fetch equipment
      const equipDoc = await getDocs(query(
        collection(db, 'equipment'),
        where('projectId', '==', projectId)
      ));
      const equipment = equipDoc.docs.find(d => d.id === equipId);
      if (!equipment) continue;
      
      const data = equipment.data();
      const equipCategory = data.category || 'other';
      const categoryName = EQUIPMENT_TO_CATEGORY[equipCategory.toLowerCase()] || 'Equipment';
      
      // Find or create category
      const categoryId = await findOrCreateCategory(categoryName, equipCategory, phase);
      
      // Calculate estimated amount
      const dailyRate = data.dailyRate || 0;
      const weeklyRate = data.weeklyRate || 0;
      const estimatedAmount = dailyRate > 0 ? dailyRate * days : weeklyRate * Math.ceil(days / 7);
      
      // Create budget item - filter out undefined values (Firestore doesn't accept undefined)
      const budgetItemData: Record<string, any> = {
        projectId,
        categoryId,
        description: `${data.name}${data.quantity > 1 ? ` (x${data.quantity})` : ''}`,
        estimatedAmount,
        actualAmount: 0,
        status: 'estimated',
        unit: 'days',
        quantity: days,
        unitRate: dailyRate || (weeklyRate / 7),
        linkedEquipmentId: equipId,
        phase: phase || 'production',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      // Only add vendor if it has a value
      if (data.rentalVendor) {
        budgetItemData.vendor = data.rentalVendor;
      }
      const itemRef = await addDoc(collection(db, 'budget_items'), budgetItemData);
      
      createdItems.push(itemRef.id);
    }
    
    return { success: true, itemsCreated: createdItems.length };
  };

  // Create budget items from locations
  const createFromLocations = async ({ locationIds, phase }: { locationIds: string[], phase?: string }) => {
    if (!user) throw new Error("Not logged in");
    
    const createdItems: string[] = [];
    
    // Find or create Locations category
    const categoryId = await findOrCreateCategory('Locations', 'production', phase);
    
    for (const locId of locationIds) {
      // Fetch location
      const locDoc = await getDocs(query(
        collection(db, 'locations'),
        where('projectId', '==', projectId)
      ));
      const location = locDoc.docs.find(d => d.id === locId);
      if (!location) continue;
      
      const data = location.data();
      
      // Create budget item - filter out undefined values
      const locationBudgetData: Record<string, any> = {
        projectId,
        categoryId,
        description: data.name || 'Location',
        estimatedAmount: data.rentalCost || 0,
        actualAmount: 0,
        status: 'estimated',
        linkedLocationId: locId,
        phase: phase || 'production',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      // Only add vendor if it has a value
      if (data.contactName || data.contactEmail) {
        locationBudgetData.vendor = data.contactName || data.contactEmail;
      }
      const itemRef = await addDoc(collection(db, 'budget_items'), locationBudgetData);
      
      createdItems.push(itemRef.id);
    }
    
    return { success: true, itemsCreated: createdItems.length };
  };

  // Create budget items from cast members
  const createFromCast = async ({ castMemberIds, phase }: { castMemberIds: string[], phase?: string }) => {
    if (!user) throw new Error("Not logged in");
    
    const createdItems: string[] = [];
    
    // Find or create Cast/Talent category (or Above The Line if it exists)
    let categoryId: string;
    const categoriesRef = collection(db, 'budget_categories');
    const atlQuery = query(
      categoriesRef,
      where('projectId', '==', projectId),
      where('name', '==', 'Above The Line')
    );
    const atlSnap = await getDocs(atlQuery);
    
    if (!atlSnap.empty) {
      categoryId = atlSnap.docs[0].id;
    } else {
      categoryId = await findOrCreateCategory('Cast/Talent', 'production', phase);
    }
    
    for (const castId of castMemberIds) {
      // Fetch cast member
      const castDoc = await getDocs(query(
        collection(db, 'cast'),
        where('projectId', '==', projectId)
      ));
      const castMember = castDoc.docs.find(d => d.id === castId);
      if (!castMember) continue;
      
      const data = castMember.data();
      
      // Create budget item - filter out undefined values
      const castBudgetData: Record<string, any> = {
        projectId,
        categoryId,
        description: `${data.actorName || 'Actor'} as ${data.characterName || 'Character'}`,
        estimatedAmount: data.rate || 0,
        actualAmount: 0,
        status: 'estimated',
        linkedCastMemberId: castId,
        phase: phase || 'pre-production',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      // Only add vendor if it has a value
      if (data.agent) {
        castBudgetData.vendor = data.agent;
      }
      const itemRef = await addDoc(collection(db, 'budget_items'), castBudgetData);
      
      createdItems.push(itemRef.id);
    }
    
    return { success: true, itemsCreated: createdItems.length };
  };

  return {
    budget,
    isLoading,
    error,
    createCategory: { mutate: createCategory, mutateAsync: createCategory },
    updateCategory: { mutate: updateCategory, mutateAsync: updateCategory },
    deleteCategory: { mutate: deleteCategory, mutateAsync: deleteCategory },
    createItem: { mutate: createItem, mutateAsync: createItem },
    updateItem: { mutate: updateItem, mutateAsync: updateItem },
    deleteItem: { mutate: deleteItem, mutateAsync: deleteItem },
    createFromCrew: { mutate: createFromCrew, mutateAsync: createFromCrew },
    createFromEquipment: { mutate: createFromEquipment, mutateAsync: createFromEquipment },
    createFromLocations: { mutate: createFromLocations, mutateAsync: createFromLocations },
    createFromCast: { mutate: createFromCast, mutateAsync: createFromCast },
  };
}
