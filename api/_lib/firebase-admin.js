// api/_lib/firebase-admin.js
const admin = require('firebase-admin');

let dbInstance = null;

function getDb() {
  if (dbInstance) return dbInstance;

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT nincs beállítva a környezeti változók között');
  }

  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  dbInstance = admin.firestore();
  return dbInstance;
}

module.exports = { getDb };
