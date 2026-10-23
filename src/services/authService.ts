import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { isEmailConfiguredAllowed, normalizeEmail } from '../utils/allowlist';
import { type UserProfile } from '../types';

export class AuthService {
  /**
   * Check whether an authenticated user is on the Firestore allowlist
   */
  public async isUserAuthorizedInFirestore(email: string): Promise<boolean> {
    try {
      const normalized = normalizeEmail(email);
      // Query the authorized_users collection directly
      const docRef = doc(db, 'authorized_users', normalized);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return true;
      }
      // If Firestore allowlist doc does not exist yet (e.g. before initial seeding),
      // we check if it matches the configured environment variables:
      return isEmailConfiguredAllowed(normalized);
    } catch (e) {
      console.warn('[AuthService] Checking Firestore allowlist encountered error:', e);
      // Fallback check against configured environment variable
      return isEmailConfiguredAllowed(email);
    }
  }

  /**
   * Register a new user
   */
  public async signUp(params: {
    email: string;
    password: string;
    displayName: string;
    photoURL?: string;
  }): Promise<User> {
    const normalizedEmail = normalizeEmail(params.email);

    // Reject upfront if not in allowlist
    if (!isEmailConfiguredAllowed(normalizedEmail)) {
      throw new Error(
        'This email address is not authorized to register on this private TogetherSpace instance.'
      );
    }

    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, params.password);
    const user = cred.user;

    await firebaseUpdateProfile(user, {
      displayName: params.displayName,
      photoURL: params.photoURL || '',
    });

    // Write initial user profile in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: normalizedEmail,
        displayName: params.displayName,
        photoURL: params.photoURL || '',
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Send verification email
    try {
      await sendEmailVerification(user);
    } catch (err) {
      console.warn('[AuthService] Could not send initial verification email:', err);
    }

    return user;
  }

  /**
   * Log in with email and password
   */
  public async login(email: string, password: string): Promise<User> {
    const normalizedEmail = normalizeEmail(email);

    // Verify allowlist upfront
    if (!isEmailConfiguredAllowed(normalizedEmail)) {
      throw new Error(
        'Access denied: This email address is not in the authorized two-user list for TogetherSpace.'
      );
    }

    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const user = cred.user;

    // Ensure user record in Firestore is up to date
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: normalizedEmail,
        displayName: user.displayName || 'Authorized User',
        photoURL: user.photoURL || '',
        isOnline: true,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    );

    return user;
  }

  /**
   * Log out the current user
   */
  public async logout(): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(
          userRef,
          {
            isOnline: false,
            inCall: false,
            activeCallId: null,
            lastSeen: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('[AuthService] Error marking user offline on logout:', err);
      }
    }
    await firebaseSignOut(auth);
  }

  /**
   * Send password reset email
   */
  public async resetPassword(email: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email);
    if (!isEmailConfiguredAllowed(normalizedEmail)) {
      throw new Error(
        'This email address is not authorized for this TogetherSpace instance.'
      );
    }
    await sendPasswordResetEmail(auth, normalizedEmail);
  }

  /**
   * Resend verification email
   */
  public async resendVerification(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');
    await sendEmailVerification(user);
  }

  /**
   * Update current user profile
   */
  public async updateUserProfile(params: { displayName: string; photoURL?: string }): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    await firebaseUpdateProfile(user, {
      displayName: params.displayName,
      photoURL: params.photoURL !== undefined ? params.photoURL : user.photoURL,
    });

    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        displayName: params.displayName,
        photoURL: params.photoURL !== undefined ? params.photoURL : user.photoURL,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  /**
   * Fetch current user profile document
   */
  public async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (e) {
      console.warn('[AuthService] Error fetching user profile:', e);
      return null;
    }
  }
}

export const authService = new AuthService();
