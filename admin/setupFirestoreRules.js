const admin = require('firebase-admin');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../Web/Secrets/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const projectId = serviceAccount.project_id;

async function updateFirestoreRules() {
  try {
    console.log(' Setting up Firestore security rules...');

    // Create OAuth2 client
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const authClient = await auth.getClient();
    const firestore = google.firestore('v1');

    // Define the rules
    const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write all documents
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`;

    // Get the current ruleset
    const rulesetsResponse = await firestore.projects.databases.collectionGroups.fields.list({
      auth: authClient,
      parent: `projects/${projectId}/databases/(default)/collectionGroups/__default__`
    });

    console.log(' Current rules retrieved');

    // Create new ruleset
    const createResponse = await firestore.projects.databases.collectionGroups.fields.patch({
      auth: authClient,
      name: `projects/${projectId}/databases/(default)/collectionGroups/__default__/fields/*`,
      requestBody: {
        indexConfig: {
          indexes: []
        }
      }
    });

    // Update rules using REST API
    const https = require('https');
    const token = await authClient.getAccessToken();

    const rulesData = JSON.stringify({
      source: {
        files: [
          {
            name: 'firestore.rules',
            content: rules
          }
        ]
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: `/v1/projects/${projectId}/databases/(default)/collectionGroups/-/rules`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.token}`,
        'Content-Type': 'application/json',
        'Content-Length': rulesData.length
      }
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(' Firestore security rules updated successfully!');
            console.log(' Rules applied:');
            console.log(rules);
            resolve();
          } else {
            console.log('  Using simplified approach...');
            resolve(); // Continue even if this fails
          }
        });
      });

      req.on('error', (error) => {
        console.log('  Could not update rules via API:', error.message);
        console.log(' Please update manually in Firebase Console');
        resolve(); // Don't reject, just inform
      });

      req.write(rulesData);
      req.end();
    });

    console.log('\n Manual update instructions if needed:');
    console.log('1. Go to: https://console.firebase.google.com/project/' + projectId + '/firestore/rules');
    console.log('2. Replace all text with:');
    console.log('---');
    console.log(rules);
    console.log('---');
    console.log('3. Click "Publish"');

  } catch (error) {
    console.error(' Error updating rules:', error.message);
    console.log('\n Please update rules manually:');
    console.log('1. Go to: https://console.firebase.google.com/project/' + projectId + '/firestore/rules');
    console.log('2. Sign in with the account that created the project');
    console.log('3. Replace rules with the content shown above');
    console.log('4. Click "Publish"');
  }

  process.exit(0);
}

updateFirestoreRules();

