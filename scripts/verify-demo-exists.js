#!/usr/bin/env node

/**
 * Verify the Nike demo project exists and has correct fields
 */

const admin = require('firebase-admin');
const serviceAccount = require('../doublecheck-9f8c1-firebase-adminsdk-fbsvc-5fc5f5b49d.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'doublecheck-9f8c1'
  });
}

const db = admin.firestore();

async function verifyDemo() {
  console.log('🔍 Checking Nike demo project...\n');

  try {
    // Check by ID
    const demoDoc = await db.collection('projects').doc('demo-nike-project').get();
    
    if (!demoDoc.exists) {
      console.log('❌ Demo project with ID "demo-nike-project" not found!');
      console.log('\n🔍 Searching for any public template projects...');
      
      const publicProjects = await db.collection('projects')
        .where('isPublic', '==', true)
        .get();
      
      console.log(`\nFound ${publicProjects.size} public projects:`);
      publicProjects.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.title} (isTemplate: ${data.isTemplate}, isPublic: ${data.isPublic})`);
      });
      
      return;
    }

    const data = demoDoc.data();
    console.log('✅ Nike demo project found!');
    console.log(`\nProject Details:`);
    console.log(`  ID: ${demoDoc.id}`);
    console.log(`  Title: ${data.title}`);
    console.log(`  Client: ${data.client}`);
    console.log(`  isPublic: ${data.isPublic}`);
    console.log(`  isTemplate: ${data.isTemplate}`);
    console.log(`  orgId: ${data.orgId}`);
    
    // Check related data
    console.log(`\n📊 Related Data:`);
    
    const crew = await db.collection('crew').where('projectId', '==', 'demo-nike-project').get();
    console.log(`  - Crew: ${crew.size} members`);
    
    const cast = await db.collection('cast').where('projectId', '==', 'demo-nike-project').get();
    console.log(`  - Cast: ${cast.size} members`);
    
    const equipment = await db.collection('equipment').where('projectId', '==', 'demo-nike-project').get();
    console.log(`  - Equipment: ${equipment.size} items`);
    
    const locations = await db.collection('locations').where('projectId', '==', 'demo-nike-project').get();
    console.log(`  - Locations: ${locations.size}`);
    
    const scenes = await db.collection('scenes').where('projectId', '==', 'demo-nike-project').get();
    console.log(`  - Scenes: ${scenes.size}`);
    
    const shots = await db.collection('shots').where('projectId', '==', 'demo-nike-project').get();
    console.log(`  - Shots: ${shots.size}`);
    
    const budget = await db.collection('budgetCategories').where('projectId', '==', 'demo-nike-project').get();
    console.log(`  - Budget Items: ${budget.size}`);
    
    const days = await db.collection('shootingDays').where('projectId', '==', 'demo-nike-project').get();
    console.log(`  - Shooting Days: ${days.size}`);
    
    console.log('\n✅ Nike demo is ready for cloning!');

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
  
  process.exit(0);
}

verifyDemo();

