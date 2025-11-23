import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Sync scene budget - create/update budget items from scene requirements
 */
export async function syncSceneBudget(
  sceneId: string,
  categoryId?: string
): Promise<string[]> {
  const sceneDoc = await adminDb.collection('scenes').doc(sceneId).get();

  if (!sceneDoc.exists) {
    throw new Error('Scene not found');
  }

  const sceneData = sceneDoc.data()!;
  const projectId = sceneData.projectId;

  // Find or create category
  let finalCategoryId = categoryId;
  if (!finalCategoryId) {
    // Try to find "Production" category
    const categoriesSnapshot = await adminDb
      .collection('budgetCategories')
      .where('projectId', '==', projectId)
      .where('name', '==', 'Production')
      .limit(1)
      .get();

    if (!categoriesSnapshot.empty) {
      finalCategoryId = categoriesSnapshot.docs[0].id;
    } else {
      // Create Production category
      const categoryRef = await adminDb.collection('budgetCategories').add({
        projectId,
        name: 'Production',
        department: 'production',
        phase: 'production',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      finalCategoryId = categoryRef.id;
    }
  }

  const createdItemIds: string[] = [];

  // Create budget items for cast
  const castIds = sceneData.castIds || [];
  for (const castId of castIds) {
    const castDoc = await adminDb.collection('cast').doc(castId).get();
    if (castDoc.exists) {
      const castData = castDoc.data()!;
      const rate = castData.rate || 0;

      // Check if budget item already exists
      const existingItemsSnapshot = await adminDb
        .collection('budgetItems')
        .where('projectId', '==', projectId)
        .where('linkedCastMemberId', '==', castId)
        .where('linkedSceneId', '==', sceneId)
        .limit(1)
        .get();

      if (existingItemsSnapshot.empty) {
        const itemRef = await adminDb.collection('budgetItems').add({
          projectId,
          categoryId: finalCategoryId,
          description: `${castData.actorName} as ${castData.characterName} - Scene ${sceneData.sceneNumber}`,
          estimatedAmount: rate,
          actualAmount: 0,
          status: 'estimated',
          linkedCastMemberId: castId,
          linkedSceneId: sceneId,
          vendor: castData.agent,
          phase: 'production',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        createdItemIds.push(itemRef.id);
      }
    }
  }

  // Create budget items for crew
  const crewIds = sceneData.crewIds || [];
  for (const crewId of crewIds) {
    const crewDoc = await adminDb.collection('crew').doc(crewId).get();
    if (crewDoc.exists) {
      const crewData = crewDoc.data()!;
      const rate = crewData.rate || 0;
      const rateType = crewData.rateType || 'daily';

      // Check if budget item already exists
      const existingItemsSnapshot = await adminDb
        .collection('budgetItems')
        .where('projectId', '==', projectId)
        .where('linkedCrewMemberId', '==', crewId)
        .where('linkedSceneId', '==', sceneId)
        .limit(1)
        .get();

      if (existingItemsSnapshot.empty) {
        const itemRef = await adminDb.collection('budgetItems').add({
          projectId,
          categoryId: finalCategoryId,
          description: `${crewData.name} - ${crewData.role} - Scene ${sceneData.sceneNumber}`,
          estimatedAmount: rate,
          actualAmount: 0,
          status: 'estimated',
          linkedCrewMemberId: crewId,
          linkedSceneId: sceneId,
          unit: rateType === 'hourly' ? 'hours' : rateType === 'weekly' ? 'weeks' : 'days',
          quantity: 1,
          unitRate: rate,
          phase: 'production',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        createdItemIds.push(itemRef.id);
      }
    }
  }

  // Create budget items for equipment
  const equipmentIds = sceneData.equipmentIds || [];
  for (const equipmentId of equipmentIds) {
    const equipmentDoc = await adminDb.collection('equipment').doc(equipmentId).get();
    if (equipmentDoc.exists) {
      const equipmentData = equipmentDoc.data()!;
      const dailyRate = equipmentData.dailyRate || 0;

      // Check if budget item already exists
      const existingItemsSnapshot = await adminDb
        .collection('budgetItems')
        .where('projectId', '==', projectId)
        .where('linkedEquipmentId', '==', equipmentId)
        .where('linkedSceneId', '==', sceneId)
        .limit(1)
        .get();

      if (existingItemsSnapshot.empty && dailyRate > 0) {
        const itemRef = await adminDb.collection('budgetItems').add({
          projectId,
          categoryId: finalCategoryId,
          description: `${equipmentData.name} - Scene ${sceneData.sceneNumber}`,
          estimatedAmount: dailyRate,
          actualAmount: 0,
          status: 'estimated',
          linkedEquipmentId: equipmentId,
          linkedSceneId: sceneId,
          unit: 'days',
          quantity: 1,
          unitRate: dailyRate,
          vendor: equipmentData.rentalVendor,
          phase: 'production',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        createdItemIds.push(itemRef.id);
      }
    }
  }

  return createdItemIds;
}

/**
 * Calculate estimated cost for a scene based on cast/crew/equipment rates
 */
export async function calculateSceneCost(sceneId: string): Promise<number> {
  const sceneDoc = await adminDb.collection('scenes').doc(sceneId).get();

  if (!sceneDoc.exists) {
    throw new Error('Scene not found');
  }

  const sceneData = sceneDoc.data()!;
  let totalCost = 0;

  // Calculate cast costs
  const castIds = sceneData.castIds || [];
  for (const castId of castIds) {
    const castDoc = await adminDb.collection('cast').doc(castId).get();
    if (castDoc.exists) {
      const castData = castDoc.data()!;
      totalCost += castData.rate || 0;
    }
  }

  // Calculate crew costs
  const crewIds = sceneData.crewIds || [];
  for (const crewId of crewIds) {
    const crewDoc = await adminDb.collection('crew').doc(crewId).get();
    if (crewDoc.exists) {
      const crewData = crewDoc.data()!;
      const rate = crewData.rate || 0;
      const rateType = crewData.rateType || 'daily';
      
      // For now, assume 1 day/unit
      if (rateType === 'hourly') {
        totalCost += rate * 8; // Assume 8 hour day
      } else {
        totalCost += rate;
      }
    }
  }

  // Calculate equipment costs
  const equipmentIds = sceneData.equipmentIds || [];
  for (const equipmentId of equipmentIds) {
    const equipmentDoc = await adminDb.collection('equipment').doc(equipmentId).get();
    if (equipmentDoc.exists) {
      const equipmentData = equipmentDoc.data()!;
      totalCost += equipmentData.dailyRate || 0;
    }
  }

  return totalCost;
}

/**
 * Update budget based on actual shot completion
 */
export async function updateBudgetFromShots(sceneId: string): Promise<void> {
  const sceneDoc = await adminDb.collection('scenes').doc(sceneId).get();

  if (!sceneDoc.exists) {
    throw new Error('Scene not found');
  }

  const sceneData = sceneDoc.data()!;

  // Get all shots for this scene
  const shotsSnapshot = await adminDb
    .collection('shots')
    .where('sceneId', '==', sceneId)
    .get();

  const completedShots = shotsSnapshot.docs.filter(
    (doc) => doc.data().status === 'completed'
  );

  // If all shots are completed, mark scene as completed
  if (completedShots.length === shotsSnapshot.docs.length && shotsSnapshot.docs.length > 0) {
    // Update budget items linked to this scene to mark as actual
    const budgetItemsSnapshot = await adminDb
      .collection('budgetItems')
      .where('projectId', '==', sceneData.projectId)
      .where('linkedSceneId', '==', sceneId)
      .get();

    const batch = adminDb.batch();
    budgetItemsSnapshot.docs.forEach((itemDoc) => {
      const itemData = itemDoc.data();
      // Update actual amount if not already set
      if (itemData.actualAmount === 0 && itemData.estimatedAmount > 0) {
        batch.update(itemDoc.ref, {
          actualAmount: itemData.estimatedAmount,
          status: 'actual',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    await batch.commit();
  }
}

