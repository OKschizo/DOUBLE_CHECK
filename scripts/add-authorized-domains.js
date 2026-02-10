const admin = require('firebase-admin');
const serviceAccount = require('../doublecheck-9f8c1-firebase-adminsdk-fbsvc-5fc5f5b49d.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'doublecheck-9f8c1'
});

const domains = [
  'doublecheck-ivory.vercel.app',
  'doublecheck-bobs-projects-a8f7fdd8.vercel.app',
  'doublecheck-anonwork33-5863-bobs-projects-a8f7fdd8.vercel.app'
];

console.log('Adding authorized domains to Firebase Authentication...');
console.log('Domains to add:', domains);

console.log('\n⚠️  NOTE: Authorized domains can only be added via Firebase Console or Firebase CLI.');
console.log('Please add these domains manually:');
console.log('\n1. Go to: https://console.firebase.google.com/project/doublecheck-9f8c1/authentication/settings');
console.log('2. Click on the "Authorized domains" tab');
console.log('3. Click "Add domain" button');
console.log('4. Add each of these domains:');
domains.forEach(domain => console.log(`   - ${domain}`));
console.log('\n5. Save the changes');
console.log('\nAlternatively, run: firebase auth:domains:add <domain>');

