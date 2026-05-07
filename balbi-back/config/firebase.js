const admin = require('firebase-admin');

const FIREBASE_BUCKET = process.env.FIREBASE_BUCKET;

let firebaseInitialized = false;

function initFirebase() {
  if (firebaseInitialized) {
    return admin.storage().bucket(FIREBASE_BUCKET);
  }

  // Opción 1: JSON en variable de entorno (base64 o texto)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson) {
    let cred;
    try {
      const parsed = typeof serviceAccountJson === 'string' && serviceAccountJson.startsWith('{')
        ? JSON.parse(serviceAccountJson)
        : JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf8'));
      cred = admin.credential.cert(parsed);
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', e.message);
      throw e;
    }
    admin.initializeApp({ credential: cred, storageBucket: FIREBASE_BUCKET });
    firebaseInitialized = true;
    return admin.storage().bucket(FIREBASE_BUCKET);
  }

  throw new Error('Firebase no configurado: defina FIREBASE_SERVICE_ACCOUNT (JSON) o FIREBASE_BUCKET');
}

function getBucket() {
  return initFirebase();
}

module.exports = { initFirebase, getBucket, FIREBASE_BUCKET };
