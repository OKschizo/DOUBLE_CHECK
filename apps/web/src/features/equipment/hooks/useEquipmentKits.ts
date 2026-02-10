'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { EquipmentPackage } from '@/lib/schemas/equipment';

// Fetch all kits for a project
export function useEquipmentKits(projectId: string) {
  const [kits, setKits] = useState<EquipmentPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!projectId) {
      setKits([]);
      setIsLoading(false);
      return;
    }

    const kitsRef = collection(db, 'projects', projectId, 'equipmentKits');
    
    const unsubscribe = onSnapshot(kitsRef,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
          reservedDate: doc.data().reservedDate?.toDate?.(),
          pickupDate: doc.data().pickupDate?.toDate?.(),
          pickedUpDate: doc.data().pickedUpDate?.toDate?.(),
          returnDate: doc.data().returnDate?.toDate?.(),
          returnedDate: doc.data().returnedDate?.toDate?.(),
        })) as EquipmentPackage[];
        setKits(list);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching kits:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  return { data: kits, isLoading, error };
}

// Create a new kit
export function useCreateKit(projectId: string) {
  const { firebaseUser } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(async (
    data: Partial<EquipmentPackage>,
    options?: { onSuccess?: (id: string) => void; onError?: (err: Error) => void }
  ) => {
    if (!firebaseUser) throw new Error('Must be logged in');
    setIsPending(true);

    try {
      const kitsRef = collection(db, 'projects', projectId, 'equipmentKits');
      const docRef = await addDoc(kitsRef, {
        ...data,
        projectId,
        equipmentIds: data.equipmentIds || [],
        createdBy: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // If kit has equipment items, update them with the kit ID
      if (data.equipmentIds && data.equipmentIds.length > 0) {
        const batch = writeBatch(db);
        for (const equipmentId of data.equipmentIds) {
          const equipmentRef = doc(db, 'equipment', equipmentId);
          batch.update(equipmentRef, { packageId: docRef.id, updatedAt: serverTimestamp() });
        }
        await batch.commit();
      }

      setIsPending(false);
      options?.onSuccess?.(docRef.id);
      return docRef.id;
    } catch (err: any) {
      setIsPending(false);
      options?.onError?.(err);
      throw err;
    }
  }, [projectId, firebaseUser]);

  return { mutate, isPending };
}

// Update a kit
export function useUpdateKit(projectId: string) {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(async (
    { kitId, data }: { kitId: string; data: Partial<EquipmentPackage> },
    options?: { onSuccess?: () => void; onError?: (err: Error) => void }
  ) => {
    setIsPending(true);

    try {
      const kitRef = doc(db, 'projects', projectId, 'equipmentKits', kitId);
      
      // Clean up undefined values
      const cleanData: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanData[key] = value;
        }
      });
      
      await updateDoc(kitRef, {
        ...cleanData,
        updatedAt: serverTimestamp(),
      });

      setIsPending(false);
      options?.onSuccess?.();
    } catch (err: any) {
      setIsPending(false);
      options?.onError?.(err);
      throw err;
    }
  }, [projectId]);

  return { mutate, isPending };
}

// Delete a kit
export function useDeleteKit(projectId: string) {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(async (
    kitId: string,
    options?: { onSuccess?: () => void; onError?: (err: Error) => void }
  ) => {
    setIsPending(true);

    try {
      // First, remove packageId from all equipment in this kit
      const equipmentRef = collection(db, 'equipment');
      const q = query(equipmentRef, where('packageId', '==', kitId));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { packageId: null, updatedAt: serverTimestamp() });
      });
      
      // Delete the kit
      const kitRef = doc(db, 'projects', projectId, 'equipmentKits', kitId);
      batch.delete(kitRef);
      
      await batch.commit();
      setIsPending(false);
      options?.onSuccess?.();
    } catch (err: any) {
      setIsPending(false);
      options?.onError?.(err);
      throw err;
    }
  }, [projectId]);

  return { mutate, isPending };
}

// Add equipment to a kit
export function useAddToKit(projectId: string) {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(async (
    { kitId, equipmentIds }: { kitId: string; equipmentIds: string[] },
    options?: { onSuccess?: () => void; onError?: (err: Error) => void }
  ) => {
    setIsPending(true);

    try {
      const batch = writeBatch(db);
      
      // Update each equipment item with the kit ID
      for (const equipmentId of equipmentIds) {
        const equipmentRef = doc(db, 'equipment', equipmentId);
        batch.update(equipmentRef, { packageId: kitId, updatedAt: serverTimestamp() });
      }
      
      await batch.commit();
      
      // Update the kit's equipmentIds array
      const kitsRef = collection(db, 'projects', projectId, 'equipmentKits');
      const kitDoc = await getDocs(query(kitsRef));
      const currentKit = kitDoc.docs.find(d => d.id === kitId);
      const currentIds = currentKit?.data()?.equipmentIds || [];
      const newIds = [...new Set([...currentIds, ...equipmentIds])];
      
      const kitRef = doc(db, 'projects', projectId, 'equipmentKits', kitId);
      await updateDoc(kitRef, {
        equipmentIds: newIds,
        updatedAt: serverTimestamp(),
      });

      setIsPending(false);
      options?.onSuccess?.();
    } catch (err: any) {
      setIsPending(false);
      options?.onError?.(err);
      throw err;
    }
  }, [projectId]);

  return { mutate, isPending };
}

// Remove equipment from a kit
export function useRemoveFromKit(projectId: string) {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(async (
    { kitId, equipmentIds }: { kitId: string; equipmentIds: string[] },
    options?: { onSuccess?: () => void; onError?: (err: Error) => void }
  ) => {
    setIsPending(true);

    try {
      const batch = writeBatch(db);
      
      // Remove packageId from equipment items
      for (const equipmentId of equipmentIds) {
        const equipmentRef = doc(db, 'equipment', equipmentId);
        batch.update(equipmentRef, { packageId: null, updatedAt: serverTimestamp() });
      }
      
      await batch.commit();
      
      // Update the kit's equipmentIds array
      const kitsRef = collection(db, 'projects', projectId, 'equipmentKits');
      const kitRef = doc(db, 'projects', projectId, 'equipmentKits', kitId);
      const kitDoc = await getDocs(query(kitsRef));
      const currentKit = kitDoc.docs.find(d => d.id === kitId);
      const currentIds = currentKit?.data()?.equipmentIds || [];
      const newIds = currentIds.filter((id: string) => !equipmentIds.includes(id));
      
      await updateDoc(kitRef, {
        equipmentIds: newIds,
        updatedAt: serverTimestamp(),
      });

      setIsPending(false);
      options?.onSuccess?.();
    } catch (err: any) {
      setIsPending(false);
      options?.onError?.(err);
      throw err;
    }
  }, [projectId]);

  return { mutate, isPending };
}

// Create kit from template
export function useCreateKitFromTemplate(projectId: string) {
  const { firebaseUser } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(async (
    {
      templateId,
      kitName,
      items,
    }: {
      templateId: string;
      kitName: string;
      items: Array<{ name: string; category: string; required?: boolean }>;
    },
    options?: { onSuccess?: (result: { kitId: string; itemsCreated: number }) => void; onError?: (err: Error) => void }
  ) => {
    if (!firebaseUser) throw new Error('Must be logged in');
    setIsPending(true);

    try {
      const batch = writeBatch(db);
      const equipmentIds: string[] = [];

      // Create equipment items first
      for (const item of items) {
        const equipmentRef = doc(collection(db, 'equipment'));
        equipmentIds.push(equipmentRef.id);
        batch.set(equipmentRef, {
          name: item.name,
          category: item.category,
          quantity: 1,
          projectId,
          procurementStatus: 'needed',
          status: 'available',
          source: 'rental',
          createdBy: firebaseUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Create the kit
      const kitRef = doc(collection(db, 'projects', projectId, 'equipmentKits'));
      batch.set(kitRef, {
        name: kitName,
        templateId,
        equipmentIds,
        projectId,
        trackAsUnit: true,
        procurementStatus: 'needed',
        source: 'rental',
        createdBy: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update equipment items with kit ID
      for (const equipmentId of equipmentIds) {
        const equipmentRef = doc(db, 'equipment', equipmentId);
        batch.update(equipmentRef, { packageId: kitRef.id });
      }

      await batch.commit();
      const result = { kitId: kitRef.id, itemsCreated: items.length };
      setIsPending(false);
      options?.onSuccess?.(result);
      return result;
    } catch (err: any) {
      setIsPending(false);
      options?.onError?.(err);
      throw err;
    }
  }, [projectId, firebaseUser]);

  return { mutate, isPending };
}

// Update kit procurement status (and optionally all items in kit)
export function useUpdateKitStatus(projectId: string) {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(async (
    {
      kitId,
      status,
      updateItems = true,
    }: {
      kitId: string;
      status: string;
      updateItems?: boolean;
    },
    options?: { onSuccess?: () => void; onError?: (err: Error) => void }
  ) => {
    setIsPending(true);

    try {
      const kitRef = doc(db, 'projects', projectId, 'equipmentKits', kitId);
      
      await updateDoc(kitRef, {
        procurementStatus: status,
        updatedAt: serverTimestamp(),
      });

      if (updateItems) {
        // Get kit's equipment IDs and update them
        const equipmentRef = collection(db, 'equipment');
        const q = query(equipmentRef, where('packageId', '==', kitId));
        const snapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { procurementStatus: status, updatedAt: serverTimestamp() });
        });
        await batch.commit();
      }

      setIsPending(false);
      options?.onSuccess?.();
    } catch (err: any) {
      setIsPending(false);
      options?.onError?.(err);
      throw err;
    }
  }, [projectId]);

  return { mutate, isPending };
}
