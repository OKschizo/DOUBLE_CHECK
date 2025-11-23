import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin
if (getApps().length === 0) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || 'doublecheck-9f8c1';
  const databaseURL = process.env.FIREBASE_ADMIN_DATABASE_URL || 'https://doublecheck-9f8c1-default-rtdb.firebaseio.com';

  let credential;
  
  // In production (Cloud Run), use Application Default Credentials
  // In development, try to use service account file
  if (process.env.NODE_ENV === 'production' || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Using Application Default Credentials for Firebase Admin');
    credential = applicationDefault();
  } else {
    // Development: Try to find service account file
    const possiblePaths = [
      path.join(process.cwd(), 'doublecheck-9f8c1-firebase-adminsdk-fbsvc-5fc5f5b49d.json'),
      path.join(process.cwd(), '..', '..', 'doublecheck-9f8c1-firebase-adminsdk-fbsvc-5fc5f5b49d.json'),
      path.join(process.cwd(), '../../doublecheck-9f8c1-firebase-adminsdk-fbsvc-5fc5f5b49d.json'),
    ];
    
    const serviceAccountPath = possiblePaths.find(p => {
      try {
        return fs.existsSync(p);
      } catch (e) {
        return false;
      }
    });
    
    if (serviceAccountPath) {
      console.log('Using service account file for Firebase Admin:', serviceAccountPath);
      credential = cert(serviceAccountPath);
    } else {
      console.log('No service account file found, attempting to use Application Default Credentials');
      credential = applicationDefault();
    }
  }
  
  const app = initializeApp({
    credential,
    projectId,
    databaseURL,
  });
  
  console.log('Firebase Admin initialized with project:', app.options.projectId);
}

const db = getFirestore();
db.settings({
  ignoreUndefinedProperties: true,
});
console.log('Firestore initialized (default database)');

export const adminDb = db;
