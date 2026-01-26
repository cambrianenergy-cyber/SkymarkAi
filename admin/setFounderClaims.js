const admin = require('firebase-admin');
const serviceAccount = require('../Web/Secrets/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// User IDs or emails of founders
const founders = [
  'Cambrianenergy@gmail.com',
  'Financialgrowthdfw@gmail.com',
];

async function setFounderClaims() {
  try {
    console.log('Starting to set founder claims...\n');

    for (const identifier of founders) {
      try {
        let user;
        
        // Check if identifier is an email or UID
        if (identifier.includes('@')) {
          user = await admin.auth().getUserByEmail(identifier);
        } else {
          user = await admin.auth().getUser(identifier);
        }

        // Set custom claims
        await admin.auth().setCustomUserClaims(user.uid, {
          founder: true,
          role: 'founder'
        });

        console.log(` Successfully set founder claims for: ${user.email || user.uid}`);
      } catch (error) {
        console.error(` Error setting claims for ${identifier}:`, error.message);
      }
    }

    console.log('\n Finished setting founder claims');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

setFounderClaims();

