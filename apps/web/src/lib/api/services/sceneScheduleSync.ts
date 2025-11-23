import { adminDb } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Sync a shot to schedule - create or update schedule events for multiple shooting days
 */
export async function syncShotToSchedule(
  shotId: string,
  shootingDayIds: string[]
): Promise<void> {
  const shotDoc = await adminDb.collection('shots').doc(shotId).get();

  if (!shotDoc.exists) {
    throw new Error('Shot not found');
  }

  const shotData = shotDoc.data()!;
  const projectId = shotData.projectId;
  const sceneId = shotData.sceneId;

  // Get scene data for fallback values
  const sceneDoc = await adminDb.collection('scenes').doc(sceneId).get();
  const sceneData = sceneDoc.exists ? sceneDoc.data()! : null;

  // Get existing schedule events for this shot
  const existingEventsSnapshot = await adminDb
    .collection('scheduleEvents')
    .where('projectId', '==', projectId)
    .where('shotId', '==', shotId)
    .get();

  const existingEventDayIds = new Set(
    existingEventsSnapshot.docs.map(doc => doc.data().shootingDayId).filter(Boolean)
  );

  // Find days that need new events (only add if event doesn't already exist)
  const daysToAdd = shootingDayIds.filter(dayId => !existingEventDayIds.has(dayId));

  // Update existing events with latest shot data (only for shooting days in the current list)
  // This ensures data is up-to-date but doesn't remove events for other days
  for (const eventDoc of existingEventsSnapshot.docs) {
    const eventData = eventDoc.data();
    // Only update events for shooting days that are in the current list
    // Don't touch events for days not in the list (they might be from other scenes/shots)
    if (shootingDayIds.includes(eventData.shootingDayId)) {
      const locationIds = shotData.locationIds && shotData.locationIds.length > 0 
        ? shotData.locationIds 
        : (sceneData?.locationIds || (sceneData?.locationId ? [sceneData.locationId] : []));
      const locationNames = shotData.locationNames && shotData.locationNames.length > 0
        ? shotData.locationNames
        : (sceneData?.locationNames || (sceneData?.locationName ? [sceneData.locationName] : []));
      
      await eventDoc.ref.update({
        description: shotData.title || `Shot ${shotData.shotNumber}`,
        sceneNumber: sceneData?.sceneNumber || '',
        shotId,
        sceneId,
        locationId: locationIds[0],
        location: locationNames[0] || '',
        castIds: shotData.castIds && shotData.castIds.length > 0 ? shotData.castIds : (sceneData?.castIds || []),
        crewIds: shotData.crewIds && shotData.crewIds.length > 0 ? shotData.crewIds : (sceneData?.crewIds || []),
        equipmentIds: shotData.equipmentIds || [],
        duration: shotData.duration,
        notes: shotData.actionDescription || shotData.composition || sceneData?.continuityNotes || sceneData?.specialRequirements || '',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  // Create new events for newly assigned days
  for (const shootingDayId of daysToAdd) {
    const shootingDayDoc = await adminDb.collection('shootingDays').doc(shootingDayId).get();
    
    if (!shootingDayDoc.exists) {
      console.warn(`Shooting day ${shootingDayId} not found, skipping`);
      continue;
    }

    // Get the max order for this shooting day
    let maxOrder = 0;
    try {
      const eventsSnapshot = await adminDb
        .collection('scheduleEvents')
        .where('shootingDayId', '==', shootingDayId)
        .orderBy('order', 'desc')
        .limit(1)
        .get();

      if (!eventsSnapshot.empty) {
        maxOrder = eventsSnapshot.docs[0].data().order || 0;
      }
    } catch (error: any) {
      // If index doesn't exist, fetch all and sort in memory
      if (error.code === 'FAILED_PRECONDITION' || error.message?.includes('index')) {
        const eventsSnapshot = await adminDb
          .collection('scheduleEvents')
          .where('shootingDayId', '==', shootingDayId)
          .get();
        
        if (!eventsSnapshot.empty) {
          const orders = eventsSnapshot.docs.map(doc => doc.data().order || 0);
          maxOrder = Math.max(...orders, 0);
        }
      } else {
        throw error;
      }
    }

    // Check if event already exists for this shot and shooting day (avoid duplicates)
    const existingEventSnapshot = await adminDb
      .collection('scheduleEvents')
      .where('projectId', '==', projectId)
      .where('shotId', '==', shotId)
      .where('shootingDayId', '==', shootingDayId)
      .limit(1)
      .get();

    // Only create if event doesn't already exist
    if (existingEventSnapshot.empty) {
      const locationIds = shotData.locationIds && shotData.locationIds.length > 0 
        ? shotData.locationIds 
        : (sceneData?.locationIds || (sceneData?.locationId ? [sceneData.locationId] : []));
      const locationNames = shotData.locationNames && shotData.locationNames.length > 0
        ? shotData.locationNames
        : (sceneData?.locationNames || (sceneData?.locationName ? [sceneData.locationName] : []));

      await adminDb.collection('scheduleEvents').add({
        shootingDayId,
        projectId,
        type: 'scene',
        description: shotData.title || `Shot ${shotData.shotNumber}`,
        sceneId,
        shotId,
        sceneNumber: sceneData?.sceneNumber || '',
        locationId: locationIds[0],
        location: locationNames[0] || '',
        castIds: shotData.castIds && shotData.castIds.length > 0 ? shotData.castIds : (sceneData?.castIds || []),
        crewIds: shotData.crewIds && shotData.crewIds.length > 0 ? shotData.crewIds : (sceneData?.crewIds || []),
        equipmentIds: shotData.equipmentIds || [],
        duration: shotData.duration,
        notes: shotData.actionDescription || shotData.composition || sceneData?.continuityNotes || sceneData?.specialRequirements || '',
        order: maxOrder + 1,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
}

/**
 * Sync a scene to schedule - syncs all shots in the scene instead of the scene itself
 */
export async function syncSceneToSchedule(
  sceneId: string,
  shootingDayIds: string[]
): Promise<void> {
  const sceneDoc = await adminDb.collection('scenes').doc(sceneId).get();

  if (!sceneDoc.exists) {
    throw new Error('Scene not found');
  }

  const sceneData = sceneDoc.data()!;
  const projectId = sceneData.projectId;

  // Get all shots for this scene
  const shotsSnapshot = await adminDb
    .collection('shots')
    .where('sceneId', '==', sceneId)
    .get();

  // Sync each shot to schedule
  // If shot has its own shootingDayIds, use those; otherwise use scene's shootingDayIds
  for (const shotDoc of shotsSnapshot.docs) {
    const shotData = shotDoc.data();
    const shotShootingDayIds = shotData.shootingDayIds && shotData.shootingDayIds.length > 0
      ? shotData.shootingDayIds
      : shootingDayIds; // Use scene's days if shot doesn't have its own
    
    if (shotShootingDayIds.length > 0) {
      try {
        await syncShotToSchedule(shotDoc.id, shotShootingDayIds);
      } catch (error) {
        console.error(`Error syncing shot ${shotDoc.id} to schedule:`, error);
        // Continue with other shots even if one fails
      }
    }
  }

  // Don't remove old scene-level events - they might be from manual creation
  // Only remove them if explicitly requested (which happens in update mutations)
}

/**
 * Check for scheduling conflicts (crew/cast/equipment double-booking)
 */
export async function checkSchedulingConflicts(
  projectId: string,
  sceneId: string,
  shootingDayId: string,
  castIds: string[],
  crewIds: string[],
  equipmentIds: string[],
  locationId?: string
): Promise<{
  crew: string[];
  cast: string[];
  equipment: string[];
  location: boolean;
}> {
  const conflicts = {
    crew: [] as string[],
    cast: [] as string[],
    equipment: [] as string[],
    location: false,
  };

  // Get all schedule events for this shooting day
  const eventsSnapshot = await adminDb
    .collection('scheduleEvents')
    .where('projectId', '==', projectId)
    .where('shootingDayId', '==', shootingDayId)
    .get();

  // Get all scenes scheduled for this day (excluding current scene)
  const scenesSnapshot = await adminDb
    .collection('scenes')
    .where('projectId', '==', projectId)
    .where('shootingDayId', '==', shootingDayId)
    .get();
  
  // Filter out the current scene (Firestore doesn't support != operator)
  const otherScenes = scenesSnapshot.docs.filter((doc) => doc.id !== sceneId);

  // Check conflicts in schedule events
  eventsSnapshot.docs.forEach((eventDoc) => {
    const eventData = eventDoc.data();
    if (eventData.sceneId === sceneId) return; // Skip the scene's own event

    // Check crew conflicts
    const eventCrewIds = eventData.crewIds || [];
    crewIds.forEach((crewId) => {
      if (eventCrewIds.includes(crewId) && !conflicts.crew.includes(crewId)) {
        conflicts.crew.push(crewId);
      }
    });

    // Check cast conflicts
    const eventCastIds = eventData.castIds || [];
    castIds.forEach((castId) => {
      if (eventCastIds.includes(castId) && !conflicts.cast.includes(castId)) {
        conflicts.cast.push(castId);
      }
    });

    // Check equipment conflicts
    const eventEquipmentIds = eventData.equipmentIds || [];
    equipmentIds.forEach((equipmentId) => {
      if (eventEquipmentIds.includes(equipmentId) && !conflicts.equipment.includes(equipmentId)) {
        conflicts.equipment.push(equipmentId);
      }
    });

    // Check location conflict
    if (locationId && eventData.locationId === locationId) {
      conflicts.location = true;
    }
  });

  // Check conflicts in other scenes
  otherScenes.forEach((sceneDoc) => {
    const otherSceneData = sceneDoc.data();

    // Check crew conflicts
    const otherCrewIds = otherSceneData.crewIds || [];
    crewIds.forEach((crewId) => {
      if (otherCrewIds.includes(crewId) && !conflicts.crew.includes(crewId)) {
        conflicts.crew.push(crewId);
      }
    });

    // Check cast conflicts
    const otherCastIds = otherSceneData.castIds || [];
    castIds.forEach((castId) => {
      if (otherCastIds.includes(castId) && !conflicts.cast.includes(castId)) {
        conflicts.cast.push(castId);
      }
    });

    // Check equipment conflicts
    const otherEquipmentIds = otherSceneData.equipmentIds || [];
    equipmentIds.forEach((equipmentId) => {
      if (otherEquipmentIds.includes(equipmentId) && !conflicts.equipment.includes(equipmentId)) {
        conflicts.equipment.push(equipmentId);
      }
    });

    // Check location conflict
    if (locationId && otherSceneData.locationId === locationId) {
      conflicts.location = true;
    }
  });

  return conflicts;
}

/**
 * Update scene status based on schedule completion
 */
export async function updateSceneStatus(sceneId: string): Promise<void> {
  const sceneDoc = await adminDb.collection('scenes').doc(sceneId).get();

  if (!sceneDoc.exists) {
    throw new Error('Scene not found');
  }

  // Get all shots for this scene
  const shotsSnapshot = await adminDb
    .collection('shots')
    .where('sceneId', '==', sceneId)
    .get();

  if (shotsSnapshot.empty) {
    // No shots, keep current status
    return;
  }

  const shots = shotsSnapshot.docs.map((doc) => doc.data());
  const completedShots = shots.filter((shot) => shot.status === 'completed');
  const inProgressShots = shots.filter((shot) => shot.status === 'in-progress');

  let newStatus: string;
  if (completedShots.length === shots.length) {
    newStatus = 'completed';
  } else if (inProgressShots.length > 0 || completedShots.length > 0) {
    newStatus = 'in-progress';
  } else {
    newStatus = 'not-shot';
  }

  await adminDb.collection('scenes').doc(sceneId).update({
    status: newStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Generate call sheet data from scheduled scenes
 */
export async function generateCallSheet(
  projectId: string,
  shootingDayId: string
): Promise<{
  date: Date;
  callTime: string;
  location: string;
  scenes: any[];
  cast: any[];
  crew: any[];
  equipment: any[];
}> {
  const shootingDayDoc = await adminDb.collection('shootingDays').doc(shootingDayId).get();

  if (!shootingDayDoc.exists) {
    throw new Error('Shooting day not found');
  }

  const shootingDayData = shootingDayDoc.data()!;

  // Get all scenes for this shooting day
  const scenesSnapshot = await adminDb
    .collection('scenes')
    .where('projectId', '==', projectId)
    .where('shootingDayId', '==', shootingDayId)
    .orderBy('sceneNumber', 'asc')
    .get();

  const scenes = scenesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Collect unique cast, crew, and equipment
  const castIds = new Set<string>();
  const crewIds = new Set<string>();
  const equipmentIds = new Set<string>();

  scenes.forEach((scene: any) => {
    (scene.castIds || []).forEach((id: string) => castIds.add(id));
    (scene.crewIds || []).forEach((id: string) => crewIds.add(id));
    (scene.equipmentIds || []).forEach((id: string) => equipmentIds.add(id));
  });

  // Fetch cast members
  const castDocs = await Promise.all(
    Array.from(castIds).map((id) => adminDb.collection('cast').doc(id).get())
  );
  const cast = castDocs
    .filter((doc) => doc.exists)
    .map((doc) => ({ id: doc.id, ...doc.data() }));

  // Fetch crew members
  const crewDocs = await Promise.all(
    Array.from(crewIds).map((id) => adminDb.collection('crew').doc(id).get())
  );
  const crew = crewDocs
    .filter((doc) => doc.exists)
    .map((doc) => ({ id: doc.id, ...doc.data() }));

  // Fetch equipment
  const equipmentDocs = await Promise.all(
    Array.from(equipmentIds).map((id) => adminDb.collection('equipment').doc(id).get())
  );
  const equipment = equipmentDocs
    .filter((doc) => doc.exists)
    .map((doc) => ({ id: doc.id, ...doc.data() }));

  return {
    date: shootingDayData.date?.toDate() || new Date(),
    callTime: shootingDayData.callTime || '',
    location: shootingDayData.location || '',
    scenes,
    cast,
    crew,
    equipment,
  };
}

