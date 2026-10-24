import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isLiveFirebase } from './firebase';
import { mockBackend } from './mockBackend';
import { isEmailConfiguredAllowed, normalizeEmail } from '../utils/allowlist';
import { type UserProfile } from '../types';

export class AuthService {
  /**
   * Check whether an authenticated user is on the Firestore allowlist
   */
  public async isUserAuthorizedInFirestore(email: string): Promise<boolean> {
    if (!isLiveFirebase || !db) {
      return isEmailConfiguredAllowed(email);
    }

    try {
      const normalized = normalizeEmail(email);
      const docRef = doc(db, 'authorized_users', normalized);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return true;
      }
      return isEmailConfiguredAllowed(normalized);
    } catch (e) {
      console.warn('[AuthService] Firestore check fallback:', e);
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
  }): Promise<any> {
    const normalizedEmail = normalizeEmail(params.email);

    // Reject upfront if not in allowlist
    if (!isEmailConfiguredAllowed(normalizedEmail)) {
      throw new Error(
        'This email address is not authorized to register on this private TogetherSpace instance.'
      );
    }

    if (!isLiveFirebase || !auth) {
      // Local Demo Mode
      return mockBackend.mockSignUp({
        email: normalizedEmail,
        displayName: params.displayName,
        photoURL: params.photoURL,
      });
    }

    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, params.password);
    const user = cred.user;

    await firebaseUpdateProfile(user, {
      displayName: params.displayName,
      photoURL: params.photoURL || '',
    });

    if (db) {
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
    }

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
  public async login(email: string, password: string): Promise<any> {
    const normalizedEmail = normalizeEmail(email);

    if (!isEmailConfiguredAllowed(normalizedEmail)) {
      throw new Error(
        'Access denied: This email address is not in the authorized two-user list for TogetherSpace.'
      );
    }

    if (!isLiveFirebase || !auth) {
      // Local Demo Mode
      return mockBackend.mockLogin(normalizedEmail);
    }

    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const user = cred.user;

    if (db) {
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
    }

    return user;
  }

  /**
   * Log out the current user
   */
  public async logout(): Promise<void> {
    if (!isLiveFirebase || !auth) {
      mockBackend.mockLogout();
      return;
    }

    const user = auth.currentUser;
    if (user && db) {
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
    if (isLiveFirebase && auth) {
      await sendPasswordResetEmail(auth, normalizedEmail);
    }
  }

  /**
   * Resend verification email
   */
  public async resendVerification(): Promise<void> {
    if (isLiveFirebase && auth?.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  }

  /**
   * Update current user profile
   */
  public async updateUserProfile(params: { displayName: string; photoURL?: string }): Promise<void> {
    if (!isLiveFirebase || !auth) {
      const current = mockBackend.getCurrentSessionUser();
      if (current) {
        current.displayName = params.displayName;
        if (params.photoURL !== undefined) current.photoURL = params.photoURL;
        sessionStorage.setItem('togetherspace_mock_user', JSON.stringify(current));
        mockBackend.saveUserProfile(current);
      }
      return;
    }

    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    await firebaseUpdateProfile(user, {
      displayName: params.displayName,
      photoURL: params.photoURL !== undefined ? params.photoURL : user.photoURL,
    });

    if (db) {
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
  }

  /**
   * Fetch current user profile document
   */
  public async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!isLiveFirebase || !db) {
      const user = mockBackend.getCurrentSessionUser();
      if (user) {
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isOnline: true,
        };
      }
      return null;
    }

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
