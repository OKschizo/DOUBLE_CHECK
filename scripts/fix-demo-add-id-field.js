#!/usr/bin/env node

const admin = require('firebase-admin');
const serviceAccount = require('../doublecheck-9f8c1-firebase-adminsdk-fbsvc-5fc5f5b49d.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'doublecheck-9f8c1'
  });
}

const db = admin.firestore();

async function addIdField() {
  console.log('Adding id field to demo project...');
  
  await db.collection('projects').doc('demo-nike-project').update({
    id: 'demo-nike-project'
  });
  
  console.log('✅ Added id field to demo project');
  process.exit(0);
}

addIdField();


