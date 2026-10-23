import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

initializeApp();
const db = getFirestore();

/**
 * Cloud Function: Seed or Update the Authorized Two-User Allowlist
 * Callable only with admin secret or initial setup token.
 */
export const seedAuthorizedUsers = onCall(async (request) => {
  const { secretKey, email1, email2 } = request.data || {};
  const expectedSecret = process.env.ADMIN_SETUP_SECRET;

  if (expectedSecret && secretKey !== expectedSecret) {
    throw new HttpsError('permission-denied', 'Invalid setup authorization key.');
  }

  if (!email1 || !email2) {
    throw new HttpsError('invalid-argument', 'Both email1 and email2 are required.');
  }

  const normalized1 = email1.trim().toLowerCase();
  const normalized2 = email2.trim().toLowerCase();

  const batch = db.batch();
  batch.set(db.collection('authorized_users').doc(normalized1), {
    email: normalized1,
    role: 'owner',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  batch.set(db.collection('authorized_users').doc(normalized2), {
    email: normalized2,
    role: 'owner',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    success: true,
    message: `Successfully provisioned allowlist for ${normalized1} and ${normalized2}`,
  };
});

/**
 * Cloud Function: Periodic Cleanup of Old Signaling Sessions
 * Runs every 30 minutes to purge completed/stale call documents (> 1 hour old)
 * and prevent temporary signaling records from bloating Firestore.
 */
export const cleanupStaleCalls = onSchedule('every 30 minutes', async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const snapshot = await db
    .collection('calls')
    .where('createdAt', '<=', oneHourAgo)
    .limit(100)
    .get();

  if (snapshot.empty) {
    console.info('[Cleanup] No stale calls to remove.');
    return;
  }

  const batch = db.batch();
  for (const doc of snapshot.docs) {
    // Delete candidate subcollections
    const callerCandidates = await doc.ref.collection('callerCandidates').get();
    callerCandidates.forEach((c) => batch.delete(c.ref));

    const receiverCandidates = await doc.ref.collection('receiverCandidates').get();
    receiverCandidates.forEach((c) => batch.delete(c.ref));

    batch.delete(doc.ref);
  }

  await batch.commit();
  console.info(`[Cleanup] Successfully removed ${snapshot.size} expired call records.`);
});
