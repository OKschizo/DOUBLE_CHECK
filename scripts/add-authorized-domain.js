/**
 * Script to add authorized domain to Firebase using Management API
 * This requires Firebase Admin SDK and proper authentication
 */

const { initializeApp, cert } = require('firebase-admin/app');
const admin = require('firebase-admin');
const https = require('https');

// Note: This approach requires using the Firebase Management REST API
// which is more complex. The easiest way is through the console.

console.log('Firebase CLI does not support adding authorized domains directly.');
console.log('Please use the Firebase Console:');
console.log('https://console.firebase.google.com/project/doublecheck-9f8c1/authentication/settings');
console.log('\nAdd this domain: unridered-jeneva-gratifiedly.ngrok-free.dev');

