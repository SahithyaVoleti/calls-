/**
 * TogetherSpace Allowlist Seeding Script
 *
 * Usage:
 *   node scripts/seed-allowlist.mjs <email1> <email2>
 * Or:
 *   Reads VITE_AUTHORIZED_EMAIL_1 and VITE_AUTHORIZED_EMAIL_2 from .env
 *
 * Requires a Firebase service account JSON key specified by GOOGLE_APPLICATION_CREDENTIALS
 * or uses Firebase Admin default credentials.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

// Parse .env if available
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length) {
          process.env[key.trim()] = values.join('=').trim().replace(/(^"|"$|^'|'$)/g, '');
        }
      }
    });
  }
}

loadEnv();

const email1 = process.argv[2] || process.env.VITE_AUTHORIZED_EMAIL_1;
const email2 = process.argv[3] || process.env.VITE_AUTHORIZED_EMAIL_2;

if (!email1 || !email2) {
  console.error('\x1b[31m[Error] Please provide both authorized email addresses.\x1b[0m');
  console.log('Usage: node scripts/seed-allowlist.mjs user1@example.com user2@example.com');
  console.log('Or define VITE_AUTHORIZED_EMAIL_1 and VITE_AUTHORIZED_EMAIL_2 in your .env file.');
  process.exit(1);
}

const normalized1 = email1.trim().toLowerCase();
const normalized2 = email2.trim().toLowerCase();

console.log(`\n\x1b[35m=== TogetherSpace Allowlist Seeder ===\x1b[0m`);
console.log(`Target Email 1: \x1b[36m${normalized1}\x1b[0m`);
console.log(`Target Email 2: \x1b[36m${normalized2}\x1b[0m\n`);

async function seed() {
  try {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const sa = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      initializeApp({ credential: cert(sa) });
    } else {
      initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID });
    }

    const db = getFirestore();
    const batch = db.batch();

    const doc1Ref = db.collection('authorized_users').doc(normalized1);
    batch.set(doc1Ref, {
      email: normalized1,
      role: 'owner',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const doc2Ref = db.collection('authorized_users').doc(normalized2);
    batch.set(doc2Ref, {
      email: normalized2,
      role: 'owner',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    console.log('\x1b[32m✔ Successfully seeded authorized_users in Firestore!\x1b[0m');
    console.log('Both users can now securely sign in, call, and message on TogetherSpace.\n');
  } catch (err) {
    console.error('\x1b[31mFailed to seed allowlist:\x1b[0m', err.message);
    console.log('\nTip: You can also manually add documents in the Firebase Console under the "authorized_users" collection:');
    console.log(`  Document ID: ${normalized1} -> { email: "${normalized1}", role: "owner" }`);
    console.log(`  Document ID: ${normalized2} -> { email: "${normalized2}", role: "owner" }`);
  }
}

seed();
