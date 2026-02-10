import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { BudgetCategory, BudgetItem } from '@/lib/schemas';

export interface BudgetVersion {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  createdByName?: string;
  // Snapshot data
  totalEstimated: number;
  totalActual: number;
  categoryCount: number;
  itemCount: number;
  // Full snapshot (stored as JSON)
  categoriesSnapshot: BudgetCategory[];
  itemsSnapshot: BudgetItem[];
}

export function useBudgetVersions(projectId: string) {
  const [versions, setVersions] = useState<BudgetVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, firebaseUser } = useAuth();

  useEffect(() => {
    if (!projectId) {
      setVersions([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'budget_versions'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc'),
      limit(50) // Keep last 50 versions
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const versionList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as BudgetVersion[];
        setVersions(versionList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching budget versions:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId]);

  // Save current budget as a new version
  const saveVersion = useCallback(async (
    categories: BudgetCategory[],
    items: BudgetItem[],
    name: string,
    description?: string
  ) => {
    if (!firebaseUser) throw new Error("Not logged in");
    
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimatedAmount || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);
    
    const versionData = {
      projectId,
      name,
      description: description || '',
      createdBy: firebaseUser.uid,
      createdByName: user?.name || firebaseUser.email || 'Unknown',
      totalEstimated,
      totalActual,
      categoryCount: categories.length,
      itemCount: items.length,
      // Store snapshots as plain objects (Firestore compatible)
      categoriesSnapshot: categories.map(c => ({
        id: c.id,
        name: c.name,
        projectId: c.projectId,
        order: c.order,
        department: c.department,
        phase: c.phase,
      })),
      itemsSnapshot: items.map(i => ({
        id: i.id,
        categoryId: i.categoryId,
        projectId: i.projectId,
        description: i.description,
        estimatedAmount: i.estimatedAmount,
        actualAmount: i.actualAmount,
        status: i.status,
        notes: i.notes,
        unit: i.unit,
        quantity: i.quantity,
        unitRate: i.unitRate,
        vendor: i.vendor,
        accountCode: i.accountCode,
        phase: i.phase,
        linkedCrewMemberId: i.linkedCrewMemberId,
        linkedEquipmentId: i.linkedEquipmentId,
        linkedLocationId: i.linkedLocationId,
        linkedCastMemberId: i.linkedCastMemberId,
      })),
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'budget_versions'), versionData);
    return docRef.id;
  }, [projectId, firebaseUser, user]);

  // Delete a version
  const deleteVersion = useCallback(async (versionId: string) => {
    await deleteDoc(doc(db, 'budget_versions', versionId));
  }, []);

  // Compare two versions
  const compareVersions = useCallback((v1: BudgetVersion, v2: BudgetVersion) => {
    const estimatedDiff = v2.totalEstimated - v1.totalEstimated;
    const actualDiff = v2.totalActual - v1.totalActual;
    const categoryDiff = v2.categoryCount - v1.categoryCount;
    const itemDiff = v2.itemCount - v1.itemCount;

    // Find added/removed/changed items
    const v1ItemIds = new Set(v1.itemsSnapshot.map(i => i.id));
    const v2ItemIds = new Set(v2.itemsSnapshot.map(i => i.id));
    
    const addedItems = v2.itemsSnapshot.filter(i => !v1ItemIds.has(i.id));
    const removedItems = v1.itemsSnapshot.filter(i => !v2ItemIds.has(i.id));
    
    const changedItems: Array<{
      id: string;
      description: string;
      estimatedBefore: number;
      estimatedAfter: number;
      actualBefore: number;
      actualAfter: number;
    }> = [];
    
    v2.itemsSnapshot.forEach(v2Item => {
      const v1Item = v1.itemsSnapshot.find(i => i.id === v2Item.id);
      if (v1Item && (
        v1Item.estimatedAmount !== v2Item.estimatedAmount ||
        v1Item.actualAmount !== v2Item.actualAmount
      )) {
        changedItems.push({
          id: v2Item.id,
          description: v2Item.description,
          estimatedBefore: v1Item.estimatedAmount || 0,
          estimatedAfter: v2Item.estimatedAmount || 0,
          actualBefore: v1Item.actualAmount || 0,
          actualAfter: v2Item.actualAmount || 0,
        });
      }
    });

    return {
      estimatedDiff,
      actualDiff,
      categoryDiff,
      itemDiff,
      addedItems,
      removedItems,
      changedItems,
      percentChange: v1.totalEstimated > 0 
        ? ((v2.totalEstimated - v1.totalEstimated) / v1.totalEstimated) * 100 
        : 0,
    };
  }, []);

  return {
    versions,
    isLoading,
    error,
    saveVersion: { mutate: saveVersion, mutateAsync: saveVersion },
    deleteVersion: { mutate: deleteVersion, mutateAsync: deleteVersion },
    compareVersions,
  };
}
