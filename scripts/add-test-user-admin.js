#!/usr/bin/env node

/**
 * Add the test user as an admin on the demo Nike project
 * This allows them to test all edit features
 */

const admin = require('firebase-admin');
const serviceAccount = require('../doublecheck-9f8c1-firebase-adminsdk-fbsvc-5fc5f5b49d.json');

// Initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'doublecheck-9f8c1'
  });
}

const db = admin.firestore();
const DEMO_PROJECT_ID = 'demo-nike-project';

async function addTestUserAsAdmin() {
  console.log('Adding test user as admin on demo project...');
  
  // First, find the test user by email
  const usersSnapshot = await db.collection('users')
    .where('email', '==', 'test@example.com')
    .get();
  
  let testUserId;
  
  if (usersSnapshot.empty) {
    console.log('Test user not found in users collection, will use email lookup in project_members');
    testUserId = 'test-user-id'; // Fallback
  } else {
    testUserId = usersSnapshot.docs[0].id;
    console.log(`Found test user with ID: ${testUserId}`);
  }
  
  // Check if test user already has a role in the project
  const existingMemberSnapshot = await db.collection('project_members')
    .where('projectId', '==', DEMO_PROJECT_ID)
    .where('email', '==', 'test@example.com')
    .get();
  
  if (!existingMemberSnapshot.empty) {
    // Update existing record
    const docId = existingMemberSnapshot.docs[0].id;
    await db.collection('project_members').doc(docId).update({
      role: 'admin',
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Updated existing membership to admin role (doc: ${docId})`);
  } else {
    // Create new membership
    const memberData = {
      projectId: DEMO_PROJECT_ID,
      userId: testUserId,
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'admin',
      status: 'active',
      invitedBy: 'system',
      invitedAt: admin.firestore.FieldValue.serverTimestamp(),
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await db.collection('project_members').add(memberData);
    console.log(`Created new admin membership (doc: ${docRef.id})`);
  }
  
  // Also check by userId
  const existingByUserIdSnapshot = await db.collection('project_members')
    .where('projectId', '==', DEMO_PROJECT_ID)
    .where('userId', '==', testUserId)
    .get();
    
  if (!existingByUserIdSnapshot.empty && testUserId !== 'test-user-id') {
    const docId = existingByUserIdSnapshot.docs[0].id;
    await db.collection('project_members').doc(docId).update({
      role: 'admin',
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Also updated user ID membership to admin (doc: ${docId})`);
  }
  
  console.log('\n✅ Test user now has admin access to the demo project!');
  console.log('Refresh the page to see all edit buttons.');
}

addTestUserAsAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
