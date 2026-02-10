/**
 * Clone the Nike demo project for new users
 * This gives each user their own editable copy to explore all features
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

// The master demo project ID
const DEMO_PROJECT_ID = 'SomJJD3bEqn2yHhXW79e';

/**
 * Check if user already has the Nike demo project cloned
 */
export async function hasNikeDemoProject(orgId: string): Promise<boolean> {
  const q = query(
    collection(db, 'projects'),
    where('orgId', '==', orgId),
    where('isClonedDemo', '==', true)
  );
  
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Clone the Nike demo project for a user
 * Returns the new project ID
 */
export async function cloneNikeDemoForUser(
  userId: string,
  orgId: string
): Promise<string> {
  try {
    console.log('🎬 Cloning Nike demo project for user...');

    // 1. Get the demo project
    let demoProjectDoc = await getDoc(doc(db, 'projects', DEMO_PROJECT_ID));
    let demoProject;
    let actualDemoId = DEMO_PROJECT_ID;
    
    if (!demoProjectDoc.exists()) {
      console.log('Demo project not found by ID, trying query...');
      // Fallback: Query for any public template project
      const demoQuery = query(
        collection(db, 'projects'),
        where('isTemplate', '==', true)
      );
      const demoSnapshot = await getDocs(demoQuery);
      
      if (demoSnapshot.empty) {
        throw new Error('Demo project not found. Please contact support.');
      }
      
      demoProjectDoc = demoSnapshot.docs[0];
      actualDemoId = demoProjectDoc.id;
      demoProject = demoProjectDoc.data();
      console.log(`Found demo project: ${actualDemoId}`);
    } else {
      demoProject = demoProjectDoc.data();
      console.log(`Found demo project: ${actualDemoId}`);
    }

    // 2. Create new project for user
    const { 
      id: _removedId, 
      isPublic: _removedIsPublic, 
      isTemplate: _removedIsTemplate, 
      orgId: _removedOrgId, 
      createdBy: _removedCreatedBy, 
      createdAt: _removedCreatedAt, 
      updatedAt: _removedUpdatedAt,
      ...cleanDemoData 
    } = demoProject;
    
    const newProjectRef = await addDoc(collection(db, 'projects'), {
      ...cleanDemoData,
      orgId,
      createdBy: userId,
      name: 'Nike "Breaking Limits" - Your Copy',
      description: 'Your editable copy of the Nike demo project. Explore all features - crew, cast, equipment, scenes, shots, budget, call sheets, and more!',
      isPublic: false,
      isTemplate: false,
      isClonedDemo: true,
      originalDemoId: actualDemoId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    const newProjectId = newProjectRef.id;
    console.log('Created new project:', newProjectId);

    // Helper function to clone a collection
    const cloneCollection = async (
      collectionName: string, 
      idMaps: Record<string, Record<string, string>> = {}
    ): Promise<Record<string, string>> => {
      const snapshot = await getDocs(
        query(collection(db, collectionName), where('projectId', '==', actualDemoId))
      );
      
      const newIdMap: Record<string, string> = {};
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Remove system fields
        const { id: _id, createdAt: _ca, updatedAt: _ua, createdBy: _cb, ...cleanData } = data;
        
        // Remap IDs if provided
        let mappedData = { ...cleanData };
        
        if (idMaps.locations && data.locationId) {
          mappedData.locationId = idMaps.locations[data.locationId] || data.locationId;
        }
        if (idMaps.scenes && data.sceneId) {
          mappedData.sceneId = idMaps.scenes[data.sceneId] || data.sceneId;
        }
        if (idMaps.days && data.shootingDayId) {
          mappedData.shootingDayId = idMaps.days[data.shootingDayId] || data.shootingDayId;
        }
        if (idMaps.categories && data.categoryId) {
          mappedData.categoryId = idMaps.categories[data.categoryId] || data.categoryId;
        }
        // Map cast member IDs array
        if (idMaps.cast && data.castMemberIds && Array.isArray(data.castMemberIds)) {
          mappedData.castMemberIds = data.castMemberIds.map((id: string) => idMaps.cast[id] || id);
        }
        
        const newDocRef = await addDoc(collection(db, collectionName), {
          ...mappedData,
          projectId: newProjectId,
          createdBy: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        newIdMap[docSnap.id] = newDocRef.id;
      }
      
      console.log(`  ✅ Cloned ${snapshot.size} ${collectionName}`);
      return newIdMap;
    };

    // 3. Clone all data with proper ID remapping
    console.log('📋 Cloning project data...');
    
    // Clone in order to maintain references
    const locationIdMap = await cloneCollection('locations');
    const castIdMap = await cloneCollection('cast');
    const crewIdMap = await cloneCollection('crew');
    const sceneIdMap = await cloneCollection('scenes', { locations: locationIdMap, cast: castIdMap });
    await cloneCollection('shots', { scenes: sceneIdMap });
    await cloneCollection('equipment');
    
    // Clone schedule
    const dayIdMap = await cloneCollection('schedule_days', { locations: locationIdMap });
    await cloneCollection('schedule_events', { 
      scenes: sceneIdMap, 
      locations: locationIdMap, 
      days: dayIdMap 
    });
    
    // Clone budget
    const categoryIdMap = await cloneCollection('budget_categories');
    await cloneCollection('budget_items', { categories: categoryIdMap });
    
    // Clone equipment packages/kits
    await cloneCollection('equipment_packages');

    // 4. Set up project team - Add current user as owner
    console.log('👥 Setting up project team...');
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.exists() ? userDoc.data() : null;
    
    await addDoc(collection(db, 'project_members'), {
      projectId: newProjectId,
      orgId,
      userId,
      email: userData?.email || '',
      displayName: userData?.displayName || 'User',
      role: 'owner',
      status: 'active',
      invitedBy: userId,
      invitedAt: serverTimestamp(),
      joinedAt: serverTimestamp(),
    });
    console.log('  ✅ Added you as project owner');

    console.log('\n🎉 Nike demo project cloned successfully!');
    console.log('📊 Your copy includes:');
    console.log('   - 5 Locations (Portland area)');
    console.log('   - 56 Crew members across all departments');
    console.log('   - 9 Cast members (lead, supporting, background)');
    console.log('   - 49 Equipment items');
    console.log('   - 10 Scenes with breakdowns');
    console.log('   - 16 Shots');
    console.log('   - 5 Shooting days with schedules');
    console.log('   - Full budget ($790K+)');
    console.log('   - Ready-to-generate call sheets!');
    
    return newProjectId;

  } catch (error) {
    console.error('Error cloning demo project:', error);
    throw error;
  }
}

/**
 * Auto-clone demo project for new users
 * Call this after user document is created
 */
export async function autoCloneDemoForNewUser(userId: string, orgId: string): Promise<void> {
  try {
    const hasDemo = await hasNikeDemoProject(orgId);
    if (hasDemo) {
      console.log('User already has Nike demo project');
      return;
    }

    await cloneNikeDemoForUser(userId, orgId);
    console.log('✅ Auto-cloned Nike demo for new user');
  } catch (error) {
    console.error('Failed to auto-clone demo:', error);
    // Don't throw - we don't want to block user signup if demo clone fails
  }
}
