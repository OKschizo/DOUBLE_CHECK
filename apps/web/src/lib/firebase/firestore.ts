import { getFirestore } from 'firebase/firestore';
import { app } from './config';

// Initialize Firestore
export const db = getFirestore(app);

// Helper to convert Firestore timestamps to Date objects
export function timestampToDate(timestamp: any): Date {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
}

