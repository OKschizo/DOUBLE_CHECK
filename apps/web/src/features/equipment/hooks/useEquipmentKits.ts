'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { EquipmentPackage, Equipment } from '@/lib/schemas/equipment';

// Fetch all kits for a project
export function useEquipmentKits(projectId: string) {
  return useQuery({
    queryKey: ['equipment-kits', projectId],
    queryFn: async () => {
      const kitsRef = collection(db, 'projects', projectId, 'equipmentKits');
      const snapshot = await getDocs(kitsRef);
      return snapshot.docs.map((doc) => ({
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
    },
    enabled: !!projectId,
  });
}

// Create a new kit
export function useCreateKit(projectId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<EquipmentPackage>) => {
      if (!user) throw new Error('Must be logged in');

      const kitsRef = collection(db, 'projects', projectId, 'equipmentKits');
      const docRef = await addDoc(kitsRef, {
        ...data,
        projectId,
        equipmentIds: data.equipmentIds || [],
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // If kit has equipment items, update them with the kit ID
      if (data.equipmentIds && data.equipmentIds.length > 0) {
        const batch = writeBatch(db);
        for (const equipmentId of data.equipmentIds) {
          const equipmentRef = doc(db, 'projects', projectId, 'equipment', equipmentId);
          batch.update(equipmentRef, { packageId: docRef.id, updatedAt: serverTimestamp() });
        }
        await batch.commit();
      }

      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-kits', projectId] });
      queryClient.invalidateQueries({ queryKey: ['equipment', projectId] });
    },
  });
}

// Update a kit
export function useUpdateKit(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kitId, data }: { kitId: string; data: Partial<EquipmentPackage> }) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-kits', projectId] });
    },
  });
}

// Delete a kit
export function useDeleteKit(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (kitId: string) => {
      // First, remove packageId from all equipment in this kit
      const equipmentRef = collection(db, 'projects', projectId, 'equipment');
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-kits', projectId] });
      queryClient.invalidateQueries({ queryKey: ['equipment', projectId] });
    },
  });
}

// Add equipment to a kit
export function useAddToKit(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kitId, equipmentIds }: { kitId: string; equipmentIds: string[] }) => {
      const kitRef = doc(db, 'projects', projectId, 'equipmentKits', kitId);
      
      // Get current kit data to append equipment
      const batch = writeBatch(db);
      
      // Update each equipment item with the kit ID
      for (const equipmentId of equipmentIds) {
        const equipmentRef = doc(db, 'projects', projectId, 'equipment', equipmentId);
        batch.update(equipmentRef, { packageId: kitId, updatedAt: serverTimestamp() });
      }
      
      await batch.commit();
      
      // Update the kit's equipmentIds array (fetch current and merge)
      const kitsRef = collection(db, 'projects', projectId, 'equipmentKits');
      const kitDoc = await getDocs(query(kitsRef));
      const currentKit = kitDoc.docs.find(d => d.id === kitId);
      const currentIds = currentKit?.data()?.equipmentIds || [];
      const newIds = [...new Set([...currentIds, ...equipmentIds])];
      
      await updateDoc(kitRef, {
        equipmentIds: newIds,
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-kits', projectId] });
      queryClient.invalidateQueries({ queryKey: ['equipment', projectId] });
    },
  });
}

// Remove equipment from a kit
export function useRemoveFromKit(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kitId, equipmentIds }: { kitId: string; equipmentIds: string[] }) => {
      const batch = writeBatch(db);
      
      // Remove packageId from equipment items
      for (const equipmentId of equipmentIds) {
        const equipmentRef = doc(db, 'projects', projectId, 'equipment', equipmentId);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-kits', projectId] });
      queryClient.invalidateQueries({ queryKey: ['equipment', projectId] });
    },
  });
}

// Create kit from template
export function useCreateKitFromTemplate(projectId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      templateId,
      kitName,
      items,
    }: {
      templateId: string;
      kitName: string;
      items: Array<{ name: string; category: string; required?: boolean }>;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const batch = writeBatch(db);
      const equipmentIds: string[] = [];

      // Create equipment items first
      for (const item of items) {
        const equipmentRef = doc(collection(db, 'projects', projectId, 'equipment'));
        equipmentIds.push(equipmentRef.id);
        batch.set(equipmentRef, {
          name: item.name,
          category: item.category,
          quantity: 1,
          projectId,
          procurementStatus: 'needed',
          status: 'available',
          source: 'rental',
          createdBy: user.uid,
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
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update equipment items with kit ID
      for (const equipmentId of equipmentIds) {
        const equipmentRef = doc(db, 'projects', projectId, 'equipment', equipmentId);
        batch.update(equipmentRef, { packageId: kitRef.id });
      }

      await batch.commit();
      return { kitId: kitRef.id, itemsCreated: items.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-kits', projectId] });
      queryClient.invalidateQueries({ queryKey: ['equipment', projectId] });
    },
  });
}

// Update kit procurement status (and optionally all items in kit)
export function useUpdateKitStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kitId,
      status,
      updateItems = true,
    }: {
      kitId: string;
      status: string;
      updateItems?: boolean;
    }) => {
      const kitRef = doc(db, 'projects', projectId, 'equipmentKits', kitId);
      
      await updateDoc(kitRef, {
        procurementStatus: status,
        updatedAt: serverTimestamp(),
      });

      if (updateItems) {
        // Get kit's equipment IDs and update them
        const equipmentRef = collection(db, 'projects', projectId, 'equipment');
        const q = query(equipmentRef, where('packageId', '==', kitId));
        const snapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { procurementStatus: status, updatedAt: serverTimestamp() });
        });
        await batch.commit();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-kits', projectId] });
      queryClient.invalidateQueries({ queryKey: ['equipment', projectId] });
    },
  });
}
