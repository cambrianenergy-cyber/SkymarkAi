const serviceAccount = require('../Web/Secrets/serviceAccountKey.json');

const projectId = serviceAccount.project_id;

const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write all documents
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

console.log('');
console.log('');
console.log('       FIRESTORE SECURITY RULES SETUP');
console.log('');
console.log('');
console.log('Project ID:', projectId);
console.log('');
console.log(' STEP 1: Open Firebase Console');
console.log('   Direct Link: https://console.firebase.google.com/project/' + projectId + '/firestore/rules');
console.log('');
console.log(' STEP 2: Sign in with one of these accounts:');
console.log('    cambrianenergy@gmail.com');
console.log('    financialgrowthdfw@gmail.com');
console.log('');
console.log(' STEP 3: Copy the rules below:');
console.log('');
console.log('');
console.log(rules);
console.log('');
console.log('');
console.log(' STEP 4: In Firebase Console:');
console.log('   1. Click on "Rules" tab');
console.log('   2. DELETE all existing text');
console.log('   3. PASTE the rules from above');
console.log('   4. Click blue "Publish" button');
console.log('   5. Wait 10-15 seconds for rules to propagate');
console.log('');
console.log(' STEP 5: Return to your app and refresh the page');
console.log('   App URL: http://localhost:3000/app/assets');
console.log('');
console.log('');
console.log('');

// Save rules to file for easy access
const fs = require('fs');
fs.writeFileSync('firestore.rules', rules);
console.log(' Rules also saved to: firestore.rules');
console.log('');

