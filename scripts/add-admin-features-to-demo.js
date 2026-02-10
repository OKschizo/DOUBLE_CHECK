#!/usr/bin/env node

/**
 * Add team members, department heads, and role requests to Nike demo project
 * This showcases the admin panel features
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

// Sample project members (team members with accounts)
const projectMembers = [
  {
    projectId: DEMO_PROJECT_ID,
    userId: 'demo-user-1',
    email: 'sarah.johnson@example.com',
    displayName: 'Sarah Johnson',
    role: 'admin',
    status: 'active',
    invitedBy: 'system',
    invitedAt: admin.firestore.FieldValue.serverTimestamp(),
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    projectId: DEMO_PROJECT_ID,
    userId: 'demo-user-2',
    email: 'alex.rivera@example.com',
    displayName: 'Alex Rivera',
    role: 'dept_head',
    status: 'active',
    invitedBy: 'system',
    invitedAt: admin.firestore.FieldValue.serverTimestamp(),
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    projectId: DEMO_PROJECT_ID,
    userId: 'demo-user-3',
    email: 'morgan.davis@example.com',
    displayName: 'Morgan Davis',
    role: 'crew',
    status: 'active',
    invitedBy: 'system',
    invitedAt: admin.firestore.FieldValue.serverTimestamp(),
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    projectId: DEMO_PROJECT_ID,
    userId: null,
    email: 'pending.member@example.com',
    displayName: 'Pending Member',
    role: 'crew',
    status: 'pending',
    invitedBy: 'system',
    invitedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

// Department heads assignments
const departmentHeads = [
  {
    projectId: DEMO_PROJECT_ID,
    userId: 'demo-user-2', // Alex Rivera
    department: 'Camera',
    assignedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    projectId: DEMO_PROJECT_ID,
    userId: 'demo-user-2', // Alex Rivera
    department: 'Lighting',
    assignedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

// Role requests (for demo purposes)
const roleRequests = [
  {
    projectId: DEMO_PROJECT_ID,
    requestedByUserId: 'demo-user-4',
    requestedByEmail: 'new.member@example.com',
    requestedByName: 'New Member',
    requestedRole: 'crew',
    requestedDepartment: 'Sound',
    message: 'Hi! I\'d love to join the sound department. I have 5 years of experience as a boom operator.',
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    projectId: DEMO_PROJECT_ID,
    requestedByUserId: 'demo-user-5',
    requestedByEmail: 'approved.member@example.com',
    requestedByName: 'Approved Member',
    requestedRole: 'crew',
    requestedDepartment: 'Grip',
    message: 'Requesting to join as a grip. Available for the full shoot.',
    status: 'approved',
    reviewNote: 'Great addition to the team!',
    reviewedBy: 'system',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

async function addAdminFeatures() {
  console.log('🚀 Adding admin features to Nike demo project...\n');

  try {
    // 1. Add Project Members
    console.log('👥 Adding project members...');
    for (const member of projectMembers) {
      await db.collection('project_members').add(member);
      console.log(`   ✅ Added ${member.displayName} (${member.role}) - ${member.status}`);
    }

    // 2. Add Department Heads
    console.log('\n👤 Assigning department heads...');
    for (const head of departmentHeads) {
      await db.collection('department_heads').add(head);
      console.log(`   ✅ Assigned ${head.department} department head`);
    }

    // 3. Add Role Requests
    console.log('\n📝 Adding role requests...');
    for (const request of roleRequests) {
      await db.collection('role_requests').add(request);
      console.log(`   ✅ Added request from ${request.requestedByName} (${request.status})`);
    }

    console.log('\n✅ Admin features added successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Project Members: ${projectMembers.length}`);
    console.log(`   - Department Heads: ${departmentHeads.length}`);
    console.log(`   - Role Requests: ${roleRequests.length}`);
    
    console.log('\n🎉 Nike demo now has full admin panel functionality!');
    console.log('\nUsers can now test:');
    console.log('   - Team member management (invite, remove, change roles)');
    console.log('   - Department head assignments');
    console.log('   - Role request reviews (approve/deny)');
    console.log('   - Project settings');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run
addAdminFeatures();

