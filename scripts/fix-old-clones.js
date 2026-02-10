#!/usr/bin/env node

/**
 * Fix old Nike clones that have orgId: demo-public
 * Either delete them or update their orgId
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

async function fixOldClones() {
  console.log('🔍 Finding old Nike clones with wrong orgId...\n');

  try {
    // Find all cloned demos
    const clonedProjects = await db.collection('projects')
      .where('isClonedDemo', '==', true)
      .get();

    console.log(`Found ${clonedProjects.size} cloned demo projects\n`);

    let fixed = 0;
    let alreadyGood = 0;

    for (const doc of clonedProjects.docs) {
      const data = doc.data();
      
      console.log(`Project: ${doc.id}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  Current orgId: ${data.orgId}`);
      console.log(`  isPublic: ${data.isPublic}`);
      
      // If orgId is demo-public, this is a problematic old clone
      if (data.orgId === 'demo-public') {
        console.log(`  ❌ Has demo-public orgId (old clone)`);
        console.log(`  → Deleting this old clone...`);
        
        await doc.ref.delete();
        fixed++;
        console.log(`  ✅ Deleted\n`);
      } else {
        console.log(`  ✅ Has proper user orgId\n`);
        alreadyGood++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  - Old clones deleted: ${fixed}`);
    console.log(`  - Good clones kept: ${alreadyGood}`);
    console.log('\n✅ Cleanup complete!');
    console.log('Now clone fresh Nike demos - they will be deletable!');

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
  
  process.exit(0);
}

fixOldClones();

