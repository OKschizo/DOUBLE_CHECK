// Firestore helper types and functions for server-side use
// Note: This file will need Firebase Admin SDK in production
// For now, we'll use client SDK pattern

export interface FirestoreTimestamp {
  toDate(): Date;
}

export function timestampToDate(timestamp: any): Date {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
}

