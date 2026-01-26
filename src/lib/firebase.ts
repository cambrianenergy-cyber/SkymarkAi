// Real Firestore db() implementation for Node.js (Firebase Admin SDK)
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Optionally load credentials from environment or a service account file
// const serviceAccount = require('path/to/serviceAccountKey.json');
// initializeApp({ credential: cert(serviceAccount) });

let app: App;
if (!getApps().length) {
	app = initializeApp();
} else {
	app = getApps()[0];
}

let firestore: Firestore | null = null;

export function db(): Firestore {
	if (!firestore) {
		firestore = getFirestore(app);
	}
	return firestore;
}
