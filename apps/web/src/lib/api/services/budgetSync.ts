import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Update linked budget items when a cast member is updated
 */
export async function syncBudgetItemsForCast(
  castMemberId: string,
  updates: {
    actorName?: string;
    characterName?: string;
    rate?: number;
  }
): Promise<void> {
  // Find all budget items linked to this cast member
  const budgetItemsSnapshot = await adminDb
    .collection('budgetItems')
    .where('linkedCastMemberId', '==', castMemberId)
    .get();

  if (budgetItemsSnapshot.empty) return;

  const batch = adminDb.batch();
  let hasUpdates = false;

  for (const doc of budgetItemsSnapshot.docs) {
    const item = doc.data();
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Update description if name changed
    if (updates.actorName || updates.characterName) {
      const newDescription = updates.characterName
        ? `${updates.actorName || item.description} as ${updates.characterName}`
        : updates.actorName || item.description;
      updateData.description = newDescription;
    }

    // Update estimated amount if rate changed and item uses unitRate
    if (updates.rate !== undefined && item.unitRate !== undefined) {
      // If the unitRate matches the old rate, update it to the new rate
      const oldRate = item.unitRate;
      if (Math.abs(oldRate - (updates.rate || 0)) < 0.01) {
        updateData.unitRate = updates.rate;
        if (item.quantity) {
          updateData.estimatedAmount = updates.rate * item.quantity;
        }
      }
    }

    if (Object.keys(updateData).length > 1) {
      // More than just updatedAt
      batch.update(doc.ref, updateData);
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    await batch.commit();
  }
}

/**
 * Update linked budget items when a crew member is updated
 */
export async function syncBudgetItemsForCrew(
  crewMemberId: string,
  updates: {
    name?: string;
    role?: string;
    rate?: number;
    rateType?: string;
  }
): Promise<void> {
  const budgetItemsSnapshot = await adminDb
    .collection('budgetItems')
    .where('linkedCrewMemberId', '==', crewMemberId)
    .get();

  if (budgetItemsSnapshot.empty) return;

  const batch = adminDb.batch();
  let hasUpdates = false;

  for (const doc of budgetItemsSnapshot.docs) {
    const item = doc.data();
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Update description if name or role changed
    if (updates.name || updates.role) {
      const newDescription = updates.name && updates.role
        ? `${updates.name} - ${updates.role}`
        : updates.name || updates.role || item.description;
      updateData.description = newDescription;
    }

    // Update estimated amount if rate changed
    if (updates.rate !== undefined && item.unitRate !== undefined) {
      const oldRate = item.unitRate;
      if (Math.abs(oldRate - (updates.rate || 0)) < 0.01) {
        updateData.unitRate = updates.rate;
        if (item.quantity) {
          updateData.estimatedAmount = updates.rate * item.quantity;
        }
      }
    }

    if (Object.keys(updateData).length > 1) {
      batch.update(doc.ref, updateData);
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    await batch.commit();
  }
}

/**
 * Update linked budget items when equipment is updated
 */
export async function syncBudgetItemsForEquipment(
  equipmentId: string,
  updates: {
    name?: string;
    dailyRate?: number;
    weeklyRate?: number;
  }
): Promise<void> {
  const budgetItemsSnapshot = await adminDb
    .collection('budgetItems')
    .where('linkedEquipmentId', '==', equipmentId)
    .get();

  if (budgetItemsSnapshot.empty) return;

  const batch = adminDb.batch();
  let hasUpdates = false;

  for (const doc of budgetItemsSnapshot.docs) {
    const item = doc.data();
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Update description if name changed
    if (updates.name) {
      updateData.description = updates.name;
    }

    // Update estimated amount if rates changed
    if (updates.dailyRate !== undefined && item.unitRate !== undefined) {
      const oldRate = item.unitRate;
      // Check if unit is 'day' or 'days' and rate matches
      if (item.unit?.toLowerCase().includes('day') && Math.abs(oldRate - updates.dailyRate) < 0.01) {
        updateData.unitRate = updates.dailyRate;
        if (item.quantity) {
          updateData.estimatedAmount = updates.dailyRate * item.quantity;
        }
      }
    }

    if (updates.weeklyRate !== undefined && item.unitRate !== undefined) {
      const oldRate = item.unitRate;
      // Check if unit is 'week' or 'weeks' and rate matches
      if (item.unit?.toLowerCase().includes('week') && Math.abs(oldRate - updates.weeklyRate) < 0.01) {
        updateData.unitRate = updates.weeklyRate;
        if (item.quantity) {
          updateData.estimatedAmount = updates.weeklyRate * item.quantity;
        }
      }
    }

    if (Object.keys(updateData).length > 1) {
      batch.update(doc.ref, updateData);
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    await batch.commit();
  }
}

/**
 * Update linked budget items when a location is updated
 */
export async function syncBudgetItemsForLocation(
  locationId: string,
  updates: {
    name?: string;
    rentalCost?: number;
  }
): Promise<void> {
  const budgetItemsSnapshot = await adminDb
    .collection('budgetItems')
    .where('linkedLocationId', '==', locationId)
    .get();

  if (budgetItemsSnapshot.empty) return;

  const batch = adminDb.batch();
  let hasUpdates = false;

  for (const doc of budgetItemsSnapshot.docs) {
    const item = doc.data();
    const updateData: any = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Update description if name changed
    if (updates.name) {
      updateData.description = updates.name;
    }

    // Update estimated amount if rental cost changed
    if (updates.rentalCost !== undefined && item.unitRate !== undefined) {
      const oldRate = item.unitRate;
      if (Math.abs(oldRate - updates.rentalCost) < 0.01) {
        updateData.unitRate = updates.rentalCost;
        if (item.quantity) {
          updateData.estimatedAmount = updates.rentalCost * item.quantity;
        }
      }
    }

    if (Object.keys(updateData).length > 1) {
      batch.update(doc.ref, updateData);
      hasUpdates = true;
    }
  }

  if (hasUpdates) {
    await batch.commit();
  }
}

/**
 * Unlink budget items when a source entity is deleted
 * (We unlink rather than delete to preserve budget history)
 */
export async function unlinkBudgetItemsForCast(castMemberId: string): Promise<void> {
  const budgetItemsSnapshot = await adminDb
    .collection('budgetItems')
    .where('linkedCastMemberId', '==', castMemberId)
    .get();

  if (budgetItemsSnapshot.empty) return;

  const batch = adminDb.batch();
  for (const doc of budgetItemsSnapshot.docs) {
    batch.update(doc.ref, {
      linkedCastMemberId: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function unlinkBudgetItemsForCrew(crewMemberId: string): Promise<void> {
  const budgetItemsSnapshot = await adminDb
    .collection('budgetItems')
    .where('linkedCrewMemberId', '==', crewMemberId)
    .get();

  if (budgetItemsSnapshot.empty) return;

  const batch = adminDb.batch();
  for (const doc of budgetItemsSnapshot.docs) {
    batch.update(doc.ref, {
      linkedCrewMemberId: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function unlinkBudgetItemsForEquipment(equipmentId: string): Promise<void> {
  const budgetItemsSnapshot = await adminDb
    .collection('budgetItems')
    .where('linkedEquipmentId', '==', equipmentId)
    .get();

  if (budgetItemsSnapshot.empty) return;

  const batch = adminDb.batch();
  for (const doc of budgetItemsSnapshot.docs) {
    batch.update(doc.ref, {
      linkedEquipmentId: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function unlinkBudgetItemsForLocation(locationId: string): Promise<void> {
  const budgetItemsSnapshot = await adminDb
    .collection('budgetItems')
    .where('linkedLocationId', '==', locationId)
    .get();

  if (budgetItemsSnapshot.empty) return;

  const batch = adminDb.batch();
  for (const doc of budgetItemsSnapshot.docs) {
    batch.update(doc.ref, {
      linkedLocationId: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}

/**
 * Reverse sync: Update source entity rates from budget item
 * This is optional and only updates rates, not names
 */
export async function syncSourceFromBudgetItem(
  budgetItem: {
    linkedCrewMemberId?: string;
    linkedCastMemberId?: string;
    linkedEquipmentId?: string;
    linkedLocationId?: string;
    unitRate?: number;
  }
): Promise<void> {
  // Only sync if unitRate is provided and there's a link
  if (!budgetItem.unitRate) return;

  if (budgetItem.linkedCrewMemberId) {
    const crewRef = adminDb.collection('crew').doc(budgetItem.linkedCrewMemberId);
    const crewDoc = await crewRef.get();
    if (crewDoc.exists) {
      const crewData = crewDoc.data()!;
      // Only update if the rate is close to the current rate (within 1%)
      if (crewData.rate && Math.abs(crewData.rate - budgetItem.unitRate) / crewData.rate < 0.01) {
        await crewRef.update({
          rate: budgetItem.unitRate,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
  }

  if (budgetItem.linkedCastMemberId) {
    const castRef = adminDb.collection('cast').doc(budgetItem.linkedCastMemberId);
    const castDoc = await castRef.get();
    if (castDoc.exists) {
      const castData = castDoc.data()!;
      if (castData.rate && Math.abs(castData.rate - budgetItem.unitRate) / castData.rate < 0.01) {
        await castRef.update({
          rate: budgetItem.unitRate,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
  }

  if (budgetItem.linkedEquipmentId) {
    const equipmentRef = adminDb.collection('equipment').doc(budgetItem.linkedEquipmentId);
    const equipmentDoc = await equipmentRef.get();
    if (equipmentDoc.exists) {
      const equipmentData = equipmentDoc.data()!;
      // Check if unit is 'day' or 'days' for dailyRate
      // This is a simple heuristic - could be improved
      if (equipmentData.dailyRate && Math.abs(equipmentData.dailyRate - budgetItem.unitRate) / equipmentData.dailyRate < 0.01) {
        await equipmentRef.update({
          dailyRate: budgetItem.unitRate,
          updatedAt: new Date(),
        });
      }
    }
  }

  if (budgetItem.linkedLocationId) {
    const locationRef = adminDb.collection('locations').doc(budgetItem.linkedLocationId);
    const locationDoc = await locationRef.get();
    if (locationDoc.exists) {
      const locationData = locationDoc.data()!;
      if (locationData.rentalCost && Math.abs(locationData.rentalCost - budgetItem.unitRate) / locationData.rentalCost < 0.01) {
        await locationRef.update({
          rentalCost: budgetItem.unitRate,
          updatedAt: new Date(),
        });
      }
    }
  }
}

