/**
 * Client-side sync utilities for budget and schedule updates
 * 
 * Note: For production, these should be implemented as Firestore triggers (Cloud Functions)
 * to ensure atomic updates and prevent race conditions.
 */

import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

/**
 * Update linked budget items when crew member data changes
 */
export async function syncBudgetForCrewUpdate(
  crewMemberId: string,
  updates: {
    name?: string;
    role?: string;
    rate?: number;
  }
): Promise<void> {
  try {
    // Find budget items linked to this crew member
    const budgetQuery = query(
      collection(db, 'budgetCategories'),
      where('linkedCrewMemberId', '==', crewMemberId)
    );
    
    const snapshot = await getDocs(budgetQuery);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    
    snapshot.docs.forEach((budgetDoc) => {
      const item = budgetDoc.data();
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      // Update description if name/role changed
      if (updates.name || updates.role) {
        const newDescription = updates.name && updates.role
          ? `${updates.name} - ${updates.role}`
          : updates.name || updates.role || item.description;
        updateData.description = newDescription;
      }

      // Update unit rate if rate changed
      if (updates.rate !== undefined && item.unitRate !== undefined) {
        updateData.unitRate = updates.rate;
        if (item.quantity) {
          updateData.estimatedAmount = updates.rate * item.quantity;
        }
      }

      if (Object.keys(updateData).length > 1) {
        batch.update(doc(db, 'budgetCategories', budgetDoc.id), updateData);
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('Error syncing budget for crew update:', error);
    // Don't throw - we don't want to fail the crew update if sync fails
  }
}

/**
 * Update linked budget items when equipment data changes
 */
export async function syncBudgetForEquipmentUpdate(
  equipmentId: string,
  updates: {
    name?: string;
    dailyRate?: number;
    weeklyRate?: number;
  }
): Promise<void> {
  try {
    const budgetQuery = query(
      collection(db, 'budgetCategories'),
      where('linkedEquipmentId', '==', equipmentId)
    );
    
    const snapshot = await getDocs(budgetQuery);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    
    snapshot.docs.forEach((budgetDoc) => {
      const item = budgetDoc.data();
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      // Update description if name changed
      if (updates.name) {
        updateData.description = updates.name;
      }

      // Update rate based on unit type
      if (updates.dailyRate !== undefined && item.unit?.toLowerCase().includes('day')) {
        updateData.unitRate = updates.dailyRate;
        if (item.quantity) {
          updateData.estimatedAmount = updates.dailyRate * item.quantity;
        }
      }

      if (updates.weeklyRate !== undefined && item.unit?.toLowerCase().includes('week')) {
        updateData.unitRate = updates.weeklyRate;
        if (item.quantity) {
          updateData.estimatedAmount = updates.weeklyRate * item.quantity;
        }
      }

      if (Object.keys(updateData).length > 1) {
        batch.update(doc(db, 'budgetCategories', budgetDoc.id), updateData);
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('Error syncing budget for equipment update:', error);
  }
}

/**
 * Update linked budget items when cast member data changes
 */
export async function syncBudgetForCastUpdate(
  castMemberId: string,
  updates: {
    actorName?: string;
    characterName?: string;
    rate?: number;
  }
): Promise<void> {
  try {
    const budgetQuery = query(
      collection(db, 'budgetCategories'),
      where('linkedCastMemberId', '==', castMemberId)
    );
    
    const snapshot = await getDocs(budgetQuery);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    
    snapshot.docs.forEach((budgetDoc) => {
      const item = budgetDoc.data();
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      // Update description
      if (updates.actorName || updates.characterName) {
        const newDescription = updates.characterName
          ? `${updates.actorName || item.description} as ${updates.characterName}`
          : updates.actorName || item.description;
        updateData.description = newDescription;
      }

      // Update rate
      if (updates.rate !== undefined && item.unitRate !== undefined) {
        updateData.unitRate = updates.rate;
        if (item.quantity) {
          updateData.estimatedAmount = updates.rate * item.quantity;
        }
      }

      if (Object.keys(updateData).length > 1) {
        batch.update(doc(db, 'budgetCategories', budgetDoc.id), updateData);
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('Error syncing budget for cast update:', error);
  }
}

/**
 * Sync scene to schedule - create schedule events for shooting days
 */
export async function syncSceneToSchedule(
  sceneId: string,
  shootingDayIds: string[]
): Promise<void> {
  try {
    // Get scene data
    const sceneDoc = await getDocs(query(collection(db, 'scenes'), where('__name__', '==', sceneId)));
    if (sceneDoc.empty) throw new Error('Scene not found');
    
    const sceneData = sceneDoc.docs[0].data();
    const projectId = sceneData.projectId;

    // Get existing schedule events for this scene
    const existingEventsQuery = query(
      collection(db, 'scheduleEvents'),
      where('projectId', '==', projectId),
      where('sceneId', '==', sceneId)
    );
    const existingSnapshot = await getDocs(existingEventsQuery);
    const existingDayIds = new Set(
      existingSnapshot.docs.map(doc => doc.data().shootingDayId)
    );

    const batch = writeBatch(db);
    
    // Create events for new shooting days
    for (const dayId of shootingDayIds) {
      if (existingDayIds.has(dayId)) continue;

      // Get max order for this day
      const dayEventsQuery = query(
        collection(db, 'scheduleEvents'),
        where('shootingDayId', '==', dayId)
      );
      const dayEventsSnapshot = await getDocs(dayEventsQuery);
      const maxOrder = dayEventsSnapshot.docs.reduce((max, doc) => 
        Math.max(max, doc.data().order || 0), 0
      );

      // Create new schedule event
      const eventRef = doc(collection(db, 'scheduleEvents'));
      batch.set(eventRef, {
        shootingDayId: dayId,
        projectId,
        type: 'scene',
        description: sceneData.description || `Scene ${sceneData.sceneNumber}`,
        sceneId,
        sceneNumber: sceneData.sceneNumber,
        locationId: sceneData.locationId,
        location: sceneData.locationName || '',
        castIds: sceneData.castIds || [],
        crewIds: sceneData.crewIds || [],
        equipmentIds: sceneData.equipmentIds || [],
        duration: sceneData.duration,
        notes: sceneData.specialRequirements || '',
        order: maxOrder + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    console.error('Error syncing scene to schedule:', error);
    throw error;
  }
}

/**
 * Check for scheduling conflicts
 * Returns IDs of crew/cast/equipment that are double-booked
 */
export async function checkSchedulingConflicts(
  projectId: string,
  sceneId: string,
  shootingDayId: string,
  castIds: string[],
  crewIds: string[],
  equipmentIds: string[]
): Promise<{
  crew: string[];
  cast: string[];
  equipment: string[];
}> {
  const conflicts = {
    crew: [] as string[],
    cast: [] as string[],
    equipment: [] as string[],
  };

  try {
    // Get all schedule events for this day (excluding current scene)
    const eventsQuery = query(
      collection(db, 'scheduleEvents'),
      where('projectId', '==', projectId),
      where('shootingDayId', '==', shootingDayId)
    );
    
    const snapshot = await getDocs(eventsQuery);
    
    snapshot.docs.forEach((eventDoc) => {
      const eventData = eventDoc.data();
      if (eventData.sceneId === sceneId) return; // Skip own scene

      // Check crew conflicts
      const eventCrewIds = eventData.crewIds || [];
      crewIds.forEach((id) => {
        if (eventCrewIds.includes(id) && !conflicts.crew.includes(id)) {
          conflicts.crew.push(id);
        }
      });

      // Check cast conflicts
      const eventCastIds = eventData.castIds || [];
      castIds.forEach((id) => {
        if (eventCastIds.includes(id) && !conflicts.cast.includes(id)) {
          conflicts.cast.push(id);
        }
      });

      // Check equipment conflicts
      const eventEquipmentIds = eventData.equipmentIds || [];
      equipmentIds.forEach((id) => {
        if (eventEquipmentIds.includes(id) && !conflicts.equipment.includes(id)) {
          conflicts.equipment.push(id);
        }
      });
    });

    return conflicts;
  } catch (error) {
    console.error('Error checking scheduling conflicts:', error);
    return conflicts;
  }
}

